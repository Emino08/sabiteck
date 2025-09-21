import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    DollarSign,
    Award,
    Users,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Download,
    Upload,
    Settings,
    X,
    Star,
    Crown,
    Sparkles,
    TrendingUp,
    Target,
    Zap,
    Shield,
    Rocket,
    Diamond,
    Briefcase,
    CheckCircle2,
    Clock,
    Layers,
    GraduationCap,
    Building,
    Globe
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ScholarshipEditor from './ScholarshipEditor';

const ScholarshipManagement = () => {
    console.log('🚀 NEW ScholarshipManagement component loaded successfully!');
    // State management
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedScholarships, setSelectedScholarships] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingScholarship, setEditingScholarship] = useState(null);

    // Categories - ALWAYS ENSURE ARRAY
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        draft: 0,
        expired: 0,
        featured: 0
    });

    // Load data
    useEffect(() => {
        loadScholarships();
        loadCategories();
        loadStats();
    }, [currentPage, searchTerm, selectedStatus, selectedCategory]);

    const loadCategories = async () => {
        try {
            console.log('🚀 Loading categories...');
            setCategoriesLoading(true);

            const response = await apiRequest('/api/admin/scholarships/categories');
            console.log('📋 Categories API Response:', response);

            // Handle the exact backend response format
            if (response && response.success && response.data && Array.isArray(response.data)) {
                console.log('✅ Setting categories:', response.data);
                setCategories(response.data);
            } else {
                console.warn('⚠️ Invalid categories response, using empty array');
                setCategories([]);
            }
        } catch (err) {
            console.error('❌ Error loading categories:', err);
            setCategoriesError('Failed to load categories');
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const loadScholarships = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedStatus && { status: selectedStatus }),
                ...(selectedCategory && { category: selectedCategory })
            });

            const response = await apiRequest(`/api/admin/scholarships?${params}`);

            if (response.success) {
                setScholarships(Array.isArray(response.data) ? response.data : []);
                setTotalCount(response.total || 0);
                setTotalPages(Math.ceil((response.total || 0) / 10));
            }
        } catch (err) {
            setError('Failed to load scholarships');
            setScholarships([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiRequest('/api/admin/scholarships/stats');
            if (response.success && response.data) {
                setStats(response.data.stats || response.data || {
                    total: 0,
                    active: 0,
                    draft: 0,
                    expired: 0,
                    featured: 0
                });
            }
        } catch (err) {
            console.error('Error loading stats:', err);
            setStats({
                total: 0,
                active: 0,
                draft: 0,
                expired: 0,
                featured: 0
            });
        }
    };

    // Event handlers
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status) => {
        setSelectedStatus(selectedStatus === status ? '' : status);
        setCurrentPage(1);
    };

    const handleCategoryFilter = (e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    };

    // CRUD handlers
    const handleEditScholarship = (scholarship) => {
        setEditingScholarship(scholarship);
        setShowEditor(true);
    };

    const handleViewScholarship = (scholarship) => {
        // For now, we'll treat view the same as edit
        // You could implement a read-only view mode later
        setEditingScholarship(scholarship);
        setShowEditor(true);
    };

    const handleDeleteScholarship = async (scholarshipId) => {
        if (!confirm('Are you sure you want to delete this scholarship?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await apiRequest(`/api/admin/scholarships/${scholarshipId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.success) {
                // Show success message and reload scholarships
                loadScholarships();
                // You might want to add a toast notification here
            } else {
                alert('Failed to delete scholarship: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting scholarship:', error);
            alert('Failed to delete scholarship. Please try again.');
        }
    };

    // Safe categories render function with enhanced error handling
    const renderCategoriesOptions = () => {
        if (categoriesLoading) {
            return <option disabled>Loading categories...</option>;
        }

        if (categoriesError) {
            return <option disabled>Error loading categories</option>;
        }

        // Multiple safety checks to prevent the map error
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return <option disabled>No categories available</option>;
        }

        try {
            return categories.map((category) => (
                <option key={category?.id || category?._id || Math.random()} value={category?.id || category?._id || ''}>
                    ⭐ {category?.name || 'Unnamed Category'}
                </option>
            ));
        } catch (error) {
            console.error('Error rendering categories:', error);
            return <option disabled>Error rendering categories</option>;
        }
    };

    // Show elite loading state
    if (loading && scholarships.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <GraduationCap className="w-16 h-16 text-purple-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Scholarship Management...</h2>
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-6 py-8 relative z-10 space-y-8">
                {/* Elite Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <GraduationCap className="w-12 h-12 text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        Elite Scholarship Management Hub
                    </h1>
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Professional Academic Opportunity Center</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                        Orchestrate exceptional academic opportunities and manage elite scholarship programs with our premium management suite
                    </p>

                    {/* Elite Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button className="inline-flex items-center px-6 py-3 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105">
                            <Download className="w-5 h-5 mr-2" />
                            Export Elite Data
                        </button>

                        <button
                            onClick={() => setShowEditor(true)}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Elite Scholarship
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
                            <p className="text-gray-300">Real-time insights into your premium scholarship ecosystem</p>
                        </div>
                        <div className="ml-auto">
                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-full text-xs font-black">
                                LIVE DATA
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                                            <GraduationCap className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-bold text-gray-300 truncate">
                                                Total Elite Scholarships
                                            </dt>
                                            <dd className="text-2xl font-black text-white">
                                                {stats.total}
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
                                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                                            <Rocket className="h-6 w-6 text-white" />
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

                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
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

                        <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
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
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
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
                            <p className="text-gray-300">Advanced tools for precision scholarship discovery</p>
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
                                    placeholder="Search elite scholarships..."
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
                                    disabled={categoriesLoading}
                                    className="pl-12 pr-4 py-3 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300"
                                >
                                    <option value="">{categoriesLoading ? 'Loading elite categories...' : 'All Elite Categories'}</option>
                                    {renderCategoriesOptions()}
                                </select>
                            </div>

                            <button className="inline-flex items-center px-6 py-3 bg-black/50 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105">
                                <Filter className="w-5 h-5 mr-2" />
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Elite Scholarships Table */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-4">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Elite Scholarship Portfolio</h3>
                                <p className="text-gray-300">Premium academic opportunities management center</p>
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
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        🎓 Elite Scholarship
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        💰 Funding Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        ⏰ Application Deadline
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                        🚀 Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-purple-300 uppercase tracking-wider">
                                        ⚙️ Elite Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black/20 backdrop-blur-lg divide-y divide-white/10">
                                {Array.isArray(scholarships) && scholarships.length > 0 ? (
                                    scholarships.map((scholarship) => (
                                        <tr key={scholarship.id} className="hover:bg-white/5 transition-all duration-300">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-lg font-bold text-white flex items-center">
                                                    <GraduationCap className="w-5 h-5 mr-3 text-purple-400" />
                                                    <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                                                    {scholarship.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-lg font-bold text-white flex items-center">
                                                    <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                                                    {scholarship.amount}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-white flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                                                    {scholarship.deadline}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-2 text-xs font-bold rounded-xl border backdrop-blur-lg ${
                                                    scholarship.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                                    scholarship.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                                                    'bg-red-500/20 text-red-300 border-red-400/30'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        scholarship.status === 'active' ? 'bg-green-400 animate-pulse' :
                                                        scholarship.status === 'draft' ? 'bg-yellow-400' :
                                                        'bg-red-400'
                                                    }`}></div>
                                                    {scholarship.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => handleViewScholarship(scholarship)}
                                                        className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl text-blue-400 hover:text-blue-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                        title="View Elite Scholarship"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditScholarship(scholarship)}
                                                        className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl text-purple-400 hover:text-purple-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                        title="Edit Elite Scholarship"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteScholarship(scholarship.id)}
                                                        className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl text-red-400 hover:text-red-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                        title="Delete Elite Scholarship"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 backdrop-blur-lg mb-4">
                                                    <GraduationCap className="w-12 h-12 text-purple-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">
                                                    {loading ? 'Loading Elite Scholarships...' : 'No Elite Scholarships Found'}
                                                </h3>
                                                <p className="text-gray-300">
                                                    {loading ? 'Searching premium opportunities...' : 'No scholarships match your elite criteria'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

                {/* Elite Editor Modal */}
                {showEditor && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg overflow-y-auto h-full w-full z-50">
                        <div className="relative min-h-screen flex items-center justify-center p-4">
                            <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto">
                                <ScholarshipEditor
                                    scholarship={editingScholarship}
                                    onCancel={() => {
                                        setShowEditor(false);
                                        setEditingScholarship(null);
                                    }}
                                    onSave={() => {
                                        loadScholarships();
                                        setShowEditor(false);
                                        setEditingScholarship(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ScholarshipManagement;
