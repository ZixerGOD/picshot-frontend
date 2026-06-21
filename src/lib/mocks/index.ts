/**
 * Barrel de mocks por dominio. Cada archivo es independiente; este
 * index re-exporta todo para mantener compatibilidad con los imports
 * actuales (`from '../lib/mocks'`).
 *
 * Al conectar el backend, los mocks dejan de leerse desde aquí y los
 * módulos de `lib/api/` toman el control.
 */
export { mockAdminUser } from './admin-user'
export { mockEvents, getMockEventById } from './events'
export { mockPhotographers } from './photographers'
export { mockCoupons } from './coupons'
export { getMockPhotosByEvent } from './photos'
export { generateMockSales, mockSales } from './sales'
export { DEMO_BUYER_EMAIL, mockAuthUsers } from './auth'
export { mockPurchases } from './purchases'
export { generateMockAnalytics, mockAnalytics } from './analytics'
export { getDashboardStats } from './stats'
export { generateId } from './utils'
