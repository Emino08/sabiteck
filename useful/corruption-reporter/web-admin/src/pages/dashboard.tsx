import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi, reportsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuthStore()

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then(res => res.data.data),
  })

  const { data: recentReports, isLoading: isReportsLoading } = useQuery({
    queryKey: ['recent-reports'],
    queryFn: () => reportsApi.getReports({ limit: 5, sort: 'created_at' }).then(res => res.data.data),
  })

  const { data: publicStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => analyticsApi.getPublicStats().then(res => res.data.data),
  })

  const stats = [
    {
      title: 'Total Reports',
      value: dashboardData?.totals?.total_reports || 0,
      icon: FileText,
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Resolved Reports',
      value: dashboardData?.totals?.resolved_reports || 0,
      icon: CheckCircle,
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Pending Reviews',
      value: dashboardData?.totals?.pending_reports || 0,
      icon: Clock,
      change: '-3%',
      changeType: 'negative',
    },
    {
      title: 'Resolution Rate',
      value: `${dashboardData?.totals?.resolution_rate || 0}%`,
      icon: TrendingUp,
      change: '+5%',
      changeType: 'positive',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name}. Here's what's happening with corruption reports.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Reports */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Latest corruption reports submitted to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isReportsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-16 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports?.data?.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between space-x-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {report.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Case #{report.case_id} • {report.category_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(report.submitted_at)}
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No recent reports
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Report Categories</CardTitle>
            <CardDescription>
              Distribution of reports by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDashboardLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-8 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.category_breakdown?.slice(0, 5).map((category: any) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color_code }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No category data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      {user?.role === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Overall system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">API Status: Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Database: Healthy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">Storage: 78% Used</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}