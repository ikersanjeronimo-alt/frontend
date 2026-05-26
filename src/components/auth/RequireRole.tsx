import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'
import { PageState } from '../ui/PageState'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
  /** Adónde redirigir si el rol no encaja. Por defecto al home. */
  redirectTo?: string
}

export function RequireRole({ roles, children, redirectTo = '/' }: RequireRoleProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageState loading />
  }
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }
  return <>{children}</>
}
