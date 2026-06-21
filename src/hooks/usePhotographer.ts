import { createContext, useContext } from 'react'
import type { EventItem, Photo, Sale } from '../lib/types'

export interface PhotographerContextValue {
  photographerId: string
  photographerName: string
  events: EventItem[]
  photos: Photo[]
  sales: Sale[]
  totalEarnings: number
  totalPhotos: number
  totalSales: number
  uploadPhotos: (eventId: string, count: number) => void
}

export const PhotographerContext = createContext<PhotographerContextValue | null>(null)

export function usePhotographer() {
  const ctx = useContext(PhotographerContext)
  if (!ctx) throw new Error('usePhotographer must be used within PhotographerProvider')
  return ctx
}
