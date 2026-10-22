import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AccountSidebar from './AccountSidebar';
import { useAuth } from '../../features/auth/hooks/useAuth';

/** Navbar + page + footer, used by every route. */
export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <div className={user ? 'signed-in-layout' : 'public-layout'}>
        {user && <AccountSidebar />}
        <div className="layout-main">
          <main>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
