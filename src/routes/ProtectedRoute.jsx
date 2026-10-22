import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * <ProtectedRoute roles={['super_admin']} />
 * - not logged in      -> /login
 * - wrong role         -> their own home
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) return <div className="container section">{t('pleaseWait')}</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'super_admin' ? '/admin' : '/account'} replace />;
  }

  return <Outlet />;
}
