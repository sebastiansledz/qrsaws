import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

export default function AdminGuard() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth/signin" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <Outlet />;
}