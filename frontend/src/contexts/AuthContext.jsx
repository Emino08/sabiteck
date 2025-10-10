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
    const [mustChangePassword, setMustChangePassword] = useState(false);

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
                    // Set state synchronously to prevent flash
                    setToken(storedToken);
                    setUser(userData);
                    setMustChangePassword(userData.must_change_password || false);
                    setLoading(false);
                } catch (parseError) {
                    logout();
                    setLoading(false);
                }
            } else {
                setUser(null);
                setToken(null);
                setMustChangePassword(false);
                setLoading(false);
            }
        } catch (error) {
            logout();
            setLoading(false);
        }
    };

    const login = (userData, authToken, permissions = null, modules = null) => {
        // Ensure permissions and modules are included in user data
        const enrichedUserData = {
            ...userData,
            permissions: permissions || userData.permissions || [],
            modules: modules || userData.modules || []
        };
        
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user', JSON.stringify(enrichedUserData));
        setToken(authToken);
        setUser(enrichedUserData);
        setMustChangePassword(enrichedUserData.must_change_password || false);
    };

    const isAuthenticated = useCallback(() => {
        return !!(token && user);
    }, [token, user]);

    const isAdmin = useCallback(() => {
        if (!user) return false;

        // Check for dashboard.view permission (all staff roles have this)
        if (user.permissions && Array.isArray(user.permissions)) {
            const hasDashboardAccess = user.permissions.some(p =>
                (typeof p === 'string' && p === 'dashboard.view') ||
                (typeof p === 'object' && p.name === 'dashboard.view')
            );
            if (hasDashboardAccess) return true;
        }

        // Fallback: Check role_name
        const userRole = user.role_name;
        return !!(userRole && userRole !== 'user');
    }, [user]);

    const hasPermission = useCallback((permission) => {
        if (!user) return false;

        // Super admin has all permissions
        if (user.role_name === 'admin') return true;

        // Check if permission exists in permissions array
        if (Array.isArray(user.permissions)) {
            return user.permissions.some(p => {
                // Handle both string and object formats
                if (typeof p === 'string') {
                    return p === permission;
                }
                return p.name === permission;
            });
        }

        return false;
    }, [user]);

    const hasAnyPermission = useCallback((permissions) => {
        if (!user) return false;
        if (!Array.isArray(permissions) || permissions.length === 0) return false;

        // Super admin has all permissions
        if (user.role_name === 'admin') return true;

        // Check if user has at least one of the required permissions
        return permissions.some(permission => hasPermission(permission));
    }, [user, hasPermission]);

    const hasAllPermissions = useCallback((permissions) => {
        if (!user) return false;
        if (!Array.isArray(permissions) || permissions.length === 0) return true;

        // Super admin has all permissions
        if (user.role_name === 'admin') return true;

        // Check if user has all required permissions
        return permissions.every(permission => hasPermission(permission));
    }, [user, hasPermission]);

    const isSuperAdmin = useCallback(() => {
        if (!user) return false;

        // Super admin is determined by role_name='admin'
        const userRoleName = user.role_name;

        const isTrueSuperAdmin = (
            userRoleName === 'admin' ||
            userRoleName === 'Administrator' ||
            userRoleName === 'super_admin'
        );

        return isTrueSuperAdmin;
    }, [user]);

    const logout = useCallback(() => {
        // Check if user is admin before clearing data
        const wasAdmin = user && isAdmin();
        
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        
        // Return redirect path based on previous role
        return wasAdmin ? '/admin' : '/login';
    }, [user, isAdmin]);

    const value = {
        user,
        token,
        loading,
        mustChangePassword,
        login,
        logout,
        isAuthenticated,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isSuperAdmin,
        refreshAuth: checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;