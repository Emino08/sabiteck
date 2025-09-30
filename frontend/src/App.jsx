import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { HelmetProvider } from 'react-helmet-async'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './components/pages/Home'
import About from './components/pages/About'
import Services from './components/pages/Services'
import Portfolio from './components/pages/Portfolio'
import Team from './components/pages/Team'
import Blog from './components/pages/Blog'
import Tools from './components/pages/Tools'
import Contact from './components/pages/Contact'
import Admin from './components/pages/Admin'
import Announcements from './components/pages/Announcements'
import Scholarships from './components/pages/Scholarships'
import ScholarshipDetail from './components/pages/ScholarshipDetail'
import Jobs from './components/pages/Jobs'
import JobDetail from './components/pages/JobDetail'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import Dashboard from './components/pages/Dashboard'
import Profile from './components/pages/Profile'
import AccountDetails from './components/pages/AccountDetails'
import ChangePassword from './components/pages/ChangePassword'
import AdminRegister from './components/pages/AdminRegister'
import AuthCallback from './components/pages/AuthCallback'
import { AuthProvider } from './contexts/AuthContext'
import { RouteSettingsProvider } from './contexts/RouteSettingsContext'
import { ToastProvider } from './components/ui/toast'
import RouteGuard from './components/guards/RouteGuard'
import CookieConsent from './components/ui/CookieConsent'
import { preloadAnimationClasses, getOptimizedAnimationSettings } from './utils/animation-utils'
import './styles/globals.css'

function App() {
  useEffect(() => {
    // Initialize animation performance optimizations
    const settings = getOptimizedAnimationSettings()
    
    // Apply global animation settings based on user preferences and device capabilities
    if (settings.reduceMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s')
    }
    
    if (settings.disableComplexAnimations) {
      document.documentElement.style.setProperty('--complex-animations', 'none')
    }
    
    // Preload animation classes for better performance
    preloadAnimationClasses()
    
    // Set up performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Animation settings:', settings)
    }

    // Add global error handling for better UX
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      // You can integrate with your toast system here
    })

    // Performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0]
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart)
      })
    }
  }, [])

  return (
    <HelmetProvider>
      <AuthProvider>
        <RouteSettingsProvider>
          <ToastProvider>
            <Router>
              <div className="App min-h-screen flex flex-col bg-white">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={
                      <RouteGuard routeName="home">
                        <Home />
                      </RouteGuard>
                    } />
                    <Route path="/about" element={
                      <RouteGuard routeName="about">
                        <About />
                      </RouteGuard>
                    } />
                    <Route path="/services" element={
                      <RouteGuard routeName="services">
                        <Services />
                      </RouteGuard>
                    } />
                    <Route path="/portfolio" element={
                      <RouteGuard routeName="portfolio">
                        <Portfolio />
                      </RouteGuard>
                    } />
                    <Route path="/team" element={
                      <RouteGuard routeName="team">
                        <Team />
                      </RouteGuard>
                    } />
                    <Route path="/blog" element={
                      <RouteGuard routeName="blog">
                        <Blog />
                      </RouteGuard>
                    } />
                    <Route path="/news" element={
                      <RouteGuard routeName="news">
                        <Blog contentType="news" />
                      </RouteGuard>
                    } />
                    <Route path="/tools" element={
                      <RouteGuard routeName="tools">
                        <Tools />
                      </RouteGuard>
                    } />
                    <Route path="/contact" element={
                      <RouteGuard routeName="contact">
                        <Contact />
                      </RouteGuard>
                    } />
                    <Route path="/announcements" element={
                      <RouteGuard routeName="announcements">
                        <Announcements />
                      </RouteGuard>
                    } />
                    <Route path="/scholarships" element={
                      <RouteGuard routeName="scholarships">
                        <Scholarships />
                      </RouteGuard>
                    } />
                    <Route path="/scholarships/:slug" element={
                      <RouteGuard routeName="scholarships">
                        <ScholarshipDetail />
                      </RouteGuard>
                    } />
                    <Route path="/jobs" element={
                      <RouteGuard routeName="jobs">
                        <Jobs />
                      </RouteGuard>
                    } />
                    <Route path="/jobs/:slug" element={
                      <RouteGuard routeName="jobs">
                        <JobDetail />
                      </RouteGuard>
                    } />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin-register" element={<AdminRegister />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/account-details" element={<AccountDetails />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/admin" element={<Admin />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <CookieConsent />
              <Toaster
                position="top-right"
                expand={true}
                richColors={true}
                closeButton={true}
              />
            </Router>
          </ToastProvider>
        </RouteSettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App
