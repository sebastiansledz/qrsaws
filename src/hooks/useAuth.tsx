import { useSessionContext } from '../features/auth/SessionProvider';

export default function useAuth() {
  const { user, claims, loading } = useSessionContext();
  
  // TODO: Extract real role/admin status from claims
  const isAdmin = claims.role === 'admin';
  const profile = user ? {
    user_id: user.id,
    display_name: user.user_metadata?.display_name || null,
    email: user.email || null,
    is_admin: isAdmin,
  } : null;

  return { user, profile, isAdmin, loading };
}
