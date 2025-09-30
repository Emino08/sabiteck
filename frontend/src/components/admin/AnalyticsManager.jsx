import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  BarChart3, Users, Eye, Globe, Monitor, Smartphone, Download, FileText, Settings, Activity,
  TrendingUp, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle2, Loader2,
  Calendar, ArrowUp, ArrowDown, Zap, Star, Target
} from 'lucide-react'
import { apiRequest } from '../../utils/api'
import { secureLog } from '../../utils/security'

const AnalyticsManager = () => {
  const [analyticsData, setAnalyticsData] = useState({
    stats: {
      unique_visitors: 0,
      sessions: 0,
      page_views: 0,
      avg_session_duration: 0,
      avg_pages_per_session: 0,
      bounce_rate: 0,
      active_users: 0,
      visitors: { total: 0, growth: 0 },
      pageviews: { total: 0, growth: 0 },
      bounce_rate: { rate: 0, growth: 0 },
      session_duration: { average: 0, growth: 0 }
    },
    popularPages: [],
    referrers: [],
    devices: [],
    geography: [],
    dailyStats: [],
    realtimeData: {
      total_active_users: 0,
      active_pages: []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [activeView, setActiveView] = useState('overview')
  const [connectionStatus, setConnectionStatus] = useState('checking') // checking, connected, error

  const periods = [
    { value: '1d', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ]

  const views = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'pages', name: 'Pages', icon: FileText },
    { id: 'traffic', name: 'Traffic Sources', icon: Globe },
    { id: 'devices', name: 'Devices', icon: Monitor },
    { id: 'realtime', name: 'Real-time', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  useEffect(() => {
    loadAnalyticsData()

    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      if (activeView === 'realtime') {
        loadRealtimeData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [period, activeView])

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus('checking')

    try {
      const [statsRes, pagesRes, referrersRes, devicesRes, geoRes] = await Promise.all([
        apiRequest(`/api/admin/analytics/dashboard?period=${period}`),
        apiRequest(`/api/admin/analytics/pages?period=${period}&limit=10`),
        apiRequest(`/api/admin/analytics/referrers?period=${period}&limit=10`),
        apiRequest(`/api/admin/analytics/devices?period=${period}`),
        apiRequest(`/api/admin/analytics/geography?period=${period}&limit=10`)
      ])

      setAnalyticsData({
        stats: statsRes || {},
        popularPages: pagesRes || [],
        referrers: referrersRes || [],
        devices: devicesRes || [],
        geography: geoRes || []
      })
      setConnectionStatus('connected')
      toast.success('📊 Analytics data loaded successfully!')
    } catch (error) {
      console.error('Analytics loading error:', error)
      setError(error.message || 'Failed to load analytics data')
      setConnectionStatus('error')
      secureLog('error', 'Failed to load analytics data', { error: error.message })

      // Set empty data state for fresh analytics
      setAnalyticsData({
        stats: {
          unique_visitors: 0,
          sessions: 0,
          page_views: 0,
          avg_session_duration: 0,
          avg_pages_per_session: 0,
          bounce_rate: 0,
          active_users: 0,
          visitors: { total: 0, growth: 0 },
          pageviews: { total: 0, growth: 0 },
          bounce_rate: { rate: 0, growth: 0 },
          session_duration: { average: 0, growth: 0 }
        },
        popularPages: [],
        referrers: [],
        devices: [],
        geography: [],
        realtimeData: {
          total_active_users: 0,
          active_pages: []
        }
      })

      toast.error(`❌ ${error.message || 'Failed to load analytics data'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadRealtimeData = async () => {
    try {
      const response = await apiRequest('/api/admin/analytics/realtime')
      setAnalyticsData(prev => ({
        ...prev,
        realtimeData: {
          total_active_users: response?.data?.total_active_users || 0,
          active_pages: response?.data?.active_pages || [],
          last_updated: response?.data?.last_updated || new Date().toISOString()
        }
      }))
    } catch (error) {
      secureLog('error', 'Failed to load realtime data', { error: error.message })
    }
  }

  const exportReport = async (format) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/export?format=${format}&period=${period}&type=overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-report-${period}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success(`Report exported as ${format.toUpperCase()}`)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      secureLog('error', 'Export failed', { error: error.message })
      toast.error('Failed to export report')
    }
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    const number = Number(num)
    if (!isFinite(number)) return '0'
    if (number >= 1000000) return (number / 1000000).toFixed(1) + 'M'
    if (number >= 1000) return (number / 1000).toFixed(1) + 'K'
    return Math.round(number).toString()
  }

  const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '0s'
    const duration = Number(seconds)
    if (!isFinite(duration) || duration < 0) return '0s'
    if (duration < 60) return Math.round(duration) + 's'
    if (duration < 3600) return Math.floor(duration / 60) + 'm ' + Math.round(duration % 60) + 's'
    return Math.floor(duration / 3600) + 'h ' + Math.floor((duration % 3600) / 60) + 'm'
  }

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0%'
    const percentage = Number(value)
    if (!isFinite(percentage)) return '0%'
    return Math.round(percentage) + '%'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h1>
                <p className="text-gray-600">Loading your business insights...</p>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Connecting...</span>
              </div>
            </div>
          </div>

          {/* Loading Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h1>
              <p className="text-gray-600">Track your website performance and user insights</p>
            </div>

            {/* Connection Status & Controls */}
            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus === 'connected' ? <CheckCircle2 className="w-4 h-4" /> :
                 connectionStatus === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                 <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-sm font-medium">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'error' ? 'Disconnected' :
                   'Connecting...'}
                </span>
              </div>

              {/* Period Selector */}
              <div className="flex bg-white rounded-xl shadow-md overflow-hidden">
                {periods.map((p, index) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                      period === p.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mr-2 inline" />
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAnalyticsData()}
                  className="bg-white shadow-md hover:shadow-lg transition-shadow"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportReport('csv')}
                  className="bg-white shadow-md hover:shadow-lg transition-shadow"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
          </Button>
        </div>
      </div>
    </div>
  </div>

      {/* Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {views.map((view) => {
          const Icon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {view.name}
            </button>
          )
        })}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Unique Visitors Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    (analyticsData.stats.visitors?.growth || 0) >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(analyticsData.stats.visitors?.growth || 0) >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(analyticsData.stats.visitors?.growth || 0)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Unique Visitors</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatNumber(analyticsData.stats.unique_visitors || analyticsData.stats.visitors?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    vs last {period === '1d' ? 'day' : period === '7d' ? 'week' : period === '30d' ? 'month' : 'quarter'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Page Views Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    (analyticsData.stats.pageviews?.growth || 0) >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(analyticsData.stats.pageviews?.growth || 0) >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(analyticsData.stats.pageviews?.growth || 0)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Page Views</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatNumber(analyticsData.stats.page_views || analyticsData.stats.pageviews?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.stats.avg_pages_per_session ?
                      formatNumber(analyticsData.stats.avg_pages_per_session) + ' avg per session' :
                      formatNumber((analyticsData.stats.page_views || analyticsData.stats.pageviews?.total || 0) / (analyticsData.stats.unique_visitors || analyticsData.stats.visitors?.total || 1)) + ' avg per visitor'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bounce Rate Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-3 rounded-xl shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    (analyticsData.stats.bounce_rate?.growth || 0) <= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(analyticsData.stats.bounce_rate?.growth || 0) <= 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                    {Math.abs(analyticsData.stats.bounce_rate?.growth || 0)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Bounce Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPercentage(analyticsData.stats.bounce_rate || analyticsData.stats.bounce_rate?.rate || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(analyticsData.stats.bounce_rate || analyticsData.stats.bounce_rate?.rate || 0) === 0 ? 'No data yet' :
                     (analyticsData.stats.bounce_rate || analyticsData.stats.bounce_rate?.rate || 0) < 40 ? 'Excellent engagement' :
                     (analyticsData.stats.bounce_rate || analyticsData.stats.bounce_rate?.rate || 0) < 60 ? 'Good engagement' : 'Needs improvement'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Session Duration Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                    (analyticsData.stats.session_duration?.growth || 0) >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {(analyticsData.stats.session_duration?.growth || 0) >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(analyticsData.stats.session_duration?.growth || 0)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Session Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatDuration(analyticsData.stats.avg_session_duration || analyticsData.stats.session_duration?.average || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(analyticsData.stats.avg_session_duration || analyticsData.stats.session_duration?.average || 0) === 0 ? 'No sessions yet' :
                     (analyticsData.stats.avg_session_duration || analyticsData.stats.session_duration?.average || 0) > 180 ? 'High engagement' :
                     (analyticsData.stats.avg_session_duration || analyticsData.stats.session_duration?.average || 0) > 60 ? 'Average engagement' : 'Low engagement'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Notice for Empty Analytics */}
        {(analyticsData.stats.unique_visitors === 0 && analyticsData.stats.page_views === 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Analytics Tracking Started</h3>
                <p className="text-blue-700 mb-3">
                  Your analytics system is now active and ready to collect visitor data. The dashboard will start showing
                  real-time insights as visitors interact with your website.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">What you'll see once data arrives:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Visitor counts and geographic distribution</li>
                    <li>• Device types (mobile, tablet, desktop)</li>
                    <li>• Popular pages and user behavior</li>
                    <li>• Traffic sources and referrers</li>
                    <li>• Real-time active users</li>
                    <li>• Session duration and engagement metrics</li>
                  </ul>
                </div>
                <div className="mt-4 flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Analytics tracking is active and GDPR compliant</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Analytics Metrics */}
        {(analyticsData.stats.unique_visitors > 0 || analyticsData.stats.page_views > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Sessions */}
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatNumber(analyticsData.stats.sessions || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.stats.sessions === 0 ? 'No sessions yet' : 'Total user sessions'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* New vs Returning */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Visitor Types</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {analyticsData.stats.unique_visitors > 0 ? 'Mixed' : '0'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.stats.unique_visitors === 0 ? 'No visitors yet' : 'New and returning visitors'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Engagement Score</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPercentage(analyticsData.stats.bounce_rate === 0 ? 0 : Math.max(0, 100 - (analyticsData.stats.bounce_rate || 0)))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.stats.bounce_rate === 0 ? 'No data yet' : 'User engagement level'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Top Pages & Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pages Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3 shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Top Performing Pages
                  <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {Array.isArray(analyticsData.popularPages) ? analyticsData.popularPages.length : 0} pages
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(Array.isArray(analyticsData.popularPages) ? analyticsData.popularPages : []).slice(0, 5).map((page, index) => (
                    <div key={index} className="group relative p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-100 transition-all duration-300 hover:shadow-md border border-gray-100">
                      {/* Ranking Badge */}
                      <div className="absolute -left-2 -top-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                      </div>

                      <div className="flex items-center justify-between ml-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                            {page.page || '/'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500 bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              {formatPercentage(page.bounce_rate || 0)} bounce
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(page.avg_session_duration || 120)} avg time
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <p className="font-bold text-blue-600">{formatNumber(page.views || 0)}</p>
                              <p className="text-xs text-gray-500">views</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-green-600">{formatNumber(page.unique_views || 0)}</p>
                              <p className="text-xs text-gray-500">unique</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(analyticsData.popularPages) || analyticsData.popularPages.length === 0) && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No page data available</p>
                      <p className="text-gray-400 text-sm">Data will appear as visitors browse your site</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg mr-3 shadow-md">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  Traffic Sources
                  <span className="ml-auto bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {Array.isArray(analyticsData.referrers) ? analyticsData.referrers.length : 0} sources
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(Array.isArray(analyticsData.referrers) ? analyticsData.referrers : []).slice(0, 5).map((referrer, index) => {
                    const getSourceIcon = (source) => {
                      if (source.includes('google')) return '🔍'
                      if (source.includes('facebook') || source.includes('fb')) return '📘'
                      if (source.includes('twitter') || source.includes('x.com')) return '🐦'
                      if (source.includes('linkedin')) return '💼'
                      if (source.includes('direct')) return '🔗'
                      if (source.includes('email')) return '✉️'
                      return '🌐'
                    }

                    return (
                      <div key={index} className="group relative p-4 rounded-xl bg-gradient-to-r from-gray-50 to-emerald-50 hover:from-emerald-50 hover:to-green-100 transition-all duration-300 hover:shadow-md border border-gray-100">
                        {/* Ranking Badge */}
                        <div className="absolute -left-2 -top-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">#{index + 1}</span>
                        </div>

                        <div className="flex items-center justify-between ml-4">
                          <div className="flex items-center flex-1 min-w-0">
                            <span className="text-2xl mr-3">{getSourceIcon(referrer.source || '')}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                                {referrer.source || 'Direct'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {referrer.percentage || 0}% share
                                </div>
                                {/* Progress Bar */}
                                <div className="flex-1 max-w-20">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(referrer.percentage || 0, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center ml-4">
                            <p className="font-bold text-emerald-600 text-lg">{formatNumber(referrer.visits || 0)}</p>
                            <p className="text-xs text-gray-500">visits</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {(!Array.isArray(analyticsData.referrers) || analyticsData.referrers.length === 0) && (
                    <div className="text-center py-12">
                      <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No traffic source data available</p>
                      <p className="text-gray-400 text-sm">Traffic sources will appear as visitors arrive</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pages View */}
      {activeView === 'pages' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Array.isArray(analyticsData.popularPages) ? analyticsData.popularPages : []).map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{page.page}</p>
                      <p className="text-xs text-muted-foreground">{formatPercentage(page.bounce_rate || 0)} bounce rate</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{formatNumber(page.views)}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatNumber(page.unique_views)}</p>
                        <p className="text-xs text-muted-foreground">Unique</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!Array.isArray(analyticsData.popularPages) || analyticsData.popularPages.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No page data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Traffic Sources View */}
      {activeView === 'traffic' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Array.isArray(analyticsData.referrers) ? analyticsData.referrers : []).map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{referrer.source}</p>
                      <p className="text-xs text-muted-foreground">{referrer.percentage}% of total traffic</p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatNumber(referrer.visits)} visits
                    </div>
                  </div>
                ))}
                {(!Array.isArray(analyticsData.referrers) || analyticsData.referrers.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No referrer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Devices View */}
      {activeView === 'devices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(analyticsData.devices) && analyticsData.devices.length > 0 ? (
              analyticsData.devices.map((device, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      {device.device_type === 'desktop' && <Monitor className="h-8 w-8 text-blue-600" />}
                      {device.device_type === 'mobile' && <Smartphone className="h-8 w-8 text-green-600" />}
                      {device.device_type === 'tablet' && <Monitor className="h-8 w-8 text-purple-600" />}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground capitalize">{device.device_type}</p>
                        <p className="text-2xl font-bold">{formatNumber(device.visitors || 0)}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(device.percentage || 0)}% of visits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3">
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No device data available yet</p>
                  <p className="text-gray-400 text-sm">Device statistics will appear as visitors browse your site</p>
                </div>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Array.isArray(analyticsData.geography) ? analyticsData.geography : []).map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="text-2xl mr-3">{country.country_code ? `${country.country_code}` : '🌍'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{country.country || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(country.percentage || 0)}% of visitors</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatNumber(country.visitors || 0)} visitors
                    </div>
                  </div>
                ))}
                {(!Array.isArray(analyticsData.geography) || analyticsData.geography.length === 0) && (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No geographic data available yet</p>
                    <p className="text-gray-400 text-sm">Visitor locations will appear as people visit your site</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time View */}
      {activeView === 'realtime' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Real-time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatNumber(analyticsData.realtimeData?.total_active_users || 0)}
                </div>
                <p className="text-muted-foreground">Active users right now</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
{(Array.isArray(analyticsData.realtimeData?.active_pages) ? analyticsData.realtimeData.active_pages : []).slice(0, 10).map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{page.page_url}</p>
                      <p className="text-xs text-muted-foreground">{page.country || 'Unknown'}</p>
                    </div>
                    <div className="text-sm font-medium">{page.count} active</div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-4">No active users</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings View */}
      {activeView === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Analytics settings can be configured through the database or API.
                Features include GDPR compliance, IP anonymization, and data retention policies.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Tracking Script</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Add this script to your website's &lt;head&gt; section:
                </p>
                <code className="block p-2 bg-background rounded text-sm">
                  &lt;script src="/frontend/analytics.js"&gt;&lt;/script&gt;
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}

export default AnalyticsManager