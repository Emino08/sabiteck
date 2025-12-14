import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { HelmetProvider } from 'react-helmet-async'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { AuthProvider } from './contexts/AuthContext'
import { RouteSettingsProvider } from './contexts/RouteSettingsContext'
import { ToastProvider } from './components/ui/toast'
import RouteGuard from './components/guards/RouteGuard'
import CookieConsent from './components/ui/CookieConsent'
import { preloadAnimationClasses, getOptimizedAnimationSettings } from './utils/animation-utils'
import './styles/globals.css'

const Home = lazy(() => import('./components/pages/Home'))
const About = lazy(() => import('./components/pages/About'))
const Services = lazy(() => import('./components/pages/Services'))
const Portfolio = lazy(() => import('./components/pages/Portfolio'))
const Team = lazy(() => import('./components/pages/Team'))
const Blog = lazy(() => import('./components/pages/Blog'))
const Tools = lazy(() => import('./components/pages/Tools'))
const Contact = lazy(() => import('./components/pages/Contact'))
const Admin = lazy(() => import('./components/pages/Admin'))
const Announcements = lazy(() => import('./components/pages/Announcements'))
const Scholarships = lazy(() => import('./components/pages/Scholarships'))
const ScholarshipDetail = lazy(() => import('./components/pages/ScholarshipDetail'))
const Jobs = lazy(() => import('./components/pages/Jobs'))
const JobDetail = lazy(() => import('./components/pages/JobDetail'))
const ContentDetail = lazy(() => import('./components/pages/ContentDetail'))
const Login = lazy(() => import('./components/pages/Login'))
const Register = lazy(() => import('./components/pages/Register'))
const Dashboard = lazy(() => import('./components/pages/Dashboard'))
const Profile = lazy(() => import('./components/pages/Profile'))
const AccountDetails = lazy(() => import('./components/pages/AccountDetails'))
const ChangePassword = lazy(() => import('./components/pages/ChangePassword'))
const AdminRegister = lazy(() => import('./components/pages/AdminRegister'))
const AuthCallback = lazy(() => import('./components/pages/AuthCallback'))
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'))
const AdminForgotPassword = lazy(() => import('./components/auth/AdminForgotPassword'))

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
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <div className="App min-h-screen flex flex-col bg-white">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading...</div>}>
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
                      <Route path="/blog/:slug" element={
                        <RouteGuard routeName="blog">
                          <ContentDetail contentType="blog" parentRoute="/blog" parentName="Blog" />
                        </RouteGuard>
                      } />
                      <Route path="/news/:slug" element={
                        <RouteGuard routeName="news">
                          <ContentDetail contentType="news" parentRoute="/news" parentName="News" />
                        </RouteGuard>
                      } />
                      <Route path="/portfolio/:slug" element={
                        <RouteGuard routeName="portfolio">
                          <ContentDetail contentType="portfolio" parentRoute="/portfolio" parentName="Portfolio" />
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
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/account-details" element={<AccountDetails />} />
                      <Route path="/change-password" element={<ChangePassword />} />
                      <Route path="/admin" element={<Admin />} />
                    </Routes>
                  </Suspense>
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
