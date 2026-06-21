import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CartCoupon,
  CartItem,
  CartTotals,
  EventItem,
  Photo,
} from '../lib/types'
import { mockCoupons, mockEvents } from '../lib/mocks'
import { packLabel, resolvePack } from '../lib/packs'

const STORAGE_KEY = 'picshot-cart'

interface StoredCart {
  items: CartItem[]
  coupon: CartCoupon | null
}

export interface CartEventGroup {
  eventId: string
  eventTitle: string
  items: CartItem[]
  unitTotal: number
  /** Total cobrado por el evento aplicando packs si corresponde. */
  chargedTotal: number
  packSavings: number
  activePackLabel: string | null
  nextPackHint: { label: string; missing: number; savings: number } | null
}

interface CartContextValue {
  items: CartItem[]
  coupon: CartCoupon | null
  totals: CartTotals
  count: number
  /** Items agrupados por evento, con cálculo de pack aplicado. */
  eventGroups: CartEventGroup[]
  isInCart: (photoId: string) => boolean
  addItem: (photo: Photo, eventId?: string) => void
  removeItem: (photoId: string) => void
  clear: () => void
  applyCoupon: (code: string) => { ok: boolean; message: string }
  removeCoupon: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(): StoredCart {
  if (typeof window === 'undefined') return { items: [], coupon: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [], coupon: null }
    const parsed = JSON.parse(raw) as StoredCart
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      coupon: parsed.coupon ?? null,
    }
  } catch {
    return { items: [], coupon: null }
  }
}

function buildEventGroups(
  items: CartItem[],
  eventIndex: Map<string, EventItem>,
): CartEventGroup[] {
  const byEvent = new Map<string, CartItem[]>()
  for (const it of items) {
    const list = byEvent.get(it.eventId) ?? []
    list.push(it)
    byEvent.set(it.eventId, list)
  }
  return Array.from(byEvent.entries()).map(([eventId, evItems]) => {
    const event = eventIndex.get(eventId)
    const unitTotal = evItems.reduce((sum, it) => sum + it.price, 0)
    const resolution = resolvePack(event?.packs, evItems.length, unitTotal)
    return {
      eventId,
      eventTitle: event?.title ?? 'Evento',
      items: evItems,
      unitTotal: +resolution.unitTotal.toFixed(2),
      chargedTotal: +resolution.chargedTotal.toFixed(2),
      packSavings: +resolution.savings.toFixed(2),
      activePackLabel: resolution.activePack
        ? packLabel(resolution.activePack.key)
        : null,
      nextPackHint: resolution.nextPack
        ? {
            label: packLabel(resolution.nextPack.pack.key),
            missing: resolution.nextPack.missing,
            savings: +resolution.nextPack.savingsIfReached.toFixed(2),
          }
        : null,
    }
  })
}

function calcTotals(
  groups: CartEventGroup[],
  coupon: CartCoupon | null,
): CartTotals {
  const subtotal = groups.reduce((sum, g) => sum + g.chargedTotal, 0)
  let discount = 0
  if (coupon) {
    discount =
      coupon.discountType === 'percentage'
        ? +(subtotal * (coupon.discountValue / 100)).toFixed(2)
        : Math.min(coupon.discountValue, subtotal)
  }
  return {
    subtotal: +subtotal.toFixed(2),
    discount: +discount.toFixed(2),
    total: +Math.max(subtotal - discount, 0).toFixed(2),
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart().items)
  const [coupon, setCoupon] = useState<CartCoupon | null>(
    () => readStoredCart().coupon,
  )

  useEffect(() => {
    const payload: StoredCart = { items, coupon }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [items, coupon])

  const addItem = useCallback((photo: Photo, eventId?: string) => {
    setItems((prev) => {
      if (prev.some((it) => it.photoId === photo.id)) return prev
      const newItem: CartItem = {
        photoId: photo.id,
        eventId: eventId ?? photo.eventId,
        url: photo.url,
        price: photo.price,
        bib: photo.bib,
        resolution: photo.resolution,
        addedAt: new Date().toISOString(),
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((photoId: string) => {
    setItems((prev) => prev.filter((it) => it.photoId !== photoId))
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const applyCoupon = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return { ok: false, message: 'Ingresa un código.' }
    const match = mockCoupons.find(
      (c) => c.code.toUpperCase() === normalized && c.isActive,
    )
    if (!match) return { ok: false, message: 'Cupón no válido.' }
    setCoupon({
      code: match.code,
      discountType: match.discountType,
      discountValue: match.discountValue,
    })
    return { ok: true, message: 'Cupón aplicado.' }
  }, [])

  const removeCoupon = useCallback(() => setCoupon(null), [])

  // En modo mock leemos los eventos directo; cuando se conecte el API,
  // este Map se puede llenar con un fetch a /events o cache local.
  const eventIndex = useMemo(() => {
    const map = new Map<string, EventItem>()
    mockEvents.forEach((e) => map.set(e.id, e))
    return map
  }, [])

  const eventGroups = useMemo(
    () => buildEventGroups(items, eventIndex),
    [items, eventIndex],
  )

  const totals = useMemo(
    () => calcTotals(eventGroups, coupon),
    [eventGroups, coupon],
  )

  const isInCart = useCallback(
    (photoId: string) => items.some((it) => it.photoId === photoId),
    [items],
  )

  const value: CartContextValue = {
    items,
    coupon,
    totals,
    count: items.length,
    eventGroups,
    isInCart,
    addItem,
    removeItem,
    clear,
    applyCoupon,
    removeCoupon,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
