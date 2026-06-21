import type {
  EventItem,
  Photo,
  AdminUser,
  Photographer,
  Coupon,
  Sale,
  AnalyticsData,
  DashboardStats,
  Purchase,
  AuthUser,
} from './types'
import { img } from './images'
import { defaultPacks } from './packs'

export const mockAdminUser: AdminUser = {
  id: 'admin-1',
  name: 'Alejandro Pérez',
  email: 'admin@picshot.com',
  role: 'admin',
}

export const mockEvents: EventItem[] = [
  {
    id: 'maraton-quito-2026',
    title: 'Maratón Internacional de Quito 2026',
    date: '2026-08-15',
    displayDate: '15 Ago 2026',
    location: 'Quito',
    type: 'Maratón',
    image: img('shots-quito', 800, 500),
    photoCount: 14500,
    runnerCount: 12000,
    isNew: true,
    status: 'active',
    basePrice: 24.99,
    photographerIds: ['ph-1', 'ph-2'],
  },
  {
    id: 'ruta-de-los-volcanes',
    title: 'Ruta de los Volcanes',
    date: '2026-07-26',
    displayDate: '26 Jul 2026',
    location: 'Cotopaxi',
    type: 'Ciclismo',
    image: img('shots-cotopaxi', 800, 500),
    photoCount: 8200,
    runnerCount: 1800,
    status: 'active',
    basePrice: 19.99,
    photographerIds: ['ph-3'],
  },
  {
    id: 'iron-pacifico-manta',
    title: 'Iron Pacífico Manta',
    date: '2026-06-21',
    displayDate: '21 Jun 2026',
    location: 'Manta',
    type: 'Triatlón',
    image: img('shots-manta', 800, 500),
    photoCount: 22100,
    runnerCount: 3100,
    status: 'closed',
    basePrice: 29.99,
    photographerIds: ['ph-1', 'ph-3', 'ph-4'],
  },
  {
    id: 'mtb-cajas-cuenca',
    title: 'MTB El Cajas Cuenca',
    date: '2026-06-07',
    displayDate: '07 Jun 2026',
    location: 'Cuenca',
    type: 'MTB',
    image: img('shots-cajas', 800, 500),
    photoCount: 5400,
    runnerCount: 950,
    status: 'active',
    basePrice: 14.99,
    photographerIds: ['ph-2'],
  },
  {
    id: 'media-nocturna-guayaquil',
    title: 'Media Nocturna Guayaquil',
    date: '2026-05-24',
    displayDate: '24 May 2026',
    location: 'Guayaquil',
    type: 'Maratón',
    image: img('shots-guayaquil', 800, 500),
    photoCount: 11200,
    runnerCount: 8600,
    status: 'active',
    basePrice: 19.99,
    photographerIds: ['ph-4'],
  },
]

// Cada evento ofrece sus packs de venta (el admin los configura al crear/editar).
mockEvents.forEach((event) => {
  event.packs = defaultPacks(event.basePrice ?? 19.99)
})

export const mockPhotographers: Photographer[] = [
  {
    id: 'ph-1',
    name: 'Carlos Ruiz',
    email: 'carlos@picshot.com',
    phone: '+593 99 612 3456',
    city: 'Quito',
    joinedAt: '2025-05-12',
    isActive: true,
    commissionRate: 40,
    eventIds: ['maraton-quito-2026', 'iron-pacifico-manta'],
  },
  {
    id: 'ph-2',
    name: 'María Gómez',
    email: 'maria@picshot.com',
    phone: '+593 98 623 4567',
    city: 'Guayaquil',
    joinedAt: '2025-08-20',
    isActive: true,
    commissionRate: 45,
    eventIds: ['maraton-quito-2026', 'mtb-cajas-cuenca'],
  },
  {
    id: 'ph-3',
    name: 'Luis Torres',
    email: 'luis@picshot.com',
    phone: '+593 96 634 5678',
    city: 'Cuenca',
    joinedAt: '2026-01-10',
    isActive: true,
    commissionRate: 35,
    eventIds: ['ruta-de-los-volcanes', 'iron-pacifico-manta'],
  },
  {
    id: 'ph-4',
    name: 'Ana Martínez',
    email: 'ana@picshot.com',
    phone: '+593 99 645 6789',
    city: 'Manta',
    joinedAt: '2026-03-15',
    isActive: false,
    commissionRate: 38,
    eventIds: ['iron-pacifico-manta', 'media-nocturna-guayaquil'],
  },
]

export const mockCoupons: Coupon[] = [
  {
    id: 'cp-1',
    code: 'QUITO20',
    eventId: 'maraton-quito-2026',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 100,
    usedCount: 67,
    validFrom: '2026-08-01',
    validUntil: '2026-08-31',
    isActive: true,
  },
  {
    id: 'cp-2',
    code: 'VOLCANES5',
    eventId: 'ruta-de-los-volcanes',
    discountType: 'fixed',
    discountValue: 5,
    maxUses: 50,
    usedCount: 12,
    validFrom: '2026-07-15',
    validUntil: '2026-08-05',
    isActive: true,
  },
  {
    id: 'cp-3',
    code: 'IRONMANTA15',
    eventId: 'iron-pacifico-manta',
    discountType: 'percentage',
    discountValue: 15,
    maxUses: 200,
    usedCount: 198,
    validFrom: '2026-05-15',
    validUntil: '2026-06-30',
    isActive: true,
  },
  {
    id: 'cp-4',
    code: 'CAJAS10',
    eventId: 'mtb-cajas-cuenca',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 30,
    usedCount: 30,
    validFrom: '2026-05-15',
    validUntil: '2026-06-15',
    isActive: false,
  },
]

const allPhotos: Photo[] = [
  {
    id: 'p1',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-1', 1200, 900),
    price: 24.99,
    bib: '4509',
    resolution: 'Alta Resolución',
    featured: true,
    photographerId: 'ph-1',
    status: 'published',
    createdAt: '2024-11-12T10:00:00Z',
  },
  {
    id: 'p2',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-2', 800, 600),
    price: 19.99,
    exclusive: true,
    photographerId: 'ph-2',
    status: 'sold',
    createdAt: '2024-11-12T11:00:00Z',
  },
  {
    id: 'p3',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-3', 800, 600),
    price: 19.99,
    photographerId: 'ph-1',
    status: 'published',
    createdAt: '2024-11-12T12:00:00Z',
  },
  {
    id: 'p4',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-4', 800, 600),
    price: 14.99,
    photographerId: 'ph-3',
    status: 'published',
    createdAt: '2024-11-12T13:00:00Z',
  },
  {
    id: 'p5',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-5', 800, 600),
    price: 19.99,
    bib: '4510',
    photographerId: 'ph-2',
    status: 'processing',
    createdAt: '2024-11-12T14:00:00Z',
  },
  {
    id: 'p6',
    eventId: 'maraton-ciudad-2026',
    url: img('shots-gallery-6', 800, 600),
    price: 29.99,
    exclusive: true,
    featured: true,
    photographerId: 'ph-1',
    status: 'sold',
    createdAt: '2024-11-12T15:00:00Z',
  },
]

export function getMockPhotosByEvent(eventId: string): Photo[] {
  return allPhotos.map((p) => ({ ...p, eventId }))
}

export function getMockEventById(id: string): EventItem | undefined {
  return (
    mockEvents.find((e) => e.id === id) ?? {
      id,
      title: 'Maratón Ciudad 2026',
      date: '2026-10-15',
      displayDate: '15 Octubre 2026',
      location: 'Ciudad Metropolitana',
      type: 'Maratón',
      image: img('shots-ciudad', 1600, 900),
      photoCount: 15000,
      runnerCount: 42000,
      isNew: true,
      status: 'active',
      basePrice: 24.99,
    }
  )
}

export function generateMockSales(): Sale[] {
  const sales: Sale[] = []
  const events = mockEvents
  const photographers = mockPhotographers
  let baseId = 1000

  events.forEach((event) => {
    const eventPhotos = getMockPhotosByEvent(event.id)
    const count = Math.floor(Math.random() * 80) + 20
    for (let i = 0; i < count; i++) {
      const photo = eventPhotos[Math.floor(Math.random() * eventPhotos.length)]
      const photographer = photographers.find((p) => p.id === photo.photographerId) ?? photographers[0]
      const amount = photo.price
      const discount = Math.random() > 0.7 ? amount * 0.15 : 0
      const final = amount - discount
      const photographerEarnings = final * (photographer.commissionRate / 100)
      const platformEarnings = final - photographerEarnings
      const date = new Date(event.date)
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))
      sales.push({
        id: `sale-${baseId++}`,
        photoId: photo.id,
        eventId: event.id,
        photographerId: photographer.id,
        buyerEmail: `comprador${baseId}@email.com`,
        amount,
        discountAmount: discount,
        finalAmount: final,
        photographerEarnings,
        platformEarnings,
        createdAt: date.toISOString(),
        couponCode: discount > 0 ? 'MADRID20' : undefined,
      })
    }
  })

  return sales
}

export const mockSales: Sale[] = generateMockSales()

// Comprador demo: en modo mock representa al usuario logueado que ve "Mis compras".
export const DEMO_BUYER_EMAIL = 'comprador@email.com'

// Credenciales de demo para el login en modo mock (el backend real usa POST /auth/login).
export const mockAuthUsers: (AuthUser & { password: string })[] = [
  {
    id: 'admin-1',
    name: 'Admin Picshot',
    email: 'admin@picshot.com',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: 'user-ph-1',
    name: 'Carlos Ruiz',
    email: 'fotografo@picshot.com',
    role: 'photographer',
    photographerId: 'ph-1',
    password: 'foto123',
  },
  {
    id: 'buyer-1',
    name: 'Comprador Demo',
    email: DEMO_BUYER_EMAIL,
    role: 'customer',
    password: 'demo123',
  },
]

export const mockPurchases: Purchase[] = [
  {
    id: 'pur-1',
    orderId: 'ORD-2024-0312',
    eventId: 'maraton-quito-2026',
    photoId: 'p1',
    url: img('compra-madrid-1', 1200, 900),
    price: 24.99,
    resolution: 'Alta Resolución',
    bib: '4509',
    purchasedAt: '2024-11-14T18:32:00Z',
  },
  {
    id: 'pur-2',
    orderId: 'ORD-2024-0312',
    eventId: 'maraton-quito-2026',
    photoId: 'p2',
    url: img('compra-madrid-2', 1200, 900),
    price: 24.99,
    resolution: 'Alta Resolución',
    bib: '4509',
    purchasedAt: '2024-11-14T18:32:00Z',
  },
  {
    id: 'pur-3',
    orderId: 'ORD-2024-0312',
    eventId: 'maraton-quito-2026',
    photoId: 'p3',
    url: img('compra-madrid-3', 1200, 900),
    price: 19.99,
    resolution: 'Alta Resolución',
    bib: '4509',
    purchasedAt: '2024-11-14T18:32:00Z',
  },
  {
    id: 'pur-4',
    orderId: 'ORD-2024-0289',
    eventId: 'iron-pacifico-manta',
    photoId: 'p4',
    url: img('compra-valencia-1', 1200, 900),
    price: 29.99,
    resolution: 'Exclusiva 4K',
    bib: '1180',
    purchasedAt: '2024-10-30T09:15:00Z',
  },
  {
    id: 'pur-5',
    orderId: 'ORD-2024-0289',
    eventId: 'iron-pacifico-manta',
    photoId: 'p5',
    url: img('compra-valencia-2', 1200, 900),
    price: 29.99,
    resolution: 'Exclusiva 4K',
    bib: '1180',
    purchasedAt: '2024-10-30T09:15:00Z',
  },
  {
    id: 'pur-6',
    orderId: 'ORD-2024-0205',
    eventId: 'mtb-cajas-cuenca',
    photoId: 'p6',
    url: img('compra-mtb-1', 1200, 900),
    price: 14.99,
    resolution: 'Alta Resolución',
    bib: '732',
    purchasedAt: '2024-10-16T12:40:00Z',
  },
]

export function generateMockAnalytics(): AnalyticsData[] {
  const data: AnalyticsData[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const visits = Math.floor(Math.random() * 2000) + 300
    const pageViews = Math.floor(visits * (1.5 + Math.random()))
    const uniqueVisitors = Math.floor(visits * 0.7)
    const sales = Math.floor(Math.random() * 40) + 2
    const revenue = sales * (15 + Math.random() * 15)
    data.push({
      date: date.toISOString().split('T')[0],
      visits,
      pageViews,
      uniqueVisitors,
      sales,
      revenue,
    })
  }
  return data
}

export const mockAnalytics: AnalyticsData[] = generateMockAnalytics()

export function getDashboardStats(): DashboardStats {
  const activeEvents = mockEvents.filter((e) => e.status === 'active').length
  const activeCoupons = mockCoupons.filter((c) => c.isActive).length
  const totalRevenue = mockSales.reduce((sum, s) => sum + s.finalAmount, 0)
  const totalSales = mockSales.length
  const totalVisits = mockAnalytics.reduce((sum, d) => sum + d.visits, 0)
  const totalPhotosSold = mockSales.length
  const totalPhotographers = mockPhotographers.filter((p) => p.isActive).length

  return {
    totalRevenue,
    totalSales,
    totalVisits,
    totalPhotosSold,
    activeEvents,
    activeCoupons,
    totalPhotographers,
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
