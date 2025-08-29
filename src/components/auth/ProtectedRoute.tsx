import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useRole } from '../../lib/useRole';

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Ładowanie…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace state={{ from: location }} />;
  }

  const atAdmin = location.pathname.startsWith('/admin');
  const atApp = location.pathname.startsWith('/app');

  if (atAdmin && role !== 'admin') return <Navigate to="/app" replace />;
  if (atApp && role === 'admin') return <Navigate to="/admin" replace />;

  return <Outlet />;
}