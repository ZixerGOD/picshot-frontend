import { useEffect, useMemo, useState } from 'react'
import type { AuthUser, LoginCredentials } from '../lib/types'
import {
  login as apiLogin,
  setToken,
  isTokenExpired,
  TOKEN_TTL_DAYS_DEFAULT,
  TOKEN_TTL_DAYS_REMEMBER,
} from '../lib/api'
import { AuthContext } from '../hooks/useAuth'

const USER_KEY = 'picshot-auth-user'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Si el token venció (rememberMe expirado, o ventana de 7 días pasada),
    // limpiamos la sesión antes de mostrar nada.
    if (isTokenExpired()) {
      setToken(null)
      try {
        localStorage.removeItem(USER_KEY)
      } catch {
        // ignore
      }
      return null
    }
    return loadUser()
  })

  // Programar limpieza automática cuando vence el token.
  useEffect(() => {
    if (!user) return
    const intervalId = window.setInterval(() => {
      if (isTokenExpired()) {
        setToken(null)
        try {
          localStorage.removeItem(USER_KEY)
        } catch {
          // ignore
        }
        setUser(null)
      }
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login: async (credentials: LoginCredentials) => {
        const session = await apiLogin(credentials)
        const ttlDays = credentials.rememberMe
          ? TOKEN_TTL_DAYS_REMEMBER
          : TOKEN_TTL_DAYS_DEFAULT
        setToken(session.token, ttlDays)
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(session.user))
        } catch {
          // ignore
        }
        setUser(session.user)
        return session.user
      },
      logout: () => {
        setToken(null)
        try {
          localStorage.removeItem(USER_KEY)
        } catch {
          // ignore
        }
        setUser(null)
      },
      updateUser: (patch: Partial<AuthUser>) => {
        setUser((prev) => {
          if (!prev) return prev
          const next = { ...prev, ...patch }
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(next))
          } catch {
            // ignore
          }
          return next
        })
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
