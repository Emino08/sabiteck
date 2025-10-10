import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const ChangePassword = () => {
  const { user, token, login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const validatePassword = useCallback((password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setPasswordRequirements(requirements)
    return Object.values(requirements).every(req => req)
  }, [])

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'newPassword') {
      validatePassword(value)
    }
  }, [validatePassword])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (!validatePassword(formData.newPassword)) {
      toast.error('Password does not meet requirements')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      // Use apiRequest helper to call the correct API endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
      
      const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          password_confirmation: formData.confirmPassword
        })
      })

      const data = await response.json()

      if (data.success || response.ok) {
        toast.success('Password changed successfully!')

        // Update user context to clear must_change_password flag
        if (user) {
          const updatedUser = { ...user, must_change_password: false };
          login(updatedUser, token);
        }

        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false
        })

        // Redirect to appropriate page after successful password change
        setTimeout(() => {
          // Check if user has dashboard access based on role or permissions
          const userRole = user?.role || user?.role_name;
          const hasDashboardRole = ['admin', 'super_admin', 'super-admin', 'Administrator', 'editor', 'moderator', 'hr_manager', 'Content Editor', 'HR Manager', 'Content Moderator'].includes(userRole);
          const hasDashboardPermission = user?.permissions?.some(p => 
            (typeof p === 'string' && p === 'dashboard.view') ||
            (typeof p === 'object' && p.name === 'dashboard.view')
          );
          
          if (hasDashboardRole || hasDashboardPermission) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [formData, validatePassword, user, token, login, navigate])

  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(prev => !prev)
  }, [])

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev)
  }, [])

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
  }, [])

  // Memoized validation to prevent re-renders
  const isPasswordValid = useMemo(() => {
    return validatePassword(formData.newPassword)
  }, [formData.newPassword, validatePassword])

  const passwordsMatch = useMemo(() => {
    return formData.newPassword === formData.confirmPassword
  }, [formData.newPassword, formData.confirmPassword])

  const PasswordRequirement = React.memo(({ met, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-slate-500'}`}>
      {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  ))

  // Handle authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600">Please log in to change your password.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Change Password</h1>
          <p className="text-slate-600">Update your password to keep your account secure</p>
        </div>

        {/* Change Password Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center mb-6">
            <Lock className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleCurrentPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleNewPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Password Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <PasswordRequirement met={passwordRequirements.length} text="At least 8 characters" />
                  <PasswordRequirement met={passwordRequirements.uppercase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordRequirements.lowercase} text="One lowercase letter" />
                  <PasswordRequirement met={passwordRequirements.number} text="One number" />
                  <PasswordRequirement met={passwordRequirements.special} text="One special character" />
                </div>
              </div>
            )}

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Changing Password...
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a unique password that you don't use for other accounts</li>
            <li>• Consider using a password manager to generate and store strong passwords</li>
            <li>• Change your password regularly and if you suspect it's been compromised</li>
            <li>• Never share your password with others or store it in unsecured locations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword