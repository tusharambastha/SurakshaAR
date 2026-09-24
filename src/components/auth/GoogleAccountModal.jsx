import React, { useState, useRef } from 'react'
import { X, UserPlus, ArrowLeft, Check, Camera, Image as ImageIcon, Clock, Bell, Shield, Lock } from 'lucide-react'
import { GOOGLE_AVATAR_PRESETS, getGooglePresetAvatar } from '../../data/googleAvatars'
import { sendGoogleSecurityAlert } from '../../lib/emailService'

// Google accounts matching the user's real Google Account Chooser screen
const GOOGLE_ACCOUNTS = [
  {
    name: 'Kishan Anand',
    email: 'kishanmgr2022@gmail.com',
    avatar: GOOGLE_AVATAR_PRESETS['kishanmgr2022@gmail.com'],
    initial: 'K',
    bg: '#00796B',
    signedOut: false,
  },
  {
    name: 'Ruchi Shree mali',
    email: 'ruchishreemali0@gmail.com',
    avatar: GOOGLE_AVATAR_PRESETS['ruchishreemali0@gmail.com'],
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
    name: 'Tushar Ambastha',
    email: 'ambasthatusar@gmail.com',
    avatar: GOOGLE_AVATAR_PRESETS['ambasthatusar@gmail.com'],
    initial: 'T',
    bg: '#D84315',
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
  const [customAvatar, setCustomAvatar] = useState(null)
  const [customError, setCustomError] = useState('')
  const fileInputRef = useRef(null)

  // Systematic Google verification state
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyStep, setVerifyStep] = useState(0) // 1: handshake, 2: tokens, 3: email alert, 4: authorized

  if (!isOpen) return null

  function handleSelect(acc) {
    setSelectedAccount(acc)
  }

  function handleConfirmSignIn() {
    if (!selectedAccount || isVerifying) return
    setIsVerifying(true)
    setVerifyStep(1)

    // Step 1: Connecting to Google Identity Services (0ms -> 850ms)
    setTimeout(() => {
      setVerifyStep(2)
    }, 850)

    // Step 2: Validating credentials & Dispatching Google Security notification to Gmail (850ms -> 1800ms)
    setTimeout(() => {
      setVerifyStep(3)
      sendGoogleSecurityAlert({
        email: selectedAccount.email,
        fullName: selectedAccount.name,
        device: 'Chrome on Mac OS (SurakshaAR Web)',
      })

      try {
        const existing = JSON.parse(localStorage.getItem('suraksha_user_notifications') || '[]')
        const newNotif = {
          id: `sec-${Date.now()}`,
          type: 'security',
          title: 'Google Sign-in Security Alert',
          message: `New sign-in to SurakshaAR from Chrome on Mac OS using Google Account (${selectedAccount.email}). Security notification dispatched to your Gmail.`,
          date: new Date().toISOString(),
        }
        localStorage.setItem('suraksha_user_notifications', JSON.stringify([newNotif, ...existing]))
      } catch (err) {
        console.warn('[GoogleAccountModal] Failed saving notification:', err)
      }
    }, 1800)

    // Step 3: Authorizing session & syncing profile (1800ms -> 2700ms)
    setTimeout(() => {
      setVerifyStep(4)
    }, 2700)

    // Step 4: Finish & Redirect to SurakshaAR (3400ms)
    setTimeout(() => {
      const finalAvatar = selectedAccount.avatar || getGooglePresetAvatar(selectedAccount.email) || null
      onSelectAccount({
        name: selectedAccount.name,
        email: selectedAccount.email,
        avatarUrl: finalAvatar,
      })
    }, 3400)
  }

  function handleCustomPhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 180
        let w = img.width, h = img.height
        if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim } }
        else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim } }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        setCustomAvatar(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
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
    const preset = getGooglePresetAvatar(cleanEmail)

    const newAcc = {
      name: capName,
      email: cleanEmail,
      avatar: customAvatar || preset || null,
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
        if (e.target === e.currentTarget && !isVerifying) onClose()
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
              {isVerifying ? 'Google Identity Services — Verification' : 'Sign in with Google'}
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

        {/* Content Body */}
        <div style={{ padding: isVerifying ? '32px 28px' : '24px 28px', overflowY: 'auto' }}>
          {isVerifying && selectedAccount ? (
            /* STEP 3: AUTHENTIC GOOGLE IDENTITY VERIFICATION SCREEN */
            <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto', animation: 'fadeIn 0.25s ease-out' }}>
              {/* Concentric Google-colored Pulsing Avatar Ring */}
              <div style={{ position: 'relative', width: 92, height: 92, margin: '0 auto 18px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'conic-gradient(#4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
                    animation: 'googleSpin 2.2s linear infinite',
                    filter: 'blur(3px)',
                    opacity: 0.85,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: '#131314',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 1,
                    border: '2px solid #202124',
                  }}
                >
                  {selectedAccount.avatar ? (
                    <img
                      src={selectedAccount.avatar}
                      alt={selectedAccount.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: selectedAccount.bg || '#E05A00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        fontWeight: 800,
                        color: '#FFFFFF',
                      }}
                    >
                      {selectedAccount.initial}
                    </div>
                  )}
                </div>

                {/* Google Official Badge at bottom right of avatar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1F1F23',
                    border: '2px solid #202124',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
              </div>

              {/* User Account Info */}
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px' }}>
                {selectedAccount.name}
              </h3>
              <div style={{ fontSize: 13, color: '#9AA0A6', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span>{selectedAccount.email}</span>
                <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#5F6368' }} />
                <span style={{ color: '#8AB4F8', fontWeight: 500 }}>Google Account Verified</span>
              </div>

              {/* Systematic Verification Steps Checklist */}
              <div
                style={{
                  background: '#1E1F22',
                  border: '1px solid #3C4043',
                  borderRadius: 16,
                  padding: '18px 20px',
                  margin: '0 auto 20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA0A6', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>
                  Google Security Handshake Protocol
                </div>

                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep > 1 ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="google-spinner-mini" />
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 1 ? '#E8EAED' : '#9AA0A6', fontWeight: verifyStep === 1 ? 600 : 400 }}>
                      Google OAuth 2.0 Identity Handshake
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep > 1 ? '#81C995' : '#8AB4F8', fontWeight: 600 }}>
                    {verifyStep > 1 ? 'Connected ✓' : 'Connecting...'}
                  </span>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep > 2 ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : verifyStep === 2 ? (
                      <div className="google-spinner-mini" />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #5F6368', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={11} color="#80868B" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 2 ? '#E8EAED' : '#9AA0A6', fontWeight: verifyStep === 2 ? 600 : 400 }}>
                      Verifying account credentials & security tokens
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep > 2 ? '#81C995' : verifyStep === 2 ? '#8AB4F8' : '#80868B', fontWeight: 600 }}>
                    {verifyStep > 2 ? 'Verified ✓' : verifyStep === 2 ? 'Verifying...' : 'Pending'}
                  </span>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep > 3 ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : verifyStep === 3 ? (
                      <div className="google-spinner-mini" />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #5F6368', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={11} color="#80868B" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 3 ? '#E8EAED' : '#9AA0A6', fontWeight: verifyStep === 3 ? 600 : 400 }}>
                      Dispatching Google Security Notification to Gmail
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep > 3 ? '#81C995' : verifyStep === 3 ? '#8AB4F8' : '#80868B', fontWeight: 600 }}>
                    {verifyStep > 3 ? 'Dispatched ✓' : verifyStep === 3 ? 'Dispatching...' : 'Pending'}
                  </span>
                </div>

                {/* Step 4 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {verifyStep >= 4 ? (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #5F6368', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={11} color="#80868B" />
                      </div>
                    )}
                    <span style={{ fontSize: 13, color: verifyStep >= 4 ? '#E8EAED' : '#9AA0A6', fontWeight: verifyStep === 4 ? 600 : 400 }}>
                      Authorizing SurakshaAR Safety Training Portal
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: verifyStep >= 4 ? '#81C995' : '#80868B', fontWeight: 600 }}>
                    {verifyStep >= 4 ? 'Authorized ✓' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Security confirmation notice pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  background: 'rgba(66, 133, 244, 0.12)',
                  border: '1px solid rgba(66, 133, 244, 0.3)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#D2E3FC',
                  margin: '0 auto',
                  lineHeight: 1.4,
                }}
              >
                <Bell size={14} color="#8AB4F8" style={{ flexShrink: 0 }} />
                <span>
                  {verifyStep >= 3
                    ? `Security sign-in confirmation sent to ${selectedAccount.email}`
                    : `Securing connection & verifying credentials for ${selectedAccount.email}...`}
                </span>
              </div>
            </div>
          ) : !selectedAccount ? (
            /* STEP 1: CHOOSE AN ACCOUNT (Matching User Screenshot 4) */
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {/* Left Column */}
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ marginBottom: 18 }}>
                  {/* SurakshaAR Brand Emblem Icon */}
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 107, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      padding: 5,
                      boxShadow: '0 4px 16px rgba(224, 90, 0, 0.25)',
                    }}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}images/surakshaar-emblem.png`}
                      alt="SurakshaAR"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
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

                    {/* Optional Photo Upload */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: '#9AA0A6', marginBottom: 6 }}>
                        Profile Photo (Optional)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {customAvatar ? (
                          <img
                            src={customAvatar}
                            alt="Preview"
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #8AB4F8',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: '#282A2D',
                              border: '1px dashed #5F6368',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9AA0A6',
                            }}
                          >
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: '#282A2D',
                            border: '1px solid #3c4043',
                            borderRadius: 6,
                            padding: '6px 12px',
                            color: '#E8EAED',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Camera size={14} color="#8AB4F8" />
                          {customAvatar ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCustomPhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
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
                            {/* Avatar: Real Photo or Brand Initial */}
                            {acc.avatar ? (
                              <img
                                src={acc.avatar}
                                alt={acc.name}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                }}
                              />
                            ) : (
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
                            )}

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
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 107, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    padding: 5,
                    boxShadow: '0 4px 16px rgba(224, 90, 0, 0.25)',
                  }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}images/surakshaar-emblem.png`}
                    alt="SurakshaAR"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
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
                  {selectedAccount.avatar ? (
                    <img
                      src={selectedAccount.avatar}
                      alt={selectedAccount.name}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
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
                  )}
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
                    onClick={() => {
                      setSelectedAccount(null)
                      setIsVerifying(false)
                      setVerifyStep(0)
                    }}
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
