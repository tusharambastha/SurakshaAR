import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { SUPPORTED_LANGUAGES } from '../../lib/i18n'
import { speak } from '../../lib/voice'
import {
  User, LogOut, ChevronDown, Sun, Volume2,
  LayoutDashboard, Home,
} from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, T } = useLang()
  const { highContrast, toggleHighContrast } = useAccessibility()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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
              onClick={() => { setLangOpen(o => !o); setProfileOpen(false) }}
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
                onClick={() => { setProfileOpen(o => !o); setLangOpen(false) }}
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
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(langOpen || profileOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          onClick={() => { setLangOpen(false); setProfileOpen(false) }}
        />
      )}
    </nav>
  )
}
