import { useEffect, useMemo, useState } from 'react'
import type {
  EventItem,
  Photo,
  Photographer,
  Coupon,
  Sale,
  DashboardStats,
} from '../lib/types'
import {
  generateId,
  mockAnalytics,
  mockCoupons,
  mockEvents,
  mockPhotographers,
  mockSales,
} from '../lib/mocks'
import { AdminContext } from '../hooks/useAdmin'

const STORAGE_KEY = 'picshot-admin-demo'

interface AdminState {
  events: EventItem[]
  photographers: Photographer[]
  coupons: Coupon[]
  photos: Photo[]
  sales: Sale[]
}

const defaultState: AdminState = {
  events: mockEvents,
  photographers: mockPhotographers,
  coupons: mockCoupons,
  photos: [
    {
      id: 'photo-initial-1',
      eventId: 'maraton-quito-2026',
      photographerId: 'ph-1',
      url: 'https://picsum.photos/seed/madrid1/800/600',
      price: 24.99,
      status: 'sold',
      createdAt: '2024-11-12T10:00:00Z',
    },
    {
      id: 'photo-initial-2',
      eventId: 'maraton-quito-2026',
      photographerId: 'ph-1',
      url: 'https://picsum.photos/seed/madrid2/800/600',
      price: 24.99,
      status: 'published',
      createdAt: '2024-11-12T11:00:00Z',
    },
    {
      id: 'photo-initial-3',
      eventId: 'iron-pacifico-manta',
      photographerId: 'ph-1',
      url: 'https://picsum.photos/seed/iron1/800/600',
      price: 29.99,
      status: 'published',
      createdAt: '2024-10-28T09:00:00Z',
    },
    {
      id: 'photo-initial-4',
      eventId: 'mtb-cajas-cuenca',
      photographerId: 'ph-2',
      url: 'https://picsum.photos/seed/mtb1/800/600',
      price: 14.99,
      status: 'sold',
      createdAt: '2024-10-15T08:00:00Z',
    },
  ],
  sales: mockSales,
}

function loadFromStorage(): AdminState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AdminState) : defaultState
  } catch {
    return defaultState
  }
}

function saveToStorage(state: AdminState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        events: state.events,
        photographers: state.photographers,
        coupons: state.coupons,
        photos: state.photos,
        sales: state.sales,
      }),
    )
  } catch {
    // ignore
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminState>(loadFromStorage)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const setters = useMemo(() => {
    return {
      addEvent: (event: Omit<EventItem, 'id'>) => {
        const newEvent = { ...event, id: generateId('evt') }
        setState((prev) => ({ ...prev, events: [newEvent, ...prev.events] }))
      },
      updateEvent: (id: string, patch: Partial<EventItem>) => {
        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }))
      },
      deleteEvent: (id: string) => {
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
          photos: prev.photos.filter((p) => p.eventId !== id),
          sales: prev.sales.filter((s) => s.eventId !== id),
          coupons: prev.coupons.filter((c) => c.eventId !== id),
        }))
      },

      addPhotographer: (photographer: Omit<Photographer, 'id'>) => {
        const newPhotographer = { ...photographer, id: generateId('ph') }
        setState((prev) => ({
          ...prev,
          photographers: [newPhotographer, ...prev.photographers],
        }))
      },
      updatePhotographer: (id: string, patch: Partial<Photographer>) => {
        setState((prev) => ({
          ...prev,
          photographers: prev.photographers.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        }))
      },
      deletePhotographer: (id: string) => {
        setState((prev) => ({
          ...prev,
          photographers: prev.photographers.filter((p) => p.id !== id),
          photos: prev.photos.filter((p) => p.photographerId !== id),
          sales: prev.sales.filter((s) => s.photographerId !== id),
          events: prev.events.map((e) => ({
            ...e,
            photographerIds: e.photographerIds?.filter((pid) => pid !== id),
          })),
        }))
      },

      addCoupon: (coupon: Omit<Coupon, 'id'>) => {
        const newCoupon = { ...coupon, id: generateId('cp') }
        setState((prev) => ({ ...prev, coupons: [newCoupon, ...prev.coupons] }))
      },
      updateCoupon: (id: string, patch: Partial<Coupon>) => {
        setState((prev) => ({
          ...prev,
          coupons: prev.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
      },
      deleteCoupon: (id: string) => {
        setState((prev) => ({
          ...prev,
          coupons: prev.coupons.filter((c) => c.id !== id),
        }))
      },

      addPhotos: (photos: Omit<Photo, 'id'>[]) => {
        const newPhotos = photos.map((p) => ({ ...p, id: generateId('photo') }))
        setState((prev) => ({ ...prev, photos: [...newPhotos, ...prev.photos] }))
      },
      deletePhoto: (id: string) => {
        setState((prev) => ({
          ...prev,
          photos: prev.photos.filter((p) => p.id !== id),
          sales: prev.sales.filter((s) => s.photoId !== id),
        }))
      },

      assignPhotographerToEvent: (photographerId: string, eventId: string) => {
        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId
              ? { ...e, photographerIds: [...new Set([...(e.photographerIds ?? []), photographerId])] }
              : e,
          ),
          photographers: prev.photographers.map((p) =>
            p.id === photographerId
              ? { ...p, eventIds: [...new Set([...(p.eventIds ?? []), eventId])] }
              : p,
          ),
        }))
      },
      removePhotographerFromEvent: (photographerId: string, eventId: string) => {
        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId
              ? { ...e, photographerIds: e.photographerIds?.filter((pid) => pid !== photographerId) }
              : e,
          ),
          photographers: prev.photographers.map((p) =>
            p.id === photographerId
              ? { ...p, eventIds: p.eventIds?.filter((eid) => eid !== eventId) }
              : p,
          ),
        }))
      },
    }
  }, [])

  const helpers = useMemo(() => {
    const allSales = state.sales
    return {
      getEventSales: (eventId: string) => allSales.filter((s) => s.eventId === eventId),
      getPhotographerSales: (photographerId: string) =>
        allSales.filter((s) => s.photographerId === photographerId),
      getPhotographerEarnings: (photographerId: string) =>
        allSales
          .filter((s) => s.photographerId === photographerId)
          .reduce((sum, s) => sum + s.photographerEarnings, 0),
    }
  }, [state.sales])

  const stats = useMemo<DashboardStats>(() => {
    const activeEvents = state.events.filter((e) => e.status === 'active').length
    const activeCoupons = state.coupons.filter((c) => c.isActive).length
    const totalRevenue = state.sales.reduce((sum, s) => sum + s.finalAmount, 0)
    const totalSales = state.sales.length
    const totalVisits = mockAnalytics.reduce((sum, d) => sum + d.visits, 0)
    const totalPhotosSold = state.sales.length
    const totalPhotographers = state.photographers.filter((p) => p.isActive).length

    return {
      totalRevenue,
      totalSales,
      totalVisits,
      totalPhotosSold,
      activeEvents,
      activeCoupons,
      totalPhotographers,
    }
  }, [state])

  const value = {
    ...state,
    analytics: mockAnalytics,
    stats,
    ...setters,
    ...helpers,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
