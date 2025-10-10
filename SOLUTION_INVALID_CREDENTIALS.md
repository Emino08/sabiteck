# SOLUTION: Invalid Credentials Error

## Problem
Database has `role='admin'` ✅ but API returns `role='blogger'` ❌

## Root Cause
**Backend server is caching old database results**

## SOLUTION (3 Steps)

### Step 1: Stop Backend Server
Find the terminal running the backend and press **Ctrl+C**

### Step 2: Restart Backend Server
```bash
cd backend
php -S localhost:8002 -t public
```

Wait for: "Development Server (http://localhost:8002) started"

### Step 3: Test Login

#### Option A: Browser Test
1. Open: http://localhost:3000/admin
2. **Clear browser data first**:
   - Press F12 (DevTools)
   - Go to Application tab
   - Click "Clear site data"
3. Refresh page (F5)
4. Login:
   - Username: `test_blogger`
   - Password: `Test123!`

#### Option B: API Test (Verify First)
```bash
cd backend
php test_login_now.php
```

**Expected output:**
```
✅ LOGIN SUCCESSFUL!
Role (column): admin  ← MUST show 'admin' not 'blogger'
```

If it still shows 'blogger', backend server wasn't restarted properly.

## Why This Happens

1. PHP's built-in server caches database connections
2. Old query results are reused
3. Even though database is updated, server returns old data
4. **Solution**: Restart the server

## Verification Checklist

- [ ] Backend server stopped (Ctrl+C)
- [ ] Backend server restarted (`php -S localhost:8002 -t public`)
- [ ] Browser cache cleared (F12 → Application → Clear site data)
- [ ] Test API returns `role='admin'` (run test_login_now.php)
- [ ] Browser login works

## If Still Not Working

### Check Database Directly
```bash
cd backend
php fix_test_user_roles.php
```

All users should show `role='admin'`

### Check Backend Server
Make sure only ONE backend server is running:
```bash
# Windows
tasklist | findstr php

# Should show only ONE php.exe process for port 8002
```

### Check Frontend Server
Make sure frontend is running:
```bash
cd frontend
npm run dev
```

Should show: "Local: http://localhost:3000"

## Alternative: Use Docker/XAMPP

If you're using Docker or XAMPP instead of PHP built-in server:

**Docker:**
```bash
docker-compose restart backend
```

**XAMPP:**
```bash
# Stop Apache from XAMPP Control Panel
# Start Apache from XAMPP Control Panel
```

## Test Credentials (All use password: Test123!)

| Username | Expected Access |
|----------|----------------|
| test_admin | ALL tabs |
| test_blogger | 6 tabs only |
| test_editor | 7 tabs only |
| test_manager | 4 tabs only |

## Success Criteria

After restarting backend:
✅ API test shows `role='admin'`
✅ Browser login works
✅ No "Invalid credentials" error
✅ Dashboard loads
✅ Correct tabs visible (blogger sees 6 tabs, not all)

---

**ACTION REQUIRED**: 
1. Stop backend server (Ctrl+C)
2. Start backend server (php -S localhost:8002 -t public)
3. Clear browser cache
4. Try login again
