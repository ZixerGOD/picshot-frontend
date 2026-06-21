export type UserRole = 'admin' | 'photographer' | 'customer'

export interface AuthUser {
  id: string
  name: string
  /** Nombres del usuario. */
  firstName?: string
  /** Apellidos del usuario. */
  lastName?: string
  email: string
  /** El usuario debe verificar su email para poder comprar o buscar fotos. */
  emailVerified?: boolean
  role: UserRole
  photographerId?: string // presente cuando role === 'photographer'
  avatarUrl?: string
  marketingOptIn?: boolean
  /** Fecha en la que el usuario aceptó los términos y condiciones. */
  termsAcceptedAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthSession {
  token: string
  user: AuthUser
}

/** Política de contraseñas: 8-128, al menos 1 mayúscula y 1 dígito. */
export const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d).{8,128}$/
export const PASSWORD_HINT =
  'Entre 8 y 128 caracteres, con al menos una mayúscula y un número.'
