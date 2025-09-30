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
                SELECT r.name as role_name, u.permissions_json
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = ? AND u.status = 'active'
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                return false;
            }

            // Check if it's a super admin (has all permissions)
            if ($user['role_name'] === 'super-admin' || $user['role_name'] === 'admin') {
                return true;
            }

            // Check individual permissions JSON (if exists)
            if ($user['permissions_json']) {
                $userPermissions = json_decode($user['permissions_json'], true);
                if (is_array($userPermissions) && in_array($permission, $userPermissions)) {
                    return true;
                }
            }

            // Check role-based permissions
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as has_permission
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.id
                WHERE u.id = ? AND (p.name = ? OR p.display_name = ?)
            ");
            $stmt->execute([$userId, $permission, $permission]);
            $result = $stmt->fetch();

            return $result['has_permission'] > 0;

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
            $stmt = $this->db->prepare("
                SELECT DISTINCT p.name, p.display_name, p.category, p.description
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.id
                WHERE u.id = ?
                UNION
                SELECT DISTINCT p.name, p.display_name, p.category, p.description
                FROM users u
                LEFT JOIN user_permissions up ON u.id = up.user_id
                LEFT JOIN permissions p ON up.permission_id = p.id
                WHERE u.id = ? AND up.granted = 1 AND (up.expires_at IS NULL OR up.expires_at > NOW())
                ORDER BY category, name
            ");
            $stmt->execute([$userId, $userId]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get user permissions error: " . $e->getMessage());
            return [];
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
            $category = $permission['category'] ?? 'general';
            if (!in_array($category, $modules)) {
                $modules[] = $category;
            }
        }

        return $modules;
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
            $stmt = $this->db->prepare("
                UPDATE users SET role_id = (
                    SELECT id FROM roles WHERE name = ? OR display_name = ?
                ) WHERE id = ?
            ");

            return $stmt->execute([$roleName, $roleName, $userId]);

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
                SELECT id, name, display_name, category, description
                FROM permissions
                ORDER BY category, name
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
                WHERE category = ?
                ORDER BY name
            ");
            $stmt->execute([$module]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get permissions by module error: " . $e->getMessage());
            return [];
        }
    }
}