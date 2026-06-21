import { createContext, useContext } from 'react'
import type {
  AnalyticsData,
  Coupon,
  DashboardStats,
  EventItem,
  Photo,
  Photographer,
  Sale,
} from '../lib/types'

export interface AdminContextValue {
  events: EventItem[]
  photographers: Photographer[]
  coupons: Coupon[]
  photos: Photo[]
  sales: Sale[]
  analytics: AnalyticsData[]
  stats: DashboardStats

  addEvent: (event: Omit<EventItem, 'id'>) => void
  updateEvent: (id: string, patch: Partial<EventItem>) => void
  deleteEvent: (id: string) => void

  addPhotographer: (photographer: Omit<Photographer, 'id'>) => void
  updatePhotographer: (id: string, patch: Partial<Photographer>) => void
  deletePhotographer: (id: string) => void

  addCoupon: (coupon: Omit<Coupon, 'id'>) => void
  updateCoupon: (id: string, patch: Partial<Coupon>) => void
  deleteCoupon: (id: string) => void

  addPhotos: (photos: Omit<Photo, 'id'>[]) => void
  deletePhoto: (id: string) => void

  assignPhotographerToEvent: (photographerId: string, eventId: string) => void
  removePhotographerFromEvent: (photographerId: string, eventId: string) => void

  getEventSales: (eventId: string) => Sale[]
  getPhotographerSales: (photographerId: string) => Sale[]
  getPhotographerEarnings: (photographerId: string) => number
}

export const AdminContext = createContext<AdminContextValue | null>(null)

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
