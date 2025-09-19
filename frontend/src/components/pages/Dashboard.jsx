import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Briefcase, 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Building2,
    MapPin,
    Calendar,
    Eye,
    Trash2,
    RefreshCw,
    TrendingUp,
    BarChart3,
    User,
    Settings,
    Search,
    Filter,
    Users,
    Mail,
    MessageSquare,
    Globe
} from 'lucide-react';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { toast } from 'sonner';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isAdmin } = useAuth();

    // State management
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Load dashboard data on component mount
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadDashboardData();
    }, []);

    const loadDashboardData = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Check if user is admin and use admin dashboard, otherwise use user dashboard
            let response;
            if (isAdmin()) {
                response = await ApiService.getAdminDashboard(token);
            } else {
                // For regular users, we can still show some basic stats
                // You might want to create a separate user dashboard endpoint
                response = await ApiService.getAdminDashboard(token);
            }

            if (response.success) {
                setDashboardData(response.data);
            } else {
                throw new Error(response.error || 'Failed to load dashboard data');
            }
        } catch (err) {
            console.error('Dashboard error:', err);
            if (err.message.includes('401') || err.message.includes('token')) {
                navigate('/login');
                return;
            }
            setError(err.message || 'Failed to load dashboard data');
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    const handleRefresh = () => {
        loadDashboardData(true);
    };
    
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center pt-20">
                    <LoadingSpinner size="large" />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-20">
                    <ErrorMessage
                        message={error}
                        onRetry={() => loadDashboardData()}
                    />
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats || {};
    const recentContacts = dashboardData?.recent_contacts || [];
    const recentActivities = dashboardData?.recent_activities || [];
    const monthlyStats = dashboardData?.monthly_stats || [];
    const insights = dashboardData?.insights || [];
    const summary = dashboardData?.summary || {};
    const currentUser = dashboardData?.user || user;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Welcome back, {currentUser?.first_name || currentUser?.username || 'User'}!
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {isAdmin() ? 'Admin Dashboard - Manage your website' : 'User Dashboard - Track your activity'}
                            </p>
                            {dashboardData?.timestamp && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Last updated: {new Date(dashboardData.timestamp).toLocaleString()}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>

                            {isAdmin() && (
                                <Link
                                    to="/admin"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Admin Panel
                                </Link>
                            )}

                            <Link
                                to="/jobs"
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Browse Jobs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights Banner */}
            {insights.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-100">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center space-x-4 text-sm">
                            <span className="font-medium text-blue-900">Latest Activity:</span>
                            {insights.slice(0, 2).map((insight, index) => (
                                <span key={index} className="text-blue-700">
                                    {insight.message}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="container mx-auto px-4 py-8">
                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.contacts || 0}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">Contact inquiries received</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.jobs || 0}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Briefcase className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">Job postings available</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Published Content</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.total_content_pieces || 0}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">Articles, blogs, and pages</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Community Size</p>
                                <p className="text-3xl font-bold text-gray-900">{summary.community_size || 0}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-gray-500">Users and subscribers</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.subscribers || 0}</div>
                        <div className="text-sm text-gray-600">Subscribers</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.blog_posts || 0}</div>
                        <div className="text-sm text-gray-600">Blog Posts</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.portfolio_projects || 0}</div>
                        <div className="text-sm text-gray-600">Projects</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.services || 0}</div>
                        <div className="text-sm text-gray-600">Services</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.team_members || 0}</div>
                        <div className="text-sm text-gray-600">Team Members</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.scholarships || 0}</div>
                        <div className="text-sm text-gray-600">Scholarships</div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activities Feed */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                                <span className="text-sm text-gray-500">{recentActivities.length} activities</span>
                            </div>
                        </div>
                        <div className="p-6">
                            {recentActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivities.map((activity, index) => {
                                        const getActivityIcon = (type) => {
                                            switch (type) {
                                                case 'contact': return <MessageSquare className="w-4 h-4 text-blue-600" />;
                                                case 'subscriber': return <Mail className="w-4 h-4 text-green-600" />;
                                                case 'content': return <FileText className="w-4 h-4 text-purple-600" />;
                                                case 'blog': return <FileText className="w-4 h-4 text-indigo-600" />;
                                                case 'user': return <User className="w-4 h-4 text-orange-600" />;
                                                default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
                                            }
                                        };

                                        const getActivityColor = (type) => {
                                            switch (type) {
                                                case 'contact': return 'bg-blue-100';
                                                case 'subscriber': return 'bg-green-100';
                                                case 'content': return 'bg-purple-100';
                                                case 'blog': return 'bg-indigo-100';
                                                case 'user': return 'bg-orange-100';
                                                default: return 'bg-gray-100';
                                            }
                                        };

                                        return (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {activity.name || activity.email || 'Unknown'}
                                                        </p>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimeAgo(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {activity.message || `${activity.type} activity`}
                                                    </p>
                                                    {activity.email && activity.type === 'contact' && (
                                                        <p className="text-xs text-gray-500 truncate">{activity.email}</p>
                                                    )}
                                                    {activity.company && (
                                                        <p className="text-xs text-gray-500 truncate">{activity.company}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No recent activities</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions & Growth */}
                    <div className="space-y-6">
                        {/* Monthly Growth Chart */}
                        {monthlyStats.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">6-Month Growth</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {monthlyStats.map((month, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">{month.month}</span>
                                                <div className="flex space-x-4">
                                                    <span className="text-sm text-blue-600">{month.contacts} contacts</span>
                                                    <span className="text-sm text-green-600">{month.subscribers} subs</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <Link
                                        to="/jobs"
                                        className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <Briefcase className="w-6 h-6 text-blue-600 mr-3" />
                                        <div>
                                            <p className="font-medium text-gray-900">Browse Jobs</p>
                                            <p className="text-sm text-gray-600">{stats.jobs || 0} active postings</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/scholarships"
                                        className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                    >
                                        <FileText className="w-6 h-6 text-purple-600 mr-3" />
                                        <div>
                                            <p className="font-medium text-gray-900">Scholarships</p>
                                            <p className="text-sm text-gray-600">{stats.scholarships || 0} opportunities</p>
                                        </div>
                                    </Link>

                                    <Link
                                        to="/blog"
                                        className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                    >
                                        <FileText className="w-6 h-6 text-green-600 mr-3" />
                                        <div>
                                            <p className="font-medium text-gray-900">Latest Blog</p>
                                            <p className="text-sm text-gray-600">{stats.blog_posts || 0} published posts</p>
                                        </div>
                                    </Link>

                                    {isAdmin() && (
                                        <Link
                                            to="/admin"
                                            className="flex items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-6 h-6 text-red-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">Admin Panel</p>
                                                <p className="text-sm text-gray-600">Manage website settings</p>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

