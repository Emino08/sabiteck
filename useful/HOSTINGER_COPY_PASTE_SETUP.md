# 🚀 Hostinger Copy-Paste Setup - No Commands Required!

## 📋 **Quick Fix Instructions**

### **Step 1: Replace index.php**

Your current `index.php` requires composer dependencies that aren't included.

**SOLUTION:** Replace the content of `/backend_production/public/index.php` with the content from `/backend_production/public/index_simple.php`

### **Step 2: Upload to Hostinger**

1. **Zip** the entire `backend_production` folder
2. **Upload** to your Hostinger File Manager
3. **Extract** to `/public_html/backend_api/` (or your chosen folder)

### **Step 3: Set Subdomain Document Root**

In Hostinger cPanel:
- Go to **Subdomains**
- Edit `backend.sabiteck.com`
- Set **Document Root** to: `/public_html/backend_api/public/`

⚠️ **CRITICAL:** Point to the `/public` folder, not the root!

### **Step 4: Update Database Credentials**

Edit `.env` file with your actual Hostinger database details:

```env
DB_HOST=localhost
DB_NAME=your_actual_database_name
DB_USER=your_actual_database_user
DB_PASS=your_actual_database_password
```

## 🧪 **Test URLs (After Upload)**

Test these URLs in order:

1. **https://backend.sabiteck.com/simple.php**
   - Should show "SUCCESS: PHP is working"
   - If this fails = hosting/PHP issue

2. **https://backend.sabiteck.com/test.php**
   - Shows detailed diagnostics
   - Lists exactly what's missing

3. **https://backend.sabiteck.com/**
   - Should show API info JSON
   - If this works = SUCCESS!

4. **https://backend.sabiteck.com/api/test**
   - Should return API test JSON

## 🔧 **What's Different in the Simple Version**

The `index_simple.php` file:
- ✅ **No composer dependencies** - works immediately
- ✅ **Manual .env loading** - no external libraries
- ✅ **Auto-creates database tables** - no setup commands needed
- ✅ **Basic JWT without libraries** - pure PHP implementation
- ✅ **Default admin user** - username: `admin`, password: `admin123`
- ✅ **CORS headers included** - works with sabiteck.com
- ✅ **Mock data fallbacks** - works even without database

## 📊 **API Endpoints Available**

- `GET /` - API info
- `GET /api/test` - Test endpoint
- `GET /api/status` - Database status
- `POST /api/admin/login` - Admin login
- `POST /api/contact` - Contact form
- `GET /api/jobs` - List jobs

## 🔐 **Default Admin Login**

Once working, you can login to admin with:
- **Username:** `admin`
- **Password:** `admin123`

The system will auto-create the admin user table on first login attempt.

## 🛠️ **File Structure to Upload**

```
backend_api/           # Upload this entire folder
├── .env              # Update with your DB credentials
├── public/           # Set as document root
│   ├── index.php     # Replace with index_simple.php content
│   ├── .htaccess     # Already configured for Hostinger
│   ├── simple.php    # Basic test file
│   ├── test.php      # Diagnostic file
│   └── debug.php     # Advanced debugging
└── migrations/       # Database files (auto-created)
```

## 🚨 **Troubleshooting**

**If you still get HTTP 500:**

1. **Check subdomain document root** - Must point to `/public` folder
2. **Check file permissions** - Should be 644 for files, 755 for folders
3. **Check database credentials** - Update `.env` with correct Hostinger details
4. **Check Hostinger error logs** - In cPanel → Error Logs

**Common Issues:**
- ❌ Document root points to wrong folder
- ❌ Database credentials incorrect
- ❌ File permissions too restrictive
- ❌ .env file missing or malformed

## ✅ **Success Checklist**

- [ ] Uploaded `backend_production` folder to Hostinger
- [ ] Set subdomain document root to `/public` folder
- [ ] Updated `.env` with correct database credentials
- [ ] Replaced `index.php` content with `index_simple.php`
- [ ] Tested `/simple.php` - shows success message
- [ ] Tested `/` - shows API JSON response
- [ ] Admin login works with `admin/admin123`

## 🎯 **Next Steps After Success**

1. **Change default admin password**
2. **Update JWT secret in .env**
3. **Test frontend connection to backend**
4. **Add your actual content/jobs/scholarships**

---

**💡 This solution requires ZERO command line usage - just copy, paste, and configure!**