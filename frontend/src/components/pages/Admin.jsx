import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessibleTabs, hasPermission, PermissionWrapper } from '../../utils/permissionUtils';
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
  Megaphone,
  Building2,
  Eye,
  MousePointer,
  Clock,
  Shield,
  Wrench
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
import ToolsManagement from '../admin/ToolsManagement';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const Admin = () => {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, isAuthenticated, isAdmin, logout, login } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Tab definitions (moved before useMemo to ensure consistent hook order)
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      category: 'dashboard',
      permissions: ['view-dashboard'],
      modules: ['dashboard']
    },
    {
      id: 'content',
      label: 'Content',
      icon: Globe,
      category: 'content',
      permissions: ['view-content'],
      modules: ['content']
    },
    {
      id: 'services',
      label: 'Services',
      icon: Database,
      category: 'content',
      permissions: ['view-services'],
      modules: ['services']
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Folder,
      category: 'content',
      permissions: ['view-portfolio'],
      modules: ['portfolio']
    },
    {
      id: 'about',
      label: 'About',
      icon: FileText,
      category: 'content',
      permissions: ['view-content'],
      modules: ['content']
    },
    {
      id: 'team',
      label: 'Team',
      icon: User,
      category: 'content',
      permissions: ['view-team'],
      modules: ['team']
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      category: 'content',
      permissions: ['view-announcements'],
      modules: ['announcements']
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      category: 'management',
      permissions: ['view-jobs'],
      modules: ['jobs']
    },
    {
      id: 'scholarships',
      label: 'Scholarships',
      icon: GraduationCap,
      category: 'management',
      permissions: ['view-scholarships'],
      modules: ['scholarships']
    },
    {
      id: 'organizations',
      label: 'Organizations',
      icon: Database,
      category: 'management',
      permissions: ['view-organizations'],
      modules: ['organizations']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      category: 'tools',
      permissions: ['view-analytics'],
      modules: ['dashboard']
    },
    {
      id: 'newsletter',
      label: 'Newsletter',
      icon: Mail,
      category: 'tools',
      permissions: ['view-newsletter'],
      modules: ['newsletter']
    },
    {
      id: 'tools-management',
      label: 'Tools & Curriculum',
      icon: Settings,
      category: 'tools',
      permissions: ['view-tools'],
      modules: ['tools']
    },
    {
      id: 'roles',
      label: 'User Roles',
      icon: Users,
      category: 'system',
      permissions: ['view-users', 'manage-user-permissions'],
      modules: ['users']
    },
    {
      id: 'routes',
      label: 'Navigation',
      icon: Navigation,
      category: 'system',
      permissions: ['edit-settings'],
      modules: ['settings']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      category: 'system',
      permissions: ['view-settings'],
      modules: ['settings']
    }
  ];

  // Filter tabs based on user permissions (moved to top to ensure consistent hook order)
  const accessibleTabs = useMemo(() => {
    if (!user) return [];

    return tabs.filter(tab => {
      // If no permissions required, show the tab
      if (!tab.permissions && !tab.modules) return true;

      // Check permissions
      if (tab.permissions) {
        const hasRequiredPermission = tab.permissions.some(permission =>
          hasPermission(user, permission)
        );
        if (!hasRequiredPermission) return false;
      }

      // Check modules (if user has modules data)
      if (tab.modules && user.modules) {
        const hasRequiredModule = tab.modules.some(module =>
          user.modules.includes(module)
        );
        if (!hasRequiredModule) return false;
      }

      return true;
    });
  }, [user, tabs]);

  // Ensure active tab is accessible to the user (moved to top for consistent hook order)
  useEffect(() => {
    if (accessibleTabs && accessibleTabs.length > 0) {
      const isActiveTabAccessible = accessibleTabs.some(tab => tab.id === activeTab);
      if (!isActiveTabAccessible) {
        // Set to the first accessible tab
        setActiveTab(accessibleTabs[0].id);
      }
    }
  }, [accessibleTabs, activeTab]);

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

      const [
        servicesRes,
        jobsRes,
        scholarshipsRes,
        settingsRes,
        teamRes,
        portfolioRes,
        announcementsRes,
        organizationsRes,
        analyticsRes,
        toolsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/services`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/jobs`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/scholarships`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/settings`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/team`),
        fetch(`${API_BASE_URL}/api/portfolio`),
        fetch(`${API_BASE_URL}/api/admin/announcements`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/organizations`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/analytics/dashboard`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/admin/tools`, { headers: authHeaders })
      ]);

      const [
        services,
        jobs,
        scholarships,
        settings,
        team,
        portfolio,
        announcements,
        organizations,
        analytics,
        tools
      ] = await Promise.all([
        servicesRes.json().catch(() => ({ total: 0, recent: [] })),
        jobsRes.json().catch(() => ({ total: 0, recent: [], applications: 0 })),
        scholarshipsRes.json().catch(() => ({ total: 0, recent: [], applications: 0 })),
        settingsRes.json().catch(() => ({ settings: {} })),
        teamRes.json().catch(() => ({ team: [] })),
        portfolioRes.json().catch(() => ({ portfolio: [] })),
        announcementsRes.json().catch(() => ({ total: 0, recent: [] })),
        organizationsRes.json().catch(() => ({ total: 0, recent: [] })),
        analyticsRes.json().catch(() => ({
          unique_visitors: 0,
          page_views: 0,
          bounce_rate: { rate: 0, growth: 0 },
          visitors: { total: 0, growth: 0 },
          pageviews: { total: 0, growth: 0 }
        })),
        toolsRes.json().catch(() => ({ total: 0, recent: [] }))
      ]);

      setDashboardData({
        services: services.recent || [],
        jobs: jobs.recent || [],
        scholarships: scholarships.recent || [],
        announcements: announcements.recent || [],
        organizations: organizations.recent || [],
        tools: tools.recent || [],
        settings: settings.settings || {},
        team: team.team || [],
        portfolio: portfolio.portfolio || [],
        analytics: analytics || { unique_visitors: 0, page_views: 0, bounce_rate: { rate: 0, growth: 0 } },
        stats: {
          totalServices: Number(services.total) || 0,
          totalJobs: Number(jobs.total) || 0,
          totalScholarships: Number(scholarships.total) || 0,
          activeJobs: Number(jobs.total) || 0,
          totalTeamMembers: Number(team.team?.length) || 0,
          totalProjects: Number(portfolio.portfolio?.length) || 0,
          totalJobApplications: Number(jobs.applications) || 0,
          totalScholarshipApplications: Number(scholarships.applications) || 0,
          totalAnnouncements: Number(announcements.total || announcements.recent?.length) || 0,
          totalOrganizations: Number(organizations.total || organizations.recent?.length) || 0,
          totalTools: Number(tools.total || tools.recent?.length) || 0,
          uniqueVisitors: Number(typeof analytics?.unique_visitors === 'number' ? analytics.unique_visitors : (analytics?.visitors?.total || 0)),
          pageViews: Number(typeof analytics?.page_views === 'number' ? analytics.page_views : (analytics?.pageviews?.total || 0)),
          bounceRate: Number(typeof analytics?.bounce_rate === 'number' ? analytics.bounce_rate : (analytics?.bounce_rate?.rate || 0))
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

  // Redirect regular users to home page if they try to access admin
  useEffect(() => {
    if (!authLoading && isAuthenticated() && !isAdmin()) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col justify-center items-center pt-32 py-12 relative overflow-hidden">
        {/* Elite Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
              <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                <Settings className="w-12 h-12 text-indigo-400 animate-spin" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            Initializing Elite Portal...
          </h2>
          <div className="flex justify-center items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400 animate-bounce" />
            <span className="text-gray-300">Authenticating access credentials</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col justify-center pt-32 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Elite Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          {/* Elite Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                  <Settings className="w-12 h-12 text-indigo-400" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Elite Admin Portal
            </h2>
            <div className="flex justify-center items-center gap-2 mb-4">
              <User className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-yellow-400 font-semibold">Administrative Control Center</span>
              <User className="w-5 h-5 text-yellow-400 fill-current" />
            </div>
            <p className="text-gray-300 mb-6">
              Access your elite administrative dashboard with enterprise security
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:border-white/20">
            <form className="space-y-8" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-white mb-3">
                  Elite Administrator
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <User className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors duration-300" />
                    <Settings className="h-4 w-4 text-yellow-400 animate-pulse group-focus-within:animate-spin" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-500 hover:border-white/30 hover:bg-black/60 focus:scale-[1.02] focus:shadow-lg"
                    placeholder="Enter admin username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-white mb-3">
                  Elite Security Key
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Database className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors duration-300" />
                    <BarChart3 className="h-4 w-4 text-purple-400 animate-pulse group-focus-within:animate-bounce" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-500 hover:border-white/30 hover:bg-black/60 focus:scale-[1.02] focus:shadow-lg"
                    placeholder="Enter secure password"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm backdrop-blur-lg animate-shake transform transition-all duration-300">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating Access...
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5 mr-2" />
                      Access Elite Dashboard
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black/30 backdrop-blur-lg text-gray-300 rounded-lg">
                    🛡️ Administrative Access Only
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center">
                  <Database className="w-3 h-3 mr-1" />
                  Protected by enterprise-grade security protocols
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Core Content Stats */}
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
              <Folder className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Admin Stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Megaphone className="h-8 w-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Announcements</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalAnnouncements || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-cyan-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalOrganizations || 0}</p>
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
              <Wrench className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tools</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.totalTools || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.uniqueVisitors || 0}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.pageViews || 0}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold">{dashboardData?.stats?.bounceRate || 0}%</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.announcements?.slice(0, 5).map((announcement, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{announcement.title}</p>
                    <p className="text-sm text-gray-600">{announcement.content?.substring(0, 50)}...</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${announcement.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {announcement.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )) || <p className="text-gray-500">No announcements found</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.organizations?.slice(0, 5).map((org, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-gray-600">{org.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {org.status}
                  </span>
                </div>
              )) || <p className="text-gray-500">No organizations found</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.team?.slice(0, 5).map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${member.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )) || <p className="text-gray-500">No team members found</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.tools?.slice(0, 5).map((tool, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-gray-600">{tool.description?.substring(0, 50)}...</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${tool.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {tool.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )) || <p className="text-gray-500">No tools found</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );


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
      case 'tools-management':
        return <ToolsManagement />;
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
            {accessibleTabs && accessibleTabs.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {Object.entries(tabCategories).map(([categoryKey, category]) => {
                  const categoryTabs = accessibleTabs.filter(tab => tab.category === categoryKey);
                  if (categoryTabs.length === 0) return null;

                  return (
                    <div key={categoryKey} className="min-w-0">
                      <h3 className={`text-xs font-semibold uppercase tracking-wide text-${category.color}-600 mb-2`}>
                        {category.label}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {categoryTabs.map((tab) => {
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No accessible tabs available. Please contact your administrator.</p>
              </div>
            )}
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
