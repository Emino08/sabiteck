import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(userData);
                } catch (parseError) {
                    console.error('Error parsing stored user data:', parseError);
                    logout();
                }
            } else {
                setUser(null);
                setToken(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, authToken) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = useCallback(() => {
        return !!(token && user);
    }, [token, user]);

    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return user.permissions?.includes(permission) || false;
    }, [user]);

    const isAdmin = useCallback(() => {
        if (!user) return false;
        return ['super_admin', 'admin'].includes(user.role);
    }, [user]);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
        hasPermission,
        isAdmin,
        refreshAuth: checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;