// API utility for making requests to the backend - UPDATED to fix authorization issues
import { secureLog } from './security';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// No mock data - all data will come from the backend database

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available - check multiple storage keys
    const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
    secureLog('info', 'Checking tokens', {
      auth_token: localStorage.getItem('auth_token') ? 'EXISTS' : 'NULL',
      admin_token: localStorage.getItem('admin_token') ? 'EXISTS' : 'NULL',
      token: localStorage.getItem('token') ? 'EXISTS' : 'NULL',
      final_token: token ? 'EXISTS' : 'NONE'
    });

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      },
      ...options
    };

    secureLog('info', 'Making API request', {
      url: url,
      hasAuth: token ? 'Bearer ***' : 'No token'
    });

    const response = await fetch(url, config);

    // Check if response is JSON by checking content-type header
    const contentType = response.headers.get('content-type');
    const isJsonResponse = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let errorData = {};
      let errorMessage = 'Unknown error';

      if (isJsonResponse) {
        errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.error || errorData.message || 'Unknown error';
      } else {
        // If it's not JSON, it's likely an HTML error page
        const errorText = await response.text().catch(() => 'Unknown error');
        errorMessage = `Server returned HTML error page (status ${response.status})`;
        secureLog('error', 'Non-JSON error response', {
          status: response.status,
          contentType,
          textPreview: errorText.substring(0, 200)
        });
      }

      secureLog('error', 'API request failed', {
        status: response.status,
        error: errorMessage,
        isJson: isJsonResponse
      });

      // For auth errors, throw to let components handle login
      if (response.status === 401) {
        secureLog('warn', 'Auth error on endpoint', { endpoint });
        throw new Error(`Unauthorized: ${errorMessage}`);
      }

      // For other errors, throw to let components handle them
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }

    // Only try to parse JSON if the response is actually JSON
    if (!isJsonResponse) {
      secureLog('warn', 'Expected JSON but got different content type', {
        contentType,
        endpoint
      });
      throw new Error(`Server returned non-JSON response: ${contentType || 'unknown content type'}`);
    }

    const data = await response.json().catch((parseError) => {
      secureLog('error', 'Failed to parse JSON response', {
        parseError: parseError.message,
        endpoint
      });
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    });
    secureLog('info', 'API request successful', { hasData: !!data });

    // If the response already has success flag, return it as-is
    if (data.success !== undefined) {
      return data;
    }

    // Otherwise wrap it in our standard format
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Success',
      pagination: data.pagination
    };

  } catch (error) {
    secureLog('error', 'API Request Error', { error: error.message });

    // For auth errors, re-throw to let components handle login
    if (error.message.includes('Unauthorized')) {
      throw error;
    }

    // For network errors, throw to let components handle them
    throw new Error(`Network Error: ${error.message}`);
  }
};

// Helper functions for common API operations
export const get = (endpoint) => apiRequest(endpoint);

export const post = (endpoint, data) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const put = (endpoint, data) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const del = (endpoint) => apiRequest(endpoint, {
  method: 'DELETE'
});

// Auth helpers
export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};