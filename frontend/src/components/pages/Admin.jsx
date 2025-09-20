import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  Briefcase,
  GraduationCap,
  Settings,
  BarChart3,
  Database,
  Globe,
  Users,
  Mail,
  Navigation,
  TrendingUp,
  FileText,
  User,
  Folder,
  Megaphone
} from 'lucide-react';
import ContentEditor from '../admin/ContentEditor';
import JobManagement from '../admin/JobManagement';
import ScholarshipManagement from '../admin/ScholarshipManagement';
import AnalyticsManager from '../admin/AnalyticsManager';
import NewsletterEditor from '../admin/NewsletterEditor';
import OrganizationManagement from '../admin/OrganizationManagement';
import RouteSettingsManager from '../admin/RouteSettingsManager';
import UserRoleManagement from '../admin/UserRoleManagement';
import ServicesManagement from '../admin/ServicesManagement';
import SettingsManager from '../admin/SettingsManager';
import TeamManagement from '../admin/TeamManagement';
import AboutManagement from '../admin/AboutManagement';
import PortfolioManagement from '../admin/PortfolioManagement';
import AnnouncementManagement from '../admin/AnnouncementManagement';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const Admin = () => {
  const { user, token, isAuthenticated, isAdmin, logout, login } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Login failed');
      }

      // Use the main AuthContext login function
      login(data.data.user, data.data.token);
      toast.success('Admin login successful!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const fetchDashboardData = async () => {
    try {
      const authHeaders = {
        'Authorization': `Bearer ${token || localStorage.getItem('auth_token')}`
      };

      const [servicesRes, jobsRes, scholarshipsRes, settingsRes, teamRes, portfolioRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/services`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/jobs`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/scholarships`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/settings`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/team`),
        fetch(`${API_BASE_URL}/api/portfolio`)
      ]);

      const [services, jobs, scholarships, settings, team, portfolio] = await Promise.all([
        servicesRes.json().catch(() => ({ total: 0, recent: [] })),
        jobsRes.json().catch(() => ({ total: 0, recent: [], applications: 0 })),
        scholarshipsRes.json().catch(() => ({ total: 0, recent: [], applications: 0 })),
        settingsRes.json().catch(() => ({ settings: {} })),
        teamRes.json().catch(() => ({ team: [] })),
        portfolioRes.json().catch(() => ({ portfolio: [] }))
      ]);

      setDashboardData({
        services: services.recent || [],
        jobs: jobs.recent || [],
        scholarships: scholarships.recent || [],
        settings: settings.settings || {},
        team: team.team || [],
        portfolio: portfolio.portfolio || [],
        stats: {
          totalServices: services.total || 0,
          totalJobs: jobs.total || 0,
          totalScholarships: scholarships.total || 0,
          activeJobs: jobs.total || 0,
          totalTeamMembers: team.team?.length || 0,
          totalProjects: portfolio.portfolio?.length || 0,
          totalJobApplications: jobs.applications || 0,
          totalScholarshipApplications: scholarships.applications || 0
        }
      });
    } catch (err) {
      toast.error('Failed to fetch dashboard data. Please refresh the page.');
    }
  };

  useEffect(() => {
    if (isAuthenticated() && isAdmin()) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Test Credentials:</p>
              <p className="text-xs text-blue-700">Username: <span className="font-mono">admin</span></p>
              <p className="text-xs text-blue-700">Password: <span className="font-mono">admin123</span></p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              {error && <div className="text-sm text-red-600">{error}</div>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalServices || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.activeJobs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scholarships</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalScholarships || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalTeamMembers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Folder className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalJobs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.services?.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-sm text-gray-600">{service.short_description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )) || <p className="text-gray-500">No services found</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.jobs?.slice(0, 5).map((job, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-gray-600">{job.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {job.status}
                  </span>
                </div>
              )) || <p className="text-gray-500">No jobs found</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, category: 'dashboard' },
    { id: 'content', label: 'Content', icon: Globe, category: 'content' },
    { id: 'services', label: 'Services', icon: Database, category: 'content' },
    { id: 'portfolio', label: 'Portfolio', icon: Folder, category: 'content' },
    { id: 'about', label: 'About', icon: FileText, category: 'content' },
    { id: 'team', label: 'Team', icon: User, category: 'content' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, category: 'content' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, category: 'management' },
    { id: 'scholarships', label: 'Scholarships', icon: GraduationCap, category: 'management' },
    { id: 'organizations', label: 'Organizations', icon: Database, category: 'management' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, category: 'tools' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, category: 'tools' },
    { id: 'roles', label: 'User Roles', icon: Users, category: 'system' },
    { id: 'routes', label: 'Navigation', icon: Navigation, category: 'system' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'system' }
  ];

  const tabCategories = {
    dashboard: { label: 'Dashboard', color: 'blue' },
    content: { label: 'Content Management', color: 'green' },
    management: { label: 'Program Management', color: 'purple' },
    tools: { label: 'Marketing Tools', color: 'orange' },
    system: { label: 'System Settings', color: 'gray' }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'content':
        return <ContentEditor />;
      case 'services':
        return <ServicesManagement />;
      case 'portfolio':
        return <PortfolioManagement />;
      case 'about':
        return <AboutManagement />;
      case 'team':
        return <TeamManagement />;
      case 'announcements':
        return <AnnouncementManagement />;
      case 'jobs':
        return <JobManagement />;
      case 'scholarships':
        return <ScholarshipManagement />;
      case 'organizations':
        return <OrganizationManagement />;
      case 'analytics':
        return <AnalyticsManager />;
      case 'newsletter':
        return <NewsletterEditor />;
      case 'roles':
        return <UserRoleManagement />;
      case 'routes':
        return <RouteSettingsManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gray-50 relative z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 pt-4 relative z-40">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="relative z-40 border-2 border-gray-300 hover:border-gray-400 bg-white px-6 py-2 rounded-lg shadow-sm"
          >
            Logout
          </Button>
        </div>

        {/* Improved Navigation Tabs with Categories */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 relative z-40">
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-4">
              {Object.entries(tabCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="min-w-0">
                  <h3 className={`text-xs font-semibold uppercase tracking-wide text-${category.color}-600 mb-2`}>
                    {category.label}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {tabs
                      .filter(tab => tab.category === categoryKey)
                      .map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                          </Button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Component */}
        <div className="bg-white rounded-lg shadow-sm border relative z-40">
          {renderActiveComponent()}
        </div>
      </div>
    </div>
  );
};

export default Admin;
