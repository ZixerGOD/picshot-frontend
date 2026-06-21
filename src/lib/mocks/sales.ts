import type { Sale } from '../types'
import { PAYPHONE_FEE_RATIO } from '../types'
import { mockEvents } from './events'
import { mockPhotographers } from './photographers'
import { getMockPhotosByEvent } from './photos'

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
      const photographer =
        photographers.find((p) => p.id === photo.photographerId) ??
        photographers[0]
      const amount = photo.price
      const discount = Math.random() > 0.7 ? amount * 0.15 : 0
      const final = amount - discount
      const payphoneFee = +(final * PAYPHONE_FEE_RATIO).toFixed(2)
      const netAmount = +(final - payphoneFee).toFixed(2)
      const photographerEarnings = netAmount * (photographer.commissionRate / 100)
      const platformEarnings = netAmount - photographerEarnings
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
        payphoneFee,
        netAmount,
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
