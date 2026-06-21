import type {
  AuthSession,
  AuthUser,
  ContactRequest,
  EventItem,
  LoginCredentials,
  Photo,
  Purchase,
  StaffApplication,
} from './types'
import { PASSWORD_POLICY } from './types'
import {
  getMockEventById,
  getMockPhotosByEvent,
  mockAuthUsers,
  mockEvents,
  mockPurchases,
} from './mocks'
import {
  consumeToken,
  findToken,
  issueToken,
  TOKEN_PURPOSE,
} from './auth-tokens'

const API_URL = import.meta.env.VITE_API_URL || ''
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
function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json', ...(options?.headers ?? {}) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

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
  // Mantener solo los del último minuto
  while (loginFailures.length && now - loginFailures[0] > LOGIN_FAILURE_WINDOW_MS) {
    loginFailures.shift()
  }
}

export function loginRetryAfterSeconds(): number {
  const now = Date.now()
  while (loginFailures.length && now - loginFailures[0] > LOGIN_FAILURE_WINDOW_MS) {
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
      (u) => u.email.toLowerCase() === email && u.password === credentials.password,
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

export async function getEvents(): Promise<EventItem[]> {
  if (USE_MOCKS) return mockEvents
  return fetchJson<EventItem[]>('/events')
}

export async function getEventById(id: string): Promise<EventItem | null> {
  if (USE_MOCKS) {
    const event = getMockEventById(id)
    return event ?? null
  }
  return fetchJson<EventItem | null>(`/events/${id}`)
}

export async function getEventPhotos(
  eventId: string,
  filters?: { bib?: string; filter?: string },
): Promise<Photo[]> {
  if (USE_MOCKS) {
    let photos = getMockPhotosByEvent(eventId)
    if (filters?.bib) {
      photos = photos.filter((p) => p.bib === filters.bib)
    }
    if (filters?.filter === 'face') {
      photos = photos.filter((_, i) => i % 2 === 0)
    }
    if (filters?.filter === 'favorites') {
      photos = photos.filter((p) => p.featured)
    }
    return photos
  }
  const query = new URLSearchParams()
  if (filters?.bib) query.set('bib', filters.bib)
  if (filters?.filter) query.set('filter', filters.filter)
  return fetchJson<Photo[]>(`/events/${eventId}/photos?${query.toString()}`)
}

/**
 * Error con código del backend del vision-service. El frontend usa el código
 * para mostrar mensajes específicos al usuario (NO_FACE_DETECTED, etc.).
 */
export class FaceSearchError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'FaceSearchError'
    this.code = code
  }
}

export async function searchPhotosByFace(
  eventId: string,
  selfie: File | Blob,
): Promise<Photo[]> {
  if (USE_MOCKS) {
    await sleep(2000)
    // En mock simulamos los errores del vision-service ocasionalmente, así
    // la UX que ya está construida para esos códigos se puede validar.
    const roll = Math.random()
    if (roll < 0.12) {
      throw new FaceSearchError(
        'NO_FACE_DETECTED',
        'No detectamos tu rostro en la selfie.',
      )
    }
    if (roll < 0.18) {
      throw new FaceSearchError(
        'MULTIPLE_FACES_DETECTED',
        'Detectamos más de un rostro en la selfie.',
      )
    }
    return getMockPhotosByEvent(eventId).filter((_, i) => i % 2 === 0)
  }
  const formData = new FormData()
  formData.append('selfie', selfie, 'selfie.jpg')
  const res = await fetch(`${API_URL}/events/${eventId}/face-search`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) throw new Error('Face search failed')
  return res.json()
}

export async function getMyPurchases(): Promise<Purchase[]> {
  if (USE_MOCKS) {
    await sleep(600)
    return mockPurchases
  }
  // El backend identifica al comprador por su sesión/token; aquí no se envía email.
  return fetchJson<Purchase[]>('/me/purchases')
}

export async function submitContactRequest(payload: ContactRequest): Promise<{ id: string }> {
  if (USE_MOCKS) {
    await sleep(1200)
    return { id: `contact-${Date.now()}` }
  }
  return fetchJson<{ id: string }>('/contact-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitStaffApplication(payload: StaffApplication): Promise<{ id: string }> {
  if (USE_MOCKS) {
    await sleep(1200)
    return { id: `staff-${Date.now()}` }
  }
  return fetchJson<{ id: string }>('/staff-applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
