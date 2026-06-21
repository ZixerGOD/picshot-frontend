import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../lib/types'

interface RequireAuthProps {
  children: React.ReactNode
  role?: UserRole
}

/** Protege rutas privadas: redirige a /login si no hay sesión o el rol no coincide. */
export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location, role }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" state={{ from: location, role, denied: true }} replace />
  }

  return <>{children}</>
}
