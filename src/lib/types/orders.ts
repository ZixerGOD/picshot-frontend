import type { CartItem, CartTotals } from './cart'

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
  /**
   * UUID generado por el frontend al iniciar el intento de checkout.
   * El backend lo recibe en el header Idempotency-Key y evita duplicar la
   * orden si el comprador hace double submit (docs/checkout.md:80-81).
   */
  idempotencyKey?: string
}
