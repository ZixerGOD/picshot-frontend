import type {
  CartCoupon,
  CartItem,
  CartTotals,
  Order,
  OrderStatus,
  PayphoneTransaction,
} from './types'

const STORAGE_KEY = 'picshot-orders'
const PAYMENT_WINDOW_MIN = 10
const CONFIRMATION_WINDOW_MIN = 5

/**
 * Códigos de respuesta de Payphone (subset relevante para el mock).
 * - 3: pagado correctamente
 * - 2: cancelado por el usuario
 * - 1: pendiente / autorizado sin confirmar
 */
const PAYPHONE_OK = 3
const PAYPHONE_CANCELLED = 2
const PAYPHONE_PENDING = 1

function readOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedOrders()
    const parsed = JSON.parse(raw) as Order[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedOrders()
  } catch {
    return seedOrders()
  }
}

/**
 * Siembra órdenes de ejemplo la primera vez que se abre el admin sin haber
 * pagado nada. Cubre los distintos estados para que el panel se vea poblado.
 */
function seedOrders(): Order[] {
  const baseDate = new Date('2026-06-01T10:00:00Z')
  const seeded: Order[] = [
    {
      id: 'ORD-DEMO01',
      buyerEmail: 'maria.lopez@correo.ec',
      items: [],
      totals: { subtotal: 49.98, discount: 0, total: 49.98 },
      status: 'confirmed',
      createdAt: new Date(baseDate.getTime()).toISOString(),
      expiresAt: new Date(baseDate.getTime() + 10 * 60_000).toISOString(),
      payphone: {
        transactionId: 'PP-DEMO01',
        responseCode: PAYPHONE_OK,
        authorizedAt: new Date(baseDate.getTime() + 30_000).toISOString(),
        confirmedAt: new Date(baseDate.getTime() + 90_000).toISOString(),
        message: 'Pago aprobado.',
      },
    },
    {
      id: 'ORD-DEMO02',
      buyerEmail: 'jose.cordova@correo.ec',
      items: [],
      totals: { subtotal: 24.99, discount: 0, total: 24.99 },
      status: 'failed',
      createdAt: new Date(baseDate.getTime() + 3600_000).toISOString(),
      expiresAt: new Date(baseDate.getTime() + 3600_000 + 10 * 60_000).toISOString(),
      payphone: {
        transactionId: 'PP-DEMO02',
        responseCode: PAYPHONE_CANCELLED,
        authorizedAt: new Date(baseDate.getTime() + 3600_000 + 20_000).toISOString(),
        message: 'El usuario canceló la transacción.',
      },
    },
    {
      id: 'ORD-DEMO03',
      buyerEmail: 'andrea.vinueza@correo.ec',
      items: [],
      totals: { subtotal: 89.5, discount: 17.9, total: 71.6 },
      couponCode: 'QUITO20',
      status: 'awaiting_payment',
      createdAt: new Date(baseDate.getTime() + 86400_000).toISOString(),
      expiresAt: new Date(baseDate.getTime() + 86400_000 + 10 * 60_000).toISOString(),
      payphone: {
        transactionId: 'PP-DEMO03',
        responseCode: PAYPHONE_PENDING,
        authorizedAt: new Date(baseDate.getTime() + 86400_000 + 30_000).toISOString(),
        message: 'Pago en revisión.',
      },
    },
    {
      id: 'ORD-DEMO04',
      buyerEmail: 'andres.muñoz@correo.ec',
      items: [],
      totals: { subtotal: 39.99, discount: 0, total: 39.99 },
      status: 'refunded',
      createdAt: new Date(baseDate.getTime() + 2 * 86400_000).toISOString(),
      expiresAt: new Date(baseDate.getTime() + 2 * 86400_000 + 10 * 60_000).toISOString(),
      payphone: {
        transactionId: 'PP-DEMO04',
        responseCode: PAYPHONE_OK,
        authorizedAt: new Date(baseDate.getTime() + 2 * 86400_000 + 10_000).toISOString(),
        confirmedAt: new Date(baseDate.getTime() + 2 * 86400_000 + 70_000).toISOString(),
        message: 'Reembolso emitido por admin.',
      },
    },
  ]
  writeOrders(seeded)
  return seeded
}

function writeOrders(orders: Order[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export function createOrder(input: {
  buyerEmail: string
  items: CartItem[]
  coupon: CartCoupon | null
  totals: CartTotals
}): Order {
  const now = new Date()
  const expires = new Date(now.getTime() + PAYMENT_WINDOW_MIN * 60_000)
  const order: Order = {
    id: generateId('ORD'),
    buyerEmail: input.buyerEmail,
    items: input.items,
    couponCode: input.coupon?.code,
    totals: input.totals,
    status: 'awaiting_payment',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }
  const orders = readOrders()
  orders.push(order)
  writeOrders(orders)
  return order
}

export function getOrder(orderId: string): Order | undefined {
  return readOrders().find((o) => o.id === orderId)
}

export function listOrders(): Order[] {
  return readOrders()
}

function patchOrder(orderId: string, patch: Partial<Order>) {
  const orders = readOrders().map((o) =>
    o.id === orderId ? { ...o, ...patch } : o,
  )
  writeOrders(orders)
}

/**
 * Reembolsa una orden ya confirmada. Mock: actualiza status y deja constancia
 * en el mensaje de Payphone.
 */
export function refundOrder(orderId: string): Order | undefined {
  const order = getOrder(orderId)
  if (!order || order.status !== 'confirmed') return order
  const payphone: PayphoneTransaction = {
    ...(order.payphone ?? {
      transactionId: 'manual-refund',
      responseCode: PAYPHONE_OK,
    }),
    message: 'Reembolso emitido por admin.',
  }
  patchOrder(orderId, { status: 'refunded', payphone })
  return getOrder(orderId)
}

export interface PayphoneSimulationOptions {
  /** Forzar el resultado del pago. Por defecto, success. */
  outcome?: 'success' | 'cancel' | 'pending'
}

/**
 * Simula el redirect a Payphone y la posterior confirmación.
 * Resuelve cuando el flujo terminó (sea pagado, cancelado o quedó pendiente).
 */
export async function simulatePayphone(
  orderId: string,
  options: PayphoneSimulationOptions = {},
): Promise<Order> {
  const outcome = options.outcome ?? 'success'
  // Simulamos el redirect ida-vuelta a Payphone (~2.5s).
  await new Promise((r) => setTimeout(r, 2500))

  const txnId = generateId('PP')
  const authorizedAt = new Date().toISOString()

  let responseCode = PAYPHONE_PENDING
  let status: OrderStatus = 'awaiting_payment'
  let message = 'Pago en revisión.'
  let confirmedAt: string | undefined

  if (outcome === 'success') {
    responseCode = PAYPHONE_OK
    status = 'confirmed'
    confirmedAt = new Date().toISOString()
    message = 'Pago aprobado.'
  } else if (outcome === 'cancel') {
    responseCode = PAYPHONE_CANCELLED
    status = 'failed'
    message = 'El usuario canceló la transacción.'
  }

  const payphone: PayphoneTransaction = {
    transactionId: txnId,
    responseCode,
    authorizedAt,
    confirmedAt,
    message,
  }

  patchOrder(orderId, { status, payphone })
  return getOrder(orderId)!
}

export const CHECKOUT_TIMINGS = {
  paymentWindowMinutes: PAYMENT_WINDOW_MIN,
  confirmationWindowMinutes: CONFIRMATION_WINDOW_MIN,
}

export const PAYPHONE_CODES = {
  OK: PAYPHONE_OK,
  CANCELLED: PAYPHONE_CANCELLED,
  PENDING: PAYPHONE_PENDING,
}
