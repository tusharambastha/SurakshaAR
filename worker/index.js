/**
 * Suraksha Mitra — Cloudflare Worker Backend Proxy
 * Serves real-time streaming and standard JSON responses via Google Gemini API
 * with in-memory sliding window rate limiting and CORS protection.
 */

import { RateLimiter } from './rateLimiter.js'
import { GeminiProvider } from './providers/gemini.js'
// To switch to Claude:
// import { ClaudeProvider } from './providers/claude.js'

// System Prompt / Persona for Suraksha Mitra
export const SURAKSHA_MITRA_SYSTEM_PROMPT = `You are 'Suraksha Mitra', the AI safety-training assistant inside SurakshaAR, an AR training simulator for mining and manufacturing workers in Jharkhand, India. Your job:
- Answer questions about industrial safety procedures, PPE (personal protective equipment), mining hazards, machine safety, and the AR training modules in this app.
- Explain things in simple, practical language — many users are frontline workers, not engineers.
- Respond in the same language the user writes in — Hindi, Hinglish, or English — match their style naturally.
- If asked about something outside industrial safety/training/the app itself, gently redirect back to safety topics.
- Keep answers concise and conversational, like a helpful colleague, not a textbook.
- Never give unsafe or incorrect safety advice; if unsure, say so and suggest consulting a certified safety officer.
- You can reference module names/features in this app if the user asks 'how do I use X'.`

// Global rate limiter instance (25 requests per minute per IP/session)
const limiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
})

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || '*'

    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'Suraksha Mitra AI Proxy',
          provider: 'Gemini (gemini-2.0-flash / gemini-1.5-flash)',
          docs: 'POST /api/chat with { messages: [...], sessionId, stream }'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        }
      )
    }

    // 2. Chat API endpoint
    if (url.pathname === '/api/chat' || url.pathname === '/SurakshaAR/api/chat') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      }

      // Check API Key
      const apiKey = env?.GEMINI_API_KEY
      if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        return new Response(
          JSON.stringify({
            error: 'Backend API key not configured. Please set GEMINI_API_KEY in worker secrets.',
            fallbackMessage: '⚠️ Suraksha Mitra proxy is running, but GEMINI_API_KEY has not been set yet. Please check README instructions.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          }
        )
      }

      // Parse payload
      let body
      try {
        body = await request.json()
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      }

      const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1'
      const sessionId = body.sessionId || request.headers.get('X-Session-Id') || clientIp

      // 3. Check rate limit
      const rateCheck = limiter.check(sessionId)
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
            retryAfter: rateCheck.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(rateCheck.retryAfter),
              ...corsHeaders(origin),
            },
          }
        )
      }

      // Format messages: support { messages: [...] } or single { message: "..." }
      let messages = Array.isArray(body.messages) ? body.messages : []
      if (messages.length === 0 && body.message) {
        messages = [{ role: 'user', content: String(body.message) }]
      } else if (messages.length === 0 && body.query) {
        messages = [{ role: 'user', content: String(body.query) }]
      }

      if (messages.length === 0) {
        return new Response(JSON.stringify({ error: 'Messages array cannot be empty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      }

      // Keep last 10 messages for context
      const contextualMessages = messages.slice(-10)

      // Instantiate AI provider (Gemini by default)
      const provider = new GeminiProvider(apiKey)
      // To use Claude instead:
      // const provider = new ClaudeProvider(env.ANTHROPIC_API_KEY)

      const wantsStream = body.stream === true || request.headers.get('Accept') === 'text/event-stream'

      try {
        if (wantsStream) {
          // Streaming SSE response
          const stream = await provider.streamResponse({
            messages: contextualMessages,
            systemPrompt: SURAKSHA_MITRA_SYSTEM_PROMPT,
          })

          return new Response(stream, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
              ...corsHeaders(origin),
            },
          })
        } else {
          // Standard JSON response
          const result = await provider.generateResponse({
            messages: contextualMessages,
            systemPrompt: SURAKSHA_MITRA_SYSTEM_PROMPT,
          })

          return new Response(
            JSON.stringify({
              reply: result.reply,
              model: result.model,
              provider: result.provider,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders(origin),
              },
            }
          )
        }
      } catch (err) {
        console.error('[Suraksha Mitra Worker Error]', err)
        return new Response(
          JSON.stringify({
            error: 'Failed to generate safety response',
            details: err.message,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          }
        )
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })
  },
}
