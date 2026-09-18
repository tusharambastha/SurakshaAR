/**
 * SurakshaAR — Authentication Validation & Security Helper
 * 
 * Provides:
 * 1. Strict RFC email validation, typo detection, and disposable email rejection
 * 2. Jumbled strong password rules (min 8 chars, uppercase, lowercase, numbers, special symbol)
 * 3. Strong random password generator
 * 4. Verification OTP code generator & validator
 */

// Common email typo domains to suggest corrections
const TYPO_DOMAINS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'rediffmial.com': 'rediffmail.com',
}

// Disposable / temporary throwaway email domains to reject
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'fakeinbox.com',
  'dispostable.com',
  'getairmail.com',
  'temp-mail.org',
  'mohmal.com',
])

/**
 * Validate an email address format, domain syntax, and reject fake/temporary domains.
 * Returns { isValid: boolean, error: string | null, suggestion: string | null }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.', suggestion: null }
  }

  const clean = email.trim().toLowerCase()

  // Standard RFC 5322 regex for email syntax
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

  if (!rfcRegex.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid email format (e.g. yourname@gmail.com).',
      suggestion: null,
    }
  }

  const parts = clean.split('@')
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email must contain exactly one "@" symbol.', suggestion: null }
  }

  const [username, domain] = parts

  if (username.length < 2) {
    return { isValid: false, error: 'Email username must be at least 2 characters.', suggestion: null }
  }

  if (TYPO_DOMAINS[domain]) {
    const suggested = `${username}@${TYPO_DOMAINS[domain]}`
    return {
      isValid: false,
      error: `Did you mean ${suggested}?`,
      suggestion: suggested,
    }
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email domains are not allowed. Please use a real email.',
      suggestion: null,
    }
  }

  // Domain structure checks
  const domainParts = domain.split('.')
  const tld = domainParts[domainParts.length - 1]

  if (!tld || tld.length < 2 || tld.length > 12) {
    return { isValid: false, error: 'Invalid domain extension (TLD).', suggestion: null }
  }

  return { isValid: true, error: null, suggestion: null }
}

/**
 * Check password criteria and calculate strength score (0 to 4).
 * Enforces jumbled password rules:
 * - Minimum 8 characters
 * - Uppercase letter (A-Z)
 * - Lowercase letter (a-z)
 * - Number (0-9)
 * - Special character (@, #, $, %, !, &, etc.)
 */
export function checkPasswordCriteria(password) {
  const pwd = password || ''

  const checks = {
    length: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  }

  // Combined letter check for UI
  const hasBothCases = checks.hasLower && checks.hasUpper

  let score = 0
  if (checks.length) score++
  if (hasBothCases) score++
  if (checks.hasNumber) score++
  if (checks.hasSpecial) score++

  let strengthLabel = 'Weak'
  let strengthColor = '#EF4444' // Red

  if (score === 2) {
    strengthLabel = 'Fair'
    strengthColor = '#F97316' // Orange
  } else if (score === 3) {
    strengthLabel = 'Good'
    strengthColor = '#EAB308' // Amber
  } else if (score === 4) {
    strengthLabel = 'Strong'
    strengthColor = '#10B981' // Emerald Green
  }

  const allMet = checks.length && checks.hasLower && checks.hasUpper && checks.hasNumber && checks.hasSpecial

  return {
    checks,
    hasBothCases,
    score,
    strengthLabel,
    strengthColor,
    allMet,
  }
}

/**
 * Generate a strong, jumbled password that satisfies all security criteria.
 * Includes uppercase, lowercase, numbers, and special symbols (@, #, $, !, %).
 */
export function generateStrongPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowers = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const specials = '@#$%&!*?'

  // Guarantee at least one of each required set
  let pwd = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ]

  const allChars = uppers + lowers + digits + specials
  for (let i = 0; i < 8; i++) {
    pwd.push(allChars[Math.floor(Math.random() * allChars.length)])
  }

  // Shuffle the array using Fisher-Yates algorithm
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pwd[i], pwd[j]] = [pwd[j], pwd[i]]
  }

  return pwd.join('')
}

/**
 * Generate a random 6-digit verification code.
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
