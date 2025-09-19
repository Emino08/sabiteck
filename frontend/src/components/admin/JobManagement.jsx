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
    UserCheck
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
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage job listings and applications
                    </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    
                    <button
                        onClick={() => {
                            setEditingJob(null);
                            setShowEditor(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Post New Job
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                <div 
                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === '' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStatusFilter('')}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Briefcase className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Jobs
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.total}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === 'active' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStatusFilter('active')}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Active
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.active}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === 'draft' ? 'ring-2 ring-gray-500 bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStatusFilter('draft')}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Edit className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Drafts
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.draft}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === 'closed' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStatusFilter('closed')}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Closed
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.closed}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Briefcase className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Featured
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.featured}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-orange-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Expired
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.expired}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Applications
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.total_applications}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                        {/* Search */}
                        <div className="flex-1 max-w-lg">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center space-x-3">
                            <select
                                value={selectedCategory}
                                onChange={handleCategoryFilter}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Categories</option>
                                {Array.isArray(categories) ? categories.map((category, index) => (
                                    <option key={category?.id || category?.name || `category-${index}`} value={category?.name || ''}>
                                        {category?.name || 'Unknown Category'}
                                    </option>
                                )) : []}
                            </select>

                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50">
                                <Filter className="w-4 h-4 mr-2" />
                                More Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedJobs.length === jobs.length && jobs.length > 0}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Job
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applications
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    try {
                                        if (loading || !jobs || !Array.isArray(jobs)) {
                                            return (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                        {loading ? 'Loading jobs...' : 'No jobs found'}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (jobs.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                        No jobs available
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedJobs.includes(job.id)}
                                                onChange={() => handleSelectJob(job.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    {job.company_logo ? (
                                                        <img
                                                            className="h-10 w-10 rounded-lg object-cover border"
                                                            src={job.company_logo}
                                                            alt={job.company_name}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <Building className="h-5 w-5 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingJob(job);
                                                                setShowEditor(true);
                                                            }}
                                                            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                                                        >
                                                            {job.title}
                                                        </button>
                                                        {job.featured && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                <Briefcase className="w-3 h-3 mr-1" />
                                                                Featured
                                                            </span>
                                                        )}
                                                        {job.remote_work && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                Remote
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-1">
                                                        {job.short_description}
                                                    </p>
                                                    <div className="flex items-center mt-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            {job.category_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{job.company_name || 'Sabiteck Limited'}</div>
                                            <div className="text-xs text-gray-500">{job.job_type || job.type}</div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                {job.location}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedJobForApplications(job)}
                                                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-900"
                                            >
                                                <Users className="w-4 h-4 mr-1" />
                                                {job.application_count || job.applications_count || 0}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-medium ${getDeadlineStatus(job.application_deadline || job.deadline)}`}>
                                                {formatDeadline(job.application_deadline || job.deadline)}
                                            </div>
                                            {(job.application_deadline || job.deadline) && (
                                                <div className="text-xs text-gray-500">
                                                    {new Date(job.application_deadline || job.deadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Eye className="w-4 h-4 mr-1" />
                                                {job.view_count || 0}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <a
                                                    href={`/jobs/${job.slug}`}
                                                    target="_blank"
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="View Public Page"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                
                                                <button
                                                    onClick={() => {
                                                        setEditingJob(job);
                                                        setShowEditor(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
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
                                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                    Error loading jobs. Please refresh the page.
                                                </td>
                                            </tr>
                                        );
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {jobs.length === 0 && !loading && (
                    <div className="px-6 py-12 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || selectedStatus || selectedCategory 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by posting your first job.'
                            }
                        </p>
                        {!searchTerm && !selectedStatus && !selectedCategory && (
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setEditingJob(null);
                                        setShowEditor(true);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Post New Job
                                </button>
                            </div>
                        )}
                    </div>
                )}

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

            {/* Error Display */}
            {error && (
                <ErrorMessage 
                    message={error} 
                    onDismiss={() => setError(null)} 
                />
            )}

            {/* Loading Overlay */}
            {loading && jobs.length > 0 && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4">
                        <LoadingSpinner size="lg" />
                    </div>
                </div>
            )}

            {/* Job Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingJob ? 'Edit Job' : 'Post New Job'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowEditor(false);
                                        setEditingJob(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
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
                </div>
            )}
        </div>
    );
};

export default JobManagement;