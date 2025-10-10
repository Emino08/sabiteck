/**
 * Error handling utilities for consistent error display across the application
 */

/**
 * Extract error message from various error formats
 * @param {Error|Object|string} error - The error object
 * @param {string} defaultMessage - Default message if no specific error found
 * @returns {string} - Formatted error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // If error is a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property (Error object)
  if (error?.message) {
    // Extract the actual message from API Error format: "API Error 400: message"
    const apiErrorMatch = error.message.match(/API Error \d+: (.+)/);
    if (apiErrorMatch) {
      return apiErrorMatch[1];
    }
    
    // Extract from Unauthorized format: "Unauthorized: message"
    const authErrorMatch = error.message.match(/Unauthorized: (.+)/);
    if (authErrorMatch) {
      return authErrorMatch[1];
    }
    
    // Return the message as-is if no pattern matched
    return error.message;
  }

  // If error has an error property (API response format)
  if (error?.error) {
    return error.error;
  }

  // If error has a data.error property (nested format)
  if (error?.data?.error) {
    return error.data.error;
  }

  // If error has a data.message property
  if (error?.data?.message) {
    return error.data.message;
  }

  // If error has response.data.error (axios-style format)
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // If error has response.data.message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Return default message if nothing matched
  return defaultMessage;
};

/**
 * Get error details including code and message
 * @param {Error|Object|string} error - The error object
 * @returns {Object} - Object with code and message
 */
export const getErrorDetails = (error) => {
  const details = {
    code: null,
    message: getErrorMessage(error)
  };

  // Extract error code from API Error format
  const codeMatch = error?.message?.match(/API Error (\d+):/);
  if (codeMatch) {
    details.code = parseInt(codeMatch[1]);
  }

  // Check for error_code in response
  if (error?.error_code) {
    details.code = error.error_code;
  }

  if (error?.data?.error_code) {
    details.code = error.data.error_code;
  }

  return details;
};

/**
 * Format error message with code for display
 * @param {Error|Object|string} error - The error object
 * @param {string} defaultMessage - Default message if no specific error found
 * @returns {string} - Formatted error message with code
 */
export const formatErrorMessage = (error, defaultMessage = 'An error occurred') => {
  const details = getErrorDetails(error);
  
  if (details.code) {
    return `[${details.code}] ${details.message}`;
  }
  
  return details.message || defaultMessage;
};

/**
 * Handle error and show toast notification
 * @param {Error|Object|string} error - The error object
 * @param {Function} toast - Toast function from sonner
 * @param {string} defaultMessage - Default message if no specific error found
 */
export const handleErrorToast = (error, toast, defaultMessage = 'An error occurred') => {
  const errorMessage = formatErrorMessage(error, defaultMessage);
  toast.error(errorMessage);
  console.error('Error:', error);
};

/**
 * Check if error is an authentication error
 * @param {Error|Object|string} error - The error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('unauthorized') || 
           error.toLowerCase().includes('authentication');
  }
  
  if (error?.message) {
    return error.message.toLowerCase().includes('unauthorized') || 
           error.message.toLowerCase().includes('authentication') ||
           error.message.includes('API Error 401');
  }
  
  const details = getErrorDetails(error);
  return details.code === 401;
};

/**
 * Check if error is a validation error
 * @param {Error|Object|string} error - The error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  const details = getErrorDetails(error);
  return details.code === 400 || details.code === 422;
};
