import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import NavBar from './components/NavBar'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import TiersPage from './pages/TiersPage'
import FeaturesPage from './pages/FeaturesPage'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AccountPage from './pages/AccountPage'
import GuestRoute from './components/auth/GuestRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Footer from './components/Footer'
import Toaster from './components/Toaster'
import './App.css'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

function AppContent() {
  const { pathname } = useLocation()
  const isAuthPage = AUTH_PATHS.includes(pathname)

  return (
    <div className="app">
      <Toaster />
      <ScrollToTop />
      {!isAuthPage && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how" element={<HowItWorksPage />} />
        <Route path="/tiers" element={<TiersPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute roles={['customer']}>
              <AccountPage />
            </ProtectedRoute>
          }
        />
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
      {!isAuthPage && <Footer />}
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
