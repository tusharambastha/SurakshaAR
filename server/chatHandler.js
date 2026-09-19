import fs from 'fs'
import path from 'path'
import { RateLimiter } from '../worker/rateLimiter.js'
import {
  checkCriticalHazardGuardrails,
  queryKnowledgeBase,
  MODULES
} from '../src/lib/safetyKnowledge.js'

export const SURAKSHA_MITRA_SYSTEM_PROMPT = `You are 'Suraksha Mitra', the AI safety-training assistant inside SurakshaAR, an AR training simulator for mining and manufacturing workers in Jharkhand, India. Your job:
- Answer questions about industrial safety procedures, PPE (personal protective equipment), mining hazards, machine safety, and the AR training modules in this app.
- Explain things in simple, practical language — many users are frontline workers, not engineers.
- Respond in the same language the user writes in — Hindi, Hinglish, or English — match their style naturally.
- If asked about something outside industrial safety/training/the app itself, gently redirect back to safety topics.
- Keep answers concise and conversational, like a helpful colleague, not a textbook.
- Never give unsafe or incorrect safety advice; if unsure, say so and suggest consulting a certified safety officer.
- You can reference module names/features in this app if the user asks 'how do I use X'.`

// Local rate limiter instance
export const localLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
})

/**
 * Retrieve Gemini API key strictly on the server side.
 * Checks process.env, .env, .env.local, .env.production.
 */
export function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
    return process.env.GEMINI_API_KEY.trim()
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim().length > 10) {
    return process.env.GOOGLE_API_KEY.trim()
  }
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 10) {
    return process.env.VITE_GEMINI_API_KEY.trim()
  }
  // Try reading .env or .env.local in project root
  const candidateFiles = ['.env.local', '.env', '.env.production']
  for (const f of candidateFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), f)
      if (fs.existsSync(fullPath)) {
        const text = fs.readFileSync(fullPath, 'utf8')
        const match = text.match(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*["']?([^"'\r\n]+)["']?/m)
        if (match && match[1] && match[1].trim().length > 10) {
          return match[1].trim()
        }
      }
    } catch (_) {}
  }
  return null
}

/**
 * Server-side Chat API for Suraksha Mitra
 * Supports:
 * 1. New conversational agent: { messages: [...], sessionId, stream }
 * 2. Legacy signature: { query, lang, module, history }
 */
export async function handleChatApi(payload = {}) {
  const sessionId = payload.sessionId || 'local-session'
  const rateCheck = localLimiter.check(sessionId)
  if (!rateCheck.allowed) {
    return {
      error: 'Rate limit exceeded. Please wait a moment before asking another question.',
      reply: '⚠️ Rate limit exceeded. Please wait a moment before sending more messages.',
      retryAfter: rateCheck.retryAfter,
    }
  }

  // Normalize input
  let query = payload.query
  let messages = Array.isArray(payload.messages) ? payload.messages : []

  if (messages.length > 0) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    query = lastUserMsg?.content || lastUserMsg?.text || ''
  } else if (query) {
    messages = [{ role: 'user', content: query }]
  }

  if (!query || query.trim().length === 0) {
    return {
      reply: 'Please ask an industrial safety or training question.',
      answer: 'Please ask an industrial safety or training question.',
      source: 'Suraksha Mitra',
      confidence: 0,
      sources: []
    }
  }

  const lang = payload.lang || 'en'
  const module = payload.module || MODULES.GLOBAL

  // 1. Critical Hazard Guardrail Check FIRST (checks query + recent conversation context)
  const fullContextQuery = [
    query,
    ...(Array.isArray(messages) ? messages.slice(-4).map(m => m.content || m.text || '') : [])
  ].join(' ')
  const critical = checkCriticalHazardGuardrails(fullContextQuery, lang)
  if (critical) {
    return {
      reply: critical.answer,
      answer: critical.answer,
      source: critical.source,
      confidence: critical.confidence,
      sources: [],
      isCritical: true,
    }
  }

  // 2. Query verified local safety knowledge
  const localMatch = queryKnowledgeBase(query, lang, module, messages)

  // 3. Check for Gemini API key
  const apiKey = getGeminiApiKey()

  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.info('[SurakshaMitra] No active GEMINI_API_KEY configured — serving verified safety response.')
    const safeReply = localMatch?.answer || (
      lang === 'hi'
        ? 'मैं सुरक्षा मित्र हूँ। औद्योगिक और खनन सुरक्षा (PPE, गैस रिसाव, बिजली, मशीन सुरक्षा) पर आप मुझसे कोई भी सवाल पूछ सकते हैं।'
        : lang === 'hinglish'
          ? 'Main hoon Suraksha Mitra. Industrial aur mining safety (PPE, fire, gas leak, electrical, machinery) par aap mujhse koi bhi practical sawal pooch sakte hain.'
          : 'I am Suraksha Mitra. You can ask me any practical questions regarding industrial safety, PPE, mining hazards, fire response, or AR training.'
    )
    return {
      reply: safeReply,
      answer: safeReply,
      source: (localMatch && !localMatch.isFallback) ? localMatch.source : 'Suraksha Mitra Safety Knowledge',
      confidence: (localMatch && !localMatch.isFallback) ? 0.95 : 0.7,
      sources: localMatch?.sources || []
    }
  }

  // 4. Live Gemini API Call
  try {
    const contents = []
    const recentMessages = messages.slice(-10)

    for (const m of recentMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user'
      const text = typeof m.content === 'string' ? m.content : (m.text || '')
      if (!text.trim()) continue

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n' + text
      } else {
        contents.push({ role, parts: [{ text }] })
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: query }] })
    }

    let trustedContextPrompt = ''
    if (localMatch && !localMatch.isFallback) {
      trustedContextPrompt = `\n--- VERIFIED SURAKSHAAR SAFETY BASELINE ---\n${localMatch.answer}\nSource: ${localMatch.source}\n-------------------------------------------`
    }

    const fullSystemInstruction = `${SURAKSHA_MITRA_SYSTEM_PROMPT}${trustedContextPrompt}`

    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest']
    let candidate = null
    let lastError = null

    for (const modelName of models) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      const requestPayload = {
        contents,
        systemInstruction: {
          parts: [{ text: fullSystemInstruction }]
        },
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
        }
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      })

      if (res.ok) {
        const json = await res.json()
        if (json.candidates && json.candidates[0]) {
          candidate = json.candidates[0]
          break
        }
      } else {
        const errText = await res.text()
        lastError = `Gemini API [${modelName}] failed (${res.status}): ${errText}`
        console.warn('[SurakshaMitra]', lastError)
      }
    }

    if (candidate && candidate.content?.parts) {
      const rawText = candidate.content.parts.map(p => p.text).filter(Boolean).join('\n')
      return {
        reply: rawText,
        answer: rawText,
        source: 'Suraksha Mitra AI (Gemini)',
        confidence: 0.98,
        sources: []
      }
    }
  } catch (err) {
    console.error('[handleChatApi] Error calling Gemini:', err)
  }

  // Graceful fallback on API error
  const fallbackAnswer = localMatch?.answer || "I am your safety assistant. Please consult your certified safety officer or check site SOPs."
  return {
    reply: fallbackAnswer,
    answer: fallbackAnswer,
    source: localMatch?.source || "Suraksha Mitra Safety Knowledge",
    confidence: localMatch?.confidence || 0.65,
    sources: []
  }
}
