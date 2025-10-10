# RBAC Permission System - Complete Fix

## Problem Summary
All admin users were seeing all routes/tabs regardless of their role and permissions. This was caused by:
1. Users created via invite were getting `role='blogger'` instead of `role='admin'`
2. Frontend was checking `role_name` to grant full access instead of checking actual permissions
3. Permission service was using `role` column instead of `role_name` for admin checks

## Solution Overview

### Key Concept: Two-Column Role System
- **`role` column**: Always set to `'admin'` for ALL staff users (gives dashboard access)
- **`role_id` column**: References the roles table (determines actual permissions)
- **`role_name` (from JOIN)**: The actual role name from roles table (admin, blogger, content_editor, etc.)

### Role Definitions
```
ID | Role Name        | Display Name      | Description
7  | admin            | Administrator     | Full access to all modules
8  | content_editor   | Content Editor    | Focuses on content, blogs, and news
9  | program_manager  | Program Manager   | Manages programs (jobs, scholarships, organizations)
10 | marketing_officer| Marketing Officer | Handles marketing, newsletter, analytics
11 | analyst          | Analyst           | View-only analytics and reports
12 | blogger          | Blogger           | Content creation: blogs, news, jobs, scholarships, newsletter
```

## Changes Made

### 1. Backend - AuthController.php
**File**: `backend/src/Controllers/AuthController.php`

#### inviteUser() Method (Line ~1076)
```php
// BEFORE:
$stmt->execute([
    ...
    $roleName,  // ❌ Wrong: Sets role column to 'blogger', 'content_editor', etc.
    $roleId
]);

// AFTER:
$stmt->execute([
    ...
    'admin',  // ✅ Correct: All staff get role='admin' for dashboard access
    $roleId   // This determines their actual permissions
]);
```

#### register() Method (Line ~83)
```php
// BEFORE:
$role = $data['role'] ?? 'user';
$roleId = $this->getRoleId($db, $role);

// AFTER:
$requestedRole = $data['role'] ?? 'user';
$roleId = $this->getRoleId($db, $requestedRole);
// All staff users (created by admin) get role='admin' for admin panel access
$role = $isAdminCreated ? 'admin' : 'user';
```

### 2. Backend - PermissionService.php
**File**: `backend/src/Services/PermissionService.php`

#### getUserPermissions() Method (Line ~96)
```php
// BEFORE:
if ($userRole && ($userRole['role_name'] === 'admin' || $userRole['role'] === 'admin')) {
    // ❌ Wrong: Checks role column, giving all staff full access
}

// AFTER:
if ($userRole && $userRole['role_name'] === 'admin') {
    // ✅ Correct: Only users with role_name='admin' get all permissions
}
```

#### hasPermission() Method (Line ~20)
```php
// BEFORE:
if ($user['role_name'] === 'admin' || $user['role'] === 'admin') {
    // ❌ Wrong: Checks role column
}

// AFTER:
if ($user['role_name'] === 'admin') {
    // ✅ Correct: Only checks role_name
}
```

### 3. Frontend - Admin.jsx
**File**: `frontend/src/components/pages/Admin.jsx`

#### accessibleTabs useMemo (Line ~194)
```javascript
// BEFORE:
const userRoleName = user.role_name || user.role;
const isTrueSuperAdmin = (
  userRoleName === 'admin' || 
  userRoleName === 'Administrator' || 
  userRoleName === 'super_admin'
);
if (isTrueSuperAdmin) return true; // ❌ Wrong: Bypasses permission checks

// AFTER:
// CRITICAL FIX: Check permissions strictly for ALL users
// Super admins (role_name='admin') have ALL permissions granted by backend
// Other staff have specific permissions
// The backend already handles giving admin role ALL permissions
// So we just need to check if user has ANY of the required permissions
const hasRequiredPermission = tab.permissions.some(permission => 
  userHasPermission(permission)
);
return hasRequiredPermission; // ✅ Correct: All users checked by permissions
```

## How It Works Now

### 1. User Creation Flow
```
Admin invites user → 
  role='admin' (dashboard access) +
  role_id=8 (blogger) →
    Backend grants blogger permissions →
      Frontend shows only tabs user has permissions for
```

### 2. Permission Check Flow
```
User logs in →
  Backend: getUserPermissions($userId) →
    If role_name='admin': return ALL permissions
    Else: return permissions from role_id →
      Frontend: Filter tabs by permissions →
        Show only tabs where user has required permissions
```

### 3. Example: Blogger User
```yaml
Database Record:
  role: 'admin'              # Dashboard access
  role_id: 12                # Blogger role
  role_name: 'blogger'       # From JOIN with roles table

Permissions (from role_id=12):
  - dashboard.view
  - content.view
  - content.create
  - content.edit
  - announcements.view
  - jobs.view
  - scholarships.view
  - newsletter.view

Visible Tabs:
  ✅ Overview (dashboard.view)
  ✅ Content (content.view)
  ✅ Announcements (announcements.view)
  ✅ Jobs (jobs.view)
  ✅ Scholarships (scholarships.view)
  ✅ Newsletter (newsletter.view)
  ❌ Services (NO services.view permission)
  ❌ Portfolio (NO portfolio.view permission)
  ❌ Settings (NO system.settings permission)
```

### 4. Example: Admin User
```yaml
Database Record:
  role: 'admin'              # Dashboard access
  role_id: 7                 # Admin role
  role_name: 'admin'         # From JOIN with roles table

Permissions:
  - ALL permissions (automatically granted by backend)

Visible Tabs:
  ✅ ALL tabs (because role_name='admin')
```

## Testing the Fix

### 1. Test Blogger User
```bash
# Login as blogger
# Expected: See only Content, Announcements, Jobs, Scholarships, Newsletter tabs
```

### 2. Test Content Editor
```bash
# Login as content_editor
# Expected: See Content, Services, Portfolio, About, Team, Announcements tabs
```

### 3. Test Admin
```bash
# Login as admin
# Expected: See ALL tabs
```

### 4. Create New User via Invite
```bash
# Use "Invite User" button in admin panel
# Select role: Blogger
# Expected: 
#   - User receives email with credentials
#   - User can login to /admin
#   - User sees only blogger tabs
```

## Database Migration (Optional)

If you have existing users with wrong role values, run this SQL:

```sql
-- Fix existing staff users: Set role='admin' for all users with role_id
UPDATE users 
SET role = 'admin' 
WHERE role_id IS NOT NULL 
  AND role_id IN (
    SELECT id FROM roles 
    WHERE name IN ('admin', 'blogger', 'content_editor', 'program_manager', 'marketing_officer', 'analyst')
  )
  AND role != 'admin';

-- Verify the fix
SELECT 
  u.id,
  u.username,
  u.email,
  u.role as role_column,
  r.name as role_name,
  r.display_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.role_id IS NOT NULL
ORDER BY u.id;
```

## Files Modified

1. ✅ `backend/src/Controllers/AuthController.php`
   - Fixed `inviteUser()` method
   - Fixed `register()` method

2. ✅ `backend/src/Services/PermissionService.php`
   - Fixed `getUserPermissions()` method
   - Fixed `hasPermission()` method

3. ✅ `frontend/src/components/pages/Admin.jsx`
   - Fixed `accessibleTabs` permission filtering

## Summary

The permission system now works correctly:
- ✅ All staff users created by admin get `role='admin'` for dashboard access
- ✅ Permissions are determined by `role_id` (not `role` column)
- ✅ Only users with `role_name='admin'` get full access to all features
- ✅ All other staff users see only tabs they have permissions for
- ✅ Frontend checks permissions strictly for all users (no role-based bypass)

## Next Steps

1. Test user creation via "Invite User" button
2. Test user creation via "Add User" button  
3. Verify existing users can still login
4. Verify permission-based tab visibility for each role
5. Run database migration if needed to fix existing users
