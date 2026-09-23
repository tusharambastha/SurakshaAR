import React, { useState } from 'react'
import { X, UserPlus, ArrowLeft, Shield, Check } from 'lucide-react'

// Default Google accounts matching the user's Google Account Chooser screen
const GOOGLE_ACCOUNTS = [
  {
    name: 'Kishan Anand',
    email: 'kishanmgr2022@gmail.com',
    initial: 'K',
    bg: '#00796B',
    signedOut: false,
  },
  {
    name: 'Tushar Ambastha',
    email: 'ambasthatusar@gmail.com',
    initial: 'T',
    bg: '#D84315',
    signedOut: false,
  },
  {
    name: 'Ruchi Shree mali',
    email: 'ruchishreemali0@gmail.com',
    initial: 'R',
    bg: '#C2185B',
    signedOut: false,
  },
  {
    name: 'Tathagat Anand',
    email: 'tathagatanand412@gmail.com',
    initial: 'T',
    bg: '#E91E63',
    signedOut: false,
  },
  {
    name: 'Kishan Anand',
    email: 'kishanmgr2004@gmail.com',
    initial: 'K',
    bg: '#00838F',
    signedOut: false,
  },
  {
    name: 'Roopa Patek',
    email: 'roopapatek02@gmail.com',
    initial: 'R',
    bg: '#558B2F',
    signedOut: true,
  },
  {
    name: 'Aditya Verma',
    email: 'verma86700@gmail.com',
    initial: 'A',
    bg: '#00695C',
    signedOut: true,
  },
  {
    name: 'SurakshaAR',
    email: 'surakshaar.in@gmail.com',
    initial: 'S',
    bg: '#E65100',
    signedOut: false,
  },
]

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount }) {
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customError, setCustomError] = useState('')

  if (!isOpen) return null

  function handleSelect(acc) {
    setSelectedAccount(acc)
  }

  function handleConfirmSignIn() {
    if (!selectedAccount) return
    onSelectAccount({
      name: selectedAccount.name,
      email: selectedAccount.email,
    })
  }

  function handleCustomSubmit(e) {
    e.preventDefault()
    setCustomError('')
    if (!customEmail || !customEmail.includes('@')) {
      setCustomError('Please enter a valid Gmail address')
      return
    }
    const cleanEmail = customEmail.trim().toLowerCase()
    const autoName = customName.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ')
    const capName = autoName.charAt(0).toUpperCase() + autoName.slice(1)
    const initial = (capName[0] || 'G').toUpperCase()

    const newAcc = {
      name: capName,
      email: cleanEmail,
      initial,
      bg: '#E05A00',
      signedOut: false,
    }
    setSelectedAccount(newAcc)
    setShowCustomInput(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#131314',
          color: '#E8EAED',
          border: '1px solid #3c4043',
          borderRadius: 24,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Google G Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#E8EAED', letterSpacing: '0.2px' }}>
              Sign in with Google
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9AA0A6',
              cursor: 'pointer',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {!selectedAccount ? (
            /* STEP 1: CHOOSE AN ACCOUNT (Matching User Screenshot 4) */
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {/* Left Column */}
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ marginBottom: 18 }}>
                  {/* SurakshaAR Shield Brand Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #FF6B00 0%, #E05A00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      boxShadow: '0 4px 16px rgba(224, 90, 0, 0.35)',
                    }}
                  >
                    <Shield size={22} color="#FFFFFF" />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 500, margin: '0 0 8px', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                    Choose an account
                  </h2>
                  <p style={{ margin: 0, fontSize: 14, color: '#9AA0A6' }}>
                    to continue to <span style={{ color: '#8AB4F8', fontWeight: 500 }}>SurakshaAR</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Accounts List */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                {showCustomInput ? (
                  <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#8AB4F8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          padding: 0,
                        }}
                      >
                        <ArrowLeft size={14} /> Back to account list
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#9AA0A6', marginBottom: 6 }}>
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kishan Anand"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: '#202124',
                          border: '1px solid #3c4043',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#9AA0A6', marginBottom: 6 }}>
                        Gmail Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: '#202124',
                          border: '1px solid #3c4043',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: 14,
                        }}
                      />
                    </div>

                    {customError && (
                      <div style={{ fontSize: 12, color: '#F28B82' }}>{customError}</div>
                    )}

                    <button
                      type="submit"
                      style={{
                        marginTop: 6,
                        background: '#8AB4F8',
                        color: '#202124',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 20,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Continue
                    </button>
                  </form>
                ) : (
                  <>
                    <div style={{ maxHeight: 330, overflowY: 'auto', paddingRight: 4 }}>
                      {GOOGLE_ACCOUNTS.map((acc, idx) => (
                        <div
                          key={acc.email}
                          onClick={() => handleSelect(acc)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderRadius: 10,
                            borderBottom: idx < GOOGLE_ACCOUNTS.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#282A2D')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* Avatar */}
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: acc.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 14,
                                color: '#FFFFFF',
                                flexShrink: 0,
                              }}
                            >
                              {acc.initial}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#E8EAED', lineHeight: 1.2 }}>
                                {acc.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#9AA0A6', lineHeight: 1.2, marginTop: 2 }}>
                                {acc.email}
                              </div>
                            </div>
                          </div>

                          {acc.signedOut && (
                            <span style={{ fontSize: 11, color: '#9AA0A6', paddingRight: 6 }}>
                              Signed out
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Use another account */}
                    <div
                      onClick={() => setShowCustomInput(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: 10,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        marginTop: 4,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#282A2D')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          border: '1px solid #5F6368',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#E8EAED',
                          flexShrink: 0,
                        }}
                      >
                        <UserPlus size={16} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#E8EAED' }}>
                        Use another account
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: CONFIRM / CONSENT SCREEN (Matching User Screenshot 3) */
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {/* Left Column */}
              <div style={{ flex: '1 1 240px' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #FF6B00 0%, #E05A00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    boxShadow: '0 4px 16px rgba(224, 90, 0, 0.35)',
                  }}
                >
                  <Shield size={22} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 500, margin: '0 0 16px', color: '#FFFFFF', lineHeight: 1.25 }}>
                  Make sure that you downloaded this app from Google
                </h2>

                {/* Selected account pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '4px 12px 4px 4px',
                    borderRadius: 20,
                    border: '1px solid #3c4043',
                    background: '#202124',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: selectedAccount.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                      color: '#FFFFFF',
                    }}
                  >
                    {selectedAccount.initial}
                  </div>
                  <span style={{ fontSize: 13, color: '#E8EAED', fontWeight: 500 }}>
                    {selectedAccount.email}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#BDC1C6', lineHeight: 1.5, margin: '0 0 14px' }}>
                    Don't sign in to <strong style={{ color: '#FFFFFF' }}>SurakshaAR</strong> unless you're sure you downloaded this app from Google.
                  </p>
                  <p style={{ fontSize: 13, color: '#9AA0A6', lineHeight: 1.5, margin: '0 0 14px' }}>
                    If you downloaded <strong style={{ color: '#FFFFFF' }}>SurakshaAR</strong> from Google, this app may be asking you to sign in again now because this app was recently updated.
                  </p>
                  <p style={{ fontSize: 12, color: '#9AA0A6', lineHeight: 1.5, margin: '0 0 24px' }}>
                    To continue, Google will share your name, email address, language preference, and profile details with SurakshaAR.
                  </p>
                </div>

                {/* Bottom Action Buttons (Matching Screenshot 3) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(null)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 20,
                      background: '#131314',
                      border: '1px solid #5F6368',
                      color: '#E8EAED',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#282A2D')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#131314')}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSignIn}
                    style={{
                      padding: '10px 26px',
                      borderRadius: 20,
                      background: '#131314',
                      border: '1px solid #FFFFFF',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.color = '#131314'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#131314'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                  >
                    <Check size={16} /> Sign in
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
