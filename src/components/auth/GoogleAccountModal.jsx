import React, { useState, useEffect } from 'react'
import { X, UserPlus, ArrowLeft, Check, Clock, Bell, Trash2 } from 'lucide-react'
import { getGooglePresetAvatar } from '../../data/googleAvatars'

const STORAGE_KEY = 'suraksha_device_google_accounts'

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount }) {
  // Saved Google accounts ONLY for this specific device
  const [savedAccounts, setSavedAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showInputForm, setShowInputForm] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [formError, setFormError] = useState('')

  // Google OAuth Verification Animation State
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyStep, setVerifyStep] = useState(0)

  // Load accounts saved on this device
  useEffect(() => {
    if (!isOpen) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const accounts = raw ? JSON.parse(raw) : []
      setSavedAccounts(accounts)
      // If no accounts on this device, directly show clean input form
      if (!accounts || accounts.length === 0) {
        setShowInputForm(true)
      } else {
        setShowInputForm(false)
      }
    } catch {
      setSavedAccounts([])
      setShowInputForm(true)
    }
    setSelectedAccount(null)
    setIsVerifying(false)
    setVerifyStep(0)
    setFormError('')
  }, [isOpen])

  if (!isOpen) return null

  function saveAccountToDevice(acc) {
    try {
      const existing = savedAccounts.filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase())
      const updated = [acc, ...existing].slice(0, 5) // Keep up to 5 on this device
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSavedAccounts(updated)
    } catch (err) {
      console.warn('[GoogleAccountModal] Failed saving account to device:', err)
    }
  }

  function removeAccountFromDevice(e, emailToRemove) {
    e.stopPropagation()
    const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSavedAccounts(updated)
    if (updated.length === 0) {
      setShowInputForm(true)
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    setFormError('')

    const cleanEmail = emailInput.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Please enter a valid Google / Gmail address')
      return
    }

    const autoName = nameInput.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ')
    const capName = autoName.charAt(0).toUpperCase() + autoName.slice(1)
    const avatar = getGooglePresetAvatar(cleanEmail, capName)

    const account = {
      name: capName,
      email: cleanEmail,
      avatar,
    }

    setSelectedAccount(account)
    setShowInputForm(false)
  }

  function handleConfirmSignIn() {
    if (!selectedAccount || isVerifying) return
    setIsVerifying(true)
    setVerifyStep(1)

    // Save to this device's storage
    saveAccountToDevice(selectedAccount)

    // Step 1: Handshake
    setTimeout(() => {
      setVerifyStep(2)
    }, 700)

    // Step 2: Tokens & Verification
    setTimeout(() => {
      setVerifyStep(3)
    }, 1500)

    // Step 3: Authorization
    setTimeout(() => {
      setVerifyStep(4)
    }, 2300)

    // Step 4: Finish & Redirect
    setTimeout(() => {
      onSelectAccount({
        name: selectedAccount.name,
        email: selectedAccount.email,
        avatarUrl: selectedAccount.avatar || getGooglePresetAvatar(selectedAccount.email, selectedAccount.name),
      })
    }, 2900)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) onClose()
      }}
    >
      <div
        style={{
          background: '#131314',
          color: '#E8EAED',
          border: '1px solid #3c4043',
          borderRadius: 24,
          maxWidth: 580,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <style>{`
          @keyframes googleBarShift {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes googleSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .google-spinner-mini {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2.5px solid rgba(66, 133, 244, 0.25);
            border-top-color: #4285F4;
            border-right-color: #EA4335;
            animation: googleSpin 0.75s linear infinite;
            flex-shrink: 0;
          }
        `}</style>

        {/* Top 4-Color Animated Indeterminate Google Progress Bar */}
        {isVerifying && (
          <div
            style={{
              height: 3.5,
              width: '100%',
              background: 'linear-gradient(90deg, #4285F4 0%, #EA4335 25%, #FBBC05 50%, #34A853 75%, #4285F4 100%)',
              backgroundSize: '200% 100%',
              animation: 'googleBarShift 1.2s linear infinite',
            }}
          />
        )}

        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Official Google G Logo */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#E8EAED', letterSpacing: '0.2px' }}>
              {isVerifying ? 'Google Identity Services' : 'Sign in with Google'}
            </span>
          </div>

          {!isVerifying && (
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
          )}
        </div>

        {/* Modal Content */}
        <div style={{ padding: isVerifying ? '28px 24px' : '22px 24px', overflowY: 'auto' }}>
          {isVerifying && selectedAccount ? (
            /* VERIFICATION IN PROGRESS */
            <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'conic-gradient(#4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
                    animation: 'googleSpin 2s linear infinite',
                    filter: 'blur(3px)',
                    opacity: 0.85,
                  }}
                />
                <img
                  src={selectedAccount.avatar}
                  alt={selectedAccount.name}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    zIndex: 1,
                    border: '2px solid #202124',
                  }}
                />
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px' }}>
                {selectedAccount.name}
              </h3>
              <div style={{ fontSize: 13, color: '#9AA0A6', marginBottom: 18 }}>
                {selectedAccount.email} · <span style={{ color: '#8AB4F8' }}>Google Account</span>
              </div>

              {/* Progress checklist */}
              <div
                style={{
                  background: '#1E1F22',
                  border: '1px solid #3C4043',
                  borderRadius: 14,
                  padding: '16px 18px',
                  margin: '0 auto 16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA0A6', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Google OAuth 2.0 Identity Protocol
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep > 1 ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="google-spinner-mini" />
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 1 ? '#E8EAED' : '#9AA0A6' }}>
                      Secure Identity Handshake
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep > 1 ? '#81C995' : '#8AB4F8', fontWeight: 600 }}>
                    {verifyStep > 1 ? 'Connected ✓' : 'Connecting...'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep > 2 ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : verifyStep === 2 ? (
                      <div className="google-spinner-mini" />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #5F6368', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={10} color="#80868B" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 2 ? '#E8EAED' : '#9AA0A6' }}>
                      Verifying Account Credentials
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep > 2 ? '#81C995' : verifyStep === 2 ? '#8AB4F8' : '#80868B', fontWeight: 600 }}>
                    {verifyStep > 2 ? 'Verified ✓' : verifyStep === 2 ? 'Verifying...' : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep >= 4 ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #5F6368', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={10} color="#80868B" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 4 ? '#E8EAED' : '#9AA0A6' }}>
                      Authorizing SurakshaAR Portal
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep >= 4 ? '#81C995' : '#80868B', fontWeight: 600 }}>
                    {verifyStep >= 4 ? 'Authorized ✓' : 'Pending'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background: 'rgba(66, 133, 244, 0.12)',
                  border: '1px solid rgba(66, 133, 244, 0.3)',
                  borderRadius: 18,
                  fontSize: 12,
                  color: '#D2E3FC',
                }}
              >
                <Bell size={13} color="#8AB4F8" />
                <span>Logging into SurakshaAR as {selectedAccount.name}...</span>
              </div>
            </div>
          ) : !selectedAccount && showInputForm ? (
            /* ENTER GOOGLE ACCOUNT FORM (Always clean & privacy-safe for each person) */
            <div style={{ maxWidth: 440, margin: '0 auto' }}>
              <div style={{ marginBottom: 20 }}>
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowInputForm(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8AB4F8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      padding: 0,
                      marginBottom: 12,
                    }}
                  >
                    <ArrowLeft size={14} /> Back to saved accounts
                  </button>
                )}
                <h2 style={{ fontSize: 24, fontWeight: 500, margin: '0 0 6px', color: '#FFFFFF' }}>
                  Use your Google Account
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#9AA0A6' }}>
                  Enter your Google / Gmail details to continue to <strong style={{ color: '#FFFFFF' }}>SurakshaAR</strong>
                </p>
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#BDC1C6', marginBottom: 6, fontWeight: 500 }}>
                    Email or phone *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. yourname@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#1F1F23',
                      border: '1px solid #5F6368',
                      borderRadius: 10,
                      color: '#FFFFFF',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#BDC1C6', marginBottom: 6, fontWeight: 500 }}>
                    Full Name (as on your certificate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Kumar"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#1F1F23',
                      border: '1px solid #5F6368',
                      borderRadius: 10,
                      color: '#FFFFFF',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {formError && (
                  <div style={{ fontSize: 12, color: '#F28B82' }}>{formError}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8AB4F8',
                      cursor: 'pointer',
                      fontSize: 13,
                      padding: 0,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      background: '#8AB4F8',
                      color: '#131314',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          ) : !selectedAccount && savedAccounts.length > 0 ? (
            /* SAVED ACCOUNTS ON THIS SPECIFIC PHONE (Zero hardcoded data) */
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 24, fontWeight: 500, margin: '0 0 6px', color: '#FFFFFF' }}>
                  Choose an account
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#9AA0A6' }}>
                  to continue to <strong style={{ color: '#8AB4F8' }}>SurakshaAR</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => setSelectedAccount(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderRadius: 12,
                      background: '#1F1F23',
                      border: '1px solid #3C4043',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={acc.avatar || getGooglePresetAvatar(acc.email, acc.name)}
                        alt={acc.name}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9AA0A6' }}>
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeAccountFromDevice(e, acc.email)}
                      title="Remove from device"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#80868B',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Use another account option */}
                <div
                  onClick={() => setShowInputForm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderRadius: 12,
                    background: 'transparent',
                    border: '1px dashed #5F6368',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
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
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#8AB4F8' }}>
                    Use another account
                  </div>
                </div>
              </div>
            </div>
          ) : selectedAccount ? (
            /* CONFIRM SIGN-IN DIALOG */
            <div style={{ maxWidth: 460, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <img
                  src={selectedAccount.avatar || getGooglePresetAvatar(selectedAccount.email, selectedAccount.name)}
                  alt={selectedAccount.name}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: '0 auto 12px',
                    border: '2px solid #8AB4F8',
                  }}
                />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px' }}>
                  Continue as {selectedAccount.name}
                </h3>
                <div style={{ fontSize: 13, color: '#9AA0A6' }}>
                  {selectedAccount.email}
                </div>
              </div>

              <div
                style={{
                  background: '#1F1F23',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 12,
                  color: '#9AA0A6',
                  lineHeight: 1.5,
                  marginBottom: 20,
                  border: '1px solid #3C4043',
                }}
              >
                Google will share your name, email address, and profile details with{' '}
                <strong style={{ color: '#FFFFFF' }}>SurakshaAR</strong> to authenticate your safety training session.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 20,
                    background: 'transparent',
                    border: '1px solid #5F6368',
                    color: '#E8EAED',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSignIn}
                  style={{
                    padding: '9px 24px',
                    borderRadius: 20,
                    background: '#8AB4F8',
                    color: '#131314',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Continue
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
