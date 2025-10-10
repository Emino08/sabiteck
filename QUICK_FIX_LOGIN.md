## QUICK FIX - Invalid Credentials Issue

The database shows `role='admin'` but the API returns cached data showing `role='blogger'`.

## Solution

### 1. Restart Backend Server
```bash
# Stop the backend server (Ctrl+C)
# Then restart:
cd backend
php -S localhost:8002 -t public
```

### 2. Clear Browser Cache
- Open browser DevTools (F12)
- Application → Storage → Clear site data
- Close all browser tabs
- Reopen browser

### 3. Try Login Again
URL: http://localhost:3000/admin
Username: test_blogger
Password: Test123!

## Quick Test

Run this to verify login works:
```bash
cd backend
php test_login_now.php
```

Should show: `Role (column): admin`

If it still shows `blogger`, the backend server needs restart.

## All Test Accounts

Password for all: **Test123!**

- test_admin (Full access)
- test_blogger (Limited)
- test_editor (Limited)
- test_manager (Limited)
- test_marketer (Limited)
- test_analyst (Limited)
