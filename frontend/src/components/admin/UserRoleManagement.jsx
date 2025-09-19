import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Shield, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    UserPlus,
    Building2,
    Check,
    X,
    Crown,
    UserCheck
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import LoadingSpinner from '../ui/LoadingSpinner';

const UserRoleManagement = () => {
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrg, setSelectedOrg] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'invite', 'role', 'permissions', 'add', 'edit'
    const [editingUser, setEditingUser] = useState(null);

    const [inviteForm, setInviteForm] = useState({
        email: '',
        organization_id: '',
        role: 'member',
        permissions: []
    });

    const [addUserForm, setAddUserForm] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'user',
        organization_id: '',
        status: 'active',
        email_verified: true,
        permissions: {}
    });

    const [roleForm, setRoleForm] = useState({
        user_id: '',
        organization_id: '',
        role: 'member'
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 15,
        total: 0,
        pages: 0
    });

    const userRoles = [
        { id: 'super_admin', name: 'Super Admin', description: 'Full system access across all organizations' },
        { id: 'admin', name: 'Admin', description: 'Full access within assigned organizations' },
        { id: 'hr_manager', name: 'HR Manager', description: 'Manage jobs and applications within organization' },
        { id: 'content_manager', name: 'Content Manager', description: 'Manage content and announcements' },
        { id: 'user', name: 'Regular User', description: 'Basic user with application permissions' }
    ];

    useEffect(() => {
        loadData();
    }, [pagination.page, searchTerm, selectedOrg]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load users with organization info
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                organization: selectedOrg
            });

            // Load users
            console.log('🚀 Loading users with params:', params.toString());
            const usersResponse = await apiRequest(`/api/admin/users?${params.toString()}`);
            console.log('👥 Users API Response:', usersResponse);

            if (usersResponse.success) {
                const usersArray = Array.isArray(usersResponse.users) ? usersResponse.users : [];
                console.log('📋 Users array extracted:', usersArray);
                console.log('📊 Users count:', usersArray.length);
                setUsers(usersArray);
                setPagination(prev => ({
                    ...prev,
                    total: usersResponse.pagination?.total || usersArray.length || 0,
                    pages: usersResponse.pagination?.pages || 1
                }));
            } else {
                console.error('❌ Failed to load users:', usersResponse);
                setUsers([]);
            }

            // Load organizations
            const orgsResponse = await apiRequest('/api/admin/organizations');
            if (orgsResponse.success) {
                const orgsArray = Array.isArray(orgsResponse.organizations) ? orgsResponse.organizations :
                                 Array.isArray(orgsResponse.data) ? orgsResponse.data : [];
                setOrganizations(orgsArray);
            } else {
                setOrganizations([]);
            }

            // Load permissions
            const permsResponse = await apiRequest('/api/admin/permissions');
            if (permsResponse.success) {
                const permsArray = Array.isArray(permsResponse.permissions) ? permsResponse.permissions :
                                  Array.isArray(permsResponse.data) ? permsResponse.data : [];
                setPermissions(permsArray);
            } else {
                setPermissions([]);
            }

        } catch (error) {
            console.error('❌ Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();

        try {
            const response = await apiRequest('/api/admin/users/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inviteForm)
            });

            if (response.success) {
                toast.success('User invitation sent successfully');
                setShowModal(false);
                resetForms();
                loadData();
            } else {
                toast.error(response.message || 'Failed to send invitation');
            }
        } catch (error) {
            toast.error('Failed to send invitation');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();

        try {
            // Convert permissions object to array of permission IDs
            const permissionArray = [];
            Object.entries(addUserForm.permissions).forEach(([permissionId, access]) => {
                if (access.read || access.write) {
                    permissionArray.push(parseInt(permissionId));
                }
            });

            const userData = {
                ...addUserForm,
                permissions: permissionArray
            };

            const response = await apiRequest('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.success) {
                const successMessage = response.temporary_password ?
                    `User created successfully!\nTemporary password: ${response.temporary_password}\nUsername: ${response.username}` :
                    `User created successfully!\nUsername: ${response.username}`;
                toast.success(successMessage);
                setShowModal(false);
                resetForms();
                loadData();
            } else {
                toast.error(response.message || response.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Add user error:', error);
            toast.error(error.message || 'Failed to create user');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();

        try {
            // Convert permissions object to array of permission IDs
            const permissionArray = [];
            Object.entries(addUserForm.permissions).forEach(([permissionId, access]) => {
                if (access.read || access.write) {
                    permissionArray.push(parseInt(permissionId));
                }
            });

            const userData = {
                ...addUserForm,
                permissions: permissionArray
            };

            const response = await apiRequest(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.success) {
                toast.success('User updated successfully!');
                setShowModal(false);
                resetForms();
                loadData();
            } else {
                toast.error(response.message || response.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Edit user error:', error);
            toast.error(error.message || 'Failed to update user');
        }
    };

    const handleUpdateUserRole = async (userId, orgId, newRole) => {
        try {
            const response = await apiRequest(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    organization_id: orgId,
                    role: newRole
                })
            });

            if (response.success) {
                toast.success('User role updated successfully');
                loadData();
            } else {
                toast.error(response.message || 'Failed to update role');
            }
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleUpdatePermissions = async (e) => {
        e.preventDefault();
        
        try {
            const response = await apiRequest(`/api/admin/users/${editingUser.id}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permissions: inviteForm.permissions
                })
            });

            if (response.success) {
                toast.success('User permissions updated successfully');
                setShowModal(false);
                resetForms();
                loadData();
            } else {
                toast.error(response.message || 'Failed to update permissions');
            }
        } catch (error) {
            toast.error('Failed to update permissions');
        }
    };

    const handleRemoveUser = async (userId, orgId) => {
        if (!confirm('Are you sure you want to remove this user from the organization?')) {
            return;
        }

        try {
            const response = await apiRequest(`/api/admin/organizations/${orgId}/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                toast.success('User removed from organization');
                loadData();
            } else {
                toast.error(response.message || 'Failed to remove user');
            }
        } catch (error) {
            toast.error('Failed to remove user');
        }
    };

    const resetForms = () => {
        setInviteForm({
            email: '',
            organization_id: '',
            role: 'member',
            permissions: []
        });
        setAddUserForm({
            email: '',
            username: '',
            first_name: '',
            last_name: '',
            password: '',
            role: 'user',
            organization_id: '',
            status: 'active',
            email_verified: true,
            permissions: {}
        });
        setRoleForm({
            user_id: '',
            organization_id: '',
            role: 'member'
        });
        setEditingUser(null);
    };

    const openInviteModal = () => {
        setModalType('invite');
        setShowModal(true);
    };

    const openAddUserModal = () => {
        setModalType('add');
        setShowModal(true);
    };

    const openPermissionsModal = (user) => {
        setEditingUser(user);
        setModalType('permissions');
        setInviteForm(prev => ({
            ...prev,
            permissions: user.permissions || []
        }));
        setShowModal(true);
    };

    const handleEdit = (user) => {
        console.log('Edit user:', user);
        setEditingUser(user);

        // Populate the addUserForm with existing user data
        const userPermissions = {};
        if (user.permissions && Array.isArray(user.permissions)) {
            user.permissions.forEach(permissionId => {
                userPermissions[permissionId] = { read: true, write: true };
            });
        }

        setAddUserForm({
            email: user.email || '',
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            password: '', // Don't populate password for security
            role: user.role || 'user',
            organization_id: user.organization_id || '',
            status: user.status || 'active',
            email_verified: user.email_verified !== undefined ? user.email_verified : true,
            permissions: userPermissions || {}
        });

        setModalType('edit');
        setShowModal(true);
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin': return 'text-purple-600 bg-purple-100';
            case 'admin': return 'text-red-600 bg-red-100';
            case 'hr_manager': return 'text-blue-600 bg-blue-100';
            case 'content_manager': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading && users.length === 0) {
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
                    <h2 className="text-2xl font-bold text-gray-900">User & Role Management</h2>
                    <p className="text-gray-600">Manage users, roles, and organization permissions</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={openAddUserModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add User</span>
                    </button>
                    <button
                        onClick={openInviteModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite User</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Organizations</option>
                    {Array.isArray(organizations) ? organizations.map(org => (
                        <option key={org?.id || 'unknown'} value={org?.id || ''}>{org?.name || 'Unknown Organization'}</option>
                    )) : []}
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">System Role</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Organizations</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(() => {
                                try {
                                    console.log('🎨 Rendering users - Loading:', loading, 'Users:', users, 'IsArray:', Array.isArray(users), 'Length:', users?.length);

                                    if (loading || !users || !Array.isArray(users)) {
                                        console.log('⏳ Showing loading/no users state');
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    {loading ? 'Loading users...' : 'No users found'}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (!Array.isArray(users)) {
                                        console.error('❌ Users is not an array:', users);
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    Error loading users data
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (users.length === 0) {
                                        console.log('📭 Users array is empty');
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    No users available
                                                </td>
                                            </tr>
                                        );
                                    }

                                    console.log('✅ Rendering', users.length, 'users:', users);
                                    try {
                                        return users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                {user.role === 'super_admin' ? (
                                                    <Crown className="w-4 h-4 text-purple-600" />
                                                ) : (
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                <div className="text-xs text-gray-400">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                            {userRoles.find(r => r.id === user.role)?.name || user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="space-y-1">
                                            {Array.isArray(user?.organizations) && user.organizations.length > 0 ? user.organizations.map(org => (
                                                <div key={org?.id || 'unknown'} className="flex items-center space-x-2">
                                                    <Building2 className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{org?.name || 'Unknown Organization'}</span>
                                                    <span className={`px-1 py-0.5 text-xs rounded ${getRoleColor(org?.role || 'user')}`}>
                                                        {org?.role || 'user'}
                                                    </span>
                                                </div>
                                            )) : (
                                                <span className="text-sm text-gray-400">No organizations</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            user.status === 'active' 
                                                ? 'text-green-600 bg-green-100' 
                                                : 'text-red-600 bg-red-100'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openPermissionsModal(user)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Manage Permissions"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-gray-600 hover:text-gray-800"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {user.role !== 'super_admin' && (
                                                <button
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Remove User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                    ));
                                    } catch (error) {
                                        console.error('Users rendering error:', error);
                                        return (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    Error loading users. Please refresh the page.
                                                </td>
                                            </tr>
                                        );
                                    }
                                } catch (error) {
                                    console.error('Users rendering error:', error);
                                    return (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                Error loading users. Please refresh the page.
                                            </td>
                                        </tr>
                                    );
                                }
                            })()}
                        </tbody>
                    </table>
                </div>

                {!users || users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {loading ? 'Loading users...' : 'No users found'}
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
                        <div className={`relative bg-white rounded-lg shadow-xl w-full ${modalType === 'add' || modalType === 'edit' ? 'max-w-4xl' : 'max-w-2xl'}`}>
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {modalType === 'invite' && 'Invite User to Organization'}
                                    {modalType === 'add' && 'Add New User with Detailed Permissions'}
                                    {modalType === 'edit' && `Edit User - ${editingUser?.first_name} ${editingUser?.last_name}`}
                                    {modalType === 'permissions' && `Manage Permissions - ${editingUser?.first_name} ${editingUser?.last_name}`}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForms();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>

                            {modalType === 'invite' && (
                                <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization *
                                        </label>
                                        <select
                                            required
                                            value={inviteForm.organization_id}
                                            onChange={(e) => setInviteForm(prev => ({ ...prev, organization_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Organization</option>
                                            {Array.isArray(organizations) ? organizations.map(org => (
                                                <option key={org?.id || 'unknown'} value={org?.id || ''}>{org?.name || 'Unknown Organization'}</option>
                                            )) : []}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role *
                                        </label>
                                        <select
                                            required
                                            value={inviteForm.role}
                                            onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {userRoles.filter(role => role.id !== 'super_admin').map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name} - {role.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForms();
                                            }}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Send Invitation
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'add' && (
                                <form onSubmit={handleAddUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                    {/* Basic User Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={addUserForm.first_name}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={addUserForm.last_name}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={addUserForm.email}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={addUserForm.username}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, username: e.target.value }))}
                                            placeholder="Auto-generated if empty"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={addUserForm.password}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Auto-generated if empty"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role *
                                            </label>
                                            <select
                                                required
                                                value={addUserForm.role}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, role: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {userRoles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={addUserForm.status}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="pending">Pending</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization (Optional)
                                        </label>
                                        <select
                                            value={addUserForm.organization_id}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, organization_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">No Organization</option>
                                            {Array.isArray(organizations) ? organizations.map(org => (
                                                <option key={org?.id || 'unknown'} value={org?.id || ''}>{org?.name || 'Unknown Organization'}</option>
                                            )) : []}
                                        </select>
                                    </div>

                                    {/* Detailed Permissions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Detailed Permissions (Read/Write Access)
                                        </label>
                                        <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                                            {Array.isArray(permissions) && permissions.length > 0 ? (() => {
                                                // Group permissions by category
                                                const groupedPermissions = permissions.reduce((acc, permission) => {
                                                    const category = permission.category || 'General';
                                                    if (!acc[category]) acc[category] = [];
                                                    acc[category].push(permission);
                                                    return acc;
                                                }, {});

                                                return Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                                                    <div key={category} className="mb-4">
                                                        <h4 className="font-medium text-gray-800 mb-2 uppercase text-sm tracking-wide">
                                                            {category}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {categoryPermissions.map(permission => (
                                                                <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">{permission.display_name || permission.name}</div>
                                                                        <div className="text-xs text-gray-500">{permission.description}</div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-4">
                                                                        <label className="flex items-center space-x-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!!(addUserForm.permissions && addUserForm.permissions[permission.id] && addUserForm.permissions[permission.id].read)}
                                                                                onChange={(e) => {
                                                                                    setAddUserForm(prev => ({
                                                                                        ...prev,
                                                                                        permissions: {
                                                                                            ...prev.permissions,
                                                                                            [permission.id]: {
                                                                                                ...(prev.permissions[permission.id] || {}),
                                                                                                read: e.target.checked
                                                                                            }
                                                                                        }
                                                                                    }));
                                                                                }}
                                                                                className="rounded"
                                                                            />
                                                                            <span className="text-xs">Read</span>
                                                                        </label>
                                                                        <label className="flex items-center space-x-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!!(addUserForm.permissions && addUserForm.permissions[permission.id] && addUserForm.permissions[permission.id].write)}
                                                                                onChange={(e) => {
                                                                                    setAddUserForm(prev => ({
                                                                                        ...prev,
                                                                                        permissions: {
                                                                                            ...prev.permissions,
                                                                                            [permission.id]: {
                                                                                                ...(prev.permissions[permission.id] || {}),
                                                                                                write: e.target.checked,
                                                                                                read: e.target.checked || (prev.permissions[permission.id] && prev.permissions[permission.id].read) || false
                                                                                            }
                                                                                        }
                                                                                    }));
                                                                                }}
                                                                                className="rounded"
                                                                            />
                                                                            <span className="text-xs">Write</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })() : (
                                                <div className="text-center text-gray-500 py-4">
                                                    No permissions available
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForms();
                                            }}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Create User
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'edit' && (
                                <form onSubmit={handleEditUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                    {/* Basic User Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={addUserForm.first_name}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={addUserForm.last_name}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={addUserForm.email}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={addUserForm.username}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password (Leave empty to keep current)
                                        </label>
                                        <input
                                            type="password"
                                            value={addUserForm.password}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="Enter new password or leave empty"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role *
                                            </label>
                                            <select
                                                required
                                                value={addUserForm.role}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, role: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {userRoles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={addUserForm.status}
                                                onChange={(e) => setAddUserForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="pending">Pending</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization (Optional)
                                        </label>
                                        <select
                                            value={addUserForm.organization_id}
                                            onChange={(e) => setAddUserForm(prev => ({ ...prev, organization_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">No Organization</option>
                                            {Array.isArray(organizations) ? organizations.map(org => (
                                                <option key={org?.id || 'unknown'} value={org?.id || ''}>{org?.name || 'Unknown Organization'}</option>
                                            )) : []}
                                        </select>
                                    </div>

                                    {/* Detailed Permissions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Detailed Permissions (Read/Write Access)
                                        </label>
                                        <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                                            {Array.isArray(permissions) && permissions.length > 0 ? (() => {
                                                // Group permissions by category
                                                const groupedPermissions = permissions.reduce((acc, permission) => {
                                                    const category = permission.category || 'General';
                                                    if (!acc[category]) acc[category] = [];
                                                    acc[category].push(permission);
                                                    return acc;
                                                }, {});

                                                return Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                                                    <div key={category} className="mb-4">
                                                        <h4 className="font-medium text-gray-800 mb-2 uppercase text-sm tracking-wide">
                                                            {category}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {categoryPermissions.map(permission => (
                                                                <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">{permission.display_name || permission.name}</div>
                                                                        <div className="text-xs text-gray-500">{permission.description}</div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-4">
                                                                        <label className="flex items-center space-x-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!!(addUserForm.permissions && addUserForm.permissions[permission.id] && addUserForm.permissions[permission.id].read)}
                                                                                onChange={(e) => {
                                                                                    setAddUserForm(prev => ({
                                                                                        ...prev,
                                                                                        permissions: {
                                                                                            ...prev.permissions,
                                                                                            [permission.id]: {
                                                                                                ...(prev.permissions[permission.id] || {}),
                                                                                                read: e.target.checked
                                                                                            }
                                                                                        }
                                                                                    }));
                                                                                }}
                                                                                className="rounded"
                                                                            />
                                                                            <span className="text-xs">Read</span>
                                                                        </label>
                                                                        <label className="flex items-center space-x-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!!(addUserForm.permissions && addUserForm.permissions[permission.id] && addUserForm.permissions[permission.id].write)}
                                                                                onChange={(e) => {
                                                                                    setAddUserForm(prev => ({
                                                                                        ...prev,
                                                                                        permissions: {
                                                                                            ...prev.permissions,
                                                                                            [permission.id]: {
                                                                                                ...(prev.permissions[permission.id] || {}),
                                                                                                write: e.target.checked,
                                                                                                read: e.target.checked || (prev.permissions[permission.id] && prev.permissions[permission.id].read) || false
                                                                                            }
                                                                                        }
                                                                                    }));
                                                                                }}
                                                                                className="rounded"
                                                                            />
                                                                            <span className="text-xs">Write</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })() : (
                                                <div className="text-center text-gray-500 py-4">
                                                    No permissions available
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForms();
                                            }}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Update User
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'permissions' && (
                                <form onSubmit={handleUpdatePermissions} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Permissions
                                        </label>
                                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                            {Array.isArray(permissions) ? permissions.map(permission => (
                                                <label key={permission.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={inviteForm.permissions.includes(permission.id)}
                                                        onChange={(e) => {
                                                            setInviteForm(prev => ({
                                                                ...prev,
                                                                permissions: e.target.checked
                                                                    ? [...prev.permissions, permission.id]
                                                                    : prev.permissions.filter(p => p !== permission.id)
                                                            }));
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">{permission.name}</div>
                                                        <div className="text-xs text-gray-500">{permission.description}</div>
                                                    </div>
                                                </label>
                                            )) : []}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForms();
                                            }}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Update Permissions
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRoleManagement;

