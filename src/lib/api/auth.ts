import type { AuthSession, AuthUser, LoginCredentials } from '../types'
import { PASSWORD_POLICY } from '../types'
import { mockAuthUsers } from '../mocks'
import { consumeToken, findToken, issueToken, TOKEN_PURPOSE } from '../auth-tokens'
import { fetchJson, sleep, USE_MOCKS } from './client'

/**
 * Rate limit visible al usuario: 5 intentos fallidos por 60 segundos.
 * Real lo aplica el backend; aquí lo mantenemos en memoria para que la UI
 * muestre el bloqueo y countdown.
 */
const LOGIN_FAILURE_WINDOW_MS = 60_000
const LOGIN_FAILURE_LIMIT = 5
const loginFailures: number[] = []

export class LoginRateLimitError extends Error {
  retryInSeconds: number
  constructor(retryInSeconds: number) {
    super('Demasiados intentos. Espera unos segundos antes de reintentar.')
    this.name = 'LoginRateLimitError'
    this.retryInSeconds = retryInSeconds
  }
}

function recordLoginFailure() {
  const now = Date.now()
  loginFailures.push(now)
  while (
    loginFailures.length &&
    now - loginFailures[0] > LOGIN_FAILURE_WINDOW_MS
  ) {
    loginFailures.shift()
  }
}

export function loginRetryAfterSeconds(): number {
  const now = Date.now()
  while (
    loginFailures.length &&
    now - loginFailures[0] > LOGIN_FAILURE_WINDOW_MS
  ) {
    loginFailures.shift()
  }
  if (loginFailures.length < LOGIN_FAILURE_LIMIT) return 0
  const oldest = loginFailures[0]
  return Math.max(0, Math.ceil((oldest + LOGIN_FAILURE_WINDOW_MS - now) / 1000))
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (USE_MOCKS) {
    const retryAfter = loginRetryAfterSeconds()
    if (retryAfter > 0) throw new LoginRateLimitError(retryAfter)
    await sleep(700)
    const email = credentials.email.trim().toLowerCase()
    const found = mockAuthUsers.find(
      (u) =>
        u.email.toLowerCase() === email && u.password === credentials.password,
    )
    if (!found) {
      recordLoginFailure()
      throw new Error('Correo o contraseña incorrectos')
    }
    const user: AuthSession['user'] = {
      id: found.id,
      name: found.name,
      firstName: found.firstName,
      lastName: found.lastName,
      email: found.email,
      role: found.role,
      emailVerified: found.emailVerified ?? false,
      ...(found.photographerId ? { photographerId: found.photographerId } : {}),
    }
    return { token: `mock-token-${user.id}`, user }
  }
  return fetchJson<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  marketingOptIn: boolean
  acceptedTerms: boolean
}

export interface RegisterResult {
  /** El usuario queda pendiente de verificación; devolvemos el token mock visible para QA. */
  pendingVerificationToken: string
  email: string
}

function validatePassword(password: string) {
  if (!PASSWORD_POLICY.test(password)) {
    throw new Error(
      'La contraseña debe tener entre 8 y 128 caracteres, con al menos una mayúscula y un número.',
    )
  }
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  if (USE_MOCKS) {
    await sleep(700)
    const email = payload.email.trim().toLowerCase()
    const firstName = payload.firstName.trim()
    const lastName = payload.lastName.trim()
    if (!payload.acceptedTerms) {
      throw new Error('Debes aceptar los términos y condiciones para continuar.')
    }
    if (!firstName || !lastName) {
      throw new Error('Ingresa tus nombres y apellidos.')
    }
    if (mockAuthUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Ya existe una cuenta con ese correo.')
    }
    validatePassword(payload.password)
    const newUser: AuthUser & { password: string } = {
      id: `cu-${Math.random().toString(36).slice(2, 8)}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      role: 'customer',
      emailVerified: false,
      marketingOptIn: payload.marketingOptIn,
      termsAcceptedAt: new Date().toISOString(),
      password: payload.password,
    }
    mockAuthUsers.push(newUser)
    const token = issueToken(TOKEN_PURPOSE.VERIFY_EMAIL, email).token
    return { pendingVerificationToken: token, email }
  }
  return fetchJson<RegisterResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function forgotPassword(email: string): Promise<{ token: string }> {
  if (USE_MOCKS) {
    await sleep(500)
    const normalized = email.trim().toLowerCase()
    // Por seguridad no diferenciamos si existe o no, pero generamos el token solo si existe.
    const exists = mockAuthUsers.some((u) => u.email.toLowerCase() === normalized)
    const token = exists
      ? issueToken(TOKEN_PURPOSE.RESET_PASSWORD, normalized).token
      : 'noop'
    return { token }
  }
  return fetchJson<{ token: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  if (USE_MOCKS) {
    await sleep(500)
    const record = findToken(token, TOKEN_PURPOSE.RESET_PASSWORD)
    if (!record) throw new Error('El enlace es inválido o ya expiró.')
    validatePassword(newPassword)
    const user = mockAuthUsers.find((u) => u.email.toLowerCase() === record.email)
    if (user) user.password = newPassword
    consumeToken(token)
    return
  }
  await fetchJson<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword }),
  })
}

export async function verifyEmail(token: string): Promise<{ email: string }> {
  if (USE_MOCKS) {
    await sleep(400)
    const record = findToken(token, TOKEN_PURPOSE.VERIFY_EMAIL)
    if (!record) throw new Error('El enlace es inválido o ya expiró.')
    const user = mockAuthUsers.find((u) => u.email.toLowerCase() === record.email)
    if (user) user.emailVerified = true
    consumeToken(token)
    return { email: record.email }
  }
  return fetchJson<{ email: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerification(email: string): Promise<{ token: string }> {
  if (USE_MOCKS) {
    await sleep(400)
    const normalized = email.trim().toLowerCase()
    const token = issueToken(TOKEN_PURPOSE.VERIFY_EMAIL, normalized).token
    return { token }
  }
  return fetchJson<{ token: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function setPasswordWithInvite(
  token: string,
  password: string,
): Promise<{ email: string }> {
  if (USE_MOCKS) {
    await sleep(500)
    const record = findToken(token, TOKEN_PURPOSE.INVITE)
    if (!record) throw new Error('La invitación es inválida o ya expiró.')
    validatePassword(password)
    const user = mockAuthUsers.find((u) => u.email.toLowerCase() === record.email)
    if (user) {
      user.password = password
      user.emailVerified = true
    }
    consumeToken(token)
    return { email: record.email }
  }
  return fetchJson<{ email: string }>('/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
