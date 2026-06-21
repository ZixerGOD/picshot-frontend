import type { EventItem } from '../types'
import { img } from '../images'
import { defaultPacks } from '../packs'

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
  if (!event.retentionUntil) {
    const start = new Date(event.date)
    start.setDate(start.getDate() + 180)
    event.retentionUntil = start.toISOString().slice(0, 10)
  }
})

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
