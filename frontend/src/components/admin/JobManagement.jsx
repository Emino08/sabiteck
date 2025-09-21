import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    MapPin,
    Users,
    Briefcase,
    Clock,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Download,
    Upload,
    Settings,
    X,
    Building,
    DollarSign,
    UserCheck,
    Star,
    Crown,
    Sparkles,
    TrendingUp,
    Target,
    Zap,
    Shield,
    Award,
    Rocket,
    Diamond,
    Globe
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import JobEditor from './JobEditor';

const JobManagement = () => {
    // State management
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedJobs, setSelectedJobs] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);

    // Lookup data
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        draft: 0,
        closed: 0,
        featured: 0,
        expired: 0,
        total_applications: 0
    });

    // Load data on mount and when filters change
    useEffect(() => {
        loadJobs();
        loadCategories();
        loadStats();
    }, [currentPage, searchTerm, selectedStatus, selectedCategory]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sort: 'created_at:desc'
            });

            if (searchTerm) params.append('search', searchTerm);
            if (selectedStatus) params.append('status', selectedStatus);
            if (selectedCategory) params.append('category', selectedCategory);

            const response = await apiRequest(`/api/admin/jobs?${params.toString()}`);
            
            if (response.success) {
                setJobs(response.data.jobs || response.data || []);
                setTotalPages(response.data.pagination?.pages || 1);
                setTotalCount(response.data.pagination?.total || response.data.length || 0);
            } else {
                setError(response.message || 'Failed to load jobs');
            }
        } catch (err) {
            setError('Failed to load jobs');
            console.error('Error loading jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await apiRequest('/api/admin/jobs/categories');
            if (response.success) {
                setCategories(response.data || []);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiRequest('/api/admin/jobs/stats');
            if (response.success) {
                setStats(response.data.stats || response.data || {
                    total: 0,
                    active: 0,
                    draft: 0,
                    closed: 0,
                    applications: 0
                });
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status) => {
        setSelectedStatus(status === selectedStatus ? '' : status);
        setCurrentPage(1);
    };

    const handleCategoryFilter = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    };

    const handleSelectJob = (jobId) => {
        setSelectedJobs(prev => 
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedJobs(Array.isArray(jobs) ? jobs.map(j => j.id) : []);
        } else {
            setSelectedJobs([]);
        }
    };

    const handleDelete = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job? This will also delete all associated applications and cannot be undone.')) {
            return;
        }

        try {
            const response = await apiRequest(`/api/admin/jobs/${jobId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                loadJobs();
                loadStats();
            } else {
                setError(response.message || 'Failed to delete job');
            }
        } catch (err) {
            setError('Failed to delete job');
            console.error('Error deleting job:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'closed': return 'bg-red-100 text-red-800';
            case 'archived': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDeadline = (deadline) => {
        if (!deadline) return 'No deadline';
        const date = new Date(deadline);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays <= 7) return `${diffDays} days left`;
        
        return date.toLocaleDateString();
    };

    const getDeadlineStatus = (deadline) => {
        if (!deadline) return 'text-gray-500';
        const date = new Date(deadline);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-red-600';
        if (diffDays <= 7) return 'text-orange-600';
        if (diffDays <= 30) return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading && jobs.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <Briefcase className="w-16 h-16 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Job Management...</h2>
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-6 py-8 relative z-10 space-y-8">
                {/* Elite Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <Briefcase className="w-12 h-12 text-indigo-400" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                        Elite Job Management Studio
                    </h1>
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Professional Career Management Hub</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                        Orchestrate exceptional career opportunities and manage elite job listings with our premium management suite
                    </p>

                    {/* Elite Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button className="inline-flex items-center px-6 py-3 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105">
                            <Download className="w-5 h-5 mr-2" />
                            Export Elite Data
                        </button>

                        <button
                            onClick={() => {
                                setEditingJob(null);
                                setShowEditor(true);
                            }}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Elite Job
                        </button>
                    </div>
                </div>

                {/* Elite Stats Dashboard */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl mb-8">
                    <div className="flex items-center mb-8">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mr-4">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Elite Analytics Dashboard</h3>
                            <p className="text-gray-300">Real-time insights into your premium job ecosystem</p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-full text-xs font-black">
                                LIVE DATA
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                        <div
                            className={`bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border ${
                                selectedStatus === '' ? 'ring-2 ring-indigo-500 bg-indigo-500/20 border-indigo-400/50' : 'border-white/10 hover:border-white/20'
                            }`}
                            onClick={() => handleStatusFilter('')}
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl">
                                            <Briefcase className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Total Elite Jobs
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.total}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border ${
                                selectedStatus === 'active' ? 'ring-2 ring-green-500 bg-green-500/20 border-green-400/50' : 'border-white/10 hover:border-white/20'
                            }`}
                            onClick={() => handleStatusFilter('active')}
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                                            <div className="h-6 w-6 bg-green-100/20 rounded-full flex items-center justify-center">
                                                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Active Elite
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.active}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border ${
                                selectedStatus === 'draft' ? 'ring-2 ring-gray-400 bg-gray-500/20 border-gray-400/50' : 'border-white/10 hover:border-white/20'
                            }`}
                            onClick={() => handleStatusFilter('draft')}
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl">
                                            <Edit className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Elite Drafts
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.draft}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border ${
                                selectedStatus === 'closed' ? 'ring-2 ring-red-500 bg-red-500/20 border-red-400/50' : 'border-white/10 hover:border-white/20'
                            }`}
                            onClick={() => handleStatusFilter('closed')}
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Closed Elite
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.closed}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                                            <Star className="h-6 w-6 text-white fill-current animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Featured Elite
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.featured}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Expired
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.expired}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Elite Applications
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.total_applications}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Elite Search & Filter Hub */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl mb-8">
                    <div className="flex items-center mb-8">
                        <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mr-4">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Elite Search & Filter Console</h3>
                            <p className="text-gray-300">Advanced tools for precision job discovery</p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-black rounded-full text-xs font-black">
                                SEARCH ENGINE
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Elite Search */}
                        <div className="flex-1 max-w-lg">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Search className="h-5 w-5 text-cyan-400" />
                                    <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search elite opportunities..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="block w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 text-white placeholder-gray-400 text-lg transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Elite Filters */}
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <Target className="w-4 h-4 text-cyan-400" />
                                </div>
                                <select
                                    value={selectedCategory}
                                    onChange={handleCategoryFilter}
                                    className="pl-12 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300"
                                >
                                    <option value="">All Elite Categories</option>
                                    {Array.isArray(categories) ? categories.map((category, index) => (
                                        <option key={category?.id || category?.name || `category-${index}`} value={category?.name || ''}>
                                            ⭐ {category?.name || 'Unknown Category'}
                                        </option>
                                    )) : []}
                                </select>
                            </div>

                            <button className="inline-flex items-center px-6 py-3 bg-black/50 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105">
                                <Filter className="w-5 h-5 mr-2" />
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Elite Jobs Table */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-4">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Elite Job Portfolio</h3>
                                <p className="text-gray-300">Premium job listings management center</p>
                            </div>
                            <div className="ml-auto">
                                <span className="px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-black rounded-full text-xs font-black">
                                    PORTFOLIO
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-black/40 backdrop-blur-lg">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedJobs.length === jobs.length && jobs.length > 0}
                                            className="h-5 w-5 text-purple-500 focus:ring-purple-500 border-gray-400 rounded bg-black/50"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        🎯 Elite Job
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        🏢 Elite Company
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        📍 Prime Location
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        👥 Applications
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        ⏰ Deadline
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        🚀 Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        👁️ Views
                                    </th>
                                    <th className="relative px-6 py-4">
                                        <span className="sr-only">Elite Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black/20 backdrop-blur-lg divide-y divide-white/10">
                                {(() => {
                                    try {
                                        if (loading || !jobs || !Array.isArray(jobs)) {
                                            return (
                                                <tr>
                                                    <td colSpan="9" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full border border-indigo-400/30 backdrop-blur-lg mb-4">
                                                                <Briefcase className="w-12 h-12 text-indigo-400" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white mb-2">
                                                                {loading ? 'Loading Elite Jobs...' : 'No Elite Jobs Found'}
                                                            </h3>
                                                            <p className="text-gray-300">
                                                                {loading ? 'Searching premium opportunities...' : 'No jobs match your elite criteria'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (jobs.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="9" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="p-4 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-full border border-gray-400/30 backdrop-blur-lg mb-4">
                                                                <Briefcase className="w-12 h-12 text-gray-400" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-white mb-2">
                                                                No Elite Jobs Available
                                                            </h3>
                                                            <p className="text-gray-300">
                                                                Start building your premium job portfolio
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-white/5 transition-all duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedJobs.includes(job.id)}
                                                onChange={() => handleSelectJob(job.id)}
                                                className="h-5 w-5 text-purple-500 focus:ring-purple-500 border-gray-400 rounded bg-black/50"
                                            />
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    {job.company_logo ? (
                                                        <div className="relative">
                                                            <img
                                                                className="h-12 w-12 rounded-2xl object-cover border-2 border-purple-400/50"
                                                                src={job.company_logo}
                                                                alt={job.company_name}
                                                            />
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                                <Crown className="w-2 h-2 text-white" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-400/30 flex items-center justify-center">
                                                            <Building className="h-6 w-6 text-purple-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingJob(job);
                                                                setShowEditor(true);
                                                            }}
                                                            className="text-lg font-bold text-white hover:text-purple-300 line-clamp-1 transition-colors"
                                                        >
                                                            {job.title}
                                                        </button>
                                                        {job.featured && (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-lg">
                                                                <Star className="w-3 h-3 mr-1 fill-current animate-pulse" />
                                                                FEATURED
                                                            </span>
                                                        )}
                                                        {job.remote_work && (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-400/30 backdrop-blur-lg">
                                                                <Globe className="w-3 h-3 mr-1" />
                                                                REMOTE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-300 line-clamp-1 mb-2">
                                                        {job.short_description}
                                                    </p>
                                                    <div className="flex items-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-lg">
                                                            <Target className="w-3 h-3 mr-1" />
                                                            {job.category_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-white flex items-center">
                                                <Building className="w-4 h-4 mr-2 text-purple-400" />
                                                {job.company_name || 'Sabiteck Limited'}
                                            </div>
                                            <div className="text-xs text-purple-300 font-semibold mt-1">
                                                {job.job_type || job.type}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-semibold text-white">
                                                <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                                                <Globe className="w-3 h-3 mr-1 text-blue-400" />
                                                {job.location}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedJobForApplications(job)}
                                                className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-lg text-sm font-bold text-blue-300 hover:text-blue-200 transition-all duration-300 hover:scale-105"
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                {job.application_count || job.applications_count || 0}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-bold flex items-center ${getDeadlineStatus(job.application_deadline || job.deadline).replace('text-gray-500', 'text-gray-300').replace('text-red-600', 'text-red-400').replace('text-orange-600', 'text-orange-400').replace('text-yellow-600', 'text-yellow-400').replace('text-green-600', 'text-green-400')}`}>
                                                <Clock className="w-4 h-4 mr-2" />
                                                {formatDeadline(job.application_deadline || job.deadline)}
                                            </div>
                                            {(job.application_deadline || job.deadline) && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(job.application_deadline || job.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-2 text-xs font-bold rounded-xl border backdrop-blur-lg ${
                                                job.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                                job.status === 'draft' ? 'bg-gray-500/20 text-gray-300 border-gray-400/30' :
                                                job.status === 'closed' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                                'bg-gray-500/20 text-gray-300 border-gray-400/30'
                                            }`}>
                                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                                    job.status === 'active' ? 'bg-green-400 animate-pulse' :
                                                    job.status === 'draft' ? 'bg-gray-400' :
                                                    job.status === 'closed' ? 'bg-red-400' :
                                                    'bg-gray-400'
                                                }`}></div>
                                                {job.status.toUpperCase()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-lg text-purple-300 font-bold">
                                                <Eye className="w-4 h-4 mr-2" />
                                                {job.view_count || 0}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center space-x-3">
                                                <a
                                                    href={`/jobs/${job.slug}`}
                                                    target="_blank"
                                                    className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl text-blue-400 hover:text-blue-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="View Elite Page"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>

                                                <button
                                                    onClick={() => {
                                                        setEditingJob(job);
                                                        setShowEditor(true);
                                                    }}
                                                    className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl text-purple-400 hover:text-purple-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Edit Elite Job"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl text-red-400 hover:text-red-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Delete Elite Job"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                        ));
                                    } catch (error) {
                                        console.error('Jobs rendering error:', error);
                                        return (
                                            <tr>
                                                <td colSpan="9" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full border border-red-400/30 backdrop-blur-lg mb-4">
                                                            <X className="w-12 h-12 text-red-400" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-white mb-2">
                                                            Elite System Error
                                                        </h3>
                                                        <p className="text-gray-300">
                                                            Unable to load elite jobs. Please refresh the page.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Elite Empty State */}
                    {jobs.length === 0 && !loading && (
                        <div className="px-8 py-16 text-center">
                            <div className="relative inline-block mb-8">
                                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                                <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                    <Briefcase className="w-16 h-16 text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4">No Elite Jobs Found</h3>
                            <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
                                {searchTerm || selectedStatus || selectedCategory
                                    ? 'Refine your elite search criteria to discover premium opportunities.'
                                    : 'Begin your journey by creating your first elite job posting.'
                                }
                            </p>
                            {!searchTerm && !selectedStatus && !selectedCategory && (
                                <div className="mt-8">
                                    <button
                                        onClick={() => {
                                            setEditingJob(null);
                                            setShowEditor(true);
                                        }}
                                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create First Elite Job
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing{' '}
                                        <span className="font-medium">
                                            {((currentPage - 1) * 10) + 1}
                                        </span>{' '}
                                        to{' '}
                                        <span className="font-medium">
                                            {Math.min(currentPage * 10, totalCount)}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-medium">{totalCount}</span>{' '}
                                        results
                                    </p>
                                </div>
                                
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        currentPage === page
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

                {/* Elite Error Display */}
                {error && (
                    <div className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-500 rounded-2xl mr-4">
                                <X className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-red-300 mb-2">
                                    Elite System Alert
                                </h3>
                                <div className="text-red-200">
                                    {error}
                                </div>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-red-300" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Elite Loading Overlay */}
                {loading && jobs.length > 0 && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50">
                        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
                            <div className="relative inline-block mb-6">
                                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                                <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                    <Rocket className="w-12 h-12 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-white mb-4">Processing Elite Request...</h3>
                            <LoadingSpinner size="lg" />
                        </div>
                    </div>
                )}

                {/* Elite Job Editor Modal */}
                {showEditor && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg overflow-y-auto h-full w-full z-50">
                        <div className="relative min-h-screen flex items-center justify-center p-4">
                            <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto">
                                <JobEditor
                                    jobId={editingJob?.id}
                                    onSave={() => {
                                        setShowEditor(false);
                                        setEditingJob(null);
                                        loadJobs();
                                        loadStats();
                                    }}
                                    onCancel={() => {
                                        setShowEditor(false);
                                        setEditingJob(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default JobManagement;