import type { Purchase } from '../types'
import { mockPurchases } from '../mocks'
import { fetchJson, sleep, USE_MOCKS } from './client'

export async function getMyPurchases(): Promise<Purchase[]> {
  if (USE_MOCKS) {
    await sleep(600)
    return mockPurchases
  }
  // El backend identifica al comprador por su sesión/token; aquí no se envía email.
  return fetchJson<Purchase[]>('/me/purchases')
}
