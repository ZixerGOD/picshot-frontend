export interface EventItem {
  id: string
  title: string
  date: string
  displayDate: string
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

export type EventStatus = 'draft' | 'active' | 'closed'

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

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
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
  email: string
  role: UserRole
  photographerId?: string // presente cuando role === 'photographer'
  avatarUrl?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

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
