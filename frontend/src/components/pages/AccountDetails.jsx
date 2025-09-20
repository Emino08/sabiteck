import React, { useState } from 'react'
import { User, Mail, Calendar, Shield, Briefcase, MapPin, Phone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const AccountDetails = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

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

  if (!isAuthenticated() || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600">Please log in to view your account details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Details</h1>
          <p className="text-slate-600">View and manage your account information</p>
        </div>

        {/* Account Information Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">First Name</label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.first_name || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Last Name</label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.last_name || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Username</label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.username || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email Address
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.email || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.phone || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Account Role
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border">
                  <span className="text-slate-900">{user.role || 'User'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
            Account Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Member Since</h3>
              <p className="text-slate-600">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Profile Status</h3>
              <p className="text-green-600 font-medium">Active</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Security Level</h3>
              <p className="text-purple-600 font-medium">Standard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountDetails