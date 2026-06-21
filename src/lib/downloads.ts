/**
 * Stub de signed URL. En producción este token vendrá firmado por el backend
 * con expiración corta (5-15 min) y validación por cuenta.
 */

// Conforme docs/security.md (Signed URL TTL = 5 minutos)
const SIGNED_URL_TTL_MIN = 5

export interface SignedDownload {
  url: string
  expiresAt: string
}

export function generateSignedDownload(baseUrl: string): SignedDownload {
  const token = Math.random().toString(36).slice(2, 16)
  const expires = new Date(Date.now() + SIGNED_URL_TTL_MIN * 60_000)
  const join = baseUrl.includes('?') ? '&' : '?'
  const url = `${baseUrl}${join}token=${token}&expires=${encodeURIComponent(
    expires.toISOString(),
  )}`
  return { url, expiresAt: expires.toISOString() }
}

/** Días por defecto que viven las fotos compradas antes de ser borradas (6 meses). */
export const RETENTION_DAYS = 180

export function retentionDateFrom(purchasedAt: string): string {
  const base = new Date(purchasedAt)
  base.setDate(base.getDate() + RETENTION_DAYS)
  return base.toISOString()
}

export function daysUntil(dateIso: string): number {
  const diff = new Date(dateIso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
