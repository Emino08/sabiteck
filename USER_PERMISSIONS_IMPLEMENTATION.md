# User Permissions System - Implementation Guide

## Overview
This document describes the enhanced user permissions system that ensures proper permission assignment and enforcement.

## Changes Made

### 1. Enhanced User Invitation Process (`AdminController.php`)

**Location:** `backend/src/Controllers/AdminController.php` - `inviteUser()` method

**Changes:**
- When a user is invited, the system now automatically populates the `user_permissions` table with all permissions from their assigned role
- Uses `PermissionService::assignRolePermissionsToUser()` to sync role permissions to the user
- Supports additional individual permissions beyond role permissions

**Flow:**
1. User is created with role_id
2. `assignRolePermissionsToUser()` is called to populate user_permissions table
3. Additional permissions (if provided) are granted on top of role permissions
4. Invitation email is sent with login credentials

### 2. Enhanced Permission Service (`PermissionService.php`)

**Location:** `backend/src/Services/PermissionService.php`

**New Methods:**
- `assignRolePermissionsToUser(int $userId, int $roleId, int $grantedBy): bool`
  - Populates user_permissions table with all permissions from a role
  - Called during user invitation and role updates
  
- `syncUserPermissionsFromRole(int $userId): bool`
  - Syncs existing user's permissions from their current role
  - Useful for migrating existing users

**Updated Methods:**
- `getUserPermissions(int $userId): array`
  - Primary source: user_permissions table (filtered by granted=1 and not expired)
  - Fallback: role_permissions (for backward compatibility)
  - Admins/Super-admins get all permissions automatically
  
- `hasPermission(int $userId, string $permission): bool`
  - Checks user_permissions table first
  - Falls back to role_permissions for backward compatibility
  - Admins/Super-admins always return true

### 3. Role Update Synchronization (`AdminController.php`)

**Location:** `backend/src/Controllers/AdminController.php` - `updateUserRole()` method

**Changes:**
- When a user's role is updated, their user_permissions are cleared and resynced
- Ensures permissions always match the current role
- Prevents orphaned or incorrect permissions

### 4. Database Migration Scripts

**Files Created:**
- `backend/migrations/sync_user_permissions.sql` - SQL migration for bulk sync
- `backend/scripts/sync_user_permissions.php` - PHP script for syncing existing users

## Permission System Architecture

### Database Tables

1. **permissions** - Available permissions in the system
   - Columns: id, name, slug, description, module
   
2. **roles** - Available roles
   - Columns: id, name, slug, description, is_admin, is_active
   
3. **role_permissions** - Role-to-permission mapping
   - Links roles to their default permissions
   
4. **user_permissions** - User-specific permissions (NEW FOCUS)
   - Primary source of truth for user permissions
   - Columns: user_id, permission_id, granted, granted_by, granted_at, expires_at
   - Populated when user is invited or role is changed

### Permission Check Flow

```
1. Check if user is admin/super-admin → Grant all permissions
2. Query user_permissions table for user's granted permissions
3. Filter by granted=1 and not expired
4. Fallback to role_permissions if user_permissions is empty (backward compatibility)
```

## Usage Examples

### Creating a User via Invite

```php
// In AdminController::inviteUser()
POST /api/admin/users/invite
{
  "email": "user@example.com",
  "role_id": 3,  // Content Manager role
  "permissions": ["additional-permission"]  // Optional extra permissions
}

// System automatically:
// 1. Creates user with role_id
// 2. Populates user_permissions with all Content Manager permissions
// 3. Adds any additional permissions
// 4. Sends invitation email
```

### Checking User Permissions in Frontend

```javascript
// User permissions are returned during login
const userPermissions = loginResponse.data.permissions;

// Check if user has specific permission
const canManageUsers = userPermissions.some(p => 
  p.name === 'Manage Users' || p.slug === 'manage-users'
);

// Conditionally render UI elements
{canManageUsers && <UserManagementLink />}
```

### Updating User Role

```php
// In AdminController::updateUserRole()
PUT /api/admin/users/{id}/role
{
  "role_id": 4,  // HR Manager role
}

// System automatically:
// 1. Updates user's role_id
// 2. Clears all user_permissions
// 3. Repopulates with HR Manager permissions
```

## Migration Guide for Existing Users

### Option 1: SQL Migration (Bulk)

```bash
# Run the SQL migration
mysql -u your_user -p your_database < backend/migrations/sync_user_permissions.sql
```

### Option 2: PHP Script (Recommended)

```bash
# Run the PHP sync script
php backend/scripts/sync_user_permissions.php
```

This script:
- Finds all active users with role_id
- Checks if they already have permissions in user_permissions
- Syncs permissions from their role if needed
- Provides detailed output of the sync process

## Frontend Integration

### Hiding UI Elements Based on Permissions

```javascript
// In your React/Vue component
import { useAuth } from '@/contexts/AuthContext';

function UserManagementSection() {
  const { user, permissions } = useAuth();
  
  // Check for specific permission
  const hasUserManagement = permissions.some(p => 
    p.name === 'View Users' || p.module === 'users'
  );
  
  if (!hasUserManagement) {
    return null; // Don't render if no permission
  }
  
  return (
    <div>
      <h2>User Management</h2>
      {/* UI elements */}
    </div>
  );
}
```

### Module-Based Navigation

```javascript
// Get unique modules user has access to
const userModules = [...new Set(permissions.map(p => p.category || p.module))];

// Render navigation based on modules
const navigationItems = [
  { module: 'users', label: 'Users', icon: 'users' },
  { module: 'content', label: 'Content', icon: 'file' },
  { module: 'jobs', label: 'Jobs', icon: 'briefcase' },
].filter(item => userModules.includes(item.module));
```

## Security Considerations

1. **Always check permissions on the backend** - Frontend checks are for UX only
2. **User permissions are the source of truth** - Not just role_permissions
3. **Admins have all permissions** - Checked before database queries
4. **Expired permissions are ignored** - System checks expires_at timestamp
5. **Permissions are synced on role change** - No manual intervention needed

## Testing Checklist

- [ ] Create user via invite with specific role
- [ ] Verify user_permissions table populated correctly
- [ ] Login as invited user
- [ ] Verify permissions in login response
- [ ] Check UI elements display based on permissions
- [ ] Update user role
- [ ] Verify permissions updated in user_permissions table
- [ ] Verify UI reflects new permissions
- [ ] Test with role that doesn't have user management permission
- [ ] Verify user management UI is hidden

## Troubleshooting

### Issue: User has no permissions after invite

**Solution:**
```bash
# Manually sync user permissions
php backend/scripts/sync_user_permissions.php
```

### Issue: Permissions not updating after role change

**Check:**
1. Is `updateUserRole()` calling `assignRolePermissionsToUser()`?
2. Are there errors in the error log?
3. Does the role have permissions in role_permissions table?

### Issue: UI shows elements user shouldn't see

**Check:**
1. Are permissions checked in the component?
2. Is the frontend using the permissions from the login response?
3. Clear browser cache and login again

## API Endpoints

- `POST /api/admin/users/invite` - Invite new user (auto-assigns permissions)
- `PUT /api/admin/users/{id}/role` - Update user role (auto-syncs permissions)
- `GET /api/admin/permissions` - Get all available permissions
- `GET /api/admin/roles` - Get all available roles
- `GET /api/auth/profile` - Get current user with permissions

## Code Files Modified

1. `backend/src/Controllers/AdminController.php`
   - `inviteUser()` - Added permission assignment
   - `updateUserRole()` - Added permission sync

2. `backend/src/Services/PermissionService.php`
   - `assignRolePermissionsToUser()` - NEW
   - `syncUserPermissionsFromRole()` - NEW
   - `getUserPermissions()` - Updated to use user_permissions table
   - `hasPermission()` - Updated to check user_permissions first
   - `getAllPermissions()` - Updated for column compatibility
   - `getPermissionsByModule()` - Updated for column compatibility

## Code Files Created

1. `backend/migrations/sync_user_permissions.sql` - SQL migration
2. `backend/scripts/sync_user_permissions.php` - PHP sync script
3. `USER_PERMISSIONS_IMPLEMENTATION.md` - This documentation

## Future Enhancements

1. **Permission Expiration Handling** - Add cron job to revoke expired permissions
2. **Permission Audit Log** - Track who granted/revoked permissions and when
3. **Custom Permission Sets** - Allow creating custom permission bundles
4. **Permission Templates** - Pre-defined permission sets for common roles
5. **UI for Permission Management** - Admin interface to manage permissions visually
