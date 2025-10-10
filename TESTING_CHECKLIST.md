# User Permissions Implementation - Testing Checklist

## Pre-Testing Setup

### 1. Database Migration
- [ ] Backup your current database
- [ ] Run SQL migration: `mysql -u user -p database < backend/migrations/sync_user_permissions.sql`
- [ ] OR run PHP script: `php backend/scripts/sync_user_permissions.php`
- [ ] Verify `user_permissions` table is populated for existing users

### 2. Code Deployment
- [ ] Ensure all modified files are deployed:
  - `backend/src/Controllers/AdminController.php`
  - `backend/src/Services/PermissionService.php`
- [ ] Clear any server-side caches (if applicable)
- [ ] Restart PHP-FPM or web server if needed

## Testing Scenarios

### Scenario 1: New User Invitation

#### Steps:
1. [ ] Login as admin/super-admin
2. [ ] Navigate to user management section
3. [ ] Click "Invite User"
4. [ ] Fill in:
   - Email: test.user@example.com
   - Role: Select "Content Manager" (or any non-admin role)
5. [ ] Click "Send Invitation"

#### Expected Results:
- [ ] Success message displayed
- [ ] Email sent to test.user@example.com
- [ ] Check database:
  ```sql
  SELECT u.id, u.email, u.role_id, COUNT(up.id) as permission_count
  FROM users u
  LEFT JOIN user_permissions up ON u.id = up.user_id
  WHERE u.email = 'test.user@example.com'
  GROUP BY u.id;
  ```
- [ ] `permission_count` > 0 (should match role's permission count)
- [ ] Check specific permissions:
  ```sql
  SELECT p.name, p.display_name, up.granted, up.granted_by
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  JOIN users u ON up.user_id = u.id
  WHERE u.email = 'test.user@example.com';
  ```
- [ ] All permissions show `granted = 1`
- [ ] `granted_by` matches the admin's user ID

### Scenario 2: User Login and Permission Loading

#### Steps:
1. [ ] Check email for invitation
2. [ ] Note temporary password from email
3. [ ] Navigate to login page
4. [ ] Login with email and temporary password
5. [ ] Observe login response (check browser dev tools Network tab)

#### Expected Results:
- [ ] Login successful
- [ ] Response includes `permissions` array
- [ ] Permissions match the role assigned
- [ ] Example response structure:
  ```json
  {
    "success": true,
    "data": {
      "token": "...",
      "user": { ... },
      "permissions": [
        {
          "name": "View Content",
          "display_name": "View Content",
          "category": "content",
          "description": "..."
        }
      ],
      "modules": ["content", "dashboard", ...]
    }
  }
  ```

### Scenario 3: UI Permission Filtering

#### Steps:
1. [ ] While logged in as test user (Content Manager), check UI
2. [ ] Navigate through different sections
3. [ ] Document what is visible vs hidden

#### Expected Results:
- [ ] **Should be VISIBLE** (Content Manager permissions):
  - Dashboard
  - Content management section
  - View/Create/Edit/Delete content
  - Announcements section
  
- [ ] **Should be HIDDEN** (No permission):
  - User management section
  - System settings
  - Team management (unless role has this permission)
  
- [ ] No console errors related to permissions

### Scenario 4: User Without User Management Permission

#### Steps:
1. [ ] Still logged in as Content Manager
2. [ ] Try to access user management URL directly (if exists)
3. [ ] Try to access user management API endpoint

#### Expected Results:
- [ ] UI shows "Access Denied" or redirects
- [ ] API returns 403 Forbidden or appropriate error
- [ ] Navigation menu doesn't show user management link

### Scenario 5: Role Update and Permission Sync

#### Steps:
1. [ ] Login as admin
2. [ ] Navigate to user management
3. [ ] Find the test user (test.user@example.com)
4. [ ] Click "Edit" or "Change Role"
5. [ ] Change role from "Content Manager" to "HR Manager"
6. [ ] Save changes

#### Expected Results:
- [ ] Success message displayed
- [ ] Check database:
  ```sql
  SELECT u.email, r.name as role_name, COUNT(up.id) as permission_count
  FROM users u
  JOIN roles r ON u.role_id = r.id
  LEFT JOIN user_permissions up ON u.id = up.user_id
  WHERE u.email = 'test.user@example.com'
  GROUP BY u.id;
  ```
- [ ] Role is updated to "HR Manager"
- [ ] Permission count changed to match HR Manager permissions
- [ ] Old permissions removed
- [ ] New permissions added
- [ ] Test user logs out and logs back in
- [ ] Permissions in login response match new role
- [ ] UI updates to show HR Manager permissions

### Scenario 6: Admin User Has All Permissions

#### Steps:
1. [ ] Login as admin/super-admin
2. [ ] Check permissions returned in login response
3. [ ] Navigate through all UI sections

#### Expected Results:
- [ ] All permissions visible in response (or permissions check returns true for everything)
- [ ] All UI sections visible
- [ ] No restrictions on any actions

### Scenario 7: Existing User Permission Sync

#### Steps:
1. [ ] Identify an existing user (created before this implementation)
2. [ ] Check their permissions:
  ```sql
  SELECT COUNT(*) FROM user_permissions WHERE user_id = [existing_user_id];
  ```
3. [ ] If count is 0, run sync:
  ```bash
  php backend/scripts/sync_user_permissions.php
  ```
4. [ ] Re-check permissions count

#### Expected Results:
- [ ] After sync, permission count > 0
- [ ] Permissions match user's role
- [ ] User can login successfully
- [ ] Permissions load correctly

## API Testing

### Test Invite User Endpoint

```bash
POST /api/admin/users/invite
Authorization: Bearer [admin_token]
Content-Type: application/json

{
  "email": "api.test@example.com",
  "role_id": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User invitation sent successfully",
  "data": {
    "user_id": 123,
    "username": "apitest",
    "email": "api.test@example.com",
    "message": "Invitation email sent to api.test@example.com"
  }
}
```

### Test Login Endpoint

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "apitest",
  "password": "[temp_password_from_email]"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 123,
      "username": "apitest",
      "email": "api.test@example.com",
      "role": "content-manager"
    },
    "permissions": [ ... ],
    "modules": [ ... ]
  }
}
```

### Test Protected Endpoint Without Permission

```bash
GET /api/admin/users
Authorization: Bearer [non_admin_token]
```

**Expected Response:**
```json
{
  "error": "Access denied",
  "message": "You don't have permission to access this resource"
}
```
OR redirect to unauthorized page

## Database Verification Queries

### Check User's Permissions
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  r.name as role_name,
  COUNT(up.id) as permission_count,
  GROUP_CONCAT(p.name) as permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.email = 'test.user@example.com'
GROUP BY u.id;
```

### Check All Users' Permission Counts
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  r.name as role,
  COUNT(up.id) as permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.id
ORDER BY u.id;
```

### Check Specific Permission Assignment
```sql
SELECT 
  u.username,
  p.name as permission,
  p.display_name,
  up.granted,
  ub.username as granted_by,
  up.granted_at
FROM user_permissions up
JOIN users u ON up.user_id = u.id
JOIN permissions p ON up.permission_id = p.id
LEFT JOIN users ub ON up.granted_by = ub.id
WHERE u.email = 'test.user@example.com'
ORDER BY p.name;
```

## Rollback Plan (If Needed)

If issues occur, you can rollback:

1. [ ] Restore database from backup
2. [ ] Revert code changes:
   ```bash
   git checkout HEAD -- backend/src/Controllers/AdminController.php
   git checkout HEAD -- backend/src/Services/PermissionService.php
   ```
3. [ ] Clear caches and restart services

## Sign-Off

- [ ] All test scenarios passed
- [ ] No errors in application logs
- [ ] No errors in browser console
- [ ] Performance is acceptable
- [ ] Documentation reviewed
- [ ] Team notified of changes

**Tested By:** _______________  
**Date:** _______________  
**Status:** _______________  
**Notes:** _______________

---

## Quick Reference

### Useful Commands

```bash
# Sync existing users
php backend/scripts/sync_user_permissions.php

# Check user permissions in DB
mysql -u user -p -e "USE database; SELECT * FROM user_permissions WHERE user_id = 123;"

# View logs
tail -f backend/logs/error.log

# Clear cache (if applicable)
php artisan cache:clear  # For Laravel
# or
rm -rf cache/*  # For custom cache
```

### Common Issues and Solutions

**Issue:** User has no permissions after invite  
**Solution:** Run `php backend/scripts/sync_user_permissions.php`

**Issue:** Permissions not updating after role change  
**Solution:** Check logs, ensure `assignRolePermissionsToUser()` is being called

**Issue:** UI shows elements user shouldn't see  
**Solution:** Verify frontend is checking permissions array, not just user role

**Issue:** API returns permission errors  
**Solution:** Check JWT token includes permissions, verify backend permission checks

---

For detailed implementation information, see:
- `USER_PERMISSIONS_IMPLEMENTATION.md`
- `PERMISSIONS_IMPLEMENTATION_SUMMARY.md`
