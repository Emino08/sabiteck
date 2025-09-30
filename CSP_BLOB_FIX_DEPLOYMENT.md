# CSP Blob URL Fix - Production Deployment Guide

## Problem
Getting this error on production (sabiteck.com):
```
Refused to load the script 'blob:https://sabiteck.com/a8caca22-9659-4553-823f-5b7e5d560a06' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
```

## Root Cause
Vite's build process generates blob URLs for dynamic imports and code chunks, but the CSP policy wasn't properly configured to allow blob URLs in all the necessary directives.

## Solution Applied

### Key Changes Made:

1. **Added `script-src-elem` directive**: The error specifically mentions this fallback, so we now explicitly set it
2. **Added `data:` support**: For inline data URLs that Vite might generate
3. **Added `worker-src` directive**: For web workers that might use blob URLs
4. **Removed localhost references in production**: Cleaned up development-only URLs

## Updated Files

### 1. `.htaccess` (Frontend Root)
```apache
# Content Security Policy - Production optimized with blob support
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://gstatic.com https://www.gstatic.com; script-src-elem 'self' 'unsafe-inline' blob: data: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://gstatic.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://sabiteck.com https://backend.sabiteck.com https://www.google-analytics.com https://analytics.google.com https://accounts.google.com https://apis.google.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; worker-src 'self' blob:;"
```

### 2. `backend/public/index.php` (Backend API)
```php
// Security headers - Production optimized with blob support
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://gstatic.com https://www.gstatic.com; script-src-elem 'self' 'unsafe-inline' blob: data: https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://gstatic.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://sabiteck.com https://backend.sabiteck.com https://www.google-analytics.com https://analytics.google.com https://accounts.google.com https://apis.google.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; worker-src 'self' blob:;");
```

### 3. `frontend/vite.config.js` (Development)
```javascript
headers: {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; script-src-elem 'self' 'unsafe-inline' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' http://localhost:* https://localhost:*; frame-src 'self'; object-src 'none'; worker-src 'self' blob:;"
}
```

## Deployment Steps

### For Production Server (sabiteck.com):

1. **Upload updated `.htaccess`** to the frontend root directory
2. **Upload updated `backend/public/index.php`** to the backend directory
3. **Clear server cache** if applicable
4. **Test the application** in production

### For Development:

1. **Updated `frontend/vite.config.js`** is already configured
2. **Restart development server**: `npm run dev`

## Verification

After deployment, verify the fix by:

1. **Opening browser dev tools** on sabiteck.com
2. **Check Console tab** - should not see CSP blob URL errors
3. **Check Network tab** - blob URLs should load successfully
4. **Test dynamic functionality** like admin dashboard, tools, etc.

## Technical Details

### What Changed:

- **Added `blob:` and `data:` to `script-src`**: Allows Vite-generated blob URLs
- **Added explicit `script-src-elem`**: Prevents fallback issues
- **Added `worker-src 'self' blob:`**: Supports web workers
- **Removed localhost references**: Production-only CSP

### Why This Fixes the Issue:

1. **Vite Code Splitting**: Vite generates blob URLs for dynamic imports
2. **CSP Enforcement**: Browser blocks blob URLs not explicitly allowed
3. **script-src-elem**: Modern browsers use this for script element sources
4. **Comprehensive Coverage**: All potential blob URL use cases are covered

## Fallback Options

If the main fix doesn't work, try these alternatives:

### Option 1: More Permissive CSP (temporary)
```apache
Header always set Content-Security-Policy "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https:; object-src 'none';"
```

### Option 2: Disable CSP Temporarily (debugging only)
```apache
# Header always set Content-Security-Policy "..."
```

### Option 3: Vite Build Alternative
In `vite.config.js`, try:
```javascript
build: {
  rollupOptions: {
    output: {
      inlineDynamicImports: true
    }
  }
}
```

## Security Notes

- **Blob URLs are necessary** for modern JavaScript bundlers
- **Limited scope**: Only allows blob URLs from same origin
- **Google services preserved**: OAuth and Analytics still work
- **Maintains security**: Other CSP protections remain active

## Support

If issues persist:
1. Check browser dev tools for specific CSP errors
2. Verify server configuration supports `.htaccess` headers
3. Test with different browsers
4. Check server error logs for conflicting headers