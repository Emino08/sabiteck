# Analytics.js MIME Type Fix - Deployment Guide

## Problem
Getting this error on production (sabiteck.com):
```
Refused to execute script from 'https://sabiteck.com/analytics.js' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.
```

## Root Cause
The `analytics.js` file was being served with `text/html` MIME type instead of `application/javascript`, likely because:
1. The file doesn't exist at the expected location
2. The server is returning a 404 HTML page instead of the JS file
3. MIME type configuration is missing

## Solution Applied

### Files Updated:

1. **`.htaccess`** - Added MIME type configuration
2. **`analytics.js`** - Created in root directory for production
3. **`frontend/public/analytics.js`** - Added for Vite development
4. **`frontend/vite.config.js`** - Updated build configuration

## Updated Files

### 1. `.htaccess` (Root Directory)
```apache
# MIME type configuration
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
    AddType image/svg+xml .svg
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE text/javascript
</IfModule>
```

### 2. `analytics.js` (Root Directory)
**New file created** with complete Sabiteck Analytics tracking script.

Key features:
- GDPR compliant tracking
- Page view tracking
- Event tracking
- Scroll depth tracking
- Session management
- Privacy controls

### 3. `frontend/public/analytics.js` (Development)
**Copy of analytics.js** placed in Vite's public directory for development server.

### 4. `frontend/vite.config.js` (Build Configuration)
```javascript
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  sourcemap: false,
  target: 'es2015',
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        router: ['react-router-dom'],
        ui: ['lucide-react', '@radix-ui/react-slot'],
      },
      format: 'es',
      inlineDynamicImports: false
    }
  },
  minify: 'esbuild',
  chunkSizeWarningLimit: 1000,
  copyPublicDir: true
}
```

## Deployment Steps

### For Production Server (sabiteck.com):

1. **Upload `analytics.js`** to the root directory (same level as index.html)
2. **Upload updated `.htaccess`** to the root directory
3. **Verify file permissions** (644 for .js files, 644 for .htaccess)
4. **Test the analytics.js URL** directly: https://sabiteck.com/analytics.js

### For Development:

1. **Ensure `frontend/public/analytics.js`** exists
2. **Updated `frontend/vite.config.js`** (already done)
3. **Restart development server**: `npm run dev`

## Verification

After deployment, verify the fix by:

1. **Direct URL test**: Visit https://sabiteck.com/analytics.js
   - Should show JavaScript code, not HTML
   - Response headers should include `Content-Type: application/javascript`

2. **Browser dev tools test**:
   - Open sabiteck.com in browser
   - Check Console tab - should not see MIME type errors
   - Check Network tab - analytics.js should load with 200 status

3. **Analytics functionality test**:
   - Page views should be tracked
   - Events should be tracked
   - Check admin analytics dashboard for data

## File Locations Summary

```
sabiteck.com/
├── .htaccess (updated MIME types)
├── analytics.js (new file - production)
├── frontend/
│   ├── public/
│   │   └── analytics.js (new file - development)
│   ├── vite.config.js (updated)
│   └── index.html (unchanged - still loads /analytics.js)
```

## Technical Details

### MIME Type Configuration
```apache
AddType application/javascript .js
```
This ensures `.js` files are served with correct MIME type.

### Analytics Script Features
- **Privacy-first**: GDPR compliant with consent management
- **Comprehensive tracking**: Page views, events, scroll depth, time on page
- **Session management**: Visitor ID and session tracking
- **Error handling**: Graceful fallbacks and error logging

### Development vs Production
- **Development**: Vite serves `frontend/public/analytics.js`
- **Production**: Server serves root `/analytics.js`
- **Both reference**: `/analytics.js` in HTML

## Troubleshooting

### If analytics.js still returns HTML:
1. Check if file exists at correct location
2. Verify server supports .htaccess files
3. Check file permissions (644)
4. Clear server cache

### If MIME type still wrong:
1. Add to Apache/Nginx configuration instead of .htaccess
2. Check server logs for configuration errors
3. Contact hosting provider for MIME type support

### Alternative Approaches:
1. **Inline the script**: Include analytics code directly in index.html
2. **CDN hosting**: Host analytics.js on external CDN
3. **Backend serving**: Serve analytics.js through PHP backend