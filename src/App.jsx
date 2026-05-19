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
import Footer from './components/Footer'
import './App.css'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

function AppContent() {
  const { pathname } = useLocation()
  const isAuthPage = AUTH_PATHS.includes(pathname)

  return (
    <div className="app">
      <ScrollToTop />
      {!isAuthPage && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how" element={<HowItWorksPage />} />
        <Route path="/tiers" element={<TiersPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
