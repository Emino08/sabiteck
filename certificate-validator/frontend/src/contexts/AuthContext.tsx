import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, authApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string, mfaCode?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, mfaCode?: string) => {
    try {
      const response = await authApi.login(email, password, mfaCode)

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data

        setToken(newToken)
        setUser(newUser)

        localStorage.setItem('auth_token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
      } else {
        throw new Error(response.data.error?.message || 'Login failed')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')

    // Call logout API (fire and forget)
    authApi.logout().catch(() => {
      // Ignore errors on logout
    })
  }

  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}