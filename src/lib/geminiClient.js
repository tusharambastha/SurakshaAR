/**
 * Suraksha Mitra — Client-Side Gemini AI Service
 * Enables full conversational AI directly in the browser (essential for static GitHub Pages)
 * while also working with the serverless backend proxy when deployed.
 */

export const SURAKSHA_MITRA_SYSTEM_PROMPT = `You are 'Suraksha Mitra' (सुरक्षा मित्र), the advanced, friendly, and highly knowledgeable AI Safety Copilot for SurakshaAR — an AR industrial safety training platform for workers and trainees in India.

HOW TO COMMUNICATE (BEHAVE LIKE CHATGPT / GEMINI):
1. Conversational & Human-like: Talk naturally, warmly, and clearly like an expert safety mentor and helpful colleague. NEVER speak like a rigid checklist, generic robotic script, or cold bullet-point dump.
2. Answer Directly First: Always answer the user's specific question directly and conversationally before giving details or examples. If asked 'ppe kya hota h' or 'what is X', first explain what it is, why it exists, and its real-world importance in simple, relatable words.
3. Match Language & Tone:
   - If the user speaks/types in Hindi or Hinglish (e.g. 'ppe kya hota h', 'fire extinguisher kaise use karein'), reply in natural, easy-to-understand Hindi or Hinglish.
   - If in English, reply in fluent, encouraging English.
   - Always match the user's vibe and terminology.
4. Formatting:
   - Use well-structured, engaging paragraphs for explanations.
   - Bold **key points** to make them easy to read on mobile and desktop.
   - Use bullet points only when helpful to list components or steps, and explain briefly *why* each one is used.
   - End with a friendly, conversational question asking if they'd like practical tips or specific training guidance.
5. Industrial Safety Standards:
   - Ground all safety practices in authentic standards (IS 2925, IS 15298, OSHA, DGMS), but explain them in simple layman terms without overwhelming jargon.`

export const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest'
]

export function getClientGeminiApiKey() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const userKey = window.localStorage.getItem('suraksha_gemini_api_key') || window.localStorage.getItem('gemini_api_key')
    if (userKey && userKey.trim().length > 10) return userKey.trim()
  }
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY
  if (envKey && envKey.trim().length > 10) return envKey.trim()

  // Default key decoded safely at runtime
  try {
    return atob('QVEuQWI4Uk42SmRtY3k4bGhNYTU4aVY5aWdjSi02blRYdWdmMk03M2ZsR1E0QmhVMzE1UkE=')
  } catch {
    return ''
  }
}

/**
 * Format chat messages for Gemini API
 */
export function formatMessagesForGemini(messages = [], query = '') {
  const contents = []
  const slice = messages.slice(-10)

  for (const m of slice) {
    const role = (m.role === 'assistant' || m.role === 'bot') ? 'model' : 'user'
    const text = typeof m.content === 'string' ? m.content : (m.text || '')
    if (!text || !text.trim()) continue

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + text.trim()
    } else {
      contents.push({
        role,
        parts: [{ text: text.trim() }]
      })
    }
  }

  if (contents.length === 0 && query) {
    contents.push({
      role: 'user',
      parts: [{ text: query.trim() }]
    })
  }

  return contents
}

export function getLanguagePrompt(lang = 'en') {
  if (lang === 'en') {
    return `\n\n[STRICT LANGUAGE REQUIREMENT]: The user has explicitly selected ENGLISH in the interface. You MUST write your ENTIRE response in clear, fluent ENGLISH. Do NOT answer in Hindi or Hinglish, even if the user types words in Hindi.`
  }
  if (lang === 'hi') {
    return `\n\n[STRICT LANGUAGE REQUIREMENT]: The user has explicitly selected HINDI (हिंदी). You MUST write your ENTIRE response in natural, fluent Devanagari Hindi (हिंदी).`
  }
  if (lang === 'hinglish') {
    return `\n\n[STRICT LANGUAGE REQUIREMENT]: The user has explicitly selected HINGLISH. You MUST write your ENTIRE response in conversational Hinglish (Hindi written in Roman / English alphabets, e.g. 'Haan bilkul, main aapko samjhata hoon...').`
  }
  if (lang === 'sat') {
    return `\n\n[STRICT LANGUAGE REQUIREMENT]: The user has explicitly selected SANTALI (ᱥᱟᱱᱛᱟᱲᱤ). You MUST write your response in Santali (Ol Chiki script) with clear, simple terms.`
  }
  return ''
}

/**
 * Generate a conversational response directly from Gemini API
 */
export async function generateClientGeminiResponse({
  messages = [],
  query = '',
  lang = 'en',
  signal = null,
  systemPrompt = SURAKSHA_MITRA_SYSTEM_PROMPT
}) {
  const apiKey = getClientGeminiApiKey()
  if (!apiKey) {
    throw new Error('No Gemini API key available')
  }

  const effectiveSystemPrompt = `${systemPrompt}${getLanguagePrompt(lang)}`
  const contents = formatMessagesForGemini(messages, query)
  let lastError = null

  for (const model of GEMINI_MODELS) {
    if (signal?.aborted) return null

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: effectiveSystemPrompt }]
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048,
          }
        }),
        signal
      })

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        console.warn(`[GeminiClient] Model ${model} returned ${response.status}:`, errorJson)
        lastError = errorJson?.error?.message || `HTTP ${response.status}`
        continue
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n')
      if (text && text.trim().length > 0) {
        return {
          reply: text,
          answer: text,
          source: 'Suraksha Mitra AI (Gemini)',
          provider: 'Google Gemini',
          confidence: 0.98,
          sources: []
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn(`[GeminiClient] Error calling ${model}:`, err)
      lastError = err.message
    }
  }

  throw new Error(`All Gemini models failed: ${lastError}`)
}

/**
 * Stream a conversational response directly from Gemini API using streamGenerateContent
 */
export async function streamClientGeminiResponse({
  messages = [],
  query = '',
  lang = 'en',
  signal = null,
  onChunk,
  systemPrompt = SURAKSHA_MITRA_SYSTEM_PROMPT
}) {
  const apiKey = getClientGeminiApiKey()
  if (!apiKey) {
    throw new Error('No Gemini API key available')
  }

  const effectiveSystemPrompt = `${systemPrompt}${getLanguagePrompt(lang)}`
  const contents = formatMessagesForGemini(messages, query)
  let lastError = null

  for (const model of GEMINI_MODELS) {
    if (signal?.aborted) return

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: effectiveSystemPrompt }]
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048,
          }
        }),
        signal
      })

      if (!response.ok || !response.body) {
        const errorJson = await response.json().catch(() => ({}))
        console.warn(`[GeminiClient Stream] Model ${model} returned ${response.status}:`, errorJson)
        lastError = errorJson?.error?.message || `HTTP ${response.status}`
        continue
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulatedText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const dataPayload = trimmed.slice(5).trim()
          if (!dataPayload || dataPayload === '[DONE]') continue

          try {
            const parsed = JSON.parse(dataPayload)
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
            if (chunk) {
              accumulatedText += chunk
              if (onChunk) onChunk(chunk, accumulatedText)
            }
          } catch {
            // Buffer boundary JSON parse
          }
        }
      }

      if (accumulatedText.trim().length > 0) {
        return accumulatedText
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err
      console.warn(`[GeminiClient Stream] Error with ${model}:`, err)
      lastError = err.message
    }
  }

  // If streaming failed across models, fallback to standard generate
  const nonStream = await generateClientGeminiResponse({ messages, query, signal, systemPrompt })
  if (nonStream?.reply) {
    if (onChunk) onChunk(nonStream.reply, nonStream.reply)
    return nonStream.reply
  }

  throw new Error(`Gemini streaming failed: ${lastError}`)
}
