/**
 * Cliente HTTP base + manejo de token de sesión.
 * Todos los módulos del API se construyen encima de `fetchJson` para usar
 * la misma URL base, headers y manejo de errores.
 */

export const API_URL = import.meta.env.VITE_API_URL || ''
export const USE_MOCKS = !API_URL

const TOKEN_KEY = 'picshot-auth-token'
const TOKEN_EXPIRES_KEY = 'picshot-auth-token-expires'

/** TTL del token según docs/security.md y decisions.md:288-291. */
export const TOKEN_TTL_DAYS_DEFAULT = 7
export const TOKEN_TTL_DAYS_REMEMBER = 30

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null, ttlDays?: number) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      if (ttlDays != null) {
        const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000
        localStorage.setItem(TOKEN_EXPIRES_KEY, String(expiresAt))
      }
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRES_KEY)
    }
  } catch {
    // ignore
  }
}

export function getTokenExpiresAt(): number | null {
  try {
    const raw = localStorage.getItem(TOKEN_EXPIRES_KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export function isTokenExpired(): boolean {
  const exp = getTokenExpiresAt()
  if (exp == null) return false
  return Date.now() >= exp
}

/** Cabeceras base + Authorization si hay sesión. */
export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders({
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}
