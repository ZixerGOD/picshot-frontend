import type { PhotoPack } from './packs'

export type EventStatus =
  | 'draft'
  | 'active'
  | 'closed'
  | 'archived'
  | 'retention_expired'

export interface EventItem {
  id: string
  title: string
  /** Fecha del evento (YYYY-MM-DD). Cada evento es de un solo día
   *  (decisions.md 229-232); para una jornada multi-día se crean
   *  eventos separados. */
  date: string
  displayDate: string
  /** Fecha hasta la que las fotos quedan disponibles (180 días por defecto). */
  retentionUntil?: string
  location: string
  type: string
  /** Imagen principal (legacy / fallback). Hoy banner y cover se pueden
   *  mostrar separados; este campo se mantiene como fallback. */
  image: string
  /** Banner amplio para la cabecera del evento. */
  bannerImage?: string
  /** Foto de portada cuadrada para listados/cards. */
  coverPhoto?: string
  /** Descripción larga editable por el admin. */
  description?: string
  photoCount: number
  runnerCount?: number
  isNew?: boolean
  status?: EventStatus
  photographerIds?: string[]
  basePrice?: number
  packs?: PhotoPack[]
}
