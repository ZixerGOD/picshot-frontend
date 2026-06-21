export interface EventItem {
  id: string
  title: string
  /** Fecha del evento (YYYY-MM-DD). Cada evento es de un solo día
   *  (decisions.md 229-232); para una jornada multi-día se crean
   *  eventos separados. */
  date: string
  displayDate: string
  /** Fecha hasta la que las fotos quedan disponibles (180 días por defecto). */
  retentionUntil?: string
  location: string
  type: string
  image: string
  photoCount: number
  runnerCount?: number
  isNew?: boolean
  status?: EventStatus
  photographerIds?: string[]
  basePrice?: number
  packs?: PhotoPack[]
}

export type EventStatus =
  | 'draft'
  | 'active'
  | 'closed'
  | 'archived'
  | 'retention_expired'

// Packs de venta que el admin configura por evento.
export type PackKey = 'single' | 'pack3' | 'pack5' | 'pack10' | 'all'

export interface PhotoPack {
  key: PackKey
  quantity: number | null // null = todas las fotos del evento
  price: number
}

export interface Photo {
  id: string
  eventId: string
  url: string
  price: number
  bib?: string
  resolution?: string
  exclusive?: boolean
  featured?: boolean
  photographerId?: string
  status?: PhotoStatus
  createdAt?: string
  salesCount?: number
}

export type PhotoStatus = 'processing' | 'published' | 'sold'

export interface ContactRequest {
  fullName: string
  eventName: string
  email: string
  phone: string
  eventType: string
  date: string
  message: string
}

export interface StaffApplication {
  fullName: string
  email: string
  city: string
  portfolioUrl: string
  social: string
  gear: string
  experience: string
}

export type PhotoFilter = 'all' | 'face' | 'bib' | 'favorites'

export interface Purchase {
  id: string
  orderId: string
  eventId: string
  photoId: string
  url: string
  price: number
  resolution?: string
  bib?: string
  purchasedAt: string
  /** Estado de la orden Payphone asociada a esta compra. */
  orderStatus?: OrderStatus
  /** Fecha estimada de borrado por retención (6 meses post-compra por defecto). */
  retentionUntil?: string
}

// ===== CARRITO =====

export interface CartItem {
  photoId: string
  eventId: string
  url: string
  price: number
  bib?: string
  resolution?: string
  addedAt: string
}

/**
 * Un paquete adquirido por el usuario en el carrito. Es un bloque con
 * precio fijo que incluye N fotos del evento (o todas, si quantity es
 * null). Las fotos viven en `photos[]` y NO se cobran sueltas: solo
 * cuenta el precio del paquete.
 */
export interface CartPack {
  /** ID local del bloque pack dentro del carrito. */
  id: string
  eventId: string
  packKey: PackKey
  /** Etiqueta legible para mostrar (ej. 'Pack 5 fotos'). */
  label: string
  /** Cantidad de fotos del paquete, o null para 'Todas las fotos'. */
  quantity: number | null
  price: number
  photos: CartItem[]
  addedAt: string
}

export interface CartCoupon {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

export interface CartTotals {
  subtotal: number
  discount: number
  total: number
}

// ===== ÓRDENES / PAYPHONE =====

/** Estados según docs/checkout.md (líneas 54-66). */
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'expired'
  | 'confirmed'
  | 'failed'
  | 'reversed'
  | 'refunded'

export interface PayphoneTransaction {
  /** ID interno generado por Payphone para el pago. */
  transactionId: string
  /** Código de respuesta de Payphone (3 = pagado). */
  responseCode: number
  /** Fecha de autorización del intento de pago. */
  authorizedAt?: string
  /** Fecha de confirmación final (≤ 5 min después de la autorización). */
  confirmedAt?: string
  /** Mensaje devuelto por Payphone, útil para debugging y UX. */
  message?: string
}

export interface Order {
  id: string
  buyerEmail: string
  items: CartItem[]
  couponCode?: string
  totals: CartTotals
  status: OrderStatus
  createdAt: string
  expiresAt: string
  payphone?: PayphoneTransaction
}

// ===== AUTH =====

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

/** Política de contraseñas: 8-128, al menos 1 mayúscula y 1 dígito. */
export const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d).{8,128}$/
export const PASSWORD_HINT =
  'Entre 8 y 128 caracteres, con al menos una mayúscula y un número.'

export interface AuthSession {
  token: string
  user: AuthUser
}

// ===== ADMIN / PHOTOGRAPHER =====

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin'
  avatarUrl?: string
}

export interface Photographer {
  id: string
  name: string
  email: string
  phone?: string
  city: string
  avatarUrl?: string
  portfolioUrl?: string
  joinedAt: string
  isActive: boolean
  commissionRate: number // 0-100
  eventIds?: string[]
  /** Cédula o RUC del fotógrafo, necesario para emitir comprobantes. */
  identification?: string
  bank?: BankInfo
  /** Última vez que inició sesión. */
  lastLoginAt?: string
  /** Última vez que subió fotos. */
  lastUploadAt?: string
}

export interface BankInfo {
  bankName: string
  accountType: 'ahorros' | 'corriente'
  accountNumber: string
}

export interface Coupon {
  id: string
  code: string
  eventId?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export interface Sale {
  id: string
  photoId: string
  eventId: string
  photographerId: string
  buyerEmail: string
  amount: number
  discountAmount: number
  finalAmount: number
  photographerEarnings: number
  platformEarnings: number
  createdAt: string
  couponCode?: string
}

export interface AnalyticsData {
  date: string
  visits: number
  pageViews: number
  uniqueVisitors: number
  sales: number
  revenue: number
}

export interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalVisits: number
  totalPhotosSold: number
  activeEvents: number
  activeCoupons: number
  totalPhotographers: number
}

export interface PhotoUploadPayload {
  id: string
  eventId: string
  photographerId: string
  url: string
  price: number
  bib?: string
  resolution?: string
  status: PhotoStatus
  createdAt: string
}
