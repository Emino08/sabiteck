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
  const [routeSettings, setRouteSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRouteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the public route settings endpoint (no auth required)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
      const response = await fetch(`${API_BASE_URL}/api/settings/routes`);
      const data = await response.json();

      if (data && data.success) {
        setRouteSettings(data.routes || []);
      } else {
        throw new Error('Failed to fetch route settings');
      }
    } catch (error) {
      console.error('Error fetching route settings:', error);
      setError('Failed to load route settings');
      // Don't block the app - use empty array if API fails
      setRouteSettings([]);
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
    const route = routeSettings.find(r => r.route_name === routeName);
    return route ? route.is_visible : false;
  };

  const getActiveRoutes = () => {
    return routeSettings.filter(route => route.is_visible).map(route => route.route_name);
  };

  const getRouteInfo = (routeName) => {
    return routeSettings.find(r => r.route_name === routeName) || { enabled: false };
  };

  const getAllRoutes = () => {
    return routeSettings;
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
    getRouteInfo,
    getAllRoutes
  };

  return (
    <RouteSettingsContext.Provider value={value}>
      {children}
    </RouteSettingsContext.Provider>
  );
};
