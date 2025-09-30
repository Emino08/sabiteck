import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Shield, User, LogOut, Settings, Home, FileText, Users, Building2, Activity } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Verify', href: '/verify', icon: Shield },
  ]

  const authenticatedNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Credentials', href: '/credentials', icon: FileText },
    { name: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'institution_admin'] },
    { name: 'Institutions', href: '/institutions', icon: Building2, roles: ['super_admin'] },
    { name: 'Audit', href: '/audit', icon: Activity, roles: ['super_admin', 'institution_admin'] },
  ]

  const canAccess = (roles?: string[]) => {
    if (!roles || !user) return true
    return roles.includes(user.role)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <Shield className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Academic Credentials
                  </span>
                </Link>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {(isAuthenticated ? authenticatedNavigation : navigation)
                  .filter(item => canAccess(item.roles))
                  .map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          isActive
                            ? 'border-primary text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
              </div>
            </div>

            <div className="flex items-center">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                      {user.institution_name && (
                        <p className="text-xs text-muted-foreground">{user.institution_name}</p>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Academic Credentials
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-600 max-w-md">
                A secure, nationwide platform for verifying academic credentials.
                Built with privacy, security, and efficiency in mind.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Platform
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/verify" className="text-sm text-gray-600 hover:text-gray-900">
                    Verify Credentials
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    Integration Guide
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Support
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 text-center">
              © 2024 Academic Credentials Verification Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}