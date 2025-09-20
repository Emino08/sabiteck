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
    X
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
                    {category?.name || 'Unnamed Category'}
                </option>
            ));
        } catch (error) {
            console.error('Error rendering categories:', error);
            return <option disabled>Error rendering categories</option>;
        }
    };

    // Show loading state
    if (loading && scholarships.length === 0) {
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
                    <h2 className="text-2xl font-bold text-gray-900">Scholarship Management</h2>
                    <p className="text-gray-600">Manage scholarship opportunities and applications</p>
                </div>
                <button
                    onClick={() => setShowEditor(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Scholarship</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Award className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Award className="h-8 w-8 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Award className="h-8 w-8 text-yellow-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Award className="h-8 w-8 text-red-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Expired</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.expired}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Award className="h-8 w-8 text-purple-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Featured</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.featured}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
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
                                    placeholder="Search scholarships..."
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
                                disabled={categoriesLoading}
                            >
                                <option value="">{categoriesLoading ? 'Loading categories...' : 'All Categories'}</option>
                                {renderCategoriesOptions()}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deadline
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Array.isArray(scholarships) && scholarships.length > 0 ? (
                                    scholarships.map((scholarship) => (
                                        <tr key={scholarship.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{scholarship.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">${scholarship.amount}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{scholarship.deadline}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    scholarship.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    scholarship.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {scholarship.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewScholarship(scholarship)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View scholarship"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditScholarship(scholarship)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                        title="Edit scholarship"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteScholarship(scholarship.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete scholarship"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            {loading ? 'Loading scholarships...' : 'No scholarships found'}
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

            {/* Editor Modal */}
            {showEditor && (
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
            )}
        </div>
    );
};

export default ScholarshipManagement;
