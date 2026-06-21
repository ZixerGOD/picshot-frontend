/**
 * Store en memoria para tokens de mock-auth (registro, reset, verify, invite).
 * En producción estos tokens viven en la base del backend y caducan; aquí solo
 * mantenemos un mapa volátil para poder probar cada pantalla.
 */

type Purpose = 'verify_email' | 'reset_password' | 'photographer_invite'

interface TokenRecord {
  token: string
  purpose: Purpose
  email: string
  createdAt: number
  expiresAt: number
  consumed: boolean
  data?: Record<string, unknown>
}

const records = new Map<string, TokenRecord>()

const TTL_MIN: Record<Purpose, number> = {
  verify_email: 60 * 24, // 24h
  reset_password: 60, // 1h
  photographer_invite: 60 * 24 * 7, // 7 días
}

function generate(): string {
  return Math.random().toString(36).slice(2, 14)
}

export function issueToken(
  purpose: Purpose,
  email: string,
  data?: Record<string, unknown>,
): TokenRecord {
  const token = generate()
  const now = Date.now()
  const record: TokenRecord = {
    token,
    purpose,
    email,
    createdAt: now,
    expiresAt: now + TTL_MIN[purpose] * 60_000,
    consumed: false,
    data,
  }
  records.set(token, record)
  return record
}

export function findToken(token: string, purpose: Purpose): TokenRecord | null {
  const r = records.get(token)
  if (!r) return null
  if (r.purpose !== purpose) return null
  if (r.consumed) return null
  if (Date.now() > r.expiresAt) return null
  return r
}

export function consumeToken(token: string): void {
  const r = records.get(token)
  if (r) r.consumed = true
}

export const TOKEN_PURPOSE = {
  VERIFY_EMAIL: 'verify_email',
  RESET_PASSWORD: 'reset_password',
  INVITE: 'photographer_invite',
} as const
