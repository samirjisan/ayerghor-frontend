import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from '../components/layout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import CustomerAccountPage from '../features/customer/pages/CustomerAccountPage';
import CartPage from '../features/cart/pages/CartPage';
import AdminProductsPage from '../features/admin/pages/AdminProductsPage';
import AdminCommercePage from '../features/admin/pages/AdminCommercePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />

        {/* only for guests */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/cart" element={<CartPage />} />

        {/* buyers and resellers */}
        <Route element={<ProtectedRoute roles={['customer', 'reseller']} />}>
          <Route path="/account" element={<CustomerAccountPage />} />
        </Route>

        {/* super admin only */}
        <Route element={<ProtectedRoute roles={['super_admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/coupons" element={<AdminCommercePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
