import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRouteSettings } from '../../contexts/RouteSettingsContext';

const RouteDisabledPage = ({ routeName }) => {
  return (
    <div className="min-h-screen pt-20 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Temporarily Unavailable</h1>
          <p className="text-gray-600 mb-6">
            The {routeName} page is currently disabled for maintenance. Please check back later.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

const RouteGuard = ({ children, routeName }) => {
  const { isRouteEnabled, loading } = useRouteSettings();

  // Show loading spinner while fetching route settings
  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Special handling for home route - never disable it completely
  if (routeName === 'home') {
    return children;
  }

  // Check if route is enabled
  if (!isRouteEnabled(routeName)) {
    return <RouteDisabledPage routeName={routeName} />;
  }

  // Route is enabled, render the component
  return children;
};

export default RouteGuard;
