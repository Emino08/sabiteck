import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    MapPin, 
    Building2, 
    Clock, 
    DollarSign, 
    Briefcase,
    Heart,
    ChevronDown,
    ChevronUp,
    Star,
    Calendar,
    Users,
    TrendingUp
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const Jobs = () => {
    // State management
    const [jobs, setJobs] = useState([]);
    const [featuredJobs, setFeaturedJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    
    // URL search params
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Filter states
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        job_type: searchParams.get('job_type') || '',
        remote: searchParams.get('remote') === 'true',
        sort: searchParams.get('sort') || 'newest',
        page: parseInt(searchParams.get('page')) || 1
    });
    
    // Job type options
    const jobTypes = [
        { value: '', label: 'All Types' },
        { value: 'full-time', label: 'Full Time' },
        { value: 'part-time', label: 'Part Time' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' },
        { value: 'remote', label: 'Remote' }
    ];
    
    // Sort options
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'title', label: 'Title A-Z' },
        { value: 'company', label: 'Company A-Z' },
        { value: 'location', label: 'Location A-Z' },
        { value: 'salary_high', label: 'Salary High-Low' },
        { value: 'salary_low', label: 'Salary Low-High' }
    ];
    
    // Load initial data
    useEffect(() => {
        loadCategories();
        loadLocations();
        loadFeaturedJobs();
    }, []);
    
    // Load jobs when filters change
    useEffect(() => {
        loadJobs();
        updateURL();
    }, [filters]);
    
    const loadJobs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== '' && !(key === 'remote' && value === false)) {
                    queryParams.append(key, value);
                }
            });
            
            const response = await apiRequest(`/api/jobs?${queryParams.toString()}`);
            
            if (response.success) {
                setJobs(response.data || []);
                setPagination(response.pagination || { total: response.total || 0, pages: 1, page: 1 });
            } else {
                setError(response.message || 'Failed to load jobs');
            }
        } catch (err) {
            setError('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };
    
    const loadFeaturedJobs = async () => {
        try {
            const response = await apiRequest('/api/jobs/featured');
            if (response.success && Array.isArray(response.data)) {
                setFeaturedJobs(response.data);
            } else {
                setFeaturedJobs([]);
            }
        } catch (err) {
            console.error('Failed to load featured jobs:', err);
            setFeaturedJobs([]);
        }
    };
    
    const loadCategories = async () => {
        try {
            const response = await apiRequest('/api/jobs/categories');
            if (response.success && Array.isArray(response.data)) {
                setCategories(response.data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
            setCategories([]);
        }
    };
    
    const loadLocations = async () => {
        try {
            const response = await apiRequest('/api/jobs/locations');
            if (response.success && Array.isArray(response.data)) {
                setLocations(response.data);
            } else {
                setLocations([]);
            }
        } catch (err) {
            console.error('Failed to load locations:', err);
            setLocations([]);
        }
    };
    
    const updateURL = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '' && !(key === 'remote' && value === false)) {
                params.set(key, value.toString());
            }
        });
        setSearchParams(params);
    };
    
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value // Reset to page 1 when other filters change
        }));
    };
    
    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            location: '',
            job_type: '',
            remote: false,
            sort: 'newest',
            page: 1
        });
    };
    
    const formatSalary = (min, max, currency = 'SLL', period = 'monthly') => {
        if (!min && !max) return 'Salary negotiable';
        
        const formatAmount = (amount) => {
            if (currency === 'SLL' && amount >= 1000) {
                return `${(amount / 1000).toFixed(0)}K`;
            }
            return amount.toLocaleString();
        };
        
        const range = min && max ? 
            `${formatAmount(min)} - ${formatAmount(max)}` : 
            (min ? `From ${formatAmount(min)}` : `Up to ${formatAmount(max)}`);
            
        return `${range} ${currency}/${period}`;
    };
    
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Not specified';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';

        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const formatDeadline = (job) => {
        const deadline = job.application_deadline || job.deadline;
        if (!deadline) return null;

        const deadlineDate = new Date(deadline);
        const now = new Date();
        const diffTime = deadlineDate - now;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffTime < 0) return { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' };
        if (diffDays === 0) return { text: 'Today', color: 'text-red-600', bgColor: 'bg-red-100' };
        if (diffDays === 1) return { text: '1 day left', color: 'text-orange-600', bgColor: 'bg-orange-100' };
        if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
        if (diffDays <= 30) return { text: `${diffDays} days left`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };

        return {
            text: deadlineDate.toLocaleDateString(),
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
        };
    };
    
    // Helper function to ensure skills are in array format
    const getSkillsArray = (skills) => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'string') {
            // Handle comma-separated string
            return skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        }
        return [];
    };

    if (loading && jobs.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center pt-20">
                    <LoadingSpinner size="large" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Enhanced Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-40" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="relative container mx-auto px-4 py-20 lg:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-8 animate-fade-in">
                            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-sm font-medium mb-6">
                                <Briefcase className="w-4 h-4 mr-2" />
                                {jobs.length} Premium Opportunities Available
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent leading-tight">
                                Elite Career Opportunities
                            </h1>
                            <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed">
                                Join industry leaders and innovative companies shaping the future of technology
                            </p>
                        </div>

                        {/* Premium Search Interface */}
                        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2 relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search roles, companies, or skills..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 text-lg transition-all duration-200"
                                    />
                                </div>

                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <select
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-lg appearance-none transition-all duration-200 cursor-pointer"
                                    >
                                        <option value="">All Locations</option>
                                        {locations.map((location, index) => (
                                            <option key={location.name || index} value={location.name}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>

                                <button
                                    onClick={() => handleFilterChange('page', 1)}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Discover Roles
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{jobs.length}+</div>
                                <div className="text-slate-300 text-sm">Active Positions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">50+</div>
                                <div className="text-slate-300 text-sm">Partner Companies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">95%</div>
                                <div className="text-slate-300 text-sm">Success Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">24h</div>
                                <div className="text-slate-300 text-sm">Response Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Premium Featured Jobs Section */}
            {featuredJobs.length > 0 && (
                <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-slate-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 text-amber-800 text-sm font-medium mb-6">
                                <Star className="w-4 h-4 mr-2 text-amber-600" />
                                Premium Selections
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                                Featured Opportunities
                            </h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                Exceptional roles from industry-leading companies, carefully curated for top talent
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {featuredJobs.map(job => (
                                <div key={job.id} className="group relative bg-white rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-2xl hover:border-blue-200/50 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                                    {/* Premium Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                            <Star className="w-3 h-3 inline mr-1" />
                                            FEATURED
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-8">
                                        <div className="mb-6">
                                            <div className="flex items-center mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">
                                                    {job.company_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-700 text-sm">{job.company_name}</h4>
                                                    <div className="flex items-center text-slate-500 text-sm">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {job.location}
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                                                <Link
                                                    to={`/jobs/${job.slug}`}
                                                    className="block hover:text-blue-600"
                                                >
                                                    {job.title}
                                                </Link>
                                            </h3>

                                            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                                {job.description?.slice(0, 120)}...
                                            </p>
                                        </div>

                                        {/* Job Details */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                    <Briefcase className="w-3 h-3 mr-1" />
                                                    {job.type || job.job_type}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                                    {job.department}
                                                </span>
                                            </div>
                                            {job.remote_work && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    Remote
                                                </span>
                                            )}
                                        </div>

                                        {/* Skills Tags */}
                                        {getSkillsArray(job.skills_required).length > 0 && (
                                            <div className="mb-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {getSkillsArray(job.skills_required).slice(0, 3).map((skill, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {getSkillsArray(job.skills_required).length > 3 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-xs">
                                                            +{getSkillsArray(job.skills_required).length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <Link
                                            to={`/jobs/${job.slug}`}
                                            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group/btn"
                                        >
                                            View Details
                                            <TrendingUp className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Premium Filters and Results Section */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    {/* Results Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                All Opportunities
                            </h2>
                            <p className="text-slate-600">
                                {loading ? 'Loading...' : `${pagination.total || jobs.length} positions available`}
                            </p>
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Advanced Sidebar Filters */}
                        {showFilters && (
                            <div className="w-full lg:w-80">
                                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sticky top-24">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Refine Search</h3>
                                        <button
                                            onClick={clearFilters}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            Clear All
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Category Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Department
                                            </label>
                                            <select
                                                value={filters.category}
                                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900"
                                            >
                                                <option value="">All Departments</option>
                                                {categories.map((category, index) => (
                                                    <option key={category.name || index} value={category.name}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Job Type Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Employment Type
                                            </label>
                                            <div className="space-y-2">
                                                {jobTypes.slice(1).map(type => (
                                                    <label key={type.value} className="flex items-center group cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="job_type"
                                                            value={type.value}
                                                            checked={filters.job_type === type.value}
                                                            onChange={(e) => handleFilterChange('job_type', e.target.value)}
                                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500/20"
                                                        />
                                                        <span className="ml-3 text-sm text-slate-700 group-hover:text-slate-900">
                                                            {type.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Remote Work Filter */}
                                        <div>
                                            <label className="flex items-center group cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.remote}
                                                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20"
                                                />
                                                <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                                    Remote Opportunities Only
                                                </span>
                                            </label>
                                        </div>

                                        {/* Sort Filter */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                                Sort By
                                            </label>
                                            <select
                                                value={filters.sort}
                                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900"
                                            >
                                                {sortOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="flex-1">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                <span className="text-red-600 text-sm">⚠</span>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Error Loading Jobs</h3>
                                            <p className="text-sm text-red-700 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="space-y-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-8 animate-pulse">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
                                                <div className="flex-1">
                                                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                                                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                                                    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                                                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Briefcase className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">No Jobs Found</h3>
                                    <p className="text-slate-600 max-w-md mx-auto mb-8">
                                        We couldn't find any positions matching your criteria. Try adjusting your filters or search terms.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Job Cards */}
                                    {jobs.map(job => (
                                        <div key={job.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200/50 hover:shadow-xl hover:border-blue-200/50 transition-all duration-300 overflow-hidden">
                                            <div className="p-8">
                                                <div className="flex items-start space-x-6">
                                                    {/* Company Logo/Initial */}
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border border-slate-200">
                                                            <span className="text-slate-700 font-bold text-xl">
                                                                {job.company_name?.charAt(0) || 'S'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Job Content */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3 mb-2">
                                                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                                                                        <Link to={`/jobs/${job.slug}`} className="block">
                                                                            {job.title}
                                                                        </Link>
                                                                    </h3>
                                                                    {job.featured && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold">
                                                                            <Star className="w-3 h-3 mr-1" />
                                                                            FEATURED
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                                                    <span className="flex items-center">
                                                                        <Building2 className="w-4 h-4 mr-1" />
                                                                        {job.company_name}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <MapPin className="w-4 h-4 mr-1" />
                                                                        {job.location}
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Clock className="w-4 h-4 mr-1" />
                                                                        {job.relative_date || formatTimeAgo(job.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Bookmark Button */}
                                                            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors duration-200">
                                                                <Heart className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                        {/* Description */}
                                                        <p className="text-slate-600 leading-relaxed mb-6 line-clamp-2">
                                                            {job.description?.slice(0, 180)}...
                                                        </p>

                                                        {/* Tags and Details */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                                                    <Briefcase className="w-3 h-3 mr-1" />
                                                                    {job.type || job.job_type}
                                                                </span>
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                                                                    {job.department}
                                                                </span>
                                                                {job.remote_work && (
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                                        Remote
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <Link
                                                                to={`/jobs/${job.slug}`}
                                                                className="group/btn inline-flex items-center px-6 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                                                            >
                                                                Apply Now
                                                                <TrendingUp className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Premium Pagination */}
                            {!loading && jobs.length > 0 && pagination.pages > 1 && (
                                <div className="mt-12 flex items-center justify-center">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                                            disabled={filters.page <= 1}
                                            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                            const page = i + 1;
                                            const isCurrentPage = page === filters.page;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handleFilterChange('page', page)}
                                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                                                        isCurrentPage
                                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                                            disabled={filters.page >= pagination.pages}
                                            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Jobs;

