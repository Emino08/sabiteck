import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Users, Clock, CheckCircle, MapPin, Phone } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import StatsCard from '../components/Dashboard/StatsCard';
import EmergencyMap from '../components/Dashboard/EmergencyMap';
import ActiveCasesList from '../components/Dashboard/ActiveCasesList';
import RecentActivity from '../components/Dashboard/RecentActivity';

import { casesService } from '../services/casesService';
import { statsService } from '../services/statsService';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  activeCases: number;
  pendingCases: number;
  responseTime: number;
  availableResponders: number;
  todayCases: number;
  resolvedToday: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch dashboard statistics
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsService.getDashboardStats(),
    refetchInterval: refreshInterval,
  });

  // Fetch active emergency cases
  const { data: activeCases } = useQuery({
    queryKey: ['active-cases'],
    queryFn: () => casesService.getActiveCases(),
    refetchInterval: refreshInterval,
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => casesService.getRecentActivity(),
    refetchInterval: 10000, // 10 seconds
  });

  const isAdmin = user?.role && ['super_admin', 'agency_admin', 'station_admin'].includes(user.role);
  const isResponder = user?.role === 'responder';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Emergency Response Command Center
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
            System Online
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Cases"
          value={stats?.activeCases || 0}
          description="Currently in progress"
          icon={AlertTriangle}
          trend={{ value: 12, isPositive: false }}
          className="border-emergency-500"
        />

        <StatsCard
          title="Pending Response"
          value={stats?.pendingCases || 0}
          description="Awaiting assignment"
          icon={Clock}
          trend={{ value: 8, isPositive: false }}
          className="border-yellow-500"
        />

        <StatsCard
          title="Avg Response Time"
          value={`${Math.round((stats?.responseTime || 0) / 60)}m`}
          description="Last 24 hours"
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
          className="border-blue-500"
        />

        <StatsCard
          title="Available Responders"
          value={stats?.availableResponders || 0}
          description="Ready for dispatch"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
          className="border-green-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Emergency Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Live Emergency Map
              </CardTitle>
              <CardDescription>
                Real-time locations of active cases and available responders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmergencyMap cases={activeCases || []} />
            </CardContent>
          </Card>
        </div>

        {/* Active Cases List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-emergency-500" />
                  Active Cases
                </span>
                <Badge variant="secondary">
                  {activeCases?.length || 0}
                </Badge>
              </CardTitle>
              <CardDescription>
                Cases requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveCasesList
                cases={activeCases || []}
                userRole={user?.role}
                onCaseSelect={(caseId) => {
                  window.location.href = `/cases/${caseId}`;
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across all cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={recentActivity || []} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/users'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/agencies'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Agencies
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </>
            )}

            {isResponder && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/cases'}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  My Assigned Cases
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Emergency Hotline
                </Button>
              </>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = '/settings'}
            >
              <Users className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayCases || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.resolvedToday || 0} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Load</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Normal</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Last sync: {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}