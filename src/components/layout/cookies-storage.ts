/**
 * Persistencia del consentimiento de cookies.
 * Helpers separados del componente para mantener React Refresh funcionando.
 */

const STORAGE_KEY = 'picshot-cookies-consent'

export type CookieChoice = 'all' | 'essential'

interface StoredCookieChoice {
  choice: CookieChoice
  decidedAt: string
}

export function getCookieChoice(): CookieChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredCookieChoice
    return parsed.choice ?? null
  } catch {
    return null
  }
}

export function setCookieChoice(choice: CookieChoice): void {
  try {
    const payload: StoredCookieChoice = {
      choice,
      decidedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
