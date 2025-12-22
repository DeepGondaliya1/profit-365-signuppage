'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '2rem'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
        hello p365 users
      </h1>
      
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid currentColor',
          borderRadius: '0.5rem',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer'
        }}
      >
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  )
}