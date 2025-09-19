import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const RouteSettingsContext = createContext();

export const useRouteSettings = () => {
  const context = useContext(RouteSettingsContext);
  if (!context) {
    throw new Error('useRouteSettings must be used within a RouteSettingsProvider');
  }
  return context;
};

export const RouteSettingsProvider = ({ children }) => {
  const [routeSettings, setRouteSettings] = useState({
    home: { enabled: true },
    about: { enabled: true },
    services: { enabled: true },
    portfolio: { enabled: true },
    jobs: { enabled: true },
    scholarships: { enabled: true },
    blog: { enabled: true },
    contact: { enabled: true },
    team: { enabled: true },
    news: { enabled: true },
    tools: { enabled: true }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRouteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the public route settings endpoint (no auth required)
      const response = await ApiService.getRouteSettings();

      if (response && response.success) {
        setRouteSettings(response.routes || {});
      }
    } catch (error) {
      console.error('Error fetching route settings:', error);
      setError('Failed to load route settings');
      // Don't block the app - use default settings if API fails
      setRouteSettings({
        home: { enabled: true },
        about: { enabled: true },
        services: { enabled: true },
        portfolio: { enabled: true },
        jobs: { enabled: true },
        scholarships: { enabled: true },
        blog: { enabled: true },
        contact: { enabled: true },
        team: { enabled: true },
        news: { enabled: true },
        tools: { enabled: true }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRouteSettings = async (routes, adminToken) => {
    try {
      if (!adminToken) {
        return { success: false, error: 'Authentication token required' };
      }

      const response = await ApiService.updateRouteSettings(adminToken, routes);

      if (response && response.success) {
        setRouteSettings(response.routes || routes);
        return { success: true };
      } else {
        return { success: false, error: response?.error || 'Failed to update route settings' };
      }
    } catch (error) {
      console.error('Error updating route settings:', error);
      return { success: false, error: 'Failed to update route settings' };
    }
  };

  const isRouteEnabled = (routeName) => {
    if (!routeName) return true;
    return routeSettings[routeName]?.enabled !== false;
  };

  const getActiveRoutes = () => {
    return Object.keys(routeSettings).filter(routeName =>
      routeSettings[routeName]?.enabled !== false
    );
  };

  const getRouteInfo = (routeName) => {
    return routeSettings[routeName] || { enabled: false };
  };

  useEffect(() => {
    fetchRouteSettings();
  }, []);

  const value = {
    routeSettings,
    loading,
    error,
    fetchRouteSettings,
    updateRouteSettings,
    isRouteEnabled,
    getActiveRoutes,
    getRouteInfo
  };

  return (
    <RouteSettingsContext.Provider value={value}>
      {children}
    </RouteSettingsContext.Provider>
  );
};
