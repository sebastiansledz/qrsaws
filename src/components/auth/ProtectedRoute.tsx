import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  if (atAdmin && !isAdmin) return <Navigate to="/app" replace />;
  if (atApp && isAdmin) return <Navigate to="/admin" replace />;

  return <Outlet />;
}