import { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('sar_hc') === 'true'
  })

  function toggleHighContrast() {
    setHighContrastState(prev => {
      const next = !prev
      localStorage.setItem('sar_hc', String(next))
      return next
    })
  }

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrast])

  return (
    <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used inside <AccessibilityProvider>')
  return ctx
}
