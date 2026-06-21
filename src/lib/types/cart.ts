import type { PackKey } from './packs'

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
