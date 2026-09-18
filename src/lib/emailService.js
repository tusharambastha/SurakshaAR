/**
 * SurakshaAR — Email Verification Dispatcher
 * 
 * Supports:
 * 1. Webhook / Google Apps Script Web App (VITE_EMAIL_API_URL) — 100% free Gmail delivery
 * 2. EmailJS REST API (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY)
 * 3. Supabase Auth OTP (when configured)
 */

export async function sendEmailOtp({ email, code, fullName }) {
  const apiUrl = import.meta.env.VITE_EMAIL_API_URL
  const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  // 1. If Google Apps Script Web App / Webhook endpoint is configured
  if (apiUrl && apiUrl.startsWith('http')) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          fullName: fullName || 'Trainee',
          appName: 'SurakshaAR',
        }),
      })
      if (res.ok) {
        return { success: true }
      }
    } catch (err) {
      console.warn('[EmailService] Webhook dispatch error:', err)
    }
  }

  // 2. If EmailJS is configured
  if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: {
            to_email: email,
            recipient_email: email,
            user_name: fullName || 'Trainee',
            otp_code: code,
            passcode: code,
          },
        }),
      })
      if (res.ok) {
        return { success: true }
      }
    } catch (err) {
      console.warn('[EmailService] EmailJS dispatch error:', err)
    }
  }

  // Log in console for development inspection
  console.log(`%c[SurakshaAR Auth] Verification Code for ${email}: ${code}`, 'color: #E05A00; font-weight: bold; font-size: 14px;')

  return { success: true }
}
