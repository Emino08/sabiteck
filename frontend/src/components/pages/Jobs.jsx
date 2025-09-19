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
                setJobs(response.data.jobs || []);
                setPagination(response.data.pagination || {});
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
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Find Your Dream Job
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                            Discover amazing career opportunities and take the next step in your professional journey
                        </p>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Job title or keyword"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                </div>
                                
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <select
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none"
                                    >
                                        <option value="">All Locations</option>
                                        {locations.map(location => (
                                            <option key={location.location} value={location.location}>
                                                {location.location} ({location.job_count})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                                
                                <button
                                    onClick={() => handleFilterChange('page', 1)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Search Jobs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Featured Jobs Section */}
            {featuredJobs.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                                <Star className="w-8 h-8 mr-2 text-yellow-500" />
                                Featured Jobs
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Hand-picked opportunities from top employers
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredJobs.map(job => (
                                <div key={job.id} className="bg-white rounded-lg shadow-sm border border-yellow-200 hover:shadow-lg transition-shadow duration-200">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                                    <span className="text-sm text-yellow-600 font-medium">Featured</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    <Link 
                                                        to={`/jobs/${job.slug}`}
                                                        className="hover:text-blue-600 transition-colors duration-200"
                                                    >
                                                        {job.title}
                                                    </Link>
                                                </h3>
                                                <p className="text-gray-600 flex items-center">
                                                    <Building2 className="w-4 h-4 mr-1" />
                                                    {job.company_name}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 mb-4">
                                            <p className="text-gray-600 flex items-center text-sm">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {job.location}
                                            </p>
                                            <p className="text-gray-600 flex items-center text-sm">
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                                            </p>
                                            <p className="text-gray-600 flex items-center text-sm">
                                                <Clock className="w-4 h-4 mr-2" />
                                                {formatTimeAgo(job.published_at)}
                                            </p>
                                            {formatDeadline(job) && (
                                                <p className={`flex items-center text-sm ${formatDeadline(job).color}`}>
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Deadline: {formatDeadline(job).text}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                            {job.short_description}
                                        </p>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {job.job_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            <Link
                                                to={`/jobs/${job.slug}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
            {/* Filters and Results */}
            <section className="py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <div className="w-full lg:w-64">
                            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                                    <button
                                        onClick={clearFilters}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Category Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name} ({category.job_count})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Job Type Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Job Type
                                        </label>
                                        <select
                                            value={filters.job_type}
                                            onChange={(e) => handleFilterChange('job_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {jobTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Remote Work Filter */}
                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={filters.remote}
                                                onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Remote Work Available</span>
                                        </label>
                                    </div>
                                    
                                    {/* Sort Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sort By
                                        </label>
                                        <select
                                            value={filters.sort}
                                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        
                        {/* Job Results */}
                        <div className="flex-1">
                            {/* Results Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Job Listings
                                    </h2>
                                    {pagination.total && (
                                        <p className="text-gray-600 mt-1">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {error && <ErrorMessage message={error} />}
                            
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-12">
                                    <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                                    <p className="text-gray-600 mb-4">
                                        Try adjusting your search criteria or browse all available positions.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Job Cards */}
                                    <div className="space-y-4">
                                        {jobs.map(job => (
                                            <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-200">
                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                {job.featured && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                                        <Star className="w-3 h-3 mr-1" />
                                                                        Featured
                                                                    </span>
                                                                )}
                                                                {job.urgent && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                        Urgent
                                                                    </span>
                                                                )}
                                                                {job.remote_work && (
                                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                        Remote
                                                                    </span>
                                                                )}
                                                                {(() => {
                                                                    const deadline = formatDeadline(job);
                                                                    if (deadline && (deadline.text.includes('day') || deadline.text === 'Today' || deadline.text === 'Expired')) {
                                                                        return (
                                                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${deadline.bgColor} ${deadline.color}`}>
                                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                                {deadline.text}
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                                <Link 
                                                                    to={`/jobs/${job.slug}`}
                                                                    className="hover:text-blue-600 transition-colors duration-200"
                                                                >
                                                                    {job.title}
                                                                </Link>
                                                            </h3>
                                                            <p className="text-gray-600 flex items-center mb-2">
                                                                <Building2 className="w-4 h-4 mr-2" />
                                                                {job.company_name}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <p className="text-lg font-semibold text-green-600 mb-1">
                                                                {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatTimeAgo(job.published_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                        <p className="text-gray-600 flex items-center text-sm">
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            {job.location}
                                                        </p>
                                                        <p className="text-gray-600 flex items-center text-sm">
                                                            <Briefcase className="w-4 h-4 mr-2" />
                                                            {job.job_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                        <p className="text-gray-600 flex items-center text-sm">
                                                            <Users className="w-4 h-4 mr-2" />
                                                            {job.applications_count || job.application_count || 0} applicants
                                                        </p>
                                                        {formatDeadline(job) && (
                                                            <p className={`flex items-center text-sm ${formatDeadline(job).color}`}>
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {formatDeadline(job).text}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                                        {job.short_description}
                                                    </p>
                                                    
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                {job.category_name}
                                                            </span>
                                                            {getSkillsArray(job.skills_required).slice(0, 3).map((skill, index) => (
                                                                <span key={index} className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {getSkillsArray(job.skills_required).length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                                    +{getSkillsArray(job.skills_required).length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <Link
                                                            to={`/jobs/${job.slug}`}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Pagination */}
                                    {pagination.pages > 1 && (
                                        <div className="flex justify-center mt-8">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                                                    disabled={pagination.page <= 1}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                
                                                {[...Array(pagination.pages)].map((_, i) => {
                                                    const page = i + 1;
                                                    const isCurrentPage = page === pagination.page;
                                                    
                                                    if (
                                                        page === 1 || 
                                                        page === pagination.pages || 
                                                        (page >= pagination.page - 2 && page <= pagination.page + 2)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => handleFilterChange('page', page)}
                                                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                                    isCurrentPage
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (
                                                        page === pagination.page - 3 || 
                                                        page === pagination.page + 3
                                                    ) {
                                                        return <span key={page} className="text-gray-500">...</span>;
                                                    }
                                                    return null;
                                                })}
                                                
                                                <button
                                                    onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                                                    disabled={pagination.page >= pagination.pages}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Jobs;

