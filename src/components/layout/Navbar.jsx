import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { SUPPORTED_LANGUAGES } from '../../lib/i18n'
import { speak } from '../../lib/voice'
import {
  User, LogOut, ChevronDown, Sun, Volume2,
  LayoutDashboard, Home, MoreVertical, BookOpen, HelpCircle, Settings, Info, X,
} from 'lucide-react'
import VideoTutorialModal from '../ui/VideoTutorialModal'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, T } = useLang()
  const { highContrast, toggleHighContrast } = useAccessibility()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showVideoTutorial, setShowVideoTutorial] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const isAdmin = profile?.role === 'admin'

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleVoice() {
    // Read the current page title aloud
    const pageTitle = document.title || 'SurakshaAR'
    speak(pageTitle, lang)
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Trainee'

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 'var(--navbar-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 'var(--z-dropdown)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 clamp(8px, 3vw, var(--space-4))',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', width: '100%',
        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, var(--space-4))',
      }}>
        {/* Logo */}
        <Link
          to={user ? (isAdmin ? '/admin' : '/dashboard') : '/landing'}
          style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/surakshaar-logo.png`}
            alt="SurakshaAR"
            style={{ height: 44, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </Link>

        {/* Admin badge */}
        {isAdmin && (
          <span className="badge badge-brand" style={{ fontSize: '0.65rem' }}>ADMIN</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Desktop controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>

          {/* Home button */}
          <Link
            to="/landing"
            style={{
              width: 36,
              height: 36,
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-alt)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: 0,
              flexShrink: 0,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            }}
            aria-label="Home"
            title="Go to Home"
          >
            <Home size={16} />
          </Link>

          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setLangOpen(o => !o); setProfileOpen(false); setMenuOpen(false) }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'var(--color-surface-alt)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                height: 36,
                padding: '0 12px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.find(l => l.code === lang)?.nativeLabel ?? 'EN'}
              <ChevronDown size={12} />
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                zIndex: 200,
                minWidth: 140,
              }}>
                {SUPPORTED_LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '10px 14px',
                      background: lang === l.code ? 'var(--color-brand-50)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      fontSize: 'var(--text-sm)', fontWeight: lang === l.code ? 700 : 400,
                      color: lang === l.code ? 'var(--color-brand)' : 'var(--color-text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice button — always visible, even on mobile */}
          <button
            onClick={handleVoice}
            style={{
              width: 36,
              height: 36,
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface-alt)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: 0,
              flexShrink: 0,
            }}
            aria-label="Text to speech"
            title="Listen (Text to Speech)"
          >
            <Volume2 size={16} />
          </button>

          {/* High contrast toggle — hidden on small mobile */}
          <button
            onClick={toggleHighContrast}
            className="navbar-secondary-btn"
            style={{
              width: 36,
              height: 36,
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: highContrast ? 'var(--color-brand)' : 'var(--color-surface-alt)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: highContrast ? 'white' : 'var(--color-text-secondary)',
              padding: 0,
              flexShrink: 0,
            }}
            aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            title={T('highContrast')}
          >
            <Sun size={16} />
          </button>

          {/* User profile / login */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setProfileOpen(o => !o); setLangOpen(false); setMenuOpen(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--color-surface-alt)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  height: 36,
                  padding: '0 12px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--color-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: 'white',
                  flexShrink: 0,
                }}>
                  {firstName[0]?.toUpperCase()}
                </div>
                <span style={{
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  maxWidth: 72,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {firstName}
                </span>
                <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  zIndex: 200,
                  minWidth: 180,
                }}>
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                  }}>
                    {user.email}
                  </div>
                  {isAdmin ? (
                    <button
                      onClick={() => { navigate('/admin'); setProfileOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '10px 14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <LayoutDashboard size={15} />
                      Admin Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '10px 14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <User size={15} />
                      {T('profile')}
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '10px 14px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--text-sm)', color: 'var(--color-error)',
                      textAlign: 'left',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <LogOut size={15} />
                    {T('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              {T('login')}
            </Link>
          )}

          {/* Three-dot vertical menu (⋮) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setMenuOpen(o => !o)
                setLangOpen(false)
                setProfileOpen(false)
              }}
              style={{
                width: 36,
                height: 36,
                boxSizing: 'border-box',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-surface-alt)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: 0,
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}
              aria-label="More options"
              aria-expanded={menuOpen}
              title="More options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                zIndex: 200,
                minWidth: 190,
                maxWidth: 'calc(100vw - 24px)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setShowVideoTutorial(true)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <BookOpen size={15} color="var(--color-brand)" />
                  <span>Training Guide</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setShowHelpModal(true)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <HelpCircle size={15} color="#0284C7" />
                  <span>Help & Support</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false)
                    if (user) {
                      navigate('/profile')
                    } else {
                      setShowSettingsModal(true)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={15} color="#64748B" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setShowAboutModal(true)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                    borderTop: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-alt)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Info size={15} color="#16A34A" />
                  <span>About SurakshaAR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Tutorial Modal for Training Guide */}
      <VideoTutorialModal
        isOpen={showVideoTutorial}
        onClose={() => setShowVideoTutorial(false)}
      />

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, boxSizing: 'border-box',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHelpModal(false) }}
        >
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg, 16px)',
            width: '100%', maxWidth: 460,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-alt)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <HelpCircle size={18} color="#0284C7" />
                <span>Help & Support</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', fontWeight: 700 }}>National Emergency Helplines</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 'var(--text-xs)' }}>
                  <div style={{ padding: '8px 10px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <strong>🚒 Fire:</strong> 101
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <strong>🚑 Ambulance:</strong> 108
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <strong>👮 Police:</strong> 100
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <strong>🆘 National Emergency:</strong> 112
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', fontWeight: 700 }}>Suraksha Saathi AI Assistant</h4>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  For real-time guidance on safety procedures, PPE compliance, and emergency protocols, tap the <strong>Suraksha Saathi</strong> floating assistant at the bottom right corner of your screen.
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm btn-full"
                onClick={() => setShowHelpModal(false)}
                style={{ marginTop: 4 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, boxSizing: 'border-box',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false) }}
        >
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg, 16px)',
            width: '100%', maxWidth: 440,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-alt)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <Settings size={18} color="#64748B" />
                <span>Settings</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Preferences like <strong>Language</strong> and <strong>High Contrast Mode</strong> can be adjusted anytime directly from the top navigation bar.
              </p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Sign in to your trainee account to configure your personal profile, department, and site location preferences.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => { setShowSettingsModal(false); navigate('/login') }}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-full"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About SurakshaAR Modal */}
      {showAboutModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, boxSizing: 'border-box',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAboutModal(false) }}
        >
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg, 16px)',
            width: '100%', maxWidth: 460,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-alt)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <Info size={18} color="#16A34A" />
                <span>About SurakshaAR</span>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={`${import.meta.env.BASE_URL}images/surakshaar-logo.png`}
                  alt="SurakshaAR"
                  style={{ height: 38, width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)' }}>SurakshaAR</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', fontWeight: 600 }}>
                    Version 1.0.0 · SIH 2026 (SIH26041)
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                SurakshaAR is an Augmented Reality (AR) industrial safety training platform designed to prepare workers and trainees for hazardous emergencies without real-world danger.
              </p>
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}>
                ✓ Built for zero-casualty industrial workplaces in Bharat.<br />
                ✓ Compliant with IS 2925, IS 15298, and national safety guidelines.
              </div>
              <button
                className="btn btn-primary btn-sm btn-full"
                onClick={() => setShowAboutModal(false)}
                style={{ marginTop: 4 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns on outside click */}
      {(langOpen || profileOpen || menuOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          onClick={() => { setLangOpen(false); setProfileOpen(false); setMenuOpen(false) }}
        />
      )}
    </nav>
  )
}
