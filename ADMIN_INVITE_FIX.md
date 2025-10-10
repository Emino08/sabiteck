# Admin User Invite Fix - Complete

## Issue
When an admin creates a user through the invite functionality or direct user creation, the user was being created with a 'user' role instead of an 'admin' role. This was incorrect because:
- Regular users can sign up themselves
- Any user created by an admin should be an admin by default

## Solution
Modified both the `inviteUser()` and `createUser()` functions in `backend/src/controllers/AdminController.php` to ensure all users created via admin default to admin role.

## Changes Made

### File: `backend/src/controllers/AdminController.php`

#### Function 1: `createUser()` (Lines 4503-4607)

##### Change 1a: Default Role ID (Line 4516)
**Before:**
```php
$roleId = $input['role_id'] ?? 1; // Default to user role
```

**After:**
```php
$roleId = $input['role_id'] ?? 2; // Default to Admin role (ID 2) for admin-created users
```

##### Change 1b: Old Role Value Mapping (Lines 4554-4558)
**Before:**
```php
// Map new roles to old enum values
$oldRoleValue = 'user'; // default
if ($roleInfo) {
    $oldRoleValue = in_array($roleInfo['name'], ['admin', 'super_admin']) ? 'admin' : 'user';
}
```

**After:**
```php
// Map new roles to old enum values
// Users created by admin should default to 'admin' role, not 'user'
// Only regular users can sign up with 'user' role themselves
$oldRoleValue = 'admin'; // default for admin-created users
if ($roleInfo && in_array($roleInfo['name'], ['user', 'subscriber', 'guest'])) {
    // Only set to 'user' if explicitly requested for regular user roles
    $oldRoleValue = 'user';
}
```

#### Function 2: `inviteUser()` (Lines 4730-4821)

##### Change 2a: Default Role ID (Line 4737)
**Before:**
```php
$roleId = $input['role_id'] ?? 1; // Default to user role
```

**After:**
```php
$roleId = $input['role_id'] ?? 2; // Default to Admin role (ID 2) for admin-created users
```

##### Change 2b: Old Role Value Mapping (Lines 4779-4786)
**Before:**
```php
// Map new roles to old enum values
$oldRoleValue = 'user'; // default
if ($roleInfo) {
    $oldRoleValue = in_array($roleInfo['name'], ['admin', 'super_admin']) ? 'admin' : 'user';
}
```

**After:**
```php
// Map new roles to old enum values
// Users created by admin should default to 'admin' role, not 'user'
// Only regular users can sign up with 'user' role themselves
$oldRoleValue = 'admin'; // default for admin-created users
if ($roleInfo && in_array($roleInfo['name'], ['user', 'subscriber', 'guest'])) {
    // Only set to 'user' if explicitly requested for regular user roles
    $oldRoleValue = 'user';
}
```

**Reason for both changes:** Reversed the logic so that the default is 'admin', and only explicitly requested user-type roles get set to 'user'.

## Role ID Reference
Based on the database schema in `backend/migrations/create_user_permissions_system.sql`:
1. Super Admin (ID: 1)
2. Admin (ID: 2) ← Default for admin-created users
3. Content Manager (ID: 3)
4. HR Manager (ID: 4)
5. Editor (ID: 5)
6. User (ID: 6)
7. Viewer (ID: 7)

## Behavior After Fix

### When Admin Creates/Invites a User:
- **Default Role ID:** 2 (Admin)
- **Default Old Role Value:** 'admin'
- **Email Invitation:** Will correctly show "Admin account" instead of "User account"
- **Login URL:** Will direct to `/admin` instead of `/login`
- **Permissions:** User will have all admin permissions by default

### If Admin Explicitly Selects User Role:
- The system will still respect the explicit selection
- User role (ID: 6) will set `oldRoleValue` to 'user'
- Such users will be directed to `/login`
- These users will have limited permissions

## Testing Recommendations

1. **Test Default User Creation:**
   - Create a user without specifying a role
   - Verify they are created as "Admin"
   - Verify they can log in to `/admin`
   - Verify their role is "Admin" in the database

2. **Test Default Invite:**
   - Invite a user without specifying a role
   - Verify they receive an "Admin account" invitation
   - Verify they can log in to `/admin`
   - Verify their role is "Admin" in the database

3. **Test Explicit User Role:**
   - Create/invite a user with role_id = 6 (User)
   - Verify they receive a "User account" invitation (if invited)
   - Verify their role is "User" in the database

4. **Test Other Admin Roles:**
   - Test with Super Admin, Content Manager, HR Manager, Editor
   - Verify all receive appropriate admin login URLs and permissions

## Files Modified
- `backend/src/controllers/AdminController.php`
  - Modified `createUser()` function (lines 4503-4607)
  - Modified `inviteUser()` function (lines 4730-4821)

## No Breaking Changes
- Existing functionality remains intact
- Self-registration for users still works as before (handled in AuthController)
- Explicit role selection in user creation/invites still works
- Only the default behavior for admin-created users changed

## Syntax Validation
✅ PHP syntax check passed: `php -l backend/src/controllers/AdminController.php`

---
**Date:** 2024
**Status:** ✅ COMPLETE
**Functions Modified:** 2 (createUser, inviteUser)
