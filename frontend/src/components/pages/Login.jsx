import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Crown, Sparkles, Shield, Zap, Rocket, Diamond, Star } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const returnTo = location.state?.returnTo || '/';
    const message = location.state?.message;
    const fromRegistration = location.state?.fromRegistration;
    const isLikeAction = returnTo.includes('autoLike=true');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.success) {
                // Use the AuthContext login function
                login(response.data.user, response.data.token);

                // Show appropriate success message
                if (isLikeAction) {
                    toast.success('Welcome back! Redirecting to activate your like...');
                } else {
                    toast.success(response.message || 'Login successful!');
                }

                // Redirect to return URL or dashboard
                navigate(returnTo, { replace: true });
            } else {
                toast.error(response.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Login failed. Please try again.');
        } finally {
            setLoading(false);
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

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Elite Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <Shield className="w-12 h-12 text-indigo-400" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                        Elite Access Portal
                    </h2>
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Professional Authentication System</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 mb-6">
                        Access your premium workspace with enterprise-grade security
                    </p>

                    {/* Special message for like actions */}
                    {(message || isLikeAction) && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                {isLikeAction && <Heart className="h-5 w-5 text-red-400" />}
                                <span className="text-white font-semibold">
                                    {fromRegistration ? 'Welcome!' : 'Almost there!'}
                                </span>
                            </div>
                            <p className="text-blue-100 text-sm text-center">
                                {message || (isLikeAction ? 'Sign in to activate your like and join the conversation' : 'Sign in to continue')}
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-gray-400">
                        New to our platform?{' '}
                        <Link
                            to="/register"
                            state={{
                                returnTo: location.state?.returnTo,
                                message: location.state?.message
                            }}
                            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Create Elite Account
                        </Link>
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-bold text-white mb-3">
                                Elite Username
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
                                    autoComplete="username"
                                    required
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Enter your elite credentials"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-white mb-3">
                                Elite Security Key
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
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-16 pr-16 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-white/30"
                                    placeholder="Enter your secure passphrase"
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
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <Zap className="w-5 h-5 mr-2 animate-spin" />
                                        Authenticating Elite Access...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5 mr-2" />
                                        Access Elite Portal
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
                                    💎 Elite Support Available
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                to="/contact"
                                className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                            >
                                <Diamond className="w-4 h-4 mr-1" />
                                Contact Elite Support
                            </Link>
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Shield className="w-3 h-3 mr-1" />
                                Protected by enterprise-grade security
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;