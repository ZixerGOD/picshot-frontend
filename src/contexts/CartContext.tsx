import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CartCoupon, CartItem, CartTotals, Photo } from '../lib/types'
import { mockCoupons } from '../lib/mocks'

const STORAGE_KEY = 'picshot-cart'

interface StoredCart {
  items: CartItem[]
  coupon: CartCoupon | null
}

interface CartContextValue {
  items: CartItem[]
  coupon: CartCoupon | null
  totals: CartTotals
  count: number
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

function calcTotals(items: CartItem[], coupon: CartCoupon | null): CartTotals {
  const subtotal = items.reduce((sum, it) => sum + it.price, 0)
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

  const totals = useMemo(() => calcTotals(items, coupon), [items, coupon])

  const isInCart = useCallback(
    (photoId: string) => items.some((it) => it.photoId === photoId),
    [items],
  )

  const value: CartContextValue = {
    items,
    coupon,
    totals,
    count: items.length,
    isInCart,
    addItem,
    removeItem,
    clear,
    applyCoupon,
    removeCoupon,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
