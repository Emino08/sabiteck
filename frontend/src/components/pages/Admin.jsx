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
  const { user, token, loading: authLoading, isAuthenticated, isAdmin, logout, login } = useAuth();
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
