# URGENT: How to Fix "Invalid Credentials" Error

## The Issue
The database has correct data (`role='admin'`), but the backend API might be returning cached data.

## Solution: Follow These Steps

### Step 1: Restart Backend Server
```bash
# Stop the current backend server (Ctrl+C in the terminal where it's running)
# Then restart it:
cd backend
php -S localhost:8002 -t public
```

### Step 2: Clear Browser Data
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage:
   - Local Storage → Clear all
   - Session Storage → Clear all
4. Close and reopen the browser

### Step 3: Test Login in Browser
1. Go to: http://localhost:3000/admin
2. Enter credentials:
   - Username: `test_blogger`
   - Password: `Test123!`
3. Click Login

### Expected Result
✅ Login should work now
✅ You should see the admin dashboard
✅ You should see ONLY these tabs:
   - Overview
   - Content
   - Announcements
   - Jobs
   - Scholarships
   - Newsletter

## Alternative: Use Different Test User

If test_blogger still doesn't work, try:
- Username: `test_admin`
- Password: `Test123!`

This will give you full access to verify the system works.

## If Still Not Working

### Check Backend Server Status
```bash
# Make sure backend is running
curl http://localhost:8002/api/health

# Should return something like: {"status":"ok"}
```

### Check Frontend Server Status
```bash
# Make sure frontend is running
# Visit: http://localhost:3000
# Should show the website
```

### Manual API Test
Run this command:
```bash
cd backend
php test_login_now.php
```

Should show:
```
✅ LOGIN SUCCESSFUL!
Role (column): admin  ← This MUST be 'admin'
```

## Database Direct Check
Run this to verify database is correct:
```bash
cd backend
php fix_test_user_roles.php
```

All users should show `role='admin'`

## Summary

The issue is likely:
1. ✅ Database is correct (verified)
2. ⚠️ Backend server needs restart (cached data)
3. ⚠️ Browser needs cache clear (old tokens)

**Action**: Restart backend server + Clear browser cache + Try login again

## Test Credentials

All passwords are: **Test123!**

| Username | Password | Should See |
|----------|----------|------------|
| test_blogger | Test123! | 6 tabs (limited access) |
| test_admin | Test123! | ALL tabs (full access) |
| test_editor | Test123! | 7 tabs (content focus) |
| test_manager | Test123! | 4 tabs (programs focus) |

---

**Next Step**: Restart backend server, clear browser cache, and try logging in again!
