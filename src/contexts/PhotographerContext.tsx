import { useMemo } from 'react'
import type { Photo } from '../lib/types'
import { useAdmin } from '../hooks/useAdmin'
import { useAuth } from '../hooks/useAuth'
import { PhotographerContext } from '../hooks/usePhotographer'

// Fallback cuando no hay fotógrafo vinculado en la sesión (modo demo).
const DEMO_PHOTOGRAPHER_ID = 'ph-1'

export function PhotographerProvider({ children }: { children: React.ReactNode }) {
  const admin = useAdmin()
  const { user } = useAuth()
  const photographerId = user?.photographerId ?? DEMO_PHOTOGRAPHER_ID

  const value = useMemo(() => {
    const photographer = admin.photographers.find((p) => p.id === photographerId)
    const photographerName = photographer?.name ?? user?.name ?? 'Fotógrafo'
    const eventIds = new Set(photographer?.eventIds ?? [])
    const events = admin.events.filter((e) => eventIds.has(e.id))
    const photos = admin.photos.filter((p) => p.photographerId === photographerId)
    const sales = admin.sales.filter((s) => s.photographerId === photographerId)
    const totalEarnings = sales.reduce((sum, s) => sum + s.photographerEarnings, 0)

    return {
      photographerId,
      photographerName,
      events,
      photos,
      sales,
      totalEarnings,
      totalPhotos: photos.length,
      totalSales: sales.length,
      uploadPhotos: (eventId: string, count: number) => {
        const event = admin.events.find((e) => e.id === eventId)
        if (!event) return
        const newPhotos: Omit<Photo, 'id'>[] = Array.from({ length: count }).map((_, i) => ({
          eventId,
          photographerId,
          url: `https://picsum.photos/seed/${Date.now()}-${i}/800/600`,
          price: event.basePrice ?? 19.99,
          status: 'published',
          createdAt: new Date().toISOString(),
        }))
        admin.addPhotos(newPhotos)
      },
    }
  }, [admin, photographerId, user?.name])

  return <PhotographerContext.Provider value={value}>{children}</PhotographerContext.Provider>
}
