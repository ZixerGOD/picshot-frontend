/**
 * Barrel del cliente API. Los consumidores importan desde `lib/api` y no
 * se enteran del split interno (cliente HTTP + módulos por dominio).
 *
 * Cuando se conecte el backend real solo cambia la rama `USE_MOCKS` de
 * cada módulo; la firma pública se mantiene.
 */
export {
  API_URL,
  USE_MOCKS,
  TOKEN_TTL_DAYS_DEFAULT,
  TOKEN_TTL_DAYS_REMEMBER,
  getToken,
  setToken,
  getTokenExpiresAt,
  isTokenExpired,
} from './client'

export {
  LoginRateLimitError,
  loginRetryAfterSeconds,
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  setPasswordWithInvite,
} from './auth'
export type { RegisterPayload, RegisterResult } from './auth'

export { getEvents, getEventById, getEventPhotos } from './events'

export { FaceSearchError, searchPhotosByFace } from './face'

export { getMyPurchases } from './purchases'

export { submitContactRequest, submitStaffApplication } from './contact'
