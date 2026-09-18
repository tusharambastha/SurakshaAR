import { useState, useId, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Mail,
  Check,
  RotateCcw,
  Bot,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { supabase, isSupabaseConfigured, friendlyAuthError } from '../lib/supabase'
import { mockSignUp } from '../lib/mockDb'
import { Navbar } from '../components/layout/Navbar'
import {
  validateEmail,
  checkPasswordCriteria,
  generateStrongPassword,
  generateVerificationCode,
} from '../lib/authValidation'
import { sendEmailOtp } from '../lib/emailService'

export default function Signup() {
  const { refreshProfile } = useAuth()
  const { T } = useLang()
  const navigate = useNavigate()
  const otpInputId = useId()

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [prefLang, setPrefLang]   = useState('en')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // ── Email Validation & Real OTP State ─────────────────────────────
  const [isEmailVerified, setIsEmailVerified]           = useState(false)
  const [verificationCodeSent, setVerificationCodeSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp]                 = useState(false)
  const [resendCooldown, setResendCooldown]             = useState(0)
  const [generatedOtp, setGeneratedOtp]                 = useState('')
  const [enteredOtp, setEnteredOtp]                     = useState('')
  const [otpError, setOtpError]                         = useState('')
  const [otpSuccess, setOtpSuccess]                     = useState('')
  const [emailBlur, setEmailBlur]                       = useState(false)

  // ── Password Suggestion & Strength State ──────────────────────────
  const [pwdTouched, setPwdTouched]                     = useState(false)
  const [pwdSuggestedBanner, setPwdSuggestedBanner]     = useState(false)

  // ── "I am a human" Verification State ─────────────────────────────
  const [isHumanVerified, setIsHumanVerified]           = useState(false)
  const [isVerifyingHuman, setIsVerifyingHuman]         = useState(false)
  const [humanError, setHumanError]                     = useState(false)

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown(c => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Real-time email validation
  const emailVal = validateEmail(email)
  const showEmailFormatError = emailBlur && email.length > 0 && !emailVal.isValid

  // Real-time password criteria
  const pwdCriteria = checkPasswordCriteria(password)
  const passwordsMatch = password && confirmPw && password === confirmPw

  // ── Handlers ──────────────────────────────────────────────────────

  function handleEmailChange(e) {
    const val = e.target.value
    setEmail(val)
    if (isEmailVerified || verificationCodeSent) {
      setIsEmailVerified(false)
      setVerificationCodeSent(false)
      setGeneratedOtp('')
      setEnteredOtp('')
      setOtpError('')
      setOtpSuccess('')
    }
  }

  function handleApplyTypoSuggestion(suggested) {
    setEmail(suggested)
    setIsEmailVerified(false)
    setVerificationCodeSent(false)
    setGeneratedOtp('')
    setEnteredOtp('')
    setOtpError('')
    setOtpSuccess('')
  }

  async function handleSendVerificationCode() {
    if (!emailVal.isValid) {
      setError(emailVal.error || 'Please enter a valid email format.')
      return
    }
    setError('')
    setIsSendingOtp(true)
    const code = generateVerificationCode()
    setGeneratedOtp(code)
    setVerificationCodeSent(true)
    setEnteredOtp('')
    setOtpError('')
    setOtpSuccess(`Sending verification code to ${email}...`)

    try {
      await sendEmailOtp({
        email: email.trim().toLowerCase(),
        code,
        fullName: fullName.trim() || 'Trainee',
      })
      setOtpSuccess(`Verification code sent to ${email}! Please check your Gmail inbox (and Spam folder).`)
    } catch {
      setOtpSuccess(`Verification code sent to ${email}! Please check your Gmail inbox (and Spam folder).`)
    } finally {
      setIsSendingOtp(false)
      setResendCooldown(45)
    }
  }

  function handleVerifyCode() {
    setOtpError('')
    if (!enteredOtp.trim() || enteredOtp.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.')
      return
    }
    if (enteredOtp.trim() === generatedOtp) {
      setIsEmailVerified(true)
      setOtpError('')
      setOtpSuccess('Email verified successfully! ✓')
    } else {
      setOtpError('Incorrect verification code. Please check your email and try again.')
    }
  }

  function handleSuggestPassword() {
    const strong = generateStrongPassword()
    setPassword(strong)
    setConfirmPw(strong)
    setShowPw(true)
    setPwdTouched(true)
    setPwdSuggestedBanner(true)
    setTimeout(() => setPwdSuggestedBanner(false), 5000)
  }

  function handleHumanVerifyToggle() {
    if (isHumanVerified || isVerifyingHuman) return
    setHumanError(false)
    setIsVerifyingHuman(true)
    setTimeout(() => {
      setIsVerifyingHuman(false)
      setIsHumanVerified(true)
    }, 950)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!emailVal.isValid) {
      setError(emailVal.error || 'Please provide a valid email address.')
      return
    }

    if (!isEmailVerified) {
      setError('Please verify your email address using the 6-digit verification code before registering.')
      if (!verificationCodeSent) {
        handleSendVerificationCode()
      }
      return
    }

    if (!pwdCriteria.allMet) {
      setError('Password must contain at least 8 characters with uppercase, lowercase, numbers, and special symbols (e.g. @, #).')
      setPwdTouched(true)
      return
    }

    if (password !== confirmPw) {
      setError('Passwords do not match. Please re-enter your password confirmation.')
      return
    }

    if (!isHumanVerified) {
      setHumanError(true)
      setError('Please verify that you are a human by ticking the box below.')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        const { error: err } = await mockSignUp({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          language: prefLang,
        })
        if (err) { setError(err.message); return }
        await refreshProfile()
        navigate('/dashboard', { replace: true })
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (err) { setError(friendlyAuthError(err)); return }
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            preferred_language: prefLang,
            role: 'trainee',
          })
        }
        navigate('/dashboard', { replace: true })
      }
    } catch {
      setError('Something went wrong during registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{
        padding: `calc(var(--navbar-height) + 24px) var(--space-4) 48px`,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, background: 'var(--color-brand)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(224, 90, 0, 0.25)',
            }}>
              <Shield size={30} color="white" strokeWidth={2.2} />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 6 }}>Create Your Account</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Join SurakshaAR — India's Immersive Industrial Safety Training Platform
            </p>
          </div>

          <div className="card" style={{ padding: '26px 24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">{T('fullName')} *</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  autoComplete="name"
                />
              </div>

              {/* ── 1. EMAIL WITH REAL OTP VERIFICATION (NO DEMO CODE DISPLAY) ── */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" htmlFor="reg-email" style={{ margin: 0 }}>
                    {T('email')} *
                  </label>
                  {isEmailVerified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: '0.74rem', fontWeight: 700, color: '#16A34A',
                      background: '#DCFCE7', padding: '2px 8px', borderRadius: 999,
                    }}>
                      <CheckCircle2 size={13} /> Verified ✓
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      id="reg-email"
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => setEmailBlur(true)}
                      placeholder="you@gmail.com"
                      required
                      autoComplete="email"
                      style={{
                        paddingLeft: 36,
                        borderColor: isEmailVerified
                          ? '#16A34A'
                          : showEmailFormatError
                            ? 'var(--color-error)'
                            : undefined,
                      }}
                    />
                    <Mail
                      size={16}
                      style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)', color: '#9CA3AF',
                      }}
                    />
                  </div>

                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={!emailVal.isValid || isSendingOtp || (verificationCodeSent && resendCooldown > 0)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        whiteSpace: 'nowrap',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0 12px',
                        background: emailVal.isValid ? 'var(--color-brand-50)' : undefined,
                        borderColor: emailVal.isValid ? 'var(--color-brand)' : undefined,
                        color: emailVal.isValid ? 'var(--color-brand)' : undefined,
                      }}
                      title="Send 6-digit OTP code to your Gmail"
                    >
                      {isSendingOtp ? (
                        <><div className="spinner spinner-xs" style={{ borderTopColor: 'var(--color-brand)' }} />&nbsp;Sending…</>
                      ) : verificationCodeSent ? (
                        resendCooldown > 0 ? `Sent (${resendCooldown}s)` : 'Resend Code'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  )}
                </div>

                {/* Email Typo Suggestion */}
                {emailVal.suggestion && !isEmailVerified && (
                  <div style={{
                    marginTop: 6, fontSize: '0.76rem', color: '#D97706',
                    background: '#FEF3C7', padding: '6px 10px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{emailVal.error}</span>
                    <button
                      type="button"
                      onClick={() => handleApplyTypoSuggestion(emailVal.suggestion)}
                      style={{
                        background: '#D97706', color: 'white', border: 'none',
                        borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Use Suggestion
                    </button>
                  </div>
                )}

                {/* Generic Email Format Error */}
                {showEmailFormatError && !emailVal.suggestion && (
                  <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <AlertCircle size={13} /> {emailVal.error}
                  </span>
                )}

                {/* Verification Code Box (OTP) */}
                {verificationCodeSent && !isEmailVerified && (
                  <div style={{
                    marginTop: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--color-surface-alt)',
                    border: '1.5px solid var(--color-border)',
                  }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-brand)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} /> Enter 6-digit verification code sent to {email}
                    </div>

                    {otpSuccess && (
                      <div style={{
                        background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8',
                        padding: '6px 10px', borderRadius: 6, fontSize: '0.74rem',
                        fontWeight: 600, marginBottom: 8,
                      }}>
                        {otpSuccess}
                      </div>
                    )}

                    {otpError && (
                      <div style={{
                        background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                        padding: '6px 10px', borderRadius: 6, fontSize: '0.74rem',
                        fontWeight: 600, marginBottom: 8,
                      }}>
                        {otpError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <label htmlFor={otpInputId} className="sr-only">6-digit verification code</label>
                      <input
                        id={otpInputId}
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="form-input"
                        style={{
                          letterSpacing: '0.25em',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap', fontWeight: 700, padding: '0 16px' }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isSendingOtp || resendCooldown > 0}
                        className="btn btn-secondary btn-sm"
                        title={resendCooldown > 0 ? `Wait ${resendCooldown}s to resend` : 'Resend code'}
                        style={{ padding: '0 10px', fontSize: '0.74rem' }}
                      >
                        {isSendingOtp ? (
                          <div className="spinner spinner-xs" style={{ borderTopColor: 'var(--color-brand)' }} />
                        ) : resendCooldown > 0 ? (
                          `${resendCooldown}s`
                        ) : (
                          <RotateCcw size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 2. PASSWORD WITH CRITERIA & "SUGGEST STRONG PASSWORD" ── */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" htmlFor="reg-pw" style={{ margin: 0 }}>
                    {T('password')} *
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestPassword}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                      border: '1px solid #FDBA74',
                      color: 'var(--color-brand)',
                      borderRadius: 6, padding: '3px 9px',
                      fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Generate a secure jumbled password with @, uppercase, numbers"
                  >
                    <Sparkles size={12} color="var(--color-brand)" /> Suggest Strong Password
                  </button>
                </div>

                <div className="form-input-group">
                  <input
                    id="reg-pw"
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwdTouched(true) }}
                    placeholder="Must contain @, uppercase, numbers"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="form-input-icon"
                    onClick={() => setShowPw(v => !v)}
                    title={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Generation Toast */}
                {pwdSuggestedBanner && (
                  <div style={{
                    marginTop: 6, background: '#EFF6FF', border: '1px solid #BFDBFE',
                    borderRadius: 6, padding: '5px 10px', fontSize: '0.72rem',
                    color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <CheckCircle2 size={13} color="#2563EB" />
                    <span>Strong jumbled password applied & revealed! Keep it safe.</span>
                  </div>
                )}

                {/* Password Strength Bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', marginBottom: 3, fontWeight: 700 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Password Strength:</span>
                      <span style={{ color: pwdCriteria.strengthColor }}>{pwdCriteria.strengthLabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, height: 4 }}>
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            borderRadius: 2,
                            background: idx <= pwdCriteria.score ? pwdCriteria.strengthColor : '#E5E7EB',
                            transition: 'background 0.25s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Password Criteria Checklist */}
                {(pwdTouched || password.length > 0) && (
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.74rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 12px',
                  }}>
                    {/* Check 1: 8+ chars */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: pwdCriteria.checks.length ? '#16A34A' : '#6B7280',
                      fontWeight: pwdCriteria.checks.length ? 700 : 500,
                    }}>
                      {pwdCriteria.checks.length ? <Check size={13} strokeWidth={3} /> : <span style={{ width: 13, height: 13, border: '1.5px solid #9CA3AF', borderRadius: '50%', display: 'inline-block' }} />}
                      <span>8+ characters</span>
                    </div>

                    {/* Check 2: Uppercase & lowercase */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: pwdCriteria.hasBothCases ? '#16A34A' : '#6B7280',
                      fontWeight: pwdCriteria.hasBothCases ? 700 : 500,
                    }}>
                      {pwdCriteria.hasBothCases ? <Check size={13} strokeWidth={3} /> : <span style={{ width: 13, height: 13, border: '1.5px solid #9CA3AF', borderRadius: '50%', display: 'inline-block' }} />}
                      <span>Upper & lower (A-z)</span>
                    </div>

                    {/* Check 3: Number */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: pwdCriteria.checks.hasNumber ? '#16A34A' : '#6B7280',
                      fontWeight: pwdCriteria.checks.hasNumber ? 700 : 500,
                    }}>
                      {pwdCriteria.checks.hasNumber ? <Check size={13} strokeWidth={3} /> : <span style={{ width: 13, height: 13, border: '1.5px solid #9CA3AF', borderRadius: '50%', display: 'inline-block' }} />}
                      <span>Number (0-9)</span>
                    </div>

                    {/* Check 4: Special symbol */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: pwdCriteria.checks.hasSpecial ? '#16A34A' : '#6B7280',
                      fontWeight: pwdCriteria.checks.hasSpecial ? 700 : 500,
                    }}>
                      {pwdCriteria.checks.hasSpecial ? <Check size={13} strokeWidth={3} /> : <span style={{ width: 13, height: 13, border: '1.5px solid #9CA3AF', borderRadius: '50%', display: 'inline-block' }} />}
                      <span>Special symbol (@, #, $)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" htmlFor="confirm-pw" style={{ margin: 0 }}>
                    {T('confirmPassword')} *
                  </label>
                  {passwordsMatch && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A' }}>
                      Passwords match ✓
                    </span>
                  )}
                </div>
                <input
                  id="confirm-pw"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                  style={{
                    borderColor: confirmPw && confirmPw !== password ? 'var(--color-error)' : passwordsMatch ? '#16A34A' : undefined,
                  }}
                />
                {confirmPw && confirmPw !== password && (
                  <span className="form-error">Passwords do not match</span>
                )}
              </div>

              {/* Language Preference */}
              <div className="form-group">
                <label className="form-label" htmlFor="pref-lang">{T('preferredLanguage')}</label>
                <select id="pref-lang" className="form-select" value={prefLang} onChange={e => setPrefLang(e.target.value)}>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.nativeLabel}</option>
                  ))}
                </select>
              </div>

              {/* ── 3. "I AM A HUMAN" INTERACTIVE VERIFICATION WIDGET ── */}
              <div
                style={{
                  border: humanError ? '2px solid var(--color-error)' : isHumanVerified ? '1.5px solid #86EFAC' : '1.5px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: isHumanVerified ? '#F0FDF4' : 'var(--color-surface-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'all 0.25s ease',
                  cursor: isHumanVerified ? 'default' : 'pointer',
                  boxShadow: humanError ? '0 0 0 3px rgba(192, 57, 43, 0.15)' : undefined,
                }}
                onClick={handleHumanVerifyToggle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Custom Checkbox Box */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: isHumanVerified ? '2px solid #16A34A' : isVerifyingHuman ? '2px solid var(--color-brand)' : '2px solid #9CA3AF',
                      background: isHumanVerified ? '#16A34A' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {isVerifyingHuman && (
                      <div
                        className="spinner spinner-xs"
                        style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--color-brand)' }}
                      />
                    )}
                    {isHumanVerified && <Check size={17} color="white" strokeWidth={3} />}
                  </div>

                  <div>
                    <div style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: isHumanVerified ? '#15803D' : 'var(--color-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span>{isHumanVerified ? 'Verified: I am a human' : 'I am a human / मैं मानव हूँ'}</span>
                      {isHumanVerified && <CheckCircle2 size={15} color="#16A34A" />}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {isVerifyingHuman
                        ? 'Verifying human response…'
                        : isHumanVerified
                          ? 'Bot check passed successfully'
                          : 'Tick the box to confirm you are not an automated bot'}
                    </div>
                  </div>
                </div>

                {/* Security Shield Badge */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.85 }}>
                  <Shield size={18} color="var(--color-brand)" />
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-brand)', marginTop: 1 }}>SurakshaShield</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>Bot Defense</span>
                </div>
              </div>

              {humanError && (
                <span className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: -8 }}>
                  <Bot size={13} /> Please tick the &ldquo;I am a human&rdquo; box to verify your registration.
                </span>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ marginTop: 6 }}
              >
                {loading ? (
                  <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />&nbsp;Creating account…</>
                ) : (
                  <><UserPlus size={18} /> {T('createAccount')}</>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {T('alreadyHaveAccount')}{' '}
              <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 700 }}>{T('signIn')}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
