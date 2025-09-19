import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Users, 
    Briefcase,
    Globe,
    MapPin,
    Mail,
    Phone,
    Eye
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import LoadingSpinner from '../ui/LoadingSpinner';

const OrganizationManagement = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        industry: '',
        size: 'small',
        location: '',
        contact_email: '',
        contact_phone: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        loadOrganizations();
    }, [pagination.page, searchTerm]);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });

            const response = await apiRequest(`/api/admin/organizations?${params.toString()}`);
            
            if (response && response.success) {
                // Backend returns organizations directly, not nested under data
                const organizationsData = response.organizations || [];
                const paginationData = response.pagination || {};

                setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
                setPagination(prev => ({
                    ...prev,
                    total: paginationData.total || organizationsData.length || 0,
                    pages: paginationData.pages || 1
                }));
            } else {
                // Handle case where response is not successful
                setOrganizations([]);
                toast.error(response?.error || response?.message || 'Failed to load organizations');
            }
        } catch (error) {
            // Handle network errors or other exceptions
            setOrganizations([]);
            toast.error('Failed to load organizations');
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const isEdit = !!editingOrg;
            const endpoint = isEdit 
                ? `/api/admin/organizations/${editingOrg.id}`
                : '/api/admin/organizations';
            
            const response = await apiRequest(endpoint, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.success) {
                toast.success(response.message || `Organization ${isEdit ? 'updated' : 'created'} successfully`);
                setShowModal(false);
                setEditingOrg(null);
                resetForm();
                loadOrganizations();
            } else {
                toast.error(response.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleEdit = (org) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            description: org.description || '',
            website: org.website || '',
            industry: org.industry || '',
            size: org.size || 'small',
            location: org.location || '',
            contact_email: org.contact_email || '',
            contact_phone: org.contact_phone || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await apiRequest(`/api/admin/organizations/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                toast.success('Organization deleted successfully');
                loadOrganizations();
            } else {
                toast.error(response.message || 'Delete failed');
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            website: '',
            industry: '',
            size: 'small',
            location: '',
            contact_email: '',
            contact_phone: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadOrganizations();
    };

    if (loading && organizations.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Management</h2>
                    <p className="text-gray-600">Manage organizations and their job listings</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Organization</span>
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex space-x-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                    Search
                </button>
            </form>

            {/* Organizations Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Organization</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Industry</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Jobs</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Users</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(() => {
                                try {
                                    if (loading || !organizations || !Array.isArray(organizations)) {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                    {loading ? 'Loading organizations...' : 'No organizations found'}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (organizations.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                    No organizations available
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{org.name}</div>
                                                <div className="text-sm text-gray-500">{org.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-gray-600">{org.industry || '-'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-1 text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span>{org.location || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-1 text-gray-600">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{org.job_count}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-1 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>{org.user_count}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(org)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(org.id, org.name)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                    ));
                                } catch (error) {
                                    console.error('Organizations rendering error:', error);
                                    return (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                Error loading organizations. Please refresh the page.
                                            </td>
                                        </tr>
                                    );
                                }
                            })()}
                        </tbody>
                    </table>
                </div>

                {!organizations || organizations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {loading ? 'Loading organizations...' : 'No organizations found'}
                    </div>
                ) : null}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {editingOrg ? 'Edit Organization' : 'Add New Organization'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingOrg(null);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Size
                                        </label>
                                        <select
                                            name="size"
                                            value={formData.size}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="startup">Startup (1-10)</option>
                                            <option value="small">Small (11-50)</option>
                                            <option value="medium">Medium (51-200)</option>
                                            <option value="large">Large (201-1000)</option>
                                            <option value="enterprise">Enterprise (1000+)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            name="contact_email"
                                            value={formData.contact_email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contact Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="contact_phone"
                                            value={formData.contact_phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingOrg(null);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        {editingOrg ? 'Update' : 'Create'} Organization
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationManagement;
