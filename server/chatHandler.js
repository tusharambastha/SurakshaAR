import fs from 'fs'
import path from 'path'
import {
  checkCriticalHazardGuardrails,
  queryKnowledgeBase,
  MODULES
} from '../src/lib/safetyKnowledge.js'

/**
 * Retrieve Gemini API key strictly on the server side.
 * Checks process.env, .env, .env.local, .env.production.
 * Never exposed to frontend client code.
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
 * Server-side Chat API with Google Search Grounding via Gemini API.
 */
export async function handleChatApi({ query, lang = 'en', module = MODULES.GLOBAL, history = [] }) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return {
      answer: "Please enter a valid question.",
      source: "Suraksha Saathi",
      confidence: 0,
      sources: []
    }
  }

  // 1. Critical Hazard Guardrail Check FIRST (Prevents fatal instructions)
  const critical = checkCriticalHazardGuardrails(query, lang)
  if (critical) {
    return {
      answer: critical.answer,
      source: critical.source,
      confidence: critical.confidence,
      sources: [],
      isCritical: true,
    }
  }

  // 2. Query trusted local knowledge base for priority context
  const localMatch = queryKnowledgeBase(query, lang, module, history)

  // 3. Check for Gemini API key
  const apiKey = getGeminiApiKey()

  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.info('[SurakshaSaathi] No active GEMINI_API_KEY configured — serving verified safety knowledge response.')
    if (localMatch && !localMatch.isFallback) {
      return {
        answer: localMatch.answer,
        source: localMatch.source || 'Suraksha Saathi Safety Assistant',
        confidence: localMatch.confidence || 0.95,
        sources: localMatch.sources || []
      }
    }
    return {
      answer: localMatch?.answer || (
        lang === 'hi'
          ? 'इस विषय के लिए कृपया अपने कार्यस्थल के मानक संचालन प्रक्रिया (SOP) या सुरक्षा अधिकारी से परामर्श करें।'
          : lang === 'hinglish'
            ? 'Iss safety query ke liye please apne site ke Standard Operating Procedure (SOP) ya Safety Officer se consult karein.'
            : 'For this safety query, please consult your site Standard Operating Procedure (SOP) or designated Safety Officer.'
      ),
      source: 'Suraksha Saathi Safety Assistant',
      confidence: 0.7,
      sources: []
    }
  }

  console.log('[SurakshaSaathi] Executing live Gemini Google Search Grounding for:', query);

  // 4. Gemini API Call with Official Google Search Grounding
  try {
    const langInstructions = {
      hi: 'Reply strictly in clear Hindi (Devanagari script).',
      hinglish: 'Reply in natural, conversational Hinglish (Hindi written in Roman/English alphabet, using common workplace terminology).',
      sat: 'Reply in Santali if possible or simple clear Hindi/English.',
      en: 'Reply in clear, professional English.'
    }[lang] || 'Reply in the same language and style used by the user.'

    let trustedContextPrompt = ''
    if (localMatch && !localMatch.isFallback) {
      trustedContextPrompt = `\n--- TRUSTED SURAKSHAAR SAFETY KNOWLEDGE BASE (PRIORITY BASELINE) ---\n${localMatch.answer}\nSource Standard: ${localMatch.source}\n---------------------------------------------------------------\nUse the verified safety context above as authoritative for industrial standards (IS, OSHA, DGMS, SurakshaAR platform). Augment with Google Search grounding for any recent updates, real-world examples, or technical details.`
    }

    const systemInstruction = `You are 'Suraksha Saathi', an advanced, highly intelligent AI Assistant designed with the quality, breadth, and conversational clarity of ChatGPT and Google Gemini. You specialize in Industrial Safety, Engineering, and the SurakshaAR platform, but you are fully equipped to answer ANY user question (general knowledge, science, everyday topics, technical explanations, how-to guides, and safety protocols) with utmost clarity, depth, and helpfulness.

Key Answering Guidelines:
1. Response Quality & Clarity (ChatGPT / Gemini caliber):
   - Answer ANY question the user asks clearly, accurately, and thoroughly.
   - Use clean Markdown with bold keywords, organized bullet points, numbered steps, and helpful section headers.
   - Break down complex topics into intuitive, easy-to-understand explanations with real-world examples.
   - If the user asks something in Hindi or Hinglish, explain naturally and conversationally in that exact style.

2. Safety-Critical Interventions:
   - For life-threatening industrial situations (electrical fires, toxic gas, machine entanglements, LOTO, confined spaces), always enforce strict safety standards (NEVER water on electrical/grease fire, NEVER solo confined entry, NEVER tape cracked helmets).

3. Language & Tone:
   - ${langInstructions}
   - Warm, professional, supportive, and exceptionally clear.
${trustedContextPrompt}`

    // Format conversation history for Gemini (alternating user / model)
    const contents = []
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6)
      for (const m of recent) {
        if (m.role === 'user' && m.text) {
          contents.push({ role: 'user', parts: [{ text: m.text }] })
        } else if (m.role === 'bot' && m.text) {
          // Avoid consecutive identical roles
          if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
            contents[contents.length - 1].parts[0].text += '\n' + m.text
          } else if (contents.length > 0) {
            contents.push({ role: 'model', parts: [{ text: m.text }] })
          }
        }
      }
    }

    // Append current query from user
    contents.push({ role: 'user', parts: [{ text: query }] })

    // Models to try with Google Search Grounding tool
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash']
    let candidate = null
    let lastError = null

    for (const modelName of models) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      
      const requestPayload = {
        contents,
        tools: [{ google_search: {} }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
        }
      }

      let res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      })

      // If google_search fails, try googleSearch
      if (!res.ok && res.status === 400) {
        requestPayload.tools = [{ googleSearch: {} }]
        res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        })
      }

      // If tools fail, retry without tools to guarantee a direct Gemini answer
      if (!res.ok) {
        delete requestPayload.tools
        res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        })
      }

      if (res.ok) {
        const json = await res.json()
        if (json.candidates && json.candidates[0]) {
          candidate = json.candidates[0]
          break
        }
      } else {
        const errText = await res.text()
        lastError = `Gemini API [${modelName}] ${res.status}: ${errText}`
        console.warn('[SurakshaSaathi]', lastError)
      }
    }

    if (candidate && candidate.content?.parts) {
      const rawText = candidate.content.parts.map(p => p.text).filter(Boolean).join('\n')
      
      // Extract Google Search Grounding citations
      const sources = []
      const groundingMeta = candidate.groundingMetadata
      if (groundingMeta?.groundingChunks) {
        for (const chunk of groundingMeta.groundingChunks) {
          if (chunk.web?.uri) {
            const uri = chunk.web.uri
            const title = chunk.web.title || new URL(uri).hostname
            if (!sources.some(s => s.uri === uri)) {
              sources.push({ title, uri })
            }
          }
        }
      }

      const hasWebGrounding = sources.length > 0
      const sourceLabel = hasWebGrounding
        ? 'Google Search Grounding via Gemini AI'
        : (localMatch && !localMatch.isFallback ? localMatch.source : 'Suraksha Saathi AI')

      return {
        answer: rawText,
        source: sourceLabel,
        sources,
        confidence: hasWebGrounding ? 0.98 : 0.92,
        groundingQueries: groundingMeta?.webSearchQueries || []
      }
    }
  } catch (err) {
    console.error('[handleChatApi] Error calling Gemini with Google Search:', err)
  }

  // Graceful fallback to verified local safety knowledge base on any API error
  return {
    answer: localMatch?.answer || "I could not find reliable information for this query. Please check official safety manuals or consult your site supervisor.",
    source: localMatch?.source || "National Industrial Safety Protocol",
    confidence: localMatch?.confidence || 0.65,
    sources: []
  }
}
