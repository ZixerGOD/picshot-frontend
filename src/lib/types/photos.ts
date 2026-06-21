import type { OrderStatus } from './orders'

export type PhotoStatus = 'processing' | 'published' | 'sold'

export type PhotoFilter = 'all' | 'face' | 'bib' | 'favorites'

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
