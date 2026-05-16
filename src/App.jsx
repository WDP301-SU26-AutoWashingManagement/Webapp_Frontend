import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import TiersPage from './pages/TiersPage'
import FeaturesPage from './pages/FeaturesPage'
import Footer from './components/Footer'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how" element={<HowItWorksPage />} />
        <Route path="/tiers" element={<TiersPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
    </div>
  )
}
