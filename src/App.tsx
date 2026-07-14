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

import AdminBookingHistoryPage from './pages/admin/AdminBookingHistoryPage'
import AdminServiceManagementPage from './pages/admin/AdminServiceManagementPage'
import AdminStaffsPage from './pages/admin/AdminStaffsPage'
import AdminManagersPage from './pages/admin/AdminManagersPage'
import AdminTiersPage from './pages/admin/AdminTiersPage'
import InternalProfilePage from './pages/shared/InternalProfilePage'


// Boss
import BossLayout from './pages/boss/BossLayout'
import BossDashboard from './pages/boss/BossDashboard'
import BossAccountsPage from './pages/boss/BossAccountsPage'
import BossBranchesPage from './pages/boss/BossBranchesPage'
import BossPromotionsPage from './pages/boss/BossPromotionsPage'
import SharedCustomersPage from './pages/shared/SharedCustomersPage'

// Staff
import StaffLayout from './pages/staff/StaffLayout'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffPaymentsPage from './pages/staff/StaffPaymentsPage'
import StaffTransactionHistoryPage from './pages/staff/StaffTransactionHistoryPage'
import StaffLeaveRequestsPage from './pages/staff/StaffLeaveRequestsPage'
import StaffTechnicalLayout from './pages/staff/StaffTechnicalLayout'
import StaffTechnicalDashboard from './pages/staff/StaffTechnicalDashboard'
import StaffTechnicalBookingsPage from './pages/staff/StaffTechnicalBookingsPage'
import StaffTechnicalNotesPage from './pages/staff/StaffTechnicalNotesPage'
import StaffTechnicalHistoryPage from './pages/staff/StaffTechnicalHistoryPage'
import StaffSchedulePage from './pages/staff/StaffSchedulePage'
import StaffBookingListPage from './pages/staff/StaffBookingListPage'

import { useAuth } from './hooks/useAuth'
import './App.css'
import StaffWashingStatus from './pages/staff/StaffWashingStatus'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']
const ADMIN_PATHS_PREFIX = '/admin'
const BOSS_PATHS_PREFIX = '/boss'
const STAFF_PATHS_PREFIX = '/staff'

function StaffIndexRedirect() {
  const { user } = useAuth();
  if (user?.staff_type === 'technical') {
    return <Navigate to="/staff/technical/dashboard" replace />;
  }
  const isAdminOrBoss = user?.role === 'admin' || user?.role === 'boss';
  return <Navigate to={isAdminOrBoss ? "/staff/revenue" : "/staff/bookings"} replace />;
}

function AppContent() {
  const { pathname } = useLocation()
  const { isAuthenticated, user, loading } = useAuth()

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isAdminPage = pathname.startsWith(ADMIN_PATHS_PREFIX)
  const isBossPage = pathname.startsWith(BOSS_PATHS_PREFIX)
  const isStaffPage = pathname.startsWith(STAFF_PATHS_PREFIX)
  const isDashboardPage = isAdminPage || isBossPage || isStaffPage

  // Nếu là Admin nhưng đang ở trang ngoài (trang chủ, features, ...) -> đá về dashboard
  if (!loading && isAuthenticated && user?.role === 'admin' && !isAdminPage) {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Nếu là Boss nhưng đang ở trang ngoài -> đá về dashboard
  if (!loading && isAuthenticated && user?.role === 'boss' && !isBossPage) {
    return <Navigate to="/boss/dashboard" replace />
  }

  // Nếu là Staff, kiểm tra chéo vùng làm việc
  if (!loading && isAuthenticated && user?.role === 'staff') {
    const isManager = user?.staff_type === 'manager';
    const isTechnicalRoute = pathname.startsWith('/staff/technical');

    if (!isStaffPage) {
      if (isManager) return <Navigate to="/staff/bookings" replace />
      return <Navigate to="/staff/technical/bookings" replace />
    } else {
      // Đang ở trong /staff, kiểm tra không cho đi lạc chéo vùng
      if (!isManager && !isTechnicalRoute) {
        return <Navigate to="/staff/technical/bookings" replace />
      }
      if (isManager && isTechnicalRoute) {
        return <Navigate to="/staff" replace />
      }
    }
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
          <Route path="customers" element={<SharedCustomersPage />} />

          <Route path="booking-history" element={<AdminBookingHistoryPage />} />
          <Route path="managers" element={<AdminManagersPage />} />
          <Route path="staffs" element={<AdminStaffsPage />} />
          <Route path="services" element={<AdminServiceManagementPage />} />

          <Route path="tiers" element={<AdminTiersPage />} />
          <Route
            path="reports"
            element={<StaffTransactionHistoryPage />}
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
          <Route path="transaction-history" element={<StaffTransactionHistoryPage />} />
          <Route path="customers" element={<SharedCustomersPage />} />
          <Route
            path="accounts"
            element={<BossAccountsPage />}
          />
          <Route path="staffs" element={<AdminStaffsPage />} />
          <Route
            path="branches"
            element={<BossBranchesPage />}
          />
          <Route
            path="promotions"
            element={<BossPromotionsPage />}
          />
          <Route
            path="settings"
            element={<InternalProfilePage />}
          />
        </Route>

        {/* ── Staff protected ── */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['staff']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffIndexRedirect />} />
          <Route path="revenue" element={<AdminDashboard />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="customers" element={<SharedCustomersPage />} />

          <Route path="bookings" element={<StaffBookingListPage />} />
          <Route path="payments" element={<StaffPaymentsPage />} />
          <Route path="transaction-history" element={<StaffTransactionHistoryPage />} />
          <Route path="leave-requests" element={<StaffLeaveRequestsPage />} />
          <Route path="schedules" element={<StaffSchedulePage />} />
          <Route path="list" element={<AdminStaffsPage />} />
          <Route path="settings" element={<InternalProfilePage />} />
          <Route path="washing-status" element={<StaffWashingStatus />} />
        </Route>

        {/* ── Staff technical protected ── */}
        <Route
          path="/staff/technical"
          element={
            <ProtectedRoute roles={['staff']}>
              <StaffTechnicalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/technical/bookings" replace />} />
          <Route path="attendance" element={<StaffDashboard />} />
          <Route path="bookings" element={<StaffBookingListPage />} />
          <Route path="payments" element={<StaffPaymentsPage />} />
          <Route path="washing-status" element={<StaffWashingStatus />} />
          <Route path="notes" element={<StaffTechnicalNotesPage />} />
          <Route path="history" element={<StaffTechnicalHistoryPage />} />
          <Route path="leave-requests" element={<StaffLeaveRequestsPage />} />
          <Route path="schedules" element={<StaffSchedulePage />} />
          <Route path="settings" element={<InternalProfilePage />} />
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
