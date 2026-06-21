import { createContext, useContext } from 'react'
import type { AuthUser, LoginCredentials } from '../lib/types'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
