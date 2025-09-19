import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRouteSettings } from '../contexts/RouteSettingsContext';
import { useAuth } from '../contexts/AuthContext';

const RouteGuard = ({ children, routeName, fallbackPath = '/404' }) => {
  const { isRouteEnabled, loading } = useRouteSettings();
  const { user, isAdmin } = useAuth();

  // Show loading state while fetching route settings
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin users can access all routes regardless of settings
  if (isAdmin) {
    return children;
  }

  // Check if the route is enabled for public users
  if (!isRouteEnabled(routeName)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RouteGuard;
