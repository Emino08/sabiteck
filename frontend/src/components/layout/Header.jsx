import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronDown, User, LogOut, Shield, Settings, Key, Eye } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { useRouteSettings } from '../../contexts/RouteSettingsContext'
import SabiteckLogo from '../../assets/icons/Sabitek Logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin, loading: authLoading } = useAuth()
  const { getAllRoutes, loading: routeLoading } = useRouteSettings()

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get only visible navigation routes from the database
  const navigation = getAllRoutes()
    .filter(route => route.is_visible) // Only show visible routes
    .sort((a, b) => a.display_order - b.display_order) // Sort by display order
    .map(route => ({
      name: route.display_name,
      href: route.route_name === 'home' ? '/' : `/${route.route_name}`,
      routeName: route.route_name,
      description: route.description
    }))

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-500 ease-out ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-elegant'
          : 'bg-white/90 backdrop-blur-sm border-b border-transparent'
      }`}
      role="banner"
    >
      {/* Premium background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white/50 to-blue-50/30 pointer-events-none"></div>

      <nav className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
        <div className="flex items-center py-3 lg:py-4">

          {/* Elite Logo Section */}
          <div className="flex items-center animate-slide-in-left">
            <Link to="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-[1.02]">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <img
                  src={SabiteckLogo}
                  alt="Sabiteck Limited - Premier Technology Solutions"
                  className="relative h-8 w-auto transition-all duration-300 group-hover:scale-110"
                  loading="eager"
                  width="32"
                  height="32"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-blue-800 transition-all duration-300">
                  Sabiteck
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Elite Solutions
                </p>
              </div>
            </Link>
          </div>

          {/* Professional Elite Navigation Menu */}
          <div className="hidden lg:flex flex-1 justify-center mx-3 animate-slide-up animate-delay-200">
            <nav className="relative" role="navigation" aria-label="Primary navigation">
              {/* Sophisticated backdrop with subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm"></div>

              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl"></div>

              <div className="relative flex items-center px-1.5 py-1">
                {!routeLoading && navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group relative inline-flex items-center px-3 py-1.5 mx-0.5 rounded-xl text-[11px] font-medium tracking-wide uppercase transition-all duration-300 ${
                      location.pathname === item.href
                        ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                    }`}
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <span className="relative z-10 font-semibold">{item.name}</span>

                    {/* Subtle hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-slate-50 to-purple-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Professional active indicator */}
                    {location.pathname === item.href && (
                      <>
                        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-scale-in"></div>
                        <div className="absolute inset-0 ring-1 ring-white/20 rounded-xl"></div>
                      </>
                    )}

                    {/* Micro-interaction dot */}
                    <div className="absolute top-1 right-1 w-1 h-1 bg-blue-400/0 group-hover:bg-blue-400/60 rounded-full transition-all duration-300"></div>
                  </Link>
                ))}

                {routeLoading && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 text-slate-500">
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border border-slate-300 border-t-slate-600"></div>
                    <span className="text-[10px] font-medium tracking-wide uppercase">Loading</span>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Elite User Authentication Section */}
          <div className="flex items-center space-x-3 animate-slide-in-right animate-delay-400 ml-auto">
            {authLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-slate-600">Loading...</span>
              </div>
            ) : isAuthenticated() ? (
              <div className="flex items-center space-x-3">
                {/* Admin Access Button */}
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="group flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden lg:block">Admin</span>
                  </Link>
                )}

                {/* Premium User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/50 hover:bg-white hover:border-slate-300/50 transition-all duration-300 hover:scale-105 shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.first_name || user?.username}
                      </p>
                      <p className="text-xs text-slate-500">Premium Member</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                  </button>

                  {/* Elite Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-premium border border-slate-200/50 py-2 z-50 animate-scale-in">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                        >
                          <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Profile Settings</span>
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                        >
                          <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Dashboard</span>
                        </Link>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Implement account details modal/page
                            navigate('/account-details');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors group"
                        >
                          <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Account Details</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Implement change password modal/page
                            navigate('/change-password');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group"
                        >
                          <Key className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Change Password</span>
                        </button>

                        <div className="border-t border-slate-100 my-2"></div>

                        <button
                          onClick={() => {
                            const redirectPath = logout();
                            setShowUserMenu(false);
                            navigate(redirectPath);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Sign In Button - Enhanced visibility */}
                <Link
                  to="/login"
                  className="hidden md:flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 hover:backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] border border-slate-200/50 hover:border-blue-200"
                >
                  Sign In
                </Link>

                {/* Premium Sign Up Button - Enhanced for large screens */}
                <Link to="/register" className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                  <button className="relative px-6 py-2.5 lg:px-8 lg:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm lg:text-base font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group-hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                    <span className="relative z-10 flex items-center space-x-2">
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Sign Up</span>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-white/90 group-hover:translate-x-1 transition-transform duration-200"></div>
                    </span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Elite Mobile Menu Button */}
          <div className="lg:hidden animate-slide-in-right animate-delay-300">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/50 hover:bg-white hover:border-slate-300/50 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-slate-700 animate-scale-in" />
                ) : (
                  <Menu className="h-5 w-5 text-slate-700 animate-scale-in" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Elite Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden animate-slide-up max-h-[calc(100vh-5rem)] overflow-y-auto mobile-menu-scrollbar scroll-smooth">
            <div className="relative mt-4 mx-4 mb-6 min-h-0">
              {/* Premium mobile menu background */}
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-3xl shadow-premium border border-slate-200/50"></div>

              <div className="relative p-6 space-y-6">
                {/* Professional Navigation Links */}
                <div className="space-y-1">
                  {!routeLoading && navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 animate-slide-in-left ${
                        location.pathname === item.href
                          ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25'
                          : 'text-slate-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="relative z-10 uppercase text-xs font-semibold">{item.name}</span>
                      {location.pathname === item.href && (
                        <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-scale-in"></div>
                      )}
                    </Link>
                  ))}
                  {routeLoading && (
                    <div className="flex items-center justify-center space-x-2 py-4 text-slate-500">
                      <div className="animate-spin rounded-full h-3 w-3 border border-slate-300 border-t-slate-700"></div>
                      <span className="text-xs font-medium tracking-wide uppercase">Loading</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200"></div>

                {/* User Authentication Section */}
                <div className="animate-slide-up animate-delay-600">
                  {authLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                      <span className="text-sm text-slate-600">Loading...</span>
                    </div>
                  ) : isAuthenticated() ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-sm text-slate-500">Premium Member</p>
                        </div>
                      </div>

                      {/* Admin Access */}
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold"
                        >
                          <Shield className="w-5 h-5" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      {/* Profile & Account Management Links */}
                      <div className="space-y-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors"
                        >
                          <User className="w-5 h-5" />
                          <span className="font-medium">Profile Settings</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors"
                        >
                          <Settings className="w-5 h-5" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/account-details');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-2xl transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                          <span className="font-medium">Account Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/change-password');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-2xl transition-colors"
                        >
                          <Key className="w-5 h-5" />
                          <span className="font-medium">Change Password</span>
                        </button>
                      </div>

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          const redirectPath = logout();
                          setIsMenuOpen(false);
                          navigate(redirectPath);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full text-center px-6 py-3 rounded-2xl border-2 border-slate-300 text-slate-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="group relative block w-full"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        <div className="relative text-center px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-0.5">
                          <span className="flex items-center justify-center space-x-2">
                            <span>Get Started</span>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-white/80 group-hover:translate-x-0.5 transition-transform duration-200"></div>
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
