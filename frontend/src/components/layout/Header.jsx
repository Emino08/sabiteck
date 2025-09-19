import React, { useState } from 'react'
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { useRouteSettings } from '../../contexts/RouteSettingsContext'
import SabiteckLogo from '../../assets/icons/Sabitek Logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const { isRouteEnabled, loading: routeLoading } = useRouteSettings()

  // Define all possible navigation routes with their display names
  const allNavigationRoutes = [
    { name: 'Home', href: '/', routeName: 'home' },
    { name: 'About', href: '/about', routeName: 'about' },
    { name: 'Services', href: '/services', routeName: 'services' },
    { name: 'Portfolio', href: '/portfolio', routeName: 'portfolio' },
    { name: 'Team', href: '/team', routeName: 'team' },
    { name: 'Jobs', href: '/jobs', routeName: 'jobs' },
    { name: 'Blog', href: '/blog', routeName: 'blog' },
    { name: 'News', href: '/news', routeName: 'news' },
    { name: 'Tools', href: '/tools', routeName: 'tools' },
    { name: 'Scholarships', href: '/scholarships', routeName: 'scholarships' },
    { name: 'Contact', href: '/contact', routeName: 'contact' },
  ]

  // Filter navigation to only show active routes (enabled by admin)
  const navigation = allNavigationRoutes.filter(route => {
    // Always show home page
    if (route.routeName === 'home') return true
    // Show route only if it's enabled by admin
    return isRouteEnabled(route.routeName)
  })

  return (
    <header className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 animate-fade-in" role="banner">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center animate-slide-in-left">
            <Link to="/" className="flex items-center hover-scale transition-smooth group">
              <img 
                src={SabiteckLogo} 
                alt="Sabiteck Limited - Premier Technology Solutions in Sierra Leone" 
                className="h-10 w-auto transition-smooth group-hover:scale-105" 
                loading="eager"
                width="40"
                height="40"
              />
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-smooth">Sabiteck</span>
            </Link>
          </div>
          
          <div className="hidden md:block animate-slide-up animate-delay-200">
            <div className="ml-10 flex items-baseline space-x-4">
              {!routeLoading && navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth hover-lift relative ${
                    location.pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  {item.name}
                  {location.pathname === item.href && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-scale-in"></div>
                  )}
                </Link>
              ))}
              {routeLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                  <span className="text-sm">Loading navigation...</span>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block animate-slide-in-right animate-delay-400">
            {isAuthenticated() ? (
              <div className="flex items-center space-x-4">
                {isAdmin() && (
                  <Link to="/admin" className="text-sm text-gray-700 hover:text-blue-600">
                    Admin
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <User className="w-4 h-4" />
                    <span>{user?.first_name || user?.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-900 border-b">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/register">
                  <Button className="btn-animate hover-glow">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden animate-slide-in-right animate-delay-300">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover-scale transition-smooth"
            >
              {isMenuOpen ? 
                <X className="h-6 w-6 animate-scale-in" /> : 
                <Menu className="h-6 w-6 animate-scale-in" />
              }
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {!routeLoading && navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-smooth hover-lift animate-slide-in-left ${
                    location.pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {routeLoading && (
                <div className="flex items-center justify-center space-x-2 text-gray-500 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                  <span className="text-sm">Loading navigation...</span>
                </div>
              )}
              <div className="pt-4 animate-slide-up animate-delay-600">
                {isAuthenticated() ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-900 px-3 py-2 border-b">
                      Welcome, {user?.first_name || user?.username}
                    </div>
                    {isAdmin() && (
                      <Link to="/admin" className="block text-sm text-gray-700 hover:text-blue-600 px-3 py-2">
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left text-sm text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full btn-animate hover-glow">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
