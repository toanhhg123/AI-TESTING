import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import CartPage from '../pages/CartPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import OrderHistoryPage from '../pages/OrderHistoryPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import ProductListPage from '../pages/ProductListPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import OrderManagementPage from '../pages/admin/OrderManagementPage.jsx';
import ProductManagementPage from '../pages/admin/ProductManagementPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="orders" element={<OrderManagementPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
