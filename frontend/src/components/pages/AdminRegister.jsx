import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Building2, Crown, Shield, Star, Zap, Rocket, Diamond, Phone, Sparkles } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const AdminRegister = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        phone: '',
        organization: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Redirect authenticated users
    useEffect(() => {
        if (!loading && isAuthenticated()) {
            if (isAdmin()) {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [loading, isAuthenticated, isAdmin, navigate]);

    // Show loading spinner while checking auth status
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <Zap className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-white">Checking authentication...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.username || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setSubmitting(true);
            const { confirmPassword, ...registerData } = formData;

            const response = await apiRequest('/api/auth/admin-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            if (response.message) {
                toast.success('Admin account created successfully! You can now log in.');
                navigate('/login', {
                    state: {
                        message: 'Admin account created! Please sign in to access the dashboard.',
                        fromRegistration: true
                    }
                });
            } else {
                toast.error(response.error || 'Admin registration failed');
            }
        } catch (err) {
            toast.error('Admin registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 flex flex-col justify-center pt-32 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Admin Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
                {/* Admin Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <Crown className="w-12 h-12 text-red-400" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-white via-red-200 to-orange-200 bg-clip-text text-transparent">
                        Admin Portal Registration
                    </h2>
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Administrator Account Creation</span>
                        <Crown className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 mb-6">
                        Create your administrative account with elevated privileges
                    </p>
                    <p className="text-sm text-gray-400">
                        Already have admin access?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-red-400 hover:text-red-300 transition-colors"
                        >
                            Access Admin Portal
                        </Link>
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-bold text-white mb-3">
                                    Admin First Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <User className="h-5 w-5 text-red-400" />
                                    </div>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                        placeholder="Your first name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-bold text-white mb-3">
                                    Admin Last Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <User className="h-5 w-5 text-red-400" />
                                    </div>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                        placeholder="Your last name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-white mb-3">
                                Admin Email Address *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Mail className="h-5 w-5 text-red-400" />
                                    <Crown className="h-4 w-4 text-yellow-400 animate-pulse" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Admin email address"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-bold text-white mb-3">
                                Admin Username *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <User className="h-5 w-5 text-red-400" />
                                    <Shield className="h-4 w-4 text-orange-400 animate-pulse" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Administrative username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-bold text-white mb-3">
                                Admin Contact Number
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <Phone className="h-5 w-5 text-red-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                    placeholder="Your contact number (optional)"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="organization" className="block text-sm font-bold text-white mb-3">
                                Admin Organization
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Building2 className="h-5 w-5 text-red-400" />
                                    <Shield className="h-4 w-4 text-orange-400 animate-pulse" />
                                </div>
                                <input
                                    id="organization"
                                    name="organization"
                                    type="text"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Your organization (optional)"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-white mb-3">
                                Admin Security Key *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Lock className="h-5 w-5 text-red-400" />
                                    <Shield className="h-4 w-4 text-orange-400 animate-pulse" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-16 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Create admin passphrase (6+ chars)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-red-400 hover:text-red-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-red-400 hover:text-red-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-bold text-white mb-3">
                                Confirm Admin Security Key *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Lock className="h-5 w-5 text-red-400" />
                                    <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-16 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Confirm admin passphrase"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-red-400 hover:text-red-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-red-400 hover:text-red-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {submitting ? (
                                    <>
                                        <Zap className="w-5 h-5 mr-2 animate-spin" />
                                        Creating Admin Account...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5 mr-2" />
                                        <Crown className="w-4 h-4 mr-1" />
                                        Create Admin Account
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-black/30 backdrop-blur-lg text-gray-300 rounded-lg">
                                    👑 Admin Terms & Policies
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Shield className="w-3 h-3 mr-1" />
                                By creating an admin account, you agree to our{' '}
                            </p>
                            <div className="mt-2 space-x-4">
                                <Link to="/terms" className="inline-flex items-center text-sm text-red-400 hover:text-red-300 transition-colors font-semibold">
                                    <Diamond className="w-4 h-4 mr-1" />
                                    Admin Terms
                                </Link>
                                <span className="text-gray-500">•</span>
                                <Link to="/privacy" className="inline-flex items-center text-sm text-red-400 hover:text-red-300 transition-colors font-semibold">
                                    <Shield className="w-4 h-4 mr-1" />
                                    Privacy Policy
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Crown className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                                Administrative privileges - Use responsibly
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;