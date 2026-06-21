// Packs de venta que el admin configura por evento.
export type PackKey = 'single' | 'pack3' | 'pack5' | 'pack10' | 'all'

export interface PhotoPack {
  key: PackKey
  quantity: number | null // null = todas las fotos del evento
  price: number
}
