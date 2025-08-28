import { Navigate } from 'react-router-dom'
import { useRole } from '../../lib/useRole'

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role, loading } = useRole()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (role !== 'admin') {
    return <Navigate to="/app" replace />
  }
  
  return <>{children}</>
}