# Admin Routes Fix - Quick Reference

## What Was Fixed

The admin authentication system was failing because SQL queries were using the wrong field for role checking. Fixed by ensuring all queries use `role_id` with JOIN to the `roles` table.

## Testing

### Option 1: Web Interface (Recommended)
1. Open `test_admin_auth_final.html` in your browser
2. Click "Run All Admin Tests" button
3. All tests should pass with green "success" status

### Option 2: Command Line
```bash
cd backend
php verify_auth_fix.php
```

Expected output: `✅ ALL TESTS PASSED!`

## Test Credentials

- **Username**: test_admin_1759682447
- **Email**: test_admin_1759682447@test.com
- **Password**: Admin@123456
- **Token**: See `test_admin_credentials.json`

## What Changed

### Files Modified (2 files)
1. `backend/public/index.php` - Fixed 5 authentication queries
2. `backend/public/.htaccess` - Added Authorization header forwarding

### Files Created (4 useful tools)
1. `backend/sync_user_roles.php` - Sync role fields
2. `backend/verify_auth_fix.php` - Verify authentication works
3. `test_admin_auth_final.html` - Web testing interface
4. `ADMIN_ROUTES_FIX_COMPLETE.md` - Full documentation

## Maintenance Commands

```bash
# Check role consistency
php backend/sync_user_roles.php

# Verify authentication works
php backend/verify_auth_fix.php

# Create a new test admin user
php backend/create_test_admin.php
```

## How It Works Now

1. Client sends JWT token in `Authorization: Bearer <token>` header
2. `.htaccess` forwards the header to PHP
3. `handleAdminAuth()` validates JWT and extracts user_id
4. Queries database: `users u LEFT JOIN roles r ON u.role_id = r.id`
5. Checks `r.name` (from roles table) instead of `u.role` (enum field)
6. Grants access if role is 'admin' or 'super_admin'

## Troubleshooting

### If admin routes still fail:
1. Check the browser console for errors
2. Verify token is being sent: Check Network tab → Request Headers
3. Check backend logs for authentication errors
4. Run: `php backend/verify_auth_fix.php`

### If you get "Invalid token" errors:
1. The token might be expired (valid for 30 days)
2. Run: `php backend/create_test_admin.php` to create a new user with fresh token

### If you get "Insufficient permissions":
1. Check user role: Look at `roles` table to verify `role_id` is correct
2. Run: `php backend/sync_user_roles.php` to sync role fields

## Key Points

✅ **All admin authentication now uses the roles table** (via `role_id` JOIN)  
✅ **Consistent across all authentication functions**  
✅ **Works for all roles**: admin, editor, moderator, hr_manager  
✅ **Permission-based access control** available for non-admin roles  
✅ **Backward compatible** with existing users and tokens  

## Next Steps

1. Test with real admin users
2. Monitor logs for any auth errors
3. Consider removing legacy `role` enum field (optional, long-term)

## Support

If you encounter any issues:
1. Check `ADMIN_ROUTES_FIX_COMPLETE.md` for detailed information
2. Run verification script: `php backend/verify_auth_fix.php`
3. Use test interface: `test_admin_auth_final.html`
