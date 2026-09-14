/**
 * SurakshaAR — Safety Chatbot Component (Suraksha Saathi)
 *
 * Curated industrial safety knowledge base matcher.
 * Features:
 * - 4-Language bar: English, हिंदी, Hinglish, ᱥᱟᱱᱛᱟᱲᱤ
 * - 3-Language voice support: English (en-IN), Hindi (hi-IN), Hinglish (hi-IN)
 * - Voice Input (Speech-to-Text) with live listening indicator
 * - Voice Output (Text-to-Speech) with speaker toggle & stop
 * - Quick suggested question pills
 * - Safe, deterministic fallback for unrecognized queries
 */
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Volume2, VolumeX, Mic, MicOff, Sparkles } from 'lucide-react'
import { useLang } from '../../contexts/LanguageContext'
import { queryKnowledgeBase } from '../../lib/safetyKnowledge'
import { speak, stopSpeech, startListening, isTTSSupported, isVoiceSupported } from '../../lib/voice'

export const CHAT_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', voice: true, voiceBadge: 'Voice 🎙️' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', voice: true, voiceBadge: 'आवाज़ 🎙️' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish', flag: '🇮🇳', voice: true, voiceBadge: 'Awaaz 🎙️' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🌿', voice: false, voiceBadge: 'Text' },
]

const WELCOME_MESSAGES = {
  en: {
    id: 'welcome-en',
    role: 'bot',
    text: "👷 Hello! I am your Suraksha Saathi safety assistant. Ask me about fire response, gas leaks, PPE safety gear, or emergency procedures.\n\nYou can also use the 🎙️ Mic button to speak in English, Hindi, or Hinglish!",
    source: 'National Industrial Safety Protocol',
  },
  hi: {
    id: 'welcome-hi',
    role: 'bot',
    text: "👷 नमस्ते! मैं आपका सुरक्षा साथी हूँ। मुझसे आग से बचाव, गैस रिसाव, PPE सुरक्षा उपकरण, या आपातकालीन प्रक्रियाओं के बारे में पूछें।\n\nआप 🎙️ माइक बटन दबाकर हिंदी, हिंग्लिश या अंग्रेज़ी में बोलकर भी पूछ सकते हैं!",
    source: 'राष्ट्रीय औद्योगिक सुरक्षा प्रोटोकॉल',
  },
  hinglish: {
    id: 'welcome-hinglish',
    role: 'bot',
    text: "👷 Namaste! Main aapka Suraksha Saathi hoon. Aap mujhse Fire safety, Gas leak, PPE kit, ya Emergency evacuation ke baare mein likhkar ya 🎙️ Mic button se bolkar pooch sakte hain!",
    source: 'National Industrial Safety Protocol',
  },
  sat: {
    id: 'welcome-sat',
    role: 'bot',
    text: "👷 ᱡᱚᱦᱟᱨ! ᱤᱧ ᱟᱢᱤᱡ ᱥᱩᱨᱠᱷᱟ ᱥᱟᱛᱷᱤ (Suraksha Saathi) ᱠᱟᱹᱱᱟᱹᱧ᱾ ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡ, ᱜᱮᱥ ᱞᱤᱠ, PPE ᱥᱟᱢᱟᱱ ᱟᱨ ᱟᱯᱟᱛᱠᱟᱞ ᱱᱤᱭᱟᱹᱢ ᱠᱚ ᱵᱟᱵᱚᱛ ᱠᱩᱞᱤᱭ ᱢᱮ᱾",
    source: 'ᱡᱟᱹᱛᱤᱭᱟᱹᱨᱤ ᱠᱟᱹᱨᱜᱟᱲ ᱥᱩᱨᱠᱷᱟ ᱯᱨᱳᱴᱳᱠᱳᱞ',
  },
}

const PLACEHOLDERS = {
  en: 'Ask or speak about fire, gas leak, PPE…',
  hi: 'आग, गैस रिसाव, PPE के बारे में पूछें या बोलें…',
  hinglish: 'Fire, gas leak, PPE ke baare mein likhein ya bolein…',
  sat: 'ᱥᱮᱸᱜᱮᱞ, ᱜᱮᱥ ᱞᱤᱠ, PPE ᱵᱟᱵᱚᱛ ᱠᱩᱞᱤᱭ ᱢᱮ…',
}

const QUICK_SUGGESTIONS = {
  en: [
    { label: '🔴 Fire Extinguisher', query: 'How to use a fire extinguisher?' },
    { label: '⚡ Electrical Fire', query: 'Which extinguisher for electrical fire?' },
    { label: '🦺 PPE Kit', query: 'What PPE should I wear during a fire?' },
    { label: '💨 Gas Leak', query: 'How do I detect a gas leak?' },
  ],
  hi: [
    { label: '🔴 अग्निशामक', query: 'अग्निशामक का उपयोग कैसे करें?' },
    { label: '⚡ बिजली की आग', query: 'बिजली की आग के लिए कौन सा अग्निशामक?' },
    { label: '🦺 PPE उपकरण', query: 'आग के दौरान कौन सा PPE पहनें?' },
    { label: '💨 गैस रिसाव', query: 'गैस रिसाव कैसे पहचानें?' },
  ],
  hinglish: [
    { label: '🔴 Fire Extinguisher', query: 'Fire extinguisher kaise use karein?' },
    { label: '⚡ Bijli ki Aag', query: 'Bijli ki aag ke liye kaunsa extinguisher use karein?' },
    { label: '🦺 PPE Kit', query: 'Fire emergency mein kaunsa PPE pehnein?' },
    { label: '💨 Gas Leak', query: 'Gas leak kaise detect karein?' },
  ],
  sat: [
    { label: '🔴 ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ', query: 'ᱥᱮᱸᱜᱮᱞ ᱤᱬᱤᱡᱤᱡ ᱪᱮᱫ ᱞᱮᱠᱟ ᱵᱮᱵᱷᱟᱨᱟ?' },
    { label: '⚡ ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ', query: 'ᱵᱤᱡᱽᱞᱤ ᱥᱮᱸᱜᱮᱞ ᱞᱟᱹᱜᱤᱫ ᱚᱠᱟ ᱤᱬᱤᱡᱤᱡ?' },
    { label: '🦺 PPE ᱥᱟᱢᱟᱱ', query: 'ᱥᱮᱸᱜᱮᱞ ᱚᱠᱛᱚ ᱪᱮᱫ PPE ᱦᱚᱨᱚᱜ ᱞᱟᱹᱠᱛᱤ?' },
    { label: '💨 ᱜᱮᱥ ᱞᱤᱠ', query: 'ᱜᱮᱥ ᱞᱤᱠ ᱪᱮᱫ ᱞᱮᱠᱟ ᱪᱤᱱᱦᱟᱹᱣᱟ?' },
  ],
}

export default function SafetyChatbot() {
  const { lang: globalLang } = useLang()
  const [open, setOpen]                     = useState(false)
  const [badgeDismissed, setBadgeDismissed] = useState(false)
  const [chatLang, setChatLang]             = useState(() => {
    return localStorage.getItem('sar_chat_lang') || (['en', 'hi', 'sat'].includes(globalLang) ? globalLang : 'en')
  })
  const [input, setInput]                   = useState('')
  const [messages, setMessages]             = useState(() => [WELCOME_MESSAGES[chatLang] || WELCOME_MESSAGES.en])
  const [typing, setTyping]                 = useState(false)
  const [isListening, setIsListening]       = useState(false)
  const [speakingMsgId, setSpeakingMsgId]   = useState(null)
  const [voiceNotice, setVoiceNotice]       = useState(null)

  const bottomRef       = useRef(null)
  const inputRef        = useRef(null)
  const recognitionRef  = useRef(null)

  // Sync initial welcome message if user switches chatLang and chat is empty/welcome
  function handleLanguageChange(newLang) {
    if (newLang === chatLang) return
    setChatLang(newLang)
    localStorage.setItem('sar_chat_lang', newLang)

    // Stop ongoing speech & listening
    stopSpeech()
    setSpeakingMsgId(null)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    // Add a stylish system notification in the chat
    const langObj = CHAT_LANGUAGES.find(l => l.code === newLang)
    const noticeText = {
      en: '🌐 Language switched to English (Voice enabled 🎙️)',
      hi: '🌐 भाषा हिंदी में बदल दी गई (आवाज़ सक्रिय 🎙️)',
      hinglish: '🌐 Switched to Hinglish (Voice enabled 🎙️)',
      sat: '🌐 ᱯᱟᱹᱨᱥᱤ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱵᱚᱫᱚᱞᱮᱱᱟ 🌿',
    }[newLang] || `Switched to ${langObj?.name}`

    // If chat only has 1 message (welcome), swap it directly
    if (messages.length <= 1) {
      setMessages([WELCOME_MESSAGES[newLang] || WELCOME_MESSAGES.en])
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'system',
          text: noticeText,
        },
      ])
    }
    scrollBottom()
  }

  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  function handleClose() {
    setOpen(false)
    stopSpeech()
    setSpeakingMsgId(null)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  async function processQuery(queryText) {
    const query = (queryText ?? input).trim()
    if (!query) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    scrollBottom()
    setTyping(true)

    // Thinking delay for natural dialogue
    await new Promise(r => setTimeout(r, 450 + Math.random() * 350))

    const result = queryKnowledgeBase(query, chatLang, null)
    const text = typeof result === 'string' ? result : (result?.answer || "I'm your safety assistant. Please ask any industrial safety question.")
    const source = typeof result === 'object' && result?.source ? result.source : 'Safety Knowledge Base'
    const botMsg = {
      id: Date.now() + 1,
      role: 'bot',
      text,
      source,
      confidence: typeof result === 'object' && result?.confidence ? result.confidence : 0.85,
    }
    setTyping(false)
    setMessages(prev => [...prev, botMsg])
    scrollBottom()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      processQuery()
    }
  }

  // Voice Readout (TTS)
  function handleToggleSpeech(msg) {
    if (speakingMsgId === msg.id) {
      stopSpeech()
      setSpeakingMsgId(null)
      return
    }
    stopSpeech()
    setSpeakingMsgId(msg.id)
    speak(msg.text, chatLang, () => {
      setSpeakingMsgId(null)
    })
  }

  // Voice Input (STT)
  function toggleVoiceInput() {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    // Voice recognition supported in 3 languages: en, hi, hinglish
    if (chatLang === 'sat') {
      setVoiceNotice('🎙️ Voice recognition is supported in 3 languages: English, Hindi, and Hinglish. Please switch language tab to speak.')
      setTimeout(() => setVoiceNotice(null), 4000)
      return
    }

    setVoiceNotice(null)
    const controller = startListening(
      chatLang,
      (recognizedText) => {
        setIsListening(false)
        if (recognizedText) {
          setInput(recognizedText)
          processQuery(recognizedText)
        }
      },
      (error) => {
        setIsListening(false)
        console.warn('[SafetyChatbot] Voice recognition error:', error)
        setVoiceNotice('Could not recognize voice. Please check mic permission or speak clearly.')
        setTimeout(() => setVoiceNotice(null), 4000)
      }
    )

    if (controller) {
      recognitionRef.current = controller
      setIsListening(true)
    }
  }

  useEffect(() => {
    return () => {
      stopSpeech()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const currentSuggestions = QUICK_SUGGESTIONS[chatLang] || QUICK_SUGGESTIONS.en
  const hasVoice = isVoiceSupported(chatLang)

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes micPulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(224, 90, 0, 0.7); transform: scale(1); }
          50% { box-shadow: 0 0 0 8px rgba(224, 90, 0, 0); transform: scale(1.06); }
          100% { box-shadow: 0 0 0 0 rgba(224, 90, 0, 0); transform: scale(1); }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>

      {/* Floating button speech badge */}
      {!open && !badgeDismissed && (
        <div
          onClick={handleOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleOpen() }}
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--color-surface)',
            border: '1.5px solid rgba(224, 90, 0, 0.35)',
            borderRadius: '16px 16px 4px 16px',
            padding: '6px 10px 6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(224, 90, 0, 0.18)',
            zIndex: 'var(--z-modal)',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            width: 22, height: 22,
            borderRadius: '50%',
            background: 'rgba(224, 90, 0, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={13} style={{ color: 'var(--color-brand)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1 }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 500 }}>
              Aapka Apna
            </span>
            <span style={{ color: 'var(--color-brand)', fontSize: '0.84rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Suraksha Saathi
            </span>
          </div>

          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#2ECC71', boxShadow: '0 0 6px #2ECC71',
            flexShrink: 0, marginLeft: 2,
          }} />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setBadgeDismissed(true)
            }}
            aria-label="Close notification"
            title="Dismiss label"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 4px', marginLeft: 4, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)', borderRadius: '50%', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating launcher button */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-label="Aapka Apna Suraksha Saathi"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'var(--color-text-secondary)' : 'var(--color-brand)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(224,90,0,0.4)',
          zIndex: 'var(--z-modal)',
          transition: 'background 0.2s, transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'none',
        }}
      >
        {open ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>

      {/* Chat dialog panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Suraksha Saathi"
          style={{
            position: 'fixed', bottom: 92, right: 24,
            width: 'min(410px, calc(100vw - 32px))',
            height: 'min(560px, calc(100vh - 110px))',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
            zIndex: 'var(--z-modal)',
            overflow: 'hidden',
            animation: 'slideUpFade 0.25s ease',
          }}
        >
          {/* Header with Integrated Chatbot-Only 4-Language Bar */}
          <div style={{
            background: 'var(--color-brand)',
            padding: '12px 14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(224, 90, 0, 0.25)',
          }}>
            {/* Top Row: Bot Icon, Title, Online Status, Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: '0.94rem', lineHeight: 1.2 }}>
                  Suraksha Saathi
                </p>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.67rem', fontWeight: 500 }}>
                  Curated Knowledge Base • Chatbot Only
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(0,0,0,0.22)', padding: '3px 8px', borderRadius: '12px',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4AFF91' }} />
                  <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                    ONLINE
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close chat"
                  style={{
                    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%',
                    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* In-Header Dedicated Language Bar (4 Languages, 3 with Voice) */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.22)',
              borderRadius: '12px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'space-between',
            }}>
              {CHAT_LANGUAGES.map(item => {
                const isSelected = chatLang === item.code
                return (
                  <button
                    key={item.code}
                    onClick={() => handleLanguageChange(item.code)}
                    title={
                      item.voice
                        ? `${item.name} (${item.voiceBadge} supported)`
                        : `${item.name} (Ol Chiki Text)`
                    }
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      padding: '5px 3px',
                      borderRadius: '9px',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 800 : 600,
                      border: 'none',
                      background: isSelected ? '#ffffff' : 'transparent',
                      color: isSelected ? 'var(--color-brand, #E05A00)' : 'rgba(255,255,255,0.92)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <span>{item.native}</span>
                    {item.voice ? (
                      <span style={{
                        fontSize: '0.62rem',
                        lineHeight: 1,
                        opacity: isSelected ? 1 : 0.8,
                      }}>
                        🎙️
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.62rem',
                        lineHeight: 1,
                        opacity: isSelected ? 1 : 0.7,
                      }}>
                        📝
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Voice status notice if any */}
          {voiceNotice && (
            <div style={{
              background: '#FFF3CD', color: '#856404',
              padding: '6px 12px', fontSize: '0.72rem',
              borderBottom: '1px solid #FFEEBA',
              display: 'flex', alignItems: 'center', gap: 6,
              lineHeight: 1.3, flexShrink: 0,
            }}>
              <span>ℹ️</span>
              <span style={{ flex: 1 }}>{voiceNotice}</span>
              <button
                onClick={() => setVoiceNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#856404', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Live Voice Listening Pulse Bar */}
          {isListening && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(224,90,0,0.12), rgba(224,90,0,0.25), rgba(224,90,0,0.12))',
              borderBottom: '1.5px solid var(--color-brand)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.75rem',
              color: 'var(--color-brand)',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#E05A00', animation: 'micPulseGlow 1.2s infinite ease-in-out',
              }} />
              <span>
                {chatLang === 'hi' ? '🎙️ सुन रहा हूँ... बोलिए' :
                 chatLang === 'hinglish' ? '🎙️ Listening... Bol rahe hain...' :
                 '🎙️ Listening... Speak now'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Click Mic to Stop
              </span>
            </div>
          )}

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.map(msg => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.id} style={{
                    alignSelf: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                  }}>
                    {msg.text}
                  </div>
                )
              }

              const isBot = msg.role === 'bot'
              const isSpeaking = speakingMsgId === msg.id

              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: isBot ? 'flex-start' : 'flex-end',
                  gap: 8,
                  alignItems: 'flex-end',
                }}>
                  {isBot && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(224, 90, 0, 0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Bot size={15} style={{ color: 'var(--color-brand)' }} />
                    </div>
                  )}

                  <div style={{ maxWidth: '84%' }}>
                    <div style={{
                      padding: '10px 13px',
                      background: isBot ? 'var(--color-surface-alt)' : 'var(--color-brand)',
                      color: isBot ? 'var(--color-text-primary)' : 'white',
                      borderRadius: isBot ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.55,
                      border: isBot ? '1px solid var(--color-border)' : 'none',
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.text}
                    </div>

                    {/* Source tag + Voice Readout button */}
                    {isBot && (
                      <div style={{
                        display: 'flex', gap: 6, marginTop: 4,
                        alignItems: 'center', flexWrap: 'wrap',
                      }}>
                        {msg.source && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '1px 6px',
                          }}>
                            📚 {msg.source}
                          </span>
                        )}

                        {isTTSSupported(chatLang) && (
                          <button
                            onClick={() => handleToggleSpeech(msg)}
                            title={isSpeaking ? 'Stop speaking' : 'Listen with Voice'}
                            style={{
                              background: isSpeaking ? 'var(--color-brand)' : 'var(--color-surface)',
                              border: isSpeaking ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              padding: '2px 7px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: isSpeaking ? 'white' : 'var(--color-text-secondary)',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              transition: 'all 0.15s ease',
                            }}
                            aria-label={isSpeaking ? 'Stop speech' : 'Play speech'}
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX size={12} />
                                <span>Playing…</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={12} />
                                <span>Voice 🔊</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(224, 90, 0, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Bot size={15} style={{ color: 'var(--color-brand)' }} />
                </div>
                <div style={{
                  padding: '9px 13px',
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px 18px 18px 18px',
                  display: 'flex', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--color-text-muted)',
                      animation: `typingBounce 1s ease ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Suggested Prompt Pills */}
          <div style={{
            padding: '4px 12px 6px',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
            background: 'var(--color-surface)',
          }}>
            {currentSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => processQuery(item.query)}
                disabled={typing || isListening}
                style={{
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '4px 9px',
                  fontSize: '0.68rem',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(224, 90, 0, 0.12)'
                  e.currentTarget.style.color = 'var(--color-brand)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--color-surface-alt)'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <div style={{
            padding: '8px 12px 10px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
            background: 'var(--color-surface)',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[chatLang] || PLACEHOLDERS.en}
              rows={1}
              style={{
                flex: 1,
                border: isListening ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: '0.84rem',
                resize: 'none',
                outline: 'none',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: chatLang === 'sat' ? 'var(--font-santali), var(--font-sans)' : 'var(--font-sans)',
                lineHeight: 1.45,
                maxHeight: 72,
                overflowY: 'auto',
                boxShadow: isListening ? '0 0 0 3px rgba(224, 90, 0, 0.15)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />

            {/* Voice Input (Microphone) Button */}
            <button
              onClick={toggleVoiceInput}
              title={
                isListening ? 'Stop listening' :
                hasVoice ? `Speak in ${CHAT_LANGUAGES.find(l => l.code === chatLang)?.name}` :
                'Voice available in English, Hindi & Hinglish'
              }
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: isListening ? '#E05A00' : 'var(--color-surface-alt)',
                border: isListening ? '2px solid #C0392B' : '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: isListening ? '#ffffff' : 'var(--color-text-primary)',
                animation: isListening ? 'micPulseGlow 1.2s infinite' : 'none',
                transition: 'all 0.15s ease',
              }}
              aria-label={isListening ? 'Stop voice recording' : 'Start voice input'}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => processQuery()}
              disabled={!input.trim() || typing}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() ? 'var(--color-brand)' : 'var(--color-border)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              aria-label="Send query"
            >
              <Send size={16} color="white" />
            </button>
          </div>

          {/* Footer note */}
          <div style={{
            padding: '4px 12px 8px',
            fontSize: '0.62rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            flexShrink: 0,
            background: 'var(--color-surface)',
          }}>
            Curated Safety KB • 4 Languages • 3 Voice Modes (EN, HI, Hinglish)
          </div>
        </div>
      )}
    </>
  )
}

