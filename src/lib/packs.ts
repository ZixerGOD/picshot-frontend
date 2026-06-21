import type { PackKey, PhotoPack } from './types'

/**
 * Catálogo de packs que el admin puede ofrecer en un evento.
 * `quantity: null` significa "todas las fotos del evento".
 */
export const PACK_CATALOG: {
  key: PackKey
  label: string
  quantity: number | null
}[] = [
  { key: 'single', label: 'Unidad', quantity: 1 },
  { key: 'pack3', label: 'Pack 3 fotos', quantity: 3 },
  { key: 'pack5', label: 'Pack 5 fotos', quantity: 5 },
  { key: 'pack10', label: 'Pack 10 fotos', quantity: 10 },
  { key: 'all', label: 'Todas las fotos', quantity: null },
]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function packLabel(key: PackKey): string {
  return PACK_CATALOG.find((p) => p.key === key)?.label ?? key
}

export function packQuantity(key: PackKey): number | null {
  const meta = PACK_CATALOG.find((p) => p.key === key)
  return meta ? meta.quantity : null
}

/** Precios sugeridos a partir del precio unitario (los packs aplican descuento por volumen). */
export function defaultPacks(basePrice: number): PhotoPack[] {
  const unit = basePrice || 19.99
  return [
    { key: 'single', quantity: 1, price: round2(unit) },
    { key: 'pack3', quantity: 3, price: round2(unit * 3 * 0.9) },
    { key: 'pack5', quantity: 5, price: round2(unit * 5 * 0.85) },
    { key: 'pack10', quantity: 10, price: round2(unit * 10 * 0.8) },
    { key: 'all', quantity: null, price: round2(unit * 15) },
  ]
}

/** Precio por foto del pack, para comparar el ahorro (los de "todas" no aplican). */
export function pricePerPhoto(pack: PhotoPack): number | null {
  if (!pack.quantity) return null
  return round2(pack.price / pack.quantity)
}

// ===== Edición de packs en formularios =====

export interface PackDraft {
  key: PackKey
  enabled: boolean
  price: string
}

/** Construye el estado editable de packs a partir de los existentes (o sugeridos). */
export function buildPackDrafts(
  existing: PhotoPack[] | undefined,
  basePrice: number,
): PackDraft[] {
  const suggested = defaultPacks(basePrice)
  return PACK_CATALOG.map((meta) => {
    const found = existing?.find((p) => p.key === meta.key)
    const fallback = suggested.find((p) => p.key === meta.key)!
    return {
      key: meta.key,
      enabled: found ? true : meta.key === 'single',
      price: String(found ? found.price : fallback.price),
    }
  })
}

/** Convierte los drafts habilitados en packs listos para guardar. */
export function draftsToPacks(drafts: PackDraft[]): PhotoPack[] {
  return drafts
    .filter((d) => d.enabled)
    .map((d) => ({
      key: d.key,
      quantity: packQuantity(d.key),
      price: parseFloat(d.price) || 0,
    }))
}

/** Precio unitario del evento derivado del pack "Unidad" (o el primero disponible). */
export function unitPriceFromPacks(packs: PhotoPack[], fallback = 19.99): number {
  const single = packs.find((p) => p.key === 'single')
  if (single) return single.price
  const perPhoto = packs.map(pricePerPhoto).find((v): v is number => v != null)
  return perPhoto ?? fallback
}

// ===== Resolución del pack vs carrito =====

export interface PackResolution {
  /** Cuántas fotos del evento hay en el carrito. */
  count: number
  /** Suma de los precios unitarios de las fotos seleccionadas. */
  unitTotal: number
  /** Pack activo: el carrito ya cumple su umbral exacto (o el "Todas"). */
  activePack: PhotoPack | null
  /** Precio final cobrado por este evento (con pack si aplica). */
  chargedTotal: number
  /** Diferencia entre unitTotal y chargedTotal cuando hay pack activo. */
  savings: number
  /** Próximo pack alcanzable y cuánto falta para llegar. */
  nextPack: { pack: PhotoPack; missing: number; savingsIfReached: number } | null
}

export function resolvePack(
  packs: PhotoPack[] | undefined,
  count: number,
  unitTotal: number,
): PackResolution {
  const base: PackResolution = {
    count,
    unitTotal: round2(unitTotal),
    activePack: null,
    chargedTotal: round2(unitTotal),
    savings: 0,
    nextPack: null,
  }
  if (!packs || packs.length === 0 || count === 0) return base

  // 1) Pack 'all' siempre activo si existe (cobra precio fijo, omite todo)
  const allPack = packs.find((p) => p.key === 'all')
  if (allPack && allPack.price < unitTotal) {
    return {
      ...base,
      activePack: allPack,
      chargedTotal: round2(allPack.price),
      savings: round2(unitTotal - allPack.price),
    }
  }

  // 2) Pack con quantity exactamente igual al count: aplica
  const exact = packs
    .filter((p) => p.quantity != null)
    .find((p) => p.quantity === count)
  if (exact && exact.price < unitTotal) {
    return {
      ...base,
      activePack: exact,
      chargedTotal: round2(exact.price),
      savings: round2(unitTotal - exact.price),
    }
  }

  // 3) No hay pack activo. Sugerimos el siguiente cuyo umbral está por encima del count.
  const candidates = packs
    .filter((p): p is PhotoPack & { quantity: number } => p.quantity != null)
    .filter((p) => p.quantity > count)
    .sort((a, b) => a.quantity - b.quantity)
  if (candidates.length === 0) return base

  const next = candidates[0]
  const unit = unitPriceFromPacks(packs)
  const projectedUnitTotal = round2(unit * next.quantity)
  const savingsIfReached = round2(projectedUnitTotal - next.price)
  if (savingsIfReached <= 0) return base
  return {
    ...base,
    nextPack: {
      pack: next,
      missing: next.quantity - count,
      savingsIfReached,
    },
  }
}
