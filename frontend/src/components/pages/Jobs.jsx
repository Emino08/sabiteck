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
    TrendingUp,
    Crown,
    Sparkles,
    Zap,
    Target,
    Globe,
    Award,
    Shield,
    Rocket,
    Diamond,
    Eye,
    BookOpen,
    Layers,
    Copy
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import ApiService from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { toast } from 'sonner';

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
            setError(null);
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== '' && !(key === 'remote' && value === false)) {
                    queryParams.append(key, value);
                }
            });

            // Try the API endpoint first
            const response = await apiRequest(`/api/jobs?${queryParams.toString()}`);

            if (response.success) {
                setJobs(response.data || []);
                setPagination(response.pagination || { total: response.total || 0, pages: 1, page: 1 });
                return;
            } else {
                throw new Error(response.message || 'Failed to load jobs');
            }
        } catch (err) {
            console.warn('Primary jobs endpoint failed, trying fallback:', err.message);

            try {
                // Fallback to ApiService
                const fallbackJobs = await ApiService.getJobs(filters);
                const jobsArray = Array.isArray(fallbackJobs) ? fallbackJobs : [];
                setJobs(jobsArray);
                setPagination({ total: jobsArray.length, pages: 1, page: 1 });
            } catch (fallbackErr) {
                console.error('Both job endpoints failed:', fallbackErr);
                setError('Unable to load job listings. Please try again later.');
                setJobs([]);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const loadFeaturedJobs = async () => {
        try {
            // Try the direct API endpoint first
            const response = await apiRequest('/api/jobs/featured');
            if (response.success && Array.isArray(response.data)) {
                setFeaturedJobs(response.data);
                return;
            }
        } catch (err) {
            console.warn('Featured jobs endpoint not available, trying fallback:', err.message);
        }

        try {
            // Fallback to getting all jobs and filtering for featured ones
            const allJobs = await ApiService.getJobs({ featured: true, limit: 6 });
            const featuredJobs = Array.isArray(allJobs) ? allJobs.filter(job => job.featured) : [];
            setFeaturedJobs(featuredJobs.slice(0, 6)); // Limit to 6 featured jobs
        } catch (fallbackErr) {
            console.error('Failed to load featured jobs with fallback:', fallbackErr);
            setFeaturedJobs([]);
        }
    };
    
    const loadCategories = async () => {
        try {
            const response = await apiRequest('/api/jobs/categories');
            if (response.success && Array.isArray(response.data)) {
                setCategories(response.data);
                return;
            }
        } catch (err) {
            console.warn('Job categories endpoint not available:', err.message);
        }

        // Fallback to empty array or default categories
        setCategories([
            { name: 'Technology', count: 0 },
            { name: 'Engineering', count: 0 },
            { name: 'Design', count: 0 },
            { name: 'Marketing', count: 0 },
            { name: 'Sales', count: 0 }
        ]);
    };
    
    const loadLocations = async () => {
        try {
            const response = await apiRequest('/api/jobs/locations');
            if (response.success && Array.isArray(response.data)) {
                setLocations(response.data);
                return;
            }
        } catch (err) {
            console.warn('Job locations endpoint not available:', err.message);
        }

        // Fallback to default locations
        setLocations([
            { name: 'Freetown, Sierra Leone', count: 0 },
            { name: 'Bo, Sierra Leone', count: 0 },
            { name: 'Kenema, Sierra Leone', count: 0 },
            { name: 'Remote', count: 0 }
        ]);
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

    const copyJobLink = async (job) => {
        try {
            // Generate the job link based on the slug or ID
            const baseUrl = window.location.origin;
            const jobUrl = `${baseUrl}/jobs/${job.slug || job.id}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(jobUrl);

            toast.success('✨ Job link copied to clipboard!', {
                description: jobUrl,
                duration: 3000
            });
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            const baseUrl = window.location.origin;
            const jobUrl = `${baseUrl}/jobs/${job.slug || job.id}`;

            textArea.value = jobUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            toast.success('✨ Job link copied to clipboard!', {
                description: jobUrl,
                duration: 3000
            });
        }
    };

    if (loading && jobs.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-32 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <Crown className="w-16 h-16 text-yellow-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Opportunities...</h2>
                    <LoadingSpinner size="large" />
                </div>
            </div>
        );
    }

    // Stats for hero section
    const stats = [
        { label: 'Active Jobs', value: `${jobs.length}+` },
        { label: 'Employers', value: '200+' },
        { label: 'Successful Hires', value: '1K+' },
        { label: 'Countries', value: '15+' }
    ];

    return (
        <div className="min-h-screen">
            {/* Enhanced Hero Section - Matching Portfolio/Team/Tools Style */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24">
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-repeat bg-[length:60px_60px]"
                         style={{
                             backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
                         }}>
                    </div>
                </div>

                {/* Animated floating elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white py-12 md:py-20">
                    <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-400/20">
                        <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Career Opportunities
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
                        Find Your Dream
                        <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            Career Opportunity
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
                        Discover exciting job opportunities from top employers. Whether you're a student seeking internships or a professional looking for your next role, we've got you covered.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
                        <button
                            className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
                            onClick={() => document.querySelector('.jobs-content')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <Search className="mr-3 h-6 w-6" />
                            Browse Jobs
                            <ChevronDown className="ml-3 h-6 w-6 group-hover:translate-y-1 transition-transform" />
                        </button>
                        <button
                            className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                            onClick={() => navigate('/contact')}
                        >
                            <Building2 className="mr-3 h-6 w-6" />
                            Post a Job
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-blue-200 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filter Section - Matching Portfolio/Team/Tools Style */}
            <section className="jobs-content py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
                         style={{
                             backgroundImage: `radial-gradient(circle at 20px 20px, #60A5FA 1px, transparent 1px)`
                         }}>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 backdrop-blur-sm rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-400/20">
                            <Filter className="h-4 w-4 mr-2" />
                            Job Categories
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                            Browse by Category
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                            Find opportunities that match your skills and interests across various industries.
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="max-w-5xl mx-auto mb-12 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs by title, company, or skills..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-white placeholder-gray-300 transition-all duration-300 shadow-lg"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <select
                                    value={filters.location}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-white appearance-none transition-all duration-300 cursor-pointer"
                                >
                                    <option value="">All Locations</option>
                                    {locations.map((location, index) => (
                                        <option key={location.name || index} value={location.name}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <select
                                    value={filters.job_type}
                                    onChange={(e) => handleFilterChange('job_type', e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-white appearance-none transition-all duration-300 cursor-pointer"
                                >
                                    {jobTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <TrendingUp className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-white appearance-none transition-all duration-300 cursor-pointer"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex justify-center">
                        <div className="inline-flex flex-wrap gap-3 sm:gap-4 bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20">
                            <button
                                onClick={() => handleFilterChange('category', '')}
                                className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                                    filters.category === ''
                                        ? 'text-white shadow-xl'
                                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                                }`}
                                style={filters.category === '' ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span>All Jobs</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${filters.category === '' ? 'bg-white/20 text-white' : 'bg-blue-400/20 text-blue-200'}`}>
                                        {jobs.length}
                                    </span>
                                </span>
                            </button>
                            {categories.map(category => {
                                const isActive = filters.category === category.name;
                                return (
                                    <button
                                        key={category.name}
                                        onClick={() => handleFilterChange('category', category.name)}
                                        className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                                            isActive
                                                ? 'text-white shadow-xl'
                                                : 'bg-white/10 text-gray-200 hover:bg-white/20'
                                        }`}
                                        style={isActive ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>{category.name}</span>
                                            {category.count > 0 && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-400/20 text-blue-200'}`}>
                                                    {category.count}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Jobs Content Section */}
            
            {/* Elite Featured Jobs Section */}
            {featuredJobs.length > 0 && (
                <section className="relative py-20 bg-gradient-to-b from-slate-900 to-black">
                    {/* Background Effects */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg border border-yellow-400/30 text-yellow-200 text-sm font-bold mb-8">
                                <Crown className="w-4 h-4 mr-2 text-yellow-400 animate-pulse" />
                                ELITE PREMIER SELECTIONS
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                                Featured Elite Opportunities
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                Exclusive positions from industry titans and innovative leaders,
                                handpicked for exceptional professionals who define excellence.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {featuredJobs.map(job => (
                                <div key={job.id} className="group relative bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden shadow-2xl">
                                    {/* Elite Premium Badge */}
                                    <div className="absolute top-6 right-6 z-10">
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-xs font-black shadow-2xl animate-pulse">
                                            <Crown className="w-3 h-3 inline mr-1" />
                                            ELITE FEATURED
                                        </div>
                                    </div>

                                    {/* Elite Card Content */}
                                    <div className="p-8">
                                        <div className="mb-6">
                                            <div className="flex items-center mb-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-lg mr-4 shadow-xl">
                                                    {job.company_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{job.company_name}</h4>
                                                    <div className="flex items-center text-gray-300 text-sm">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {job.location}
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl font-black text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                                                <Link
                                                    to={`/jobs/${job.slug}`}
                                                    className="block hover:text-purple-300"
                                                >
                                                    {job.title}
                                                </Link>
                                            </h3>

                                            <p className="text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                                                {job.description?.slice(0, 150)}...
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

                                        {/* Action Buttons */}
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => copyJobLink(job)}
                                                className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group/btn"
                                                title="Copy Job Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/jobs/${job.slug}`}
                                                className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center group/btn"
                                            >
                                                View Details
                                                <TrendingUp className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Premium Filters and Results Section */}
            <section className="py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-black">
                <div className="container mx-auto px-4">
                    {/* Results Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                All Opportunities
                            </h2>
                            <p className="text-blue-100">
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

                                                            <div className="flex items-center space-x-3">
                                                                <button
                                                                    onClick={() => copyJobLink(job)}
                                                                    className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                                                                    title="Copy Job Link"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
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

