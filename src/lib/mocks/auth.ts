import type { AuthUser } from '../types'

// Comprador demo: en modo mock representa al usuario logueado que ve "Mis compras".
export const DEMO_BUYER_EMAIL = 'comprador@email.com'

// Credenciales de demo para el login en modo mock (el backend real usa POST /auth/login).
export const mockAuthUsers: (AuthUser & { password: string })[] = [
  {
    id: 'admin-1',
    name: 'Admin Picshot',
    firstName: 'Admin',
    lastName: 'Picshot',
    email: 'admin@picshot.com',
    role: 'admin',
    emailVerified: true,
    password: 'Admin123!',
  },
  {
    id: 'user-ph-1',
    name: 'Carlos Ruiz',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    email: 'fotografo@picshot.com',
    role: 'photographer',
    photographerId: 'ph-1',
    emailVerified: true,
    password: 'Foto1234',
  },
  {
    id: 'buyer-1',
    name: 'Comprador Demo',
    firstName: 'Comprador',
    lastName: 'Demo',
    email: DEMO_BUYER_EMAIL,
    role: 'customer',
    emailVerified: true,
    password: 'Demo1234',
  },
]
