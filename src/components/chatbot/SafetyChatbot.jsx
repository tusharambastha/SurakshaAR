/**
 * SurakshaAR — Safety Chatbot Component
 *
 * NOT an LLM — keyword-based curated knowledge base matcher.
 * Clearly labelled as "Curated Safety Knowledge Base".
 * Safe, deterministic fallback for unrecognized queries.
 */
import { useState, useRef } from 'react'
import { MessageCircle, X, Send, Bot, Volume2 } from 'lucide-react'
import { useLang } from '../../contexts/LanguageContext'
import { queryKnowledgeBase } from '../../lib/safetyKnowledge'
import { speak, isTTSSupported } from '../../lib/voice'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "👷 Hello! I'm your Safety Knowledge Assistant. Ask me about fire response, gas leaks, PPE, or emergency procedures. I use a curated industrial safety knowledge base.",
}

export default function SafetyChatbot() {
  const { lang } = useLang()
  const [open, setOpen]                 = useState(false)
  const [badgeDismissed, setBadgeDismissed] = useState(false)
  const [input, setInput]               = useState('')
  const [messages, setMessages]         = useState([WELCOME_MESSAGE])
  const [typing, setTyping]             = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()


  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  async function handleSend() {
    const query = input.trim()
    if (!query) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    scrollBottom()
    setTyping(true)

    // Simulate a short thinking delay (realistic UX)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

    const result = queryKnowledgeBase(query, lang, null)
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleListen(text) {
    speak(text, lang)
  }

  return (
    <>
      {/* Floating button stylish speech badge with dismiss (×) option */}
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
          {/* Bot icon in subtle brand tint */}
          <div style={{
            width: 22, height: 22,
            borderRadius: '50%',
            background: 'rgba(224, 90, 0, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={13} style={{ color: 'var(--color-brand)' }} />
          </div>

          {/* Styled Typography */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1 }}>
            <span style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}>
              Aapka Apna
            </span>
            <span style={{
              color: 'var(--color-brand)',
              fontSize: '0.84rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}>
              Suraksha Saathi
            </span>
          </div>

          {/* Active online dot */}
          <span style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: '#2ECC71',
            boxShadow: '0 0 6px #2ECC71',
            flexShrink: 0,
            marginLeft: 2,
          }} />

          {/* Small, clearly visible dismiss (×) button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setBadgeDismissed(true)
            }}
            aria-label="Close notification"
            title="Dismiss label"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              marginLeft: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
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

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Suraksha Saathi"
          style={{
            position: 'fixed', bottom: 92, right: 24,
            width: 'min(380px, calc(100vw - 48px))',
            height: 'min(520px, calc(100vh - 120px))',
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
          {/* Header */}
          <div style={{
            background: 'var(--color-brand)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 'var(--text-sm)', lineHeight: 1.2 }}>
                Suraksha Saathi
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-xs)' }}>
                Curated Knowledge Base
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4AFF91' }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontWeight: 600 }}>ONLINE</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8, alignItems: 'flex-end',
              }}>
                {msg.role === 'bot' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: 'var(--color-brand-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Bot size={14} style={{ color: 'var(--color-brand)' }} />
                  </div>
                )}
                <div style={{ maxWidth: '82%' }}>
                  <div style={{
                    padding: '10px 13px',
                    background: msg.role === 'user' ? 'var(--color-brand)' : 'var(--color-surface-alt)',
                    color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    fontSize: 'var(--text-sm)', lineHeight: 1.55,
                    border: msg.role === 'bot' ? '1px solid var(--color-border)' : 'none',
                  }}>
                    {msg.text}
                  </div>
                  {/* Source tag + TTS for bot messages */}
                  {msg.role === 'bot' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      {msg.source && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          background: 'var(--color-surface-alt)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '1px 6px',
                        }}>
                          📚 {msg.source}
                        </span>
                      )}
                      {isTTSSupported(lang) && (
                        <button
                          onClick={() => handleListen(msg.text)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                          aria-label="Listen"
                        >
                          <Volume2 size={12} style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={14} style={{ color: 'var(--color-brand)' }} />
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-muted)',
                      animation: `typingBounce 1s ease ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about fire, gas leak, PPE…"
              rows={1}
              style={{
                flex: 1, border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '8px 12px',
                fontSize: 'var(--text-sm)', resize: 'none', outline: 'none',
                background: 'var(--color-surface)', color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.5,
                maxHeight: 80, overflowY: 'auto',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() ? 'var(--color-brand)' : 'var(--color-border)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
              aria-label="Send"
            >
              <Send size={16} color="white" />
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '6px 12px 10px',
            fontSize: '0.62rem', color: 'var(--color-text-muted)',
            textAlign: 'center', flexShrink: 0,
          }}>
            Curated safety KB · Not AI-generated · In an emergency call your Safety Officer
          </div>
        </div>
      )}
    </>
  )
}
