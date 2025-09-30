import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Building2, Crown, Shield, Star, Zap, Rocket, Diamond, Phone, Sparkles } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
            
            const response = await apiRequest('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            if (response.success) {
                toast.success('Account created successfully! Please log in.');
                // Pass along the return URL and message for login redirect
                const returnTo = location.state?.returnTo;
                const message = location.state?.message;
                navigate('/login', {
                    state: {
                        returnTo,
                        message: message || 'Welcome! Please sign in to complete your action.',
                        fromRegistration: true
                    }
                });
            } else {
                toast.error(response.message || 'Registration failed');
            }
        } catch (err) {
            toast.error('Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            // Use server-initiated OAuth flow to avoid CSP issues
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8002';

            toast.info('Redirecting to Google for authentication...');

            // Let the server handle the OAuth redirect to avoid CSP issues
            window.location.href = `${apiUrl}/api/auth/google/redirect`;
        } catch (error) {
            toast.error('Failed to initialize Google authentication');
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col justify-center pt-32 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
                {/* Elite Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <Sparkles className="w-12 h-12 text-indigo-400" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                        Join the Elite Platform
                    </h2>
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Premium Membership Registration</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 mb-6">
                        Create your professional account and unlock exclusive features
                    </p>
                    <p className="text-sm text-gray-400">
                        Already have an elite account?{' '}
                        <Link
                            to="/login"
                            state={{
                                returnTo: location.state?.returnTo,
                                message: location.state?.message
                            }}
                            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Access Your Portal
                        </Link>
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    {/* Elite Google Sign Up Button */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full flex justify-center items-center py-4 px-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 hover:scale-105"
                        >
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                            Elite Google Registration
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-black/30 backdrop-blur-lg text-gray-300 rounded-lg">
                                💎 Or create with credentials
                            </span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-bold text-white mb-3">
                                    Elite First Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <User className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                        placeholder="Your first name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-bold text-white mb-3">
                                    Elite Last Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <User className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        required
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                        placeholder="Your last name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-white mb-3">
                                Elite Email Address *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Mail className="h-5 w-5 text-indigo-400" />
                                    <Diamond className="h-4 w-4 text-purple-400 animate-pulse" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Your premium email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-bold text-white mb-3">
                                Elite Username *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <User className="h-5 w-5 text-indigo-400" />
                                    <Crown className="h-4 w-4 text-yellow-400 animate-pulse" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Your elite handle"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-bold text-white mb-3">
                                Elite Contact Number
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <Phone className="h-5 w-5 text-indigo-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 hover:border-white/30"
                                    placeholder="Your contact number (optional)"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="organization" className="block text-sm font-bold text-white mb-3">
                                Elite Organization
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Building2 className="h-5 w-5 text-indigo-400" />
                                    <Shield className="h-4 w-4 text-purple-400 animate-pulse" />
                                </div>
                                <input
                                    id="organization"
                                    name="organization"
                                    type="text"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Your elite organization (optional)"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-white mb-3">
                                Elite Security Key *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Lock className="h-5 w-5 text-indigo-400" />
                                    <Shield className="h-4 w-4 text-purple-400 animate-pulse" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-16 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Create secure passphrase (6+ chars)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-indigo-400 hover:text-indigo-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-indigo-400 hover:text-indigo-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-bold text-white mb-3">
                                Confirm Elite Security Key *
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                    <Lock className="h-5 w-5 text-indigo-400" />
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
                                    className="w-full pl-16 pr-16 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Confirm your secure passphrase"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-indigo-400 hover:text-indigo-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-indigo-400 hover:text-indigo-300" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {submitting ? (
                                    <>
                                        <Zap className="w-5 h-5 mr-2 animate-spin" />
                                        Creating Elite Account...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5 mr-2" />
                                        <Crown className="w-4 h-4 mr-1" />
                                        Create Elite Account
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
                                    💎 Elite Terms & Policies
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Shield className="w-3 h-3 mr-1" />
                                By creating an elite account, you agree to our{' '}
                            </p>
                            <div className="mt-2 space-x-4">
                                <Link to="/terms" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                                    <Diamond className="w-4 h-4 mr-1" />
                                    Terms of Service
                                </Link>
                                <span className="text-gray-500">•</span>
                                <Link to="/privacy" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                                    <Shield className="w-4 h-4 mr-1" />
                                    Privacy Policy
                                </Link>
                            </div>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                                Join thousands of elite professionals worldwide
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;