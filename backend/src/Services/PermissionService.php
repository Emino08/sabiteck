<?php

namespace App\Services;

use Exception;
use PDO;

class PermissionService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(int $userId, string $permission): bool
    {
        try {
            // Get user's role
            $stmt = $this->db->prepare("
                SELECT r.name as role_name
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ? AND (u.status = 'active' OR u.status IS NULL)
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                return false;
            }

            // Check if user's role is 'admin' (administrators have all permissions)
            if ($user['role_name'] === 'admin') {
                return true;
            }

            // Check role permissions and direct user permissions
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count
                FROM permissions p
                LEFT JOIN role_permissions rp ON p.id = rp.permission_id
                LEFT JOIN user_roles ur ON rp.role_id = ur.role_id AND ur.user_id = ?
                LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ?
                WHERE p.name = ?
                AND (ur.user_id IS NOT NULL OR (up.user_id IS NOT NULL AND up.granted = 1))
                AND NOT EXISTS (
                    SELECT 1 FROM user_permissions up2
                    WHERE up2.user_id = ? AND up2.permission_id = p.id AND up2.granted = 0
                )
            ");
            $stmt->execute([$userId, $userId, $permission, $userId]);
            $result = $stmt->fetch();

            return $result['count'] > 0;

        } catch (Exception $e) {
            error_log("Permission check error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(int $userId, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($userId, $permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all given permissions
     */
    public function hasAllPermissions(int $userId, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($userId, $permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get all permissions for a user
     */
    public function getUserPermissions(int $userId): array
    {
        try {
            // Get user's role via user_roles table
            $roleStmt = $this->db->prepare("
                SELECT r.name as role_name, r.id as role_id
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            ");
            $roleStmt->execute([$userId]);
            $userRole = $roleStmt->fetch();

            // If user has 'admin' role, return ALL permissions
            if ($userRole && $userRole['role_name'] === 'admin') {
                $allPermsStmt = $this->db->query("
                    SELECT name, display_name, category, description, module
                    FROM permissions
                    ORDER BY category, name
                ");
                return $allPermsStmt->fetchAll();
            }

            // For other roles, get permissions from role_permissions and user_permissions
            $stmt = $this->db->prepare("
                SELECT DISTINCT p.name, p.display_name, p.category, p.description, p.module
                FROM permissions p
                LEFT JOIN role_permissions rp ON p.id = rp.permission_id
                LEFT JOIN user_roles ur ON rp.role_id = ur.role_id AND ur.user_id = ?
                LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ?
                WHERE (ur.user_id IS NOT NULL OR (up.user_id IS NOT NULL AND up.granted = 1))
                AND NOT EXISTS (
                    SELECT 1 FROM user_permissions up2
                    WHERE up2.user_id = ? AND up2.permission_id = p.id AND up2.granted = 0
                )
                ORDER BY p.category, p.name
            ");
            $stmt->execute([$userId, $userId, $userId]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get user permissions error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get user permissions as simple array of permission names
     */
    public function getUserPermissionNames(int $userId): array
    {
        $permissions = $this->getUserPermissions($userId);
        return array_column($permissions, 'name');
    }

    /**
     * Get user's role information
     */
    public function getUserRole(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT r.id, r.name, r.display_name, r.description
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch() ?: null;

        } catch (Exception $e) {
            error_log("Get user role error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user's accessible modules based on permissions
     */
    public function getUserModules(int $userId): array
    {
        $permissions = $this->getUserPermissions($userId);
        $modules = [];

        foreach ($permissions as $permission) {
            $module = $permission['module'] ?? $permission['category'] ?? 'general';
            if (!in_array($module, $modules)) {
                $modules[] = $module;
            }
        }

        return $modules;
    }

    /**
     * Assign all role permissions to a user in the user_permissions table
     * This is called when a user is created with a specific role via invite
     */
    public function assignRolePermissionsToUser(int $userId, int $roleId, int $grantedBy): bool
    {
        try {
            // Get all permissions for the role
            $stmt = $this->db->prepare("
                SELECT DISTINCT p.id
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role_id = ?
            ");
            $stmt->execute([$roleId]);
            $rolePermissions = $stmt->fetchAll();

            if (empty($rolePermissions)) {
                error_log("No permissions found for role ID: $roleId");
                return false;
            }

            // Insert all role permissions into user_permissions table
            $stmt = $this->db->prepare("
                INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
                VALUES (?, ?, 1, ?, NOW())
                ON DUPLICATE KEY UPDATE
                granted = 1, granted_by = ?, updated_at = NOW()
            ");

            $success = true;
            foreach ($rolePermissions as $permission) {
                $result = $stmt->execute([
                    $userId,
                    $permission['id'],
                    $grantedBy,
                    $grantedBy
                ]);
                
                if (!$result) {
                    $success = false;
                    error_log("Failed to assign permission ID {$permission['id']} to user ID $userId");
                }
            }

            return $success;

        } catch (Exception $e) {
            error_log("Assign role permissions error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Grant permission to a user
     */
    public function grantPermission(int $userId, string $permissionName, int $grantedBy, $expiresAt = null): bool
    {
        try {
            // Get permission ID
            $stmt = $this->db->prepare("SELECT id FROM permissions WHERE name = ? OR display_name = ?");
            $stmt->execute([$permissionName, $permissionName]);
            $permission = $stmt->fetch();

            if (!$permission) {
                return false;
            }

            // Insert or update user permission
            $stmt = $this->db->prepare("
                INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, expires_at)
                VALUES (?, ?, 1, ?, ?)
                ON DUPLICATE KEY UPDATE
                granted = 1, granted_by = ?, expires_at = ?, updated_at = NOW()
            ");

            return $stmt->execute([
                $userId,
                $permission['id'],
                $grantedBy,
                $expiresAt,
                $grantedBy,
                $expiresAt
            ]);

        } catch (Exception $e) {
            error_log("Grant permission error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Revoke permission from a user
     */
    public function revokePermission(int $userId, string $permissionName): bool
    {
        try {
            $stmt = $this->db->prepare("
                DELETE up FROM user_permissions up
                LEFT JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = ? AND (p.name = ? OR p.display_name = ?)
            ");

            return $stmt->execute([$userId, $permissionName, $permissionName]);

        } catch (Exception $e) {
            error_log("Revoke permission error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update user role
     */
    public function updateUserRole(int $userId, string $roleName): bool
    {
        try {
            // Get role ID
            $stmt = $this->db->prepare("SELECT id FROM roles WHERE name = ? OR display_name = ?");
            $stmt->execute([$roleName, $roleName]);
            $role = $stmt->fetch();

            if (!$role) {
                error_log("Role not found: $roleName");
                return false;
            }

            // Delete existing role assignment
            $stmt = $this->db->prepare("DELETE FROM user_roles WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Insert new role assignment
            $stmt = $this->db->prepare("
                INSERT INTO user_roles (user_id, role_id, created_at)
                VALUES (?, ?, NOW())
            ");

            return $stmt->execute([$userId, $role['id']]);

        } catch (Exception $e) {
            error_log("Update user role error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all available permissions
     */
    public function getAllPermissions(): array
    {
        try {
            $stmt = $this->db->query("
                SELECT id, name, display_name, 
                       COALESCE(module, category) as category, 
                       description
                FROM permissions
                ORDER BY COALESCE(module, category), name
            ");
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get all permissions error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get all available roles
     */
    public function getAllRoles(): array
    {
        try {
            $stmt = $this->db->query("
                SELECT id, name, display_name, description
                FROM roles
                ORDER BY name
            ");
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get all roles error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get permissions by module/category
     */
    public function getPermissionsByModule(string $module): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT id, name, display_name, description
                FROM permissions
                WHERE COALESCE(module, category) = ?
                ORDER BY name
            ");
            $stmt->execute([$module]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get permissions by module error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Sync existing user's permissions from their role
     * This is useful for migrating existing users to the new permission system
     */
    public function syncUserPermissionsFromRole(int $userId): bool
    {
        try {
            // Get user's role ID from user_roles table
            $stmt = $this->db->prepare("
                SELECT role_id FROM user_roles WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $userRole = $stmt->fetch();

            if (!$userRole || !$userRole['role_id']) {
                error_log("User not found or has no role: $userId");
                return false;
            }

            // Clear existing permissions
            $stmt = $this->db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
            $stmt->execute([$userId]);

            // Assign role permissions
            return $this->assignRolePermissionsToUser($userId, $userRole['role_id'], $userId);

        } catch (Exception $e) {
            error_log("Sync user permissions error: " . $e->getMessage());
            return false;
        }
    }
}