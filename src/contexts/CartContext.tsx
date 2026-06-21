import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CartCoupon,
  CartItem,
  CartPack,
  CartTotals,
  EventItem,
  PackKey,
  Photo,
  PhotoPack,
} from '../lib/types'
import { mockCoupons, mockEvents } from '../lib/mocks'
import { packLabel } from '../lib/packs'

const STORAGE_KEY = 'picshot-cart-v2'

interface StoredCart {
  items: CartItem[]
  packs: CartPack[]
  coupon: CartCoupon | null
}

export interface PackUpsellHint {
  /** Cuál es el pack al que pueden cambiar las fotos sueltas. */
  pack: PhotoPack
  label: string
  /** Cantidad de fotos sueltas que ya tienen del evento. */
  currentSingles: number
  /** Cuántas fotos más necesitan agregar para completar el pack (0 si ya alcanzan). */
  missing: number
  /** Cuánto se ahorraría si convierten. */
  savings: number
  /** Si missing === 0, se puede convertir directo desde el carrito. */
  canConvert: boolean
}

export interface CartEventGroup {
  eventId: string
  eventTitle: string
  singles: CartItem[]
  packs: CartPack[]
  /** Suma de los precios de fotos sueltas + precios de los packs. */
  total: number
  upsell: PackUpsellHint | null
}

interface CartContextValue {
  items: CartItem[]
  packs: CartPack[]
  coupon: CartCoupon | null
  totals: CartTotals
  /** Cantidad total de fotos (sueltas + dentro de packs). */
  count: number
  /** Cantidad de líneas (fotos sueltas + bloques pack). */
  lineCount: number
  eventGroups: CartEventGroup[]
  isInCart: (photoId: string) => boolean
  addItem: (photo: Photo, eventId?: string) => void
  removeItem: (photoId: string) => void
  addPack: (
    eventId: string,
    packKey: PackKey,
    quantity: number | null,
    price: number,
    photos: Photo[],
  ) => void
  removePack: (packId: string) => void
  /** Convierte fotos sueltas existentes en un pack (cuando se cumple el umbral exacto). */
  convertSinglesToPack: (eventId: string, packKey: PackKey) => boolean
  clear: () => void
  applyCoupon: (code: string) => { ok: boolean; message: string }
  removeCoupon: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(): StoredCart {
  if (typeof window === 'undefined') return { items: [], packs: [], coupon: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [], packs: [], coupon: null }
    const parsed = JSON.parse(raw) as StoredCart
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      packs: Array.isArray(parsed.packs) ? parsed.packs : [],
      coupon: parsed.coupon ?? null,
    }
  } catch {
    return { items: [], packs: [], coupon: null }
  }
}

function toCartItem(photo: Photo, eventId: string): CartItem {
  return {
    photoId: photo.id,
    eventId,
    url: photo.url,
    price: photo.price,
    bib: photo.bib,
    resolution: photo.resolution,
    addedAt: new Date().toISOString(),
  }
}

function findUpsell(
  packs: PhotoPack[] | undefined,
  singles: CartItem[],
): PackUpsellHint | null {
  if (!packs || singles.length === 0) return null
  const unitTotal = singles.reduce((sum, it) => sum + it.price, 0)

  // Buscar el pack que cubra exactamente o esté un poco más arriba que el conteo.
  const ranked = packs
    .filter((p): p is PhotoPack & { quantity: number } => p.quantity != null)
    .sort((a, b) => a.quantity - b.quantity)
  const count = singles.length

  // 1) Pack con cantidad exacta y precio menor que la suma suelta → ofrecer conversión.
  const exact = ranked.find((p) => p.quantity === count)
  if (exact && exact.price < unitTotal) {
    return {
      pack: exact,
      label: packLabel(exact.key),
      currentSingles: count,
      missing: 0,
      savings: +(unitTotal - exact.price).toFixed(2),
      canConvert: true,
    }
  }

  // 2) Próximo pack con cantidad mayor → sugerir agregar fotos.
  const next = ranked.find((p) => p.quantity > count)
  if (next) {
    const unitPrice = (() => {
      const single = packs.find((p) => p.key === 'single')
      if (single) return single.price
      // fallback al promedio de las sueltas existentes
      return unitTotal / count
    })()
    const projectedUnitTotal = unitPrice * next.quantity
    const savings = +(projectedUnitTotal - next.price).toFixed(2)
    if (savings > 0) {
      return {
        pack: next,
        label: packLabel(next.key),
        currentSingles: count,
        missing: next.quantity - count,
        savings,
        canConvert: false,
      }
    }
  }
  return null
}

function calcTotals(
  singles: CartItem[],
  packs: CartPack[],
  coupon: CartCoupon | null,
): CartTotals {
  const singlesTotal = singles.reduce((sum, it) => sum + it.price, 0)
  const packsTotal = packs.reduce((sum, p) => sum + p.price, 0)
  const subtotal = singlesTotal + packsTotal
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

function generatePackId() {
  return `pk-${Math.random().toString(36).slice(2, 10)}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const initial = readStoredCart()
  const [items, setItems] = useState<CartItem[]>(initial.items)
  const [packs, setPacks] = useState<CartPack[]>(initial.packs)
  const [coupon, setCoupon] = useState<CartCoupon | null>(initial.coupon)

  useEffect(() => {
    const payload: StoredCart = { items, packs, coupon }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [items, packs, coupon])

  const eventIndex = useMemo(() => {
    const map = new Map<string, EventItem>()
    mockEvents.forEach((e) => map.set(e.id, e))
    return map
  }, [])

  const addItem = useCallback((photo: Photo, eventId?: string) => {
    setItems((prev) => {
      if (prev.some((it) => it.photoId === photo.id)) return prev
      return [...prev, toCartItem(photo, eventId ?? photo.eventId)]
    })
  }, [])

  const removeItem = useCallback((photoId: string) => {
    setItems((prev) => prev.filter((it) => it.photoId !== photoId))
  }, [])

  const addPack = useCallback(
    (
      eventId: string,
      packKey: PackKey,
      quantity: number | null,
      price: number,
      photos: Photo[],
    ) => {
      const photoIds = new Set(photos.map((p) => p.id))
      // Quitar de fotos sueltas las que se vayan al pack
      setItems((prev) => prev.filter((it) => !photoIds.has(it.photoId)))
      setPacks((prev) => [
        ...prev,
        {
          id: generatePackId(),
          eventId,
          packKey,
          label: packLabel(packKey),
          quantity,
          price,
          photos: photos.map((p) => toCartItem(p, eventId)),
          addedAt: new Date().toISOString(),
        },
      ])
    },
    [],
  )

  const removePack = useCallback((packId: string) => {
    setPacks((prev) => prev.filter((p) => p.id !== packId))
  }, [])

  const convertSinglesToPack = useCallback(
    (eventId: string, packKey: PackKey) => {
      const event = eventIndex.get(eventId)
      const pack = event?.packs?.find((p) => p.key === packKey)
      if (!event || !pack || pack.quantity == null) return false
      const singles = items.filter((it) => it.eventId === eventId)
      if (singles.length !== pack.quantity) return false
      const ids = new Set(singles.map((it) => it.photoId))
      setItems((prev) => prev.filter((it) => !ids.has(it.photoId)))
      setPacks((prev) => [
        ...prev,
        {
          id: generatePackId(),
          eventId,
          packKey,
          label: packLabel(packKey),
          quantity: pack.quantity,
          price: pack.price,
          photos: singles,
          addedAt: new Date().toISOString(),
        },
      ])
      return true
    },
    [items, eventIndex],
  )

  const clear = useCallback(() => {
    setItems([])
    setPacks([])
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

  const totals = useMemo(
    () => calcTotals(items, packs, coupon),
    [items, packs, coupon],
  )

  const eventGroups = useMemo<CartEventGroup[]>(() => {
    const groups = new Map<string, CartEventGroup>()
    function ensure(eventId: string) {
      if (!groups.has(eventId)) {
        const ev = eventIndex.get(eventId)
        groups.set(eventId, {
          eventId,
          eventTitle: ev?.title ?? 'Evento',
          singles: [],
          packs: [],
          total: 0,
          upsell: null,
        })
      }
      return groups.get(eventId)!
    }
    items.forEach((it) => ensure(it.eventId).singles.push(it))
    packs.forEach((p) => ensure(p.eventId).packs.push(p))
    return Array.from(groups.values()).map((g) => {
      const singlesTotal = g.singles.reduce((s, it) => s + it.price, 0)
      const packsTotal = g.packs.reduce((s, p) => s + p.price, 0)
      const ev = eventIndex.get(g.eventId)
      return {
        ...g,
        total: +(singlesTotal + packsTotal).toFixed(2),
        upsell: findUpsell(ev?.packs, g.singles),
      }
    })
  }, [items, packs, eventIndex])

  const isInCart = useCallback(
    (photoId: string) =>
      items.some((it) => it.photoId === photoId) ||
      packs.some((p) => p.photos.some((it) => it.photoId === photoId)),
    [items, packs],
  )

  const lineCount = items.length + packs.length
  const count =
    items.length + packs.reduce((sum, p) => sum + p.photos.length, 0)

  const value: CartContextValue = {
    items,
    packs,
    coupon,
    totals,
    count,
    lineCount,
    eventGroups,
    isInCart,
    addItem,
    removeItem,
    addPack,
    removePack,
    convertSinglesToPack,
    clear,
    applyCoupon,
    removeCoupon,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
