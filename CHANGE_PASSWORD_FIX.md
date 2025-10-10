# Change Password Fix - Documentation

## Issues Fixed

### Issue 1: Wrong API URL (404 Error)
**Problem:** The change password endpoint was calling `localhost:5173/api/auth/change-password` instead of the backend API server.

**Error:**
```
POST http://localhost:5173/api/auth/change-password 404 (Not Found)
```

**Root Cause:**
Line 75 in `ChangePassword.jsx` was using a relative URL:
```javascript
const response = await fetch('/api/auth/change-password', {
```

This made the browser send the request to the frontend server (localhost:5173) instead of the backend API server (localhost:8002).

**Solution:**
Changed to use the full API URL with `VITE_API_URL` environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
```

**Note:** Also corrected the endpoint from `/api/auth/change-password` to `/api/user/change-password` to match the backend route.

---

### Issue 2: Admin Users Not Redirected to Dashboard
**Problem:** After changing password, admin users were not being redirected to the admin dashboard.

**Solution:**
Enhanced the redirect logic to properly detect admin users by checking multiple fields:
```javascript
const isAdmin = user?.role === 'admin' || 
               user?.role === 'super_admin' || 
               user?.role === 'super-admin' ||
               user?.role_name === 'admin' || 
               user?.role_name === 'Administrator';

if (isAdmin) {
  navigate('/dashboard', { replace: true });
} else {
  navigate('/', { replace: true });
}
```

---

## Files Modified

### File: `frontend/src/components/pages/ChangePassword.jsx`

**Changes:**
1. **Line 74-75:** Fixed API URL to use backend server
2. **Line 116-128:** Enhanced admin detection logic
3. **Line 137:** Added missing dependencies to useCallback

**Before:**
```javascript
// Wrong - calls frontend server
const response = await fetch('/api/auth/change-password', {

// Basic admin check
if (user?.role && ['admin', 'super_admin'].includes(user.role)) {
```

**After:**
```javascript
// Correct - calls backend API server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {

// Enhanced admin check
const isAdmin = user?.role === 'admin' || 
               user?.role === 'super_admin' || 
               user?.role === 'super-admin' ||
               user?.role_name === 'admin' || 
               user?.role_name === 'Administrator';
```

---

## Complete User Flow

### Invited Admin User Workflow

```
1. Admin invites user via dashboard
   ↓
2. User receives email with credentials
   ↓
3. User clicks login link → Goes to /admin or /login
   ↓
4. User logs in with temporary password
   ↓
5. System detects must_change_password = 1
   ↓
6. User redirected to /change-password
   ↓
7. User enters:
   - Current password (temporary)
   - New password (must meet requirements)
   - Confirm new password
   ↓
8. Frontend sends request to:
   ✅ http://localhost:8002/api/user/change-password
   ✅ With Authorization: Bearer {token}
   ↓
9. Backend validates and updates:
   - password_hash = new password
   - must_change_password = 0
   - last_password_change = NOW()
   ↓
10. Frontend receives success response
   ↓
11. Frontend updates user context (clears flag)
   ↓
12. Frontend checks user role:
    - If admin → navigate('/dashboard') ✅
    - If user → navigate('/')
   ↓
13. User lands on appropriate page with full access ✅
```

---

## API Endpoint Reference

### Change Password Endpoint

**URL:** `POST /api/user/change-password`  
**Server:** http://localhost:8002  
**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "current_password": "temporary_password_here",
  "new_password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

## Password Requirements

The new password must meet ALL of these requirements:

1. ✅ **Minimum 8 characters**
2. ✅ **At least 1 uppercase letter** (A-Z)
3. ✅ **At least 1 lowercase letter** (a-z)
4. ✅ **At least 1 number** (0-9)
5. ✅ **At least 1 special character** (!@#$%^&*(),.?":{}|<>)

**Example Valid Password:** `SecurePass123!`

**Invalid Examples:**
- `password123` ❌ (no uppercase, no special char)
- `PASSWORD123` ❌ (no lowercase, no special char)
- `Pass123!` ❌ (too short, less than 8 chars)
- `Password!` ❌ (no number)

---

## Testing Instructions

### Manual Test - Admin User Password Change

1. **Create Admin Invitation:**
   - Login to dashboard as existing admin
   - Go to User Roles → Invite User
   - Email: your_email@example.com
   - Role: Admin
   - Click "Send Invitation"

2. **Check Email:**
   - Open email
   - Note the username and temporary password
   - Click the login link

3. **Login:**
   - Enter username and temporary password
   - Click "Login"
   - Should see message: "You must change your password"

4. **Change Password:**
   - You should be on `/change-password` page
   - Enter current (temporary) password
   - Enter new password that meets requirements
   - Confirm new password
   - Click "Change Password"

5. **Verify Redirect:**
   - ✅ Success message appears
   - ✅ After 1.5 seconds, redirected to `/dashboard`
   - ✅ Can see all admin tabs
   - ✅ No password change prompt

6. **Test Login with New Password:**
   - Logout
   - Login again with new password
   - ✅ Should login directly without password change prompt
   - ✅ Should land on dashboard

---

## Troubleshooting

### Issue: Still getting 404 error

**Check:**
1. Backend server is running on port 8002:
   ```bash
   cd backend/public
   php -S localhost:8002
   ```

2. Environment variable is set:
   ```javascript
   // In .env file or vite config
   VITE_API_URL=http://localhost:8002
   ```

3. Clear browser cache and reload

### Issue: Not redirected to dashboard

**Check:**
1. Open browser console
2. Check user object:
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   ```
3. Look for `role` or `role_name` field
4. Should be 'admin' for admin users

### Issue: Password change fails

**Check:**
1. Password meets all requirements (8+ chars, uppercase, lowercase, number, special)
2. New password doesn't match current password
3. Confirm password matches new password
4. Token is valid in localStorage

---

## Backend Route Verification

The correct route in `backend/public/index.php`:

```php
// Line 833
case ($path === '/api/user/change-password' && $method === 'POST'):
    handleChangePassword($db);
    break;
```

**Note:** Not `/api/auth/change-password` - that endpoint doesn't exist!

---

## Summary

### Before Fix
❌ 404 error on password change  
❌ Calling wrong API endpoint  
❌ Using frontend server instead of backend  
❌ Admin users might not redirect properly  

### After Fix
✅ Correct API endpoint (`/api/user/change-password`)  
✅ Calls backend server (localhost:8002)  
✅ Admin users redirect to dashboard  
✅ Regular users redirect to home  
✅ Password change workflow complete  

---

## Environment Configuration

### Required in `.env` or vite config:

```env
VITE_API_URL=http://localhost:8002
```

### Default fallback in code:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
```

This ensures the API URL is always correct even if the environment variable is not set.

---

**Status:** ✅ FULLY RESOLVED  
**Password Change:** ✅ Working  
**Admin Redirect:** ✅ Working  
**API Endpoint:** ✅ Correct  

**Last Updated:** January 5, 2025
