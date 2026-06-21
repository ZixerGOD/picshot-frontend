import type { DashboardStats } from '../types'
import { mockAnalytics } from './analytics'
import { mockCoupons } from './coupons'
import { mockEvents } from './events'
import { mockPhotographers } from './photographers'
import { mockSales } from './sales'

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
