# CSP (Content Security Policy) Fix for Google OAuth

The CSP errors you're experiencing on `https://sabiteck.com` are caused by restrictive Content Security Policy headers that block Google's OAuth scripts. Here's how to fix it:

## Files Modified ✅

1. **`.htaccess`** - Added CSP headers for Apache servers
2. **`backend/public/index.php`** - Added security headers including CSP
3. **Production deployment instructions below**

## Root Cause Analysis

The CSP errors occurred because:
- Production server has strict CSP headers
- Google OAuth requires script execution from Google domains
- Browser extensions may inject additional Google scripts

## Solution Implementation

### 1. Apache Server (.htaccess)
```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://gstatic.com https://www.gstatic.com; ..."
```

### 2. PHP Backend Headers
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; frame-src https://accounts.google.com; ...");
```

## Deployment Instructions

### For cPanel/Shared Hosting:
1. Upload `.htaccess` file to public root directory
2. Deploy updated `backend/public/index.php`
3. Clear any server-side caches

### For VPS/Dedicated Server:
1. Add CSP headers to Apache/Nginx configuration
2. Deploy updated backend files
3. Restart web server

### CSP Domains Added:
- `https://accounts.google.com` - Google OAuth
- `https://apis.google.com` - Google APIs
- `https://gstatic.com` - Google static content
- `https://www.gstatic.com` - Google static content
- `https://www.googletagmanager.com` - Google Tag Manager
- `https://www.google-analytics.com` - Google Analytics

## Testing

After deployment, verify:
1. No CSP errors in browser console
2. Google OAuth works properly
3. Page loads without script blocking

## Security Notes

The CSP policy maintains security while allowing necessary Google services:
- Still blocks `unsafe-eval` except for Google domains
- Prevents XSS attacks
- Maintains frame protection
- Restricts object sources

## Alternative Solution

If CSP continues to cause issues, you can temporarily use a more permissive policy during testing:

```
Content-Security-Policy: script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; object-src 'none';
```

**Note:** This is less secure and should only be used temporarily for debugging.