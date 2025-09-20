import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield, Calendar, Check, X, AlertCircle, Settings, Camera, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, login, loading: authLoading } = useAuth();
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

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);

            // Load profile data from auth context first
            if (user) {
                setProfileData({
                    username: user.username || '',
                    email: user.email || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || ''
                });
            }
        } catch (error) {
            console.error('Profile load error:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Redirect if not authenticated
    useEffect(() => {
        if (authLoading) {
            return; // Wait for auth to load
        }

        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        loadProfile();
    }, [authLoading, isAuthenticated, navigate, loadProfile]);

    // Password validation state
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    const validatePassword = useCallback((password) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        setPasswordRequirements(requirements);
        return Object.values(requirements).every(req => req);
    }, []);

    const handleProfileUpdate = useCallback(async (e) => {
        e.preventDefault();

        if (!profileData.username || !profileData.email) {
            toast.error('Username and email are required');
            return;
        }

        try {
            setLoading(true);
            // Call the profile update API
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Profile updated successfully');

                // Update the auth context with new user data
                const updatedUser = { ...user, ...profileData };
                login(updatedUser, localStorage.getItem('auth_token'));
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    }, [profileData, user, login]);

    const handlePasswordChange = useCallback(async (e) => {
        e.preventDefault();

        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            toast.error('All password fields are required');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        if (!validatePassword(passwordData.new_password)) {
            toast.error('Password does not meet requirements');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Password changed successfully');
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
                setPasswordRequirements({
                    length: false,
                    uppercase: false,
                    lowercase: false,
                    number: false,
                    special: false
                });
            } else {
                toast.error(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    }, [passwordData, validatePassword]);

    const handleProfileInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handlePasswordInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'new_password') {
            validatePassword(value);
        }
    }, [validatePassword]);

    const togglePasswordVisibility = useCallback((field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    }, []);

    // Password requirement component
    const PasswordRequirement = React.memo(({ met, text }) => (
        <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-slate-500'}`}>
            {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    ));

    if (authLoading || (loading && activeTab === 'profile' && !profileData.username)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="mt-2 text-slate-600">{authLoading ? 'Checking authentication...' : 'Loading profile...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-32 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Elite Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Profile Settings</h1>
                    <p className="text-slate-600">Manage your account information and security settings with precision</p>
                </div>

                {/* Professional Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-2">
                        <nav className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`group flex items-center space-x-3 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'profile'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-slate-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                <span>Profile Information</span>
                                {activeTab === 'profile' && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`group flex items-center space-x-3 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                                    activeTab === 'password'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-slate-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                                }`}
                            >
                                <Lock className="w-4 h-4" />
                                <span>Security Settings</span>
                                {activeTab === 'password' && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                )}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Profile Information Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Avatar Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 text-center">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User className="w-16 h-16 text-white" />
                                    </div>
                                    <button className="absolute bottom-0 right-1/2 transform translate-x-14 translate-y-2 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Camera className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">
                                    {user?.first_name} {user?.last_name}
                                </h3>
                                <p className="text-slate-500 mb-4">{user?.email}</p>
                                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 rounded-lg py-2 px-4">
                                    <Shield className="w-4 h-4" />
                                    <span className="font-medium">Verified Account</span>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Form Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                                <div className="flex items-center mb-6">
                                    <Edit3 className="w-5 h-5 mr-2 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Username *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={profileData.username}
                                                    onChange={handleProfileInputChange}
                                                    className="w-full px-4 py-3 pl-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="Enter username"
                                                    required
                                                />
                                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Email Address *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={handleProfileInputChange}
                                                    className="w-full px-4 py-3 pl-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="Enter email address"
                                                    required
                                                />
                                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={profileData.first_name}
                                                onChange={handleProfileInputChange}
                                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Enter first name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profileData.last_name}
                                                onChange={handleProfileInputChange}
                                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Saving Changes...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Settings Tab */}
                {activeTab === 'password' && (
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
                        <div className="flex items-center mb-6">
                            <Shield className="w-5 h-5 mr-2 text-blue-600" />
                            <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordInputChange}
                                        className="w-full px-4 py-3 pl-12 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your current password"
                                        required
                                    />
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('current')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            name="new_password"
                                            value={passwordData.new_password}
                                            onChange={handlePasswordInputChange}
                                            className="w-full px-4 py-3 pl-12 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Enter your new password"
                                            required
                                        />
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            name="confirm_password"
                                            value={passwordData.confirm_password}
                                            onChange={handlePasswordInputChange}
                                            className="w-full px-4 py-3 pl-12 pr-12 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Confirm your new password"
                                            required
                                        />
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                                        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                                    )}
                                </div>
                            </div>

                            {/* Password Requirements */}
                            {passwordData.new_password && (
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Password Requirements
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <PasswordRequirement met={passwordRequirements.length} text="At least 8 characters" />
                                        <PasswordRequirement met={passwordRequirements.uppercase} text="One uppercase letter" />
                                        <PasswordRequirement met={passwordRequirements.lowercase} text="One lowercase letter" />
                                        <PasswordRequirement met={passwordRequirements.number} text="One number" />
                                        <PasswordRequirement met={passwordRequirements.special} text="One special character" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !validatePassword(passwordData.new_password) || passwordData.new_password !== passwordData.confirm_password}
                                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            <span>Changing Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            <span>Change Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Security Tips */}
                        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Use a unique password that you don't use for other accounts</li>
                                <li>• Consider using a password manager to generate and store strong passwords</li>
                                <li>• Change your password regularly and if you suspect it's been compromised</li>
                                <li>• Never share your password with others or store it in unsecured locations</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;