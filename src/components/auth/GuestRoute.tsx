import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import AuthLoadingScreen from './AuthLoadingScreen'

interface GuestRouteProps {
  children: ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    const target = from ?? (user?.role === 'admin' ? '/admin/dashboard' : '/')
    return <Navigate to={target} replace />
  }

  return children
}
