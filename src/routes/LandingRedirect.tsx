import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function LandingRedirect() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Ładowanie…</div>;
  if (!user) return <Navigate to="/auth/signin" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/app'} replace />;
}