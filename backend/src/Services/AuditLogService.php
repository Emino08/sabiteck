<?php

namespace App\Services;

use PDO;
use Exception;

class AuditLogService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Log an audit event
     */
    public function log(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): bool {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO audit_logs (
                    user_id, action, entity_type, entity_id,
                    old_values, new_values, ip_address, user_agent, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            return $stmt->execute([
                $userId,
                $action,
                $entityType,
                $entityId,
                $oldValues ? json_encode($oldValues) : null,
                $newValues ? json_encode($newValues) : null,
                $ipAddress,
                $userAgent
            ]);

        } catch (Exception $e) {
            error_log("Audit log error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log role assignment
     */
    public function logRoleAssignment(int $userId, int $targetUserId, string $roleName, int $adminId): bool
    {
        return $this->log(
            $adminId,
            'role_assigned',
            'user_role',
            $targetUserId,
            null,
            ['role' => $roleName, 'target_user_id' => $targetUserId]
        );
    }

    /**
     * Log role change
     */
    public function logRoleChange(int $adminId, int $targetUserId, string $oldRole, string $newRole): bool
    {
        return $this->log(
            $adminId,
            'role_changed',
            'user_role',
            $targetUserId,
            ['role' => $oldRole],
            ['role' => $newRole]
        );
    }

    /**
     * Log permission grant
     */
    public function logPermissionGrant(int $adminId, int $targetUserId, string $permission): bool
    {
        return $this->log(
            $adminId,
            'permission_granted',
            'user_permission',
            $targetUserId,
            null,
            ['permission' => $permission]
        );
    }

    /**
     * Log permission revoke
     */
    public function logPermissionRevoke(int $adminId, int $targetUserId, string $permission): bool
    {
        return $this->log(
            $adminId,
            'permission_revoked',
            'user_permission',
            $targetUserId,
            ['permission' => $permission],
            null
        );
    }

    /**
     * Log user creation
     */
    public function logUserCreation(int $adminId, int $newUserId, string $username, string $role): bool
    {
        return $this->log(
            $adminId,
            'user_created',
            'user',
            $newUserId,
            null,
            ['username' => $username, 'role' => $role]
        );
    }

    /**
     * Log user deletion
     */
    public function logUserDeletion(int $adminId, int $deletedUserId, string $username): bool
    {
        return $this->log(
            $adminId,
            'user_deleted',
            'user',
            $deletedUserId,
            ['username' => $username],
            null
        );
    }

    /**
     * Get audit logs for a specific user
     */
    public function getUserLogs(int $userId, int $limit = 100): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    al.*,
                    u.username as performed_by
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.entity_type = 'user' AND al.entity_id = ?
                OR al.entity_type = 'user_role' AND al.entity_id = ?
                OR al.entity_type = 'user_permission' AND al.entity_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$userId, $userId, $userId, $limit]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get user logs error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent audit logs
     */
    public function getRecentLogs(int $limit = 100, ?string $action = null): array
    {
        try {
            $sql = "
                SELECT
                    al.*,
                    u.username as performed_by
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
            ";

            if ($action) {
                $sql .= " WHERE al.action = ?";
            }

            $sql .= " ORDER BY al.created_at DESC LIMIT ?";

            $stmt = $this->db->prepare($sql);

            if ($action) {
                $stmt->execute([$action, $limit]);
            } else {
                $stmt->execute([$limit]);
            }

            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get recent logs error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get audit logs by date range
     */
    public function getLogsByDateRange(string $startDate, string $endDate, int $limit = 1000): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    al.*,
                    u.username as performed_by
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.created_at BETWEEN ? AND ?
                ORDER BY al.created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$startDate, $endDate, $limit]);
            return $stmt->fetchAll();

        } catch (Exception $e) {
            error_log("Get logs by date range error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete old audit logs (for maintenance)
     */
    public function deleteOldLogs(int $daysToKeep = 90): int
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM audit_logs
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$daysToKeep]);
            return $stmt->rowCount();

        } catch (Exception $e) {
            error_log("Delete old logs error: " . $e->getMessage());
            return 0;
        }
    }
}
