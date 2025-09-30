import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Users,
  Settings,
  Shield,
  Building2,
  Bell,
  Home,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['super_admin', 'institution_admin', 'investigator'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['super_admin', 'institution_admin', 'investigator'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'institution_admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'institution_admin'] },
  { name: 'Institutions', href: '/institutions', icon: Building2, roles: ['super_admin'] },
  { name: 'Audit Logs', href: '/audit', icon: Shield, roles: ['super_admin'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['super_admin', 'institution_admin', 'investigator'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'institution_admin'] },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const filteredNavigation = navigation.filter(item =>
    user?.role && item.roles.includes(user.role)
  )

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">
              Corruption Reporter
            </span>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-1 bg-gray-900 px-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role_name?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="mt-2 w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}