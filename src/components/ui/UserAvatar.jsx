import React, { useState, useEffect } from 'react'

export function getUserAvatarUrl(user, profile) {
  if (profile?.avatar_url) return profile.avatar_url
  if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url
  if (user?.user_metadata?.picture) return user.user_metadata.picture
  const email = (user?.email || profile?.email || '').trim().toLowerCase()
  if (email && email.includes('@')) {
    // If user registered with Gmail, automatically pull their Google account profile photo
    if (email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')) {
      return `https://unavatar.io/google/${encodeURIComponent(email)}?fallback=false`
    }
    return `https://unavatar.io/${encodeURIComponent(email)}?fallback=false`
  }
  return null
}

export function UserAvatar({ user, profile, size = 38, style = {}, className = '' }) {
  const avatarUrl = getUserAvatarUrl(user, profile)
  const [imgError, setImgError] = useState(false)

  // Reset error state whenever the avatar URL or user changes
  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  const name = profile?.full_name || user?.email || 'Trainee'
  const initial = name.trim()[0]?.toUpperCase() || 'T'

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'block',
          flexShrink: 0,
          background: 'var(--color-brand)',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 28 ? '0.72rem' : size <= 42 ? '0.95rem' : '1.3rem',
        fontWeight: 800,
        color: '#FFFFFF',
        flexShrink: 0,
        ...style,
      }}
    >
      {initial}
    </div>
  )
}

export default UserAvatar
