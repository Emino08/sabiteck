# 🔧 CSP Fix Deployment Guide - Complete Solution

## The Problem
CSP errors on `https://sabiteck.com` blocking Google OAuth scripts:
```
Refused to load the script 'blob:https://sabiteck.com/...' because it violates CSP directive
```

## ✅ Files Updated & What They Do

### 1. **ROOT .htaccess** (for Frontend/Main Website)
**File:** `.htaccess`
**Location:** Upload to your main website root directory (where index.html is)
**Purpose:** Controls CSP for the frontend website

### 2. **Backend .htaccess** (for API)
**File:** `backend/public/.htaccess`
**Location:** Upload to your backend API directory
**Purpose:** Controls CSP for API endpoints

### 3. **Backend PHP Headers**
**File:** `backend/public/index.php`
**Updated:** Lines 90-95 with security headers
**Purpose:** Programmatically sets CSP headers

## 🚀 Deployment Instructions

### Option A: Frontend Website Fix (Most Likely Needed)
If your CSP errors happen on the main website (`https://sabiteck.com`):

1. **Upload this file to your web root:**
   ```
   .htaccess  →  /public_html/.htaccess
   ```

### Option B: API Backend Fix
If your CSP errors happen on API calls:

1. **Upload this file to your backend directory:**
   ```
   backend/public/.htaccess  →  /backend/.htaccess
   ```

2. **Upload updated PHP file:**
   ```
   backend/public/index.php  →  /backend/index.php
   ```

### Option C: Both (Recommended)
For complete coverage, upload both files.

## 📋 What's Fixed in CSP Policy

The CSP now allows these Google domains:
- ✅ `https://accounts.google.com` - Google OAuth
- ✅ `https://apis.google.com` - Google APIs
- ✅ `https://gstatic.com` - Google static content
- ✅ `https://www.gstatic.com` - Google static content
- ✅ `https://www.googletagmanager.com` - Google Tag Manager
- ✅ `https://www.google-analytics.com` - Google Analytics

## 🧪 Testing After Deployment

1. **Clear browser cache** completely
2. **Visit** `https://sabiteck.com`
3. **Open browser console** (F12)
4. **Check for CSP errors** - should be gone
5. **Test Google OAuth login** - should work

## 🔍 Which File Do You Need?

### If errors show `sabiteck.com` in the URL:
→ Use **ROOT .htaccess** (main website)

### If errors show `backend.sabiteck.com` or API URLs:
→ Use **BACKEND .htaccess** (API server)

### If you're unsure:
→ Use **BOTH files** (safest option)

## ⚡ Quick Fix Script

Create this script on your server to apply the fix:

```bash
#!/bin/bash
# Apply CSP fix
echo "Applying CSP fix for Google OAuth..."

# Backup existing .htaccess if it exists
if [ -f .htaccess ]; then
    cp .htaccess .htaccess.backup
fi

# Apply the new .htaccess with CSP headers
# (Upload the .htaccess file content here)

echo "CSP fix applied! Test your Google OAuth now."
```

## 🆘 Still Getting Errors?

If CSP errors persist:

1. **Check file placement** - .htaccess must be in the correct directory
2. **Verify Apache mod_headers** is enabled on your server
3. **Clear ALL caches** (browser, Cloudflare, server)
4. **Contact your hosting provider** if mod_headers is disabled

## 📞 Quick Support Checklist

- [ ] Uploaded .htaccess to correct directory
- [ ] Cleared browser cache completely
- [ ] Verified Apache has mod_headers enabled
- [ ] Tested in private/incognito browser window
- [ ] Checked browser console for remaining errors