import type { Photo } from '../types'
import { getMockPhotosByEvent } from '../mocks'
import { API_URL, authHeaders, sleep, USE_MOCKS } from './client'

/**
 * Error con código del backend del vision-service. El frontend usa el código
 * para mostrar mensajes específicos al usuario (NO_FACE_DETECTED, etc.).
 */
export class FaceSearchError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'FaceSearchError'
    this.code = code
  }
}

export async function searchPhotosByFace(
  eventId: string,
  selfie: File | Blob,
): Promise<Photo[]> {
  if (USE_MOCKS) {
    await sleep(2000)
    // En mock simulamos los errores del vision-service ocasionalmente, así
    // la UX que ya está construida para esos códigos se puede validar.
    const roll = Math.random()
    if (roll < 0.12) {
      throw new FaceSearchError(
        'NO_FACE_DETECTED',
        'No detectamos tu rostro en la selfie.',
      )
    }
    if (roll < 0.18) {
      throw new FaceSearchError(
        'MULTIPLE_FACES_DETECTED',
        'Detectamos más de un rostro en la selfie.',
      )
    }
    return getMockPhotosByEvent(eventId).filter((_, i) => i % 2 === 0)
  }
  const formData = new FormData()
  formData.append('selfie', selfie, 'selfie.jpg')
  const res = await fetch(`${API_URL}/events/${eventId}/face-search`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) throw new Error('Face search failed')
  return res.json()
}
