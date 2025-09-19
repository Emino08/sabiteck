import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    
    // Profile form data
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: ''
    });

    // Password change form data
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadProfile();
    }, [isAuthenticated, navigate]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await apiRequest('/api/user/profile');
            
            if (response.success) {
                setProfileData({
                    username: response.data.username || '',
                    email: response.data.email || '',
                    first_name: response.data.first_name || '',
                    last_name: response.data.last_name || ''
                });
            } else {
                toast.error('Failed to load profile data');
            }
        } catch (error) {
            console.error('Profile load error:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!profileData.username || !profileData.email) {
            toast.error('Username and email are required');
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            if (response.success) {
                toast.success('Profile updated successfully');
                
                // Update the auth context with new user data
                const updatedUser = { ...user, ...profileData };
                login(updatedUser, localStorage.getItem('auth_token'));
            } else {
                toast.error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            toast.error('All password fields are required');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            if (response.success) {
                toast.success('Password changed successfully');
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
            } else {
                toast.error(response.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (loading && activeTab === 'profile' && !profileData.username) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="mt-2 text-gray-600">Manage your account information and security settings</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'password'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Change Password
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Profile Information Tab */}
                {activeTab === 'profile' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                            Username *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="username"
                                                name="username"
                                                type="text"
                                                required
                                                value={profileData.username}
                                                onChange={handleProfileInputChange}
                                                className="pl-10"
                                                placeholder="Enter username"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={profileData.email}
                                                onChange={handleProfileInputChange}
                                                className="pl-10"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            value={profileData.first_name}
                                            onChange={handleProfileInputChange}
                                            placeholder="Enter first name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            value={profileData.last_name}
                                            onChange={handleProfileInputChange}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex items-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Change Password Tab */}
                {activeTab === 'password' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Lock className="w-5 h-5 mr-2" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div>
                                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="current_password"
                                            name="current_password"
                                            type={showPasswords.current ? 'text' : 'password'}
                                            required
                                            value={passwordData.current_password}
                                            onChange={handlePasswordInputChange}
                                            className="pl-10 pr-10"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPasswords.current ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="new_password"
                                                name="new_password"
                                                type={showPasswords.new ? 'text' : 'password'}
                                                required
                                                value={passwordData.new_password}
                                                onChange={handlePasswordInputChange}
                                                className="pl-10 pr-10"
                                                placeholder="Enter new password"
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="confirm_password"
                                                name="confirm_password"
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                required
                                                value={passwordData.confirm_password}
                                                onChange={handlePasswordInputChange}
                                                className="pl-10 pr-10"
                                                placeholder="Confirm new password"
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• At least 6 characters long</li>
                                        <li>• Should be unique and not easily guessable</li>
                                        <li>• Consider using a mix of letters, numbers, and symbols</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end">
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex items-center"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Profile;