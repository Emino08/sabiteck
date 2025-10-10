# Quick Reference - Permission System

## ✅ What Was Fixed

1. **Frontend Error** - AuthContext.jsx initialization error resolved
2. **Backend Compatibility** - PermissionService updated for current database schema  
3. **User Permissions** - All users now have proper permissions in database

## 📋 Current User Setup

| User | Email | Role | Permissions | Access Level |
|------|-------|------|-------------|--------------|
| admin | admin@sabiteck.com | Admin | 46 | Full Access |
| koromaemmanuel66 | koromaemmanuel66@gmail.com | Content Editor | 12 | Content + Portfolio + Announcements |

## 🎯 Content Editor Permissions (12)

✅ Can Access:
- Dashboard
- Content Management (View, Create, Edit, Delete, Publish)
- Portfolio (View, Create, Edit)
- Announcements (View, Create, Edit)

❌ Cannot Access:
- User Management
- System Settings
- Team Management
- Other admin-only features

## 🔑 How to Get Tabs to Appear

### Step 1: Logout
- Click logout button in the application
- Wait for redirect to login page

### Step 2: Clear Browser Data
**Chrome/Edge:**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cookies and other site data"
- Select "Cached images and files"
- Click "Clear data"

**Firefox:**
- Press `Ctrl+Shift+Delete`
- Select "Cookies" and "Cache"
- Click "Clear Now"

### Step 3: Close Browser
- Completely close all browser windows
- Wait 5 seconds

### Step 4: Login Again
- Open browser
- Go to your site
- Login with credentials
- Tabs should now appear based on permissions

## 🔍 Verify Permissions

### Check Login Response (Browser DevTools)
1. Open DevTools (F12)
2. Go to Network tab
3. Login
4. Find the login request
5. Check Response - should include:
```json
{
  "data": {
    "permissions": [
      {"name": "View Dashboard", "category": "dashboard"},
      {"name": "View Content", "category": "content"},
      ...
    ],
    "modules": ["dashboard", "content", "portfolio", "announcements"]
  }
}
```

### Check in Console (F12)
```javascript
// Get auth context
const auth = JSON.parse(localStorage.getItem('user'));
console.log('Permissions:', auth.permissions);
```

## 🛠️ Troubleshooting

### Problem: Tabs still not showing
**Solution:**
1. Check browser console for errors (F12)
2. Verify `localStorage.getItem('user')` contains permissions
3. Check that components use `hasPermission()` correctly
4. Try incognito/private mode

### Problem: "No permissions" error
**Solution:**
```bash
# Re-run fix script
php backend/scripts/final_permission_fix.php
```

### Problem: Wrong permissions
**Solution:**
Check database:
```sql
SELECT up.permission 
FROM user_permissions up
JOIN users u ON up.user_id = u.id
WHERE u.email = 'your@email.com';
```

## 📞 Quick Commands

### Check User Permissions
```bash
php backend/scripts/check_db_structure.php
```

### Fix All Permissions
```bash
php backend/scripts/final_permission_fix.php
```

### Verify Database
```sql
-- Check user's permissions
SELECT u.email, COUNT(up.id) as perms
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email IN ('admin@sabiteck.com', 'koromaemmanuel66@gmail.com')
GROUP BY u.id;
```

## 📁 Important Files

- `frontend/src/contexts/AuthContext.jsx` - Auth and permission checks
- `backend/src/Services/PermissionService.php` - Permission logic
- `backend/src/Controllers/AuthController.php` - Login handler
- `PERMISSION_FIX_SUMMARY.md` - Full documentation

## ⚡ Quick Test

After logging in, open browser console and run:
```javascript
// Check if auth context is available
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user.username);
console.log('Role:', user.role);
console.log('Permissions:', user.permissions);
console.log('Permission count:', user.permissions?.length);
```

**Expected Results:**
- **Admin:** 46 permissions
- **Content Editor:** 12 permissions

---

**Status:** ✅ Ready to Test  
**Action Required:** All users must logout and login again  
**Support:** See PERMISSION_FIX_SUMMARY.md for details
