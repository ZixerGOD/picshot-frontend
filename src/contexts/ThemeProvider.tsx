import { useEffect, useState } from 'react'
import { ThemeContext, STORAGE_KEY, type Theme } from './ThemeContext'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')
    if (theme === 'dark') {
      root.classList.add('dark')
      meta?.setAttribute('content', '#000000')
    } else {
      root.classList.remove('dark')
      meta?.setAttribute('content', '#ffffff')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
