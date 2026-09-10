/**
 * SurakshaAR — Voice Module (TTS + STT)
 * Uses browser-native Web Speech API — no API key required.
 * 
 * TTS language support:
 *   en → en-IN (Indian English)
 *   hi → hi-IN (Hindi — available on Android Chrome + most browsers)
 *   sat → NO TTS available, returns false (caller shows text-only fallback)
 * 
 * STT: Chrome/Android WebView only.
 */

export const TTS_LANG = {
  en: 'en-IN',
  hi: 'hi-IN',
  sat: null, // No Santali voice available
}

let currentUtterance = null

/** Speak text aloud. Returns false if TTS not supported / no voice for lang. */
export function speak(text, lang = 'en') {
  if (!window.speechSynthesis) return false
  const ttsLang = TTS_LANG[lang]
  if (!ttsLang) return false // Santali → text-only graceful fallback

  // Stop any current speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = ttsLang
  utterance.rate = 0.9
  utterance.pitch = 1
  utterance.volume = 1

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang.startsWith(ttsLang.split('-')[0])) ||
                voices.find(v => v.lang === ttsLang)
  if (voice) utterance.voice = voice

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
  return true
}

/** Stop any currently playing speech */
export function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

/** Get current speech utterance (retained to prevent GC) */
export function getCurrentUtterance() {
  return currentUtterance
}

/** Check if TTS is supported for a language */
export function isTTSSupported(lang) {
  return !!window.speechSynthesis && !!TTS_LANG[lang]
}

/** Returns available voices — call after 'voiceschanged' event */
export function getVoices() {
  return window.speechSynthesis?.getVoices() ?? []
}

/**
 * Start speech recognition (STT). Returns a controller object.
 * Only works in Chrome and Android WebView.
 * 
 * @param {string} lang - 'en' | 'hi'
 * @param {function} onResult - called with recognized text
 * @param {function} onError - called with error message
 * @returns {{ stop: function }} controller
 */
export function startListening(lang, onResult, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser.')
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = TTS_LANG[lang] ?? 'en-IN'
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.continuous = false

  recognition.onresult = (event) => {
    const text = event.results[0]?.[0]?.transcript ?? ''
    onResult?.(text)
  }
  recognition.onerror = (event) => {
    onError?.(event.error)
  }
  recognition.start()

  return { stop: () => recognition.stop() }
}
