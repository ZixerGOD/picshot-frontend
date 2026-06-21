import { useMemo, useState } from 'react'
import type { AuthUser, LoginCredentials } from '../lib/types'
import { login as apiLogin, setToken } from '../lib/api'
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
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login: async (credentials: LoginCredentials) => {
        const session = await apiLogin(credentials)
        setToken(session.token)
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
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
