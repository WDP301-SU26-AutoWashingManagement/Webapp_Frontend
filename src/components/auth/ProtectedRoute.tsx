import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/auth'
import AuthLoadingScreen from './AuthLoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
  /** Mirrors backend `authorize(...roles)` — omit to allow any authenticated role. */
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0) {
    const role = user?.role ?? 'customer'
    if (!roles.includes(role as UserRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
