import type { Photo } from '../types'
import { img } from '../images'

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
