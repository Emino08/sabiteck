# Files Changed - Line-by-Line Reference

## Modified Files (3 files)

### 1. backend/src/Controllers/AuthController.php

#### Change 1: register() method
**Lines**: ~83-105

**Before**:
```php
// Determine role
$role = $data['role'] ?? 'user';
$roleId = $this->getRoleId($db, $role);

// Create user
$stmt = $db->prepare("
    INSERT INTO users (
        first_name, last_name, email, username, password_hash,
        phone, organization, role, role_id, status, must_change_password, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
");

$stmt->execute([
    $data['first_name'],
    $data['last_name'],
    $data['email'],
    $data['username'],
    $passwordHash,
    $data['phone'] ?? null,
    $data['organization'] ?? null,
    $role,
    $roleId,
    $isAdminCreated ? 1 : 0
]);
```

**After**:
```php
// Determine role
$requestedRole = $data['role'] ?? 'user';
$roleId = $this->getRoleId($db, $requestedRole);

// IMPORTANT: All staff users (created by admin) get role='admin' for admin panel access
// The role_id determines their actual permissions
// Regular self-registered users get role='user' and no dashboard access
$role = $isAdminCreated ? 'admin' : 'user';

// Create user
$stmt = $db->prepare("
    INSERT INTO users (
        first_name, last_name, email, username, password_hash,
        phone, organization, role, role_id, status, must_change_password, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
");

$stmt->execute([
    $data['first_name'],
    $data['last_name'],
    $data['email'],
    $data['username'],
    $passwordHash,
    $data['phone'] ?? null,
    $data['organization'] ?? null,
    $role,
    $roleId,
    $isAdminCreated ? 1 : 0
]);
```

#### Change 2: inviteUser() method
**Lines**: ~1076-1095

**Before**:
```php
try {
    // Create user
    $stmt = $db->prepare("
        INSERT INTO users (
            first_name, last_name, email, username, password_hash,
            phone, organization, role, role_id, status, must_change_password, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, NOW())
    ");

    $stmt->execute([
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $data['username'],
        $passwordHash,
        $data['phone'] ?? null,
        $data['organization'] ?? null,
        $roleName,
        $roleId
    ]);
```

**After**:
```php
try {
    // Create user
    // IMPORTANT: All staff users (created by admin) get role='admin' for admin panel access
    // The role_id determines their actual permissions (admin, blogger, content_editor, etc.)
    $stmt = $db->prepare("
        INSERT INTO users (
            first_name, last_name, email, username, password_hash,
            phone, organization, role, role_id, status, must_change_password, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', ?, 'active', 1, NOW())
    ");

    $stmt->execute([
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $data['username'],
        $passwordHash,
        $data['phone'] ?? null,
        $data['organization'] ?? null,
        $roleId
    ]);
```

---

### 2. backend/src/Services/PermissionService.php

#### Change 1: hasPermission() method
**Lines**: ~17-65

**Before**:
```php
/**
 * Check if user has a specific permission
 */
public function hasPermission(int $userId, string $permission): bool
{
    try {
        // Get user's role
        $stmt = $this->db->prepare("
            SELECT u.role, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND (u.status = 'active' OR u.status IS NULL)
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        // Check if it's admin (has all permissions)
        if ($user['role_name'] === 'admin' || $user['role'] === 'admin') {
            return true;
        }
        
        // ... rest of method
```

**After**:
```php
/**
 * Check if user has a specific permission
 */
public function hasPermission(int $userId, string $permission): bool
{
    try {
        // Get user's role_name (not role column)
        $stmt = $this->db->prepare("
            SELECT u.role, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND (u.status = 'active' OR u.status IS NULL)
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        // Check if user's role_name is 'admin' (true administrator has all permissions)
        if ($user['role_name'] === 'admin') {
            return true;
        }
        
        // ... rest of method
```

#### Change 2: getUserPermissions() method
**Lines**: ~96-140

**Before**:
```php
/**
 * Get all permissions for a user
 */
public function getUserPermissions(int $userId): array
{
    try {
        // First check if user is admin
        $roleStmt = $this->db->prepare("
            SELECT u.role, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        $roleStmt->execute([$userId]);
        $userRole = $roleStmt->fetch();

        // If user is admin, return ALL permissions
        if ($userRole && ($userRole['role_name'] === 'admin' || $userRole['role'] === 'admin')) {
            $allPermsStmt = $this->db->query("
                SELECT name, display_name, category, description, module
                FROM permissions
                ORDER BY category, name
            ");
            return $allPermsStmt->fetchAll();
        }
        
        // ... rest of method
```

**After**:
```php
/**
 * Get all permissions for a user
 */
public function getUserPermissions(int $userId): array
{
    try {
        // First check user's role_name (not role column)
        // role column is 'admin' for all staff (for dashboard access)
        // role_name determines actual permissions (admin, blogger, content_editor, etc.)
        $roleStmt = $this->db->prepare("
            SELECT u.role, r.name as role_name, r.id as role_id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        $roleStmt->execute([$userId]);
        $userRole = $roleStmt->fetch();

        // If user's role_name is 'admin', return ALL permissions
        // This gives full access only to true administrators
        if ($userRole && $userRole['role_name'] === 'admin') {
            $allPermsStmt = $this->db->query("
                SELECT name, display_name, category, description, module
                FROM permissions
                ORDER BY category, name
            ");
            return $allPermsStmt->fetchAll();
        }
        
        // ... rest of method
```

---

### 3. frontend/src/components/pages/Admin.jsx

#### Change 1: accessibleTabs useMemo
**Lines**: ~193-233

**Before**:
```javascript
// Filter tabs based on user permissions
const accessibleTabs = useMemo(() => {
  if (!user) return [];

  return tabs.filter(tab => {
    // If no permissions required, show the tab
    if (!tab.permissions || tab.permissions.length === 0) return true;

    // Check if user has the required permissions
    const userPermissions = user.permissions || [];
    
    // Helper function to check if user has a permission
    const userHasPermission = (permissionName) => {
      return userPermissions.some(p => {
        if (typeof p === 'string') return p === permissionName;
        if (typeof p === 'object' && p.name) return p.name === permissionName;
        return false;
      });
    };

    // Super admins (role_name='admin') have access to ALL tabs
    // All staff have role='admin', but role_name determines their permissions
    // E.g., blogger has role='admin' but role_name='blogger'
    const userRoleName = user.role_name || user.role;
    const isTrueSuperAdmin = (
      userRoleName === 'admin' || 
      userRoleName === 'Administrator' || 
      userRoleName === 'super_admin'
    );
    
    if (isTrueSuperAdmin) return true;

    // For staff users (bloggers, editors, etc.), strictly check permissions
    const hasRequiredPermission = tab.permissions.some(permission => 
      userHasPermission(permission)
    );

    return hasRequiredPermission;
  });
}, [user, tabs]);
```

**After**:
```javascript
// Filter tabs based on user permissions
const accessibleTabs = useMemo(() => {
  if (!user) return [];

  return tabs.filter(tab => {
    // If no permissions required, show the tab
    if (!tab.permissions || tab.permissions.length === 0) return true;

    // Check if user has the required permissions
    const userPermissions = user.permissions || [];
    
    // Helper function to check if user has a permission
    const userHasPermission = (permissionName) => {
      return userPermissions.some(p => {
        if (typeof p === 'string') return p === permissionName;
        if (typeof p === 'object' && p.name) return p.name === permissionName;
        return false;
      });
    };

    // CRITICAL FIX: Check permissions strictly for ALL users
    // Super admins (role_name='admin') have ALL permissions granted by backend
    // Other staff (blogger, content_editor, etc.) have specific permissions
    // The backend already handles giving admin role ALL permissions
    // So we just need to check if user has ANY of the required permissions
    
    // Check if user has ANY of the required permissions (OR logic)
    const hasRequiredPermission = tab.permissions.some(permission => 
      userHasPermission(permission)
    );

    return hasRequiredPermission;
  });
}, [user, tabs]);
```

---

## Summary of Changes

| File | Method/Section | Lines | Change Description |
|------|---------------|-------|-------------------|
| AuthController.php | register() | ~83-105 | Set role='admin' for admin-created users |
| AuthController.php | inviteUser() | ~1076-1095 | Set role='admin' for invited staff users |
| PermissionService.php | hasPermission() | ~17-65 | Check only role_name for admin status |
| PermissionService.php | getUserPermissions() | ~96-140 | Check only role_name for admin status |
| Admin.jsx | accessibleTabs | ~193-233 | Remove role-based bypass, check permissions |

---

## New Files Created

1. **RBAC_PERMISSION_FIX_COMPLETE.md** - Complete documentation
2. **RBAC_FIX_QUICK_REF.md** - Quick reference guide
3. **fix_rbac_permissions.sql** - Database migration script
4. **UPDATED_FILES_SUMMARY.md** - Files changed summary
5. **FILES_CHANGED_REFERENCE.md** (this file) - Line-by-line changes

---

## How to Review Changes

### Option 1: Git Diff
```bash
git diff backend/src/Controllers/AuthController.php
git diff backend/src/Services/PermissionService.php
git diff frontend/src/components/pages/Admin.jsx
```

### Option 2: Manual Review
1. Open each file listed above
2. Navigate to the specified line numbers
3. Compare the "Before" and "After" code blocks
4. Verify changes match expected modifications

### Option 3: Automated Check
```bash
# Check if files were modified
git status

# Show detailed changes
git diff --stat
```

---

## Testing Modified Code

After applying changes, test:

1. **User Creation Flow**
   ```bash
   # Test invite user
   # Test add user
   # Verify role='admin' in database
   ```

2. **Permission Loading**
   ```bash
   # Login as different roles
   # Check browser console for permissions
   # Verify correct permissions returned
   ```

3. **Tab Visibility**
   ```bash
   # Login as admin → All tabs visible
   # Login as blogger → Only blogger tabs visible
   # Login as content_editor → Only editor tabs visible
   ```

---

## Verification Commands

```sql
-- Check user roles
SELECT 
  username, 
  role as role_column, 
  (SELECT name FROM roles WHERE id = role_id) as role_name
FROM users 
WHERE role_id IS NOT NULL;

-- Check permissions
SELECT 
  u.username,
  COUNT(DISTINCT p.id) as permission_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
GROUP BY u.id;
```
