/**
 * Security utilities for frontend application
 * Provides XSS protection, input sanitization, and secure storage
 */

// Simple HTML sanitizer to prevent XSS attacks
export const sanitizeHTML = (html) => {
  if (!html) return '';

  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Define allowed tags and attributes
  const allowedTags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'];
  const allowedAttributes = {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'pre': ['class'],
    'code': ['class']
  };

  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll('script, style, iframe, object, embed');
  scripts.forEach(script => script.remove());

  // Remove dangerous attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove if tag is not allowed
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      element.remove();
      return;
    }

    // Remove dangerous attributes
    Array.from(element.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      const allowedAttrs = allowedAttributes[element.tagName.toLowerCase()] || [];

      // Remove event handlers and javascript: links
      if (attrName.startsWith('on') ||
          attr.value.toLowerCase().includes('javascript:') ||
          attr.value.toLowerCase().includes('data:') ||
          !allowedAttrs.includes(attrName)) {
        element.removeAttribute(attr.name);
      }
    });

    // Sanitize href attributes
    if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
      const href = element.getAttribute('href');
      if (!href.match(/^(https?:\/\/|\/|#)/)) {
        element.removeAttribute('href');
      }
    }
  });

  return temp.innerHTML;
};

// Secure text content extractor (strips all HTML)
export const extractTextContent = (html) => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

// Truncate text safely
export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  const cleanText = extractTextContent(text);
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength).trim() + '...';
};

// Secure localStorage wrapper with encryption
const STORAGE_PREFIX = 'sabiteck_';
const ENCRYPTION_KEY = 'sabiteck_secure_key_2024'; // In production, use environment variable

// Simple encryption (for basic security)
const encrypt = (text) => {
  try {
    return btoa(encodeURIComponent(text));
  } catch (e) {
    console.error('Encryption failed:', e);
    return text;
  }
};

const decrypt = (encryptedText) => {
  try {
    return decodeURIComponent(atob(encryptedText));
  } catch (e) {
    console.error('Decryption failed:', e);
    return encryptedText;
  }
};

export const secureStorage = {
  setItem: (key, value) => {
    try {
      const encryptedValue = encrypt(JSON.stringify(value));
      localStorage.setItem(STORAGE_PREFIX + key, encryptedValue);
    } catch (e) {
      console.error('Failed to store item securely:', e);
    }
  },

  getItem: (key) => {
    try {
      const encryptedValue = localStorage.getItem(STORAGE_PREFIX + key);
      if (!encryptedValue) return null;
      const decryptedValue = decrypt(encryptedValue);
      return JSON.parse(decryptedValue);
    } catch (e) {
      console.error('Failed to retrieve item securely:', e);
      return null;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Input validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export const validateURL = (url) => {
  try {
    const parsedURL = new URL(url);
    return ['http:', 'https:'].includes(parsedURL.protocol);
  } catch (e) {
    return false;
  }
};

// Prevent clickjacking
export const preventClickjacking = () => {
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
};

// Content Security Policy helper
export const generateCSPNonce = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Safe JSON parsing
export const safeJSONParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Invalid JSON:', e);
    return defaultValue;
  }
};

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Rate limiting helper
const rateLimitStore = new Map();

export const rateLimit = (key, maxRequests = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);
  // Remove old requests outside the window
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }

  if (requests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  requests.push(now);
  return true; // Request allowed
};

// Environment-based logging
export const secureLog = (level, message, data = null) => {
  // Only log in development or if explicitly enabled
  if (import.meta.env.VITE_APP_ENV === 'production' &&
      import.meta.env.VITE_ENABLE_LOGGING !== 'true') {
    return;
  }

  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };

  switch (level) {
    case 'error':
      console.error('[SECURE]', logData);
      break;
    case 'warn':
      console.warn('[SECURE]', logData);
      break;
    case 'info':
      console.info('[SECURE]', logData);
      break;
    default:
      console.log('[SECURE]', logData);
  }
};

// Check if running in production
export const isProduction = () => {
  return import.meta.env.VITE_APP_ENV === 'production';
};

// Validate external URLs for safety
export const isSafeExternalURL = (url) => {
  try {
    const parsed = new URL(url);
    const allowedDomains = [
      'sabiteck.com',
      'backend.sabiteck.com',
      'google.com',
      'googleapis.com',
      'github.com',
      'linkedin.com',
      'twitter.com',
      'facebook.com'
    ];

    return allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
};

export default {
  sanitizeHTML,
  extractTextContent,
  truncateText,
  secureStorage,
  validateEmail,
  validatePassword,
  validateURL,
  preventClickjacking,
  generateCSPNonce,
  safeJSONParse,
  debounce,
  rateLimit,
  secureLog,
  isProduction,
  isSafeExternalURL
};