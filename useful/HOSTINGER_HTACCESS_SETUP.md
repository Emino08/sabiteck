# 🔧 .htaccess Setup for Hostinger

You're absolutely correct! The `.htaccess` files are crucial for proper routing. Here's the complete setup:

## 📁 **Required .htaccess Files**

### **Option A: Point Subdomain to /public (Recommended)**

If your subdomain `backend.sabiteck.com` points directly to the `/public` folder:

**Files needed:**
- Only `/public/.htaccess` (already exists)

### **Option B: Point Subdomain to Root Folder**

If your subdomain points to the `backend_production` root folder:

**Files needed:**
1. `/backend_production/.htaccess` (root redirect)
2. `/public/.htaccess` (API routing)

## 🎯 **Setup Instructions**

### **Method 1: Direct to Public (Easiest)**

1. **In Hostinger cPanel:**
   - Go to **Subdomains**
   - Edit `backend.sabiteck.com`
   - Set **Document Root** to: `/public_html/backend_api/public/`

2. **Files needed:**
   - ✅ `/public/.htaccess` (already configured)
   - ❌ No root `.htaccess` needed

### **Method 2: Root with Redirect**

1. **In Hostinger cPanel:**
   - Set **Document Root** to: `/public_html/backend_api/`

2. **Files needed:**
   - ✅ `/backend_production/.htaccess` (redirects to public)
   - ✅ `/public/.htaccess` (handles API routing)

## 🛠️ **If .htaccess Causes Issues**

Some shared hosts have restrictions. If you get 500 errors:

1. **Backup current .htaccess:**
   ```
   mv /public/.htaccess /public/.htaccess_backup
   ```

2. **Use simplified version:**
   ```
   cp /public/.htaccess_simple /public/.htaccess
   ```

## 📋 **File Contents**

### **Root .htaccess** (`/backend_production/.htaccess`)
```apache
RewriteEngine On
RewriteRule ^(.*)$ public/$1 [L]

<FilesMatch "\.(env|log|ini|sql|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

### **Public .htaccess** (`/public/.htaccess`)
```apache
RewriteEngine On

# CORS Headers
Header always set Access-Control-Allow-Origin "https://sabiteck.com"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Route to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

## 🧪 **Test URLs**

After setup, test these URLs:

1. **https://backend.sabiteck.com/**
   - Should show API JSON response

2. **https://backend.sabiteck.com/api/test**
   - Should show test endpoint JSON

3. **https://backend.sabiteck.com/simple.php**
   - Direct file access test

## 🚨 **Troubleshooting .htaccess Issues**

**If you get 500 errors after adding .htaccess:**

1. **Check Hostinger error logs** (cPanel → Error Logs)
2. **Try simplified .htaccess** (use `.htaccess_simple`)
3. **Disable mod_rewrite temporarily:**
   ```apache
   # RewriteEngine On  # Comment this out to test
   ```
4. **Contact Hostinger support** - some modules might be disabled

## ✅ **Recommended Setup**

**For maximum compatibility:**

1. **Set subdomain document root to `/public`**
2. **Use the existing `/public/.htaccess`**
3. **No root .htaccess needed**

This avoids potential .htaccess conflicts and works on most shared hosts.

## 🔍 **How to Check if .htaccess is Working**

1. **Test direct file access:**
   - `https://backend.sabiteck.com/simple.php` ✅ Should work

2. **Test URL rewriting:**
   - `https://backend.sabiteck.com/api/test` ✅ Should work via .htaccess

3. **Test root redirect (if using root folder):**
   - `https://backend.sabiteck.com/` should redirect to `/public/`

---

**💡 TIP:** If .htaccess causes issues, Hostinger support can help enable the required Apache modules!