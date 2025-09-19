import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BarChart3, Users, Eye, Globe, Monitor, Smartphone, Download, FileText, Settings, Activity } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import { secureLog } from '../../utils/security'

const AnalyticsManager = () => {
  const [analyticsData, setAnalyticsData] = useState({
    stats: {},
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
  const [period, setPeriod] = useState('30d')
  const [activeView, setActiveView] = useState('overview')

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
    try {
      const [statsRes, pagesRes, referrersRes, devicesRes, geoRes] = await Promise.all([
        apiRequest(`/api/admin/analytics/dashboard?period=${period}`),
        apiRequest(`/api/admin/analytics/pages?period=${period}&limit=10`),
        apiRequest(`/api/admin/analytics/referrers?period=${period}&limit=10`),
        apiRequest(`/api/admin/analytics/devices?period=${period}`),
        apiRequest(`/api/admin/analytics/geography?period=${period}&limit=10`)
      ])

      setAnalyticsData({
        stats: statsRes?.data?.stats || {},
        popularPages: pagesRes?.data?.pages || [],
        referrers: referrersRes?.data?.referrers || [],
        devices: devicesRes?.data?.devices || [],
        geography: geoRes?.data?.geography || []
      })
    } catch (error) {
      secureLog('error', 'Failed to load analytics data', { error: error.message })
      toast.error('Failed to load analytics data')
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token')}`
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
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  const formatDuration = (seconds) => {
    if (seconds < 60) return Math.round(seconds) + 's'
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.round(seconds % 60) + 's'
    return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm'
  }

  const formatPercentage = (value) => {
    return Math.round(value || 0) + '%'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">Loading analytics data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex rounded-lg border">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 text-sm ${
                  period === p.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                } ${p.value === periods[0].value ? 'rounded-l-lg' : ''} ${
                  p.value === periods[periods.length - 1].value ? 'rounded-r-lg' : ''
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.stats.unique_visitors)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.stats.page_views)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">{formatPercentage(analyticsData.stats.bounce_rate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData.stats.active_users)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages & Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.popularPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.page_path}</p>
                        <p className="text-xs text-muted-foreground truncate">{page.page_title}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatNumber(page.page_views)} views</span>
                        <span>{formatNumber(page.unique_visitors)} visitors</span>
                      </div>
                    </div>
                  ))}
                  {analyticsData.popularPages.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No page data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.referrers.slice(0, 5).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {referrer.referrer_domain || 'Direct'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {referrer.referrer_type}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(referrer.sessions)} sessions
                      </div>
                    </div>
                  ))}
                  {analyticsData.referrers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No referrer data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
{analyticsData.realtimeData?.active_pages?.slice(0, 10).map((page, index) => (
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
  )
}

export default AnalyticsManager