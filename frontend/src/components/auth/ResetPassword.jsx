import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Key, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState(tokenFromUrl ? 'reset' : 'verify');
  const [passcode, setPasscode] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [userInfo, setUserInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyToken = async (tokenToVerify) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.data);
        setToken(data.data.token);
        setStep('reset');
        toast.success('Token verified successfully');
      } else {
        toast.error(data.error || 'Invalid or expired token');
        setStep('verify');
      }
    } catch (error) {
      console.error('Verify token error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPasscode = async () => {
    if (!passcode || passcode.length !== 6) {
      toast.error('Please enter a valid 6-digit passcode');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.data);
        setToken(data.data.token);
        setStep('reset');
        toast.success('Passcode verified successfully');
      } else {
        toast.error(data.error || 'Invalid or expired passcode');
      }
    } catch (error) {
      console.error('Verify passcode error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-4 py-12 pt-24">
        <Card className="w-full max-w-md bg-black/30 backdrop-blur-xl border-white/10">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-500/20 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Password Reset Successful!
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Your password has been reset successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-gray-300">
                Redirecting you to login page in a few seconds...
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-4 py-12 pt-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 bg-black/30 backdrop-blur-xl border-white/10">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-indigo-500/20 rounded-full">
                <Key className="w-12 h-12 text-indigo-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Enter Your Passcode
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Enter the 6-digit passcode sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-white mb-2">
                6-Digit Passcode
              </label>
              <Input
                id="passcode"
                type="text"
                placeholder="000000"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                maxLength={6}
              />
            </div>

            <Button
              onClick={verifyPasscode}
              disabled={loading || passcode.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Verify Passcode
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Didn't receive a passcode?{' '}
                <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Request new one
                </Link>
              </p>
              <p className="text-gray-400 text-sm">
                or{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-black/30 backdrop-blur-xl border-white/10">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-500/20 rounded-full">
              <Lock className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white mb-2">
            Reset Your Password
          </CardTitle>
          {userInfo && (
            <CardDescription className="text-gray-300 text-base">
              <Mail className="w-4 h-4 inline mr-1" />
              {userInfo.email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-12 bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-12 bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-2">Password Requirements:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li className={newPassword.length >= 8 ? 'text-green-400' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-green-400' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? 'text-green-400' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? 'text-green-400' : ''}>
                  • One number
                </li>
                <li className={newPassword && newPassword === confirmPassword ? 'text-green-400' : ''}>
                  • Passwords match
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
