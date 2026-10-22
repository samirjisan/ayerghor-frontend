import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

/** Login / register pages are only for guests. Logged-in users are sent to their dashboard. */
export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to={user.role === 'super_admin' ? '/admin' : '/account'} replace />;

  return <Outlet />;
}
