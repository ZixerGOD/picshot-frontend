import type { EventItem, Photo } from '../types'
import { getMockEventById, getMockPhotosByEvent, mockEvents } from '../mocks'
import { fetchJson, USE_MOCKS } from './client'

export async function getEvents(): Promise<EventItem[]> {
  if (USE_MOCKS) return mockEvents
  return fetchJson<EventItem[]>('/events')
}

export async function getEventById(id: string): Promise<EventItem | null> {
  if (USE_MOCKS) {
    const event = getMockEventById(id)
    return event ?? null
  }
  return fetchJson<EventItem | null>(`/events/${id}`)
}

export async function getEventPhotos(
  eventId: string,
  filters?: { bib?: string; filter?: string },
): Promise<Photo[]> {
  if (USE_MOCKS) {
    let photos = getMockPhotosByEvent(eventId)
    if (filters?.bib) {
      photos = photos.filter((p) => p.bib === filters.bib)
    }
    if (filters?.filter === 'face') {
      photos = photos.filter((_, i) => i % 2 === 0)
    }
    if (filters?.filter === 'favorites') {
      photos = photos.filter((p) => p.featured)
    }
    return photos
  }
  const query = new URLSearchParams()
  if (filters?.bib) query.set('bib', filters.bib)
  if (filters?.filter) query.set('filter', filters.filter)
  return fetchJson<Photo[]>(`/events/${eventId}/photos?${query.toString()}`)
}
