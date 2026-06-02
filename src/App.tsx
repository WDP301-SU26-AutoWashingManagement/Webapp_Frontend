import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import NavBar from './components/NavBar'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import TiersPage from './pages/TiersPage'
import FeaturesPage from './pages/FeaturesPage'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

import VehiclesPage from './pages/VehiclesPage'
import BookingsPage from './pages/BookingsPage'
import NewBookingPage from './pages/NewBookingPage'
import GuestRoute from './components/auth/GuestRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Footer from './components/Footer'
import Toaster from './components/Toaster'

// Admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminTiersPage from './pages/admin/AdminTiersPage'
import InternalProfilePage from './pages/shared/InternalProfilePage'
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage'

// Boss
import BossLayout from './pages/boss/BossLayout'
import BossDashboard from './pages/boss/BossDashboard'
import BossAccountsPage from './pages/boss/BossAccountsPage'
import BossBranchesPage from './pages/boss/BossBranchesPage'

import { useAuth } from './hooks/useAuth'
import './App.css'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']
const ADMIN_PATHS_PREFIX = '/admin'
const BOSS_PATHS_PREFIX = '/boss'

function AppContent() {
  const { pathname } = useLocation()
  const { isAuthenticated, user, loading } = useAuth()

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isAdminPage = pathname.startsWith(ADMIN_PATHS_PREFIX)
  const isBossPage = pathname.startsWith(BOSS_PATHS_PREFIX)
  const isDashboardPage = isAdminPage || isBossPage

  // Nếu là Admin nhưng đang ở trang ngoài (trang chủ, features, ...) -> đá về dashboard
  if (!loading && isAuthenticated && user?.role === 'admin' && !isAdminPage) {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Nếu là Boss nhưng đang ở trang ngoài -> đá về dashboard
  if (!loading && isAuthenticated && user?.role === 'boss' && !isBossPage) {
    return <Navigate to="/boss/dashboard" replace />
  }

  return (
    <div className="app">
      <Toaster />
      <ScrollToTop />
      {!isAuthPage && !isDashboardPage && <NavBar />}
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/how" element={<HowItWorksPage />} />
        <Route path="/tiers" element={<TiersPage />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* ── Customer protected ── */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['customer']}>
              <InternalProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute roles={['customer']}>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={['customer']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute roles={['customer']}>
              <NewBookingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<Navigate to="/profile" replace />} />

        {/* ── Admin protected ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route
            path="customers"
            element={<AdminPlaceholderPage title="Khách hàng" description="Quản lý tài khoản khách hàng" />}
          />
          <Route
            path="bookings"
            element={<AdminPlaceholderPage title="Đặt lịch" description="Quản lý lịch đặt rửa xe" />}
          />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="tiers" element={<AdminTiersPage />} />
          <Route
            path="reports"
            element={<AdminPlaceholderPage title="Báo cáo" description="Báo cáo doanh thu và thống kê" />}
          />
          <Route
            path="settings"
            element={<InternalProfilePage />}
          />
        </Route>

        {/* ── Boss protected ── */}
        <Route
          path="/boss"
          element={
            <ProtectedRoute roles={['boss']}>
              <BossLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/boss/dashboard" replace />} />
          <Route path="dashboard" element={<BossDashboard />} />
          <Route
            path="accounts"
            element={<BossAccountsPage />}
          />
          <Route
            path="branches"
            element={<BossBranchesPage />}
          />
          <Route
            path="settings"
            element={<InternalProfilePage />}
          />
        </Route>

        {/* ── Auth (guest only) ── */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
      {!isAuthPage && !isDashboardPage && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
