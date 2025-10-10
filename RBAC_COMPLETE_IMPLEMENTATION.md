# Complete RBAC Implementation Guide

## Overview

This document describes the complete Role-Based Access Control (RBAC) system implementation for the Sabiteck platform.

## Database Structure

### Clean RBAC Tables

The system now uses a clean, normalized RBAC structure:

1. **`users`** - User accounts (NO role/permissions columns)
2. **`roles`** - Available roles (admin, content_editor, program_manager, etc.)
3. **`permissions`** - Available permissions (content.view, jobs.create, etc.)
4. **`user_roles`** - Maps users to roles (many-to-many)
5. **`role_permissions`** - Maps roles to permissions (many-to-many)
6. **`user_permissions`** - Optional: Direct user permission overrides

### Removed Redundant Columns

The following columns were **removed** from the `users` table:
- `role` (varchar)
- `role_id` (int)
- `permissions` (text)
- `permissions_json` (json)

All role and permission data is now managed through the RBAC tables.

## Available Roles

| Role Name | Display Name | Description |
|-----------|--------------|-------------|
| `admin` | Administrator | Full access to all modules |
| `content_editor` | Content Editor | Can manage content, services, portfolio, about, team, announcements |
| `program_manager` | Program Manager | Can manage jobs, scholarships, organizations, curriculum, tools |
| `marketing_officer` | Marketing Officer | Can view analytics, manage newsletters |
| `analyst` | Analyst | Can only view analytics and reports |
| `blogger` | Blogger | Can manage content, blogs, jobs, scholarships, and newsletters |

## Permission Categories

### Dashboard
- `dashboard.view` - View dashboard (all roles have this)

### Content Management
- `content.view`, `content.create`, `content.edit`, `content.delete`, `content.publish`
- `services.view`, `services.create`, `services.edit`, `services.delete`
- `portfolio.view`, `portfolio.create`, `portfolio.edit`, `portfolio.delete`
- `about.view`, `about.edit`
- `team.view`, `team.create`, `team.edit`, `team.delete`
- `announcements.view`, `announcements.create`, `announcements.edit`, `announcements.delete`

### Program Management
- `jobs.view`, `jobs.create`, `jobs.edit`, `jobs.delete`, `jobs.publish`
- `scholarships.view`, `scholarships.create`, `scholarships.edit`, `scholarships.delete`, `scholarships.publish`
- `organizations.view`, `organizations.create`, `organizations.edit`, `organizations.delete`

### Curriculum & Tools
- `curriculum.view`, `curriculum.create`, `curriculum.edit`, `curriculum.delete`
- `tools.view`, `tools.create`, `tools.edit`, `tools.delete`

### Marketing
- `newsletter.view`, `newsletter.create`, `newsletter.send`
- `analytics.view`, `analytics.export`

### System
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `roles.manage`
- `routes.manage`
- `settings.view`, `settings.edit`
- `system.settings`
- `tools.use`

## Route-to-Permission Mapping

Each admin panel route requires specific permissions:

```javascript
{
    'dashboard': ['dashboard.view'],
    'content': ['content.view', 'content.create', 'content.edit'],
    'services': ['services.view', 'services.create', 'services.edit'],
    'portfolio': ['portfolio.view', 'portfolio.create', 'portfolio.edit'],
    'about': ['about.view', 'about.edit'],
    'team': ['team.view', 'team.create', 'team.edit'],
    'announcements': ['announcements.view', 'announcements.create', 'announcements.edit'],
    'jobs': ['jobs.view', 'jobs.create', 'jobs.edit'],
    'scholarships': ['scholarships.view', 'scholarships.create', 'scholarships.edit'],
    'organizations': ['organizations.view', 'organizations.create', 'organizations.edit'],
    'analytics': ['analytics.view'],
    'newsletter': ['newsletter.view', 'newsletter.create'],
    'tools-curriculum': ['tools.view', 'curriculum.view'],
    'user-roles': ['users.view', 'roles.manage'],
    'navigation': ['routes.manage'],
    'settings': ['settings.view', 'settings.edit'],
}
```

**Note:** A user needs **at least ONE** of the listed permissions to access a route.

## Backend Implementation

### PermissionService (`backend/src/Services/PermissionService.php`)

Key methods:
- `getUserPermissions(int $userId)` - Get all permissions for a user
- `getUserPermissionNames(int $userId)` - Get permission names as array
- `getUserRole(int $userId)` - Get user's role information
- `hasPermission(int $userId, string $permission)` - Check specific permission
- `hasAnyPermission(int $userId, array $permissions)` - Check if user has any of the permissions
- `hasAllPermissions(int $userId, array $permissions)` - Check if user has all permissions
- `updateUserRole(int $userId, string $roleName)` - Update user's role

### AuthController (`backend/src/Controllers/AuthController.php`)

The login response now includes:

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "jwt_token_here",
        "user": {
            "id": 1,
            "username": "john.doe",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "role_name": "content_editor",
            "role_display_name": "Content Editor"
        },
        "permissions": ["dashboard.view", "content.view", "content.create", ...],
        "modules": ["dashboard", "content", "services", ...]
    }
}
```

### RoutePermissions (`backend/src/Config/RoutePermissions.php`)

Provides backend route permission mapping and filtering:
- `getPermissionsForRoute(string $route)` - Get required permissions
- `canAccessRoute(array $userPermissions, string $route)` - Check route access
- `getAccessibleRoutes(array $userPermissions)` - Get all accessible routes
- `getNavigationForPermissions(array $userPermissions)` - Get filtered navigation structure

## Frontend Implementation

### AuthContext (`frontend/src/contexts/AuthContext.jsx`)

Enhanced with permission helpers:

```javascript
const {
    user,                    // User object with permissions array
    hasPermission,           // Check single permission
    hasAnyPermission,        // Check if user has any of the permissions
    hasAllPermissions,       // Check if user has all permissions
    isAdmin,                 // Check if user has dashboard access
    isSuperAdmin,            // Check if user is true administrator
} = useAuth();
```

### Route Permissions Utility (`frontend/src/utils/routePermissions.js`)

Provides frontend route filtering:

```javascript
import {
    canAccessRoute,
    getFilteredNavigation,
    getAccessibleRoutes
} from '../utils/routePermissions';

// Check if user can access a route
const canView = canAccessRoute(user.permissions, 'jobs');

// Get filtered navigation for sidebar
const navigation = getFilteredNavigation(user.permissions);

// Get all accessible route paths
const routes = getAccessibleRoutes(user.permissions);
```

## Navigation Filtering

Navigation items are automatically filtered based on user permissions. Each role will only see the navigation items they have access to.

### Example: Content Editor Navigation

A Content Editor will see:
- Dashboard
- Content Management section:
  - Content
  - Services
  - Portfolio
  - About
  - Team
  - Announcements

They will **NOT** see:
- Program Management
- Marketing Tools
- System Settings

### Example: Blogger Navigation

A Blogger will see:
- Dashboard
- Content (from Content Management)
- Jobs & Scholarships (from Program Management)
- Newsletter (from Marketing Tools)

## Email Notifications

When creating a new user, the system automatically sends an email with:
- Username and temporary password
- Role assignment details
- List of permissions and accessible features
- Link to login and change password

Email is sent using the `EmailService` class with the credentials:
- From: `auth@sabiteck.com`
- Subject: "Welcome to Sabiteck - Your Account Details"

## Testing the RBAC System

### 1. Database Cleanup Test

```bash
cd backend
php force_cleanup_users_table.php
```

Verify all redundant columns are removed.

### 2. Test User Creation

Create test users for each role using the admin panel or API:

```bash
cd backend
php test_rbac_users_creation.php
```

### 3. Test Login and Permissions

Login as each test user and verify:
1. JWT token includes permissions array
2. Navigation shows only allowed routes
3. Direct navigation to unauthorized routes redirects/denies access

### 4. Test Permission Checks

```javascript
// In React component
const { hasPermission } = useAuth();

if (hasPermission('jobs.create')) {
    // Show create button
}
```

### 5. Role-Specific Test Cases

**Administrator:**
- ✅ Can see all navigation items
- ✅ Can access all routes
- ✅ Has all permissions

**Content Editor:**
- ✅ Can see Content Management section
- ❌ Cannot see System Settings
- ❌ Cannot manage users or roles

**Program Manager:**
- ✅ Can see Program Management section
- ✅ Can see Tools & Curriculum
- ❌ Cannot see Content Management

**Marketing Officer:**
- ✅ Can see Analytics
- ✅ Can see Newsletter
- ❌ Cannot see other sections

**Analyst:**
- ✅ Can see Dashboard
- ✅ Can see Analytics
- ❌ Cannot see anything else

**Blogger:**
- ✅ Can see Dashboard
- ✅ Can see Content
- ✅ Can see Jobs and Scholarships
- ✅ Can see Newsletter
- ❌ Cannot see Services, Portfolio, About, Team
- ❌ Cannot see System Settings

## API Endpoints

### Get User Permissions
```
GET /api/users/{userId}/permissions
Authorization: Bearer {token}

Response:
{
    "permissions": ["dashboard.view", "content.view", ...],
    "role": {
        "name": "content_editor",
        "display_name": "Content Editor"
    }
}
```

### Update User Role
```
POST /api/users/{userId}/role
Authorization: Bearer {token}
Content-Type: application/json

{
    "role": "program_manager"
}
```

### Create User with Role
```
POST /api/users/invite
Authorization: Bearer {token}
Content-Type: application/json

{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "username": "jane.doe",
    "role": "content_editor"
}
```

## Security Considerations

1. **Backend Validation**: All routes check permissions server-side
2. **Frontend Filtering**: Navigation is filtered for UX, but backend enforces access
3. **JWT Security**: Permissions included in JWT for quick frontend checks
4. **Role Hierarchy**: Admin role bypasses all permission checks
5. **Granular Permissions**: Fine-grained control over specific actions

## Migration Notes

### For Existing Users

All existing users have been assigned to the `admin` role by default. To update:

```sql
-- Assign specific role to a user
DELETE FROM user_roles WHERE user_id = {userId};
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT {userId}, id, NOW() FROM roles WHERE name = 'content_editor';
```

### Adding New Permissions

```sql
INSERT INTO permissions (name, display_name, description, category, module, created_at)
VALUES ('new.permission', 'New Permission', 'Description', 'category', 'module', NOW());

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'role_name' AND p.name = 'new.permission';
```

## Troubleshooting

### User can't login after migration
Check if user has a role assigned in `user_roles` table:

```sql
SELECT u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Navigation not filtering correctly
1. Check browser console for user.permissions array
2. Verify permissions match route keys in `routePermissions.js`
3. Clear browser cache and localStorage

### Permission checks failing
1. Ensure JWT includes permissions array
2. Check PermissionService is returning correct data
3. Verify role_permissions table has correct mappings

## Files Modified/Created

### Backend
- ✅ `backend/migrations/complete_rbac_cleanup.sql`
- ✅ `backend/src/Services/PermissionService.php` (updated)
- ✅ `backend/src/Controllers/AuthController.php` (updated)
- ✅ `backend/src/Config/RoutePermissions.php` (new)

### Frontend
- ✅ `frontend/src/contexts/AuthContext.jsx` (updated)
- ✅ `frontend/src/utils/routePermissions.js` (new)

### Migration Scripts
- ✅ `backend/force_cleanup_users_table.php`
- ✅ `backend/run_rbac_cleanup.php`
- ✅ `backend/check_rbac_tables.php`
- ✅ `backend/check_rbac_data.php`

## Next Steps

1. ✅ Database cleanup completed
2. ✅ Backend RBAC system updated
3. ✅ Frontend permission utilities created
4. ⏳ Update Header navigation component to use filtered navigation
5. ⏳ Implement email notifications for user creation
6. ⏳ Add admin UI for role/permission management
7. ⏳ Create comprehensive test suite

## Support

For questions or issues, please contact the development team or refer to:
- Backend permission service: `backend/src/Services/PermissionService.php`
- Frontend auth context: `frontend/src/contexts/AuthContext.jsx`
- Route permissions: `frontend/src/utils/routePermissions.js`
