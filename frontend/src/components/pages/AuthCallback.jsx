import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [status, setStatus] = useState('processing'); // processing, success, error

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(location.search);
                const token = urlParams.get('token');
                const userString = urlParams.get('user');
                const error = urlParams.get('error');

                if (error) {
                    setStatus('error');
                    toast.error('Google authentication failed: ' + error);
                    setTimeout(() => navigate('/login'), 3000);
                    return;
                }

                if (!token || !userString) {
                    setStatus('error');
                    toast.error('Invalid authentication response');
                    setTimeout(() => navigate('/login'), 3000);
                    return;
                }

                const user = JSON.parse(decodeURIComponent(userString));

                // Use the AuthContext login function
                login(user, token);

                setStatus('success');
                toast.success(`Welcome back, ${user.first_name}! You are now signed in.`);

                // Redirect based on user role after a brief delay
                setTimeout(() => {
                    if (user.role === 'admin' || user.role === 'super_admin') {
                        navigate('/dashboard');
                    } else {
                        navigate('/');
                    }
                }, 2000);

            } catch (error) {
                setStatus('error');
                toast.error('Authentication processing failed');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [location, login, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col justify-center items-center px-6 pt-24">
            <div className="max-w-md w-full bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
                {status === 'processing' && (
                    <>
                        <div className="relative mb-8">
                            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20 mx-auto w-fit">
                                <Zap className="w-12 h-12 text-indigo-400 animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                            Processing Authentication
                        </h2>
                        <p className="text-gray-300 mb-6">
                            We're securely logging you in with Google...
                        </p>
                        <div className="flex justify-center items-center space-x-2">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-400">Secured by OAuth 2.0</span>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="relative mb-8">
                            <div className="absolute -inset-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur opacity-75 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20 mx-auto w-fit">
                                <CheckCircle className="w-12 h-12 text-green-400" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                            Authentication Successful!
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Welcome back! Redirecting you to your dashboard...
                        </p>
                        <div className="flex justify-center items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Signed in successfully</span>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="relative mb-8">
                            <div className="absolute -inset-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20 mx-auto w-fit">
                                <XCircle className="w-12 h-12 text-red-400" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white via-red-200 to-pink-200 bg-clip-text text-transparent">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Something went wrong during sign-in. Redirecting to login page...
                        </p>
                        <div className="flex justify-center items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Please try again</span>
                        </div>
                    </>
                )}

                <div className="mt-8 text-xs text-gray-400">
                    <p className="flex items-center justify-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Powered by enterprise-grade security
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;