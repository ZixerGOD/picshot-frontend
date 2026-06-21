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
const USE_MOCKS = !API_URL

const TOKEN_KEY = 'picshot-auth-token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
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

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (USE_MOCKS) {
    await sleep(700)
    const email = credentials.email.trim().toLowerCase()
    const found = mockAuthUsers.find(
      (u) => u.email.toLowerCase() === email && u.password === credentials.password,
    )
    if (!found) throw new Error('Correo o contraseña incorrectos')
    const user: AuthSession['user'] = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
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
  name: string
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

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  if (USE_MOCKS) {
    await sleep(700)
    const email = payload.email.trim().toLowerCase()
    if (!payload.acceptedTerms) {
      throw new Error('Debes aceptar los términos y condiciones para continuar.')
    }
    if (mockAuthUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Ya existe una cuenta con ese correo.')
    }
    if (payload.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
    }
    const newUser: AuthUser & { password: string } = {
      id: `cu-${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name.trim(),
      email,
      role: 'customer',
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
    if (newPassword.length < 8)
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
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
    if (password.length < 8)
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
    const user = mockAuthUsers.find((u) => u.email.toLowerCase() === record.email)
    if (user) user.password = password
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

export async function searchPhotosByFace(
  eventId: string,
  selfie: File | Blob,
): Promise<Photo[]> {
  if (USE_MOCKS) {
    await sleep(2000)
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
