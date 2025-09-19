<?php

declare(strict_types=1);

namespace App\Utils;

use App\Database\Database;
use Monolog\Logger;

class AuditLogger
{
    private Database $database;
    private Logger $logger;

    public function __construct(Database $database, Logger $logger)
    {
        $this->database = $database;
        $this->logger = $logger;
    }

    public function log(
        ?int $actorUserId,
        ?int $institutionId,
        ?int $credentialId,
        string $action,
        string $entityType,
        ?int $entityId,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        try {
            // Log to database
            $this->database->insert('audit_logs', [
                'actor_user_id' => $actorUserId,
                'institution_id' => $institutionId,
                'credential_id' => $credentialId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'metadata' => json_encode($metadata),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent
            ]);

            // Also log to file for backup
            $this->logger->info('Audit log', [
                'actor_user_id' => $actorUserId,
                'institution_id' => $institutionId,
                'credential_id' => $credentialId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'metadata' => $metadata,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent
            ]);

        } catch (\Exception $e) {
            // Ensure audit logging never breaks the application
            $this->logger->error('Failed to write audit log', [
                'error' => $e->getMessage(),
                'action' => $action,
                'entity_type' => $entityType
            ]);
        }
    }

    public function logCredentialAction(
        int $actorUserId,
        int $institutionId,
        int $credentialId,
        string $action,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $this->log(
            $actorUserId,
            $institutionId,
            $credentialId,
            $action,
            'credential',
            $credentialId,
            $metadata,
            $ipAddress,
            $userAgent
        );
    }

    public function logUserAction(
        int $actorUserId,
        ?int $institutionId,
        int $targetUserId,
        string $action,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $this->log(
            $actorUserId,
            $institutionId,
            null,
            $action,
            'user',
            $targetUserId,
            $metadata,
            $ipAddress,
            $userAgent
        );
    }

    public function logInstitutionAction(
        int $actorUserId,
        int $institutionId,
        string $action,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $this->log(
            $actorUserId,
            $institutionId,
            null,
            $action,
            'institution',
            $institutionId,
            $metadata,
            $ipAddress,
            $userAgent
        );
    }

    public function logVerificationRequest(
        ?int $actorUserId,
        int $institutionId,
        int $credentialId,
        string $action,
        array $metadata = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $this->log(
            $actorUserId,
            $institutionId,
            $credentialId,
            $action,
            'verification',
            null,
            $metadata,
            $ipAddress,
            $userAgent
        );
    }

    public function getAuditLogs(
        ?int $institutionId = null,
        ?int $credentialId = null,
        ?string $action = null,
        ?string $entityType = null,
        int $page = 1,
        int $perPage = 50
    ): array {
        $conditions = [];
        $params = [];

        if ($institutionId) {
            $conditions[] = 'institution_id = :institution_id';
            $params['institution_id'] = $institutionId;
        }

        if ($credentialId) {
            $conditions[] = 'credential_id = :credential_id';
            $params['credential_id'] = $credentialId;
        }

        if ($action) {
            $conditions[] = 'action = :action';
            $params['action'] = $action;
        }

        if ($entityType) {
            $conditions[] = 'entity_type = :entity_type';
            $params['entity_type'] = $entityType;
        }

        $whereClause = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "SELECT al.*, u.name as actor_name, u.email as actor_email
                FROM audit_logs al
                LEFT JOIN users u ON al.actor_user_id = u.id
                $whereClause
                ORDER BY al.created_at DESC";

        return $this->database->paginate($sql, $params, $page, $perPage);
    }

    public function getCredentialAuditTrail(int $credentialId): array
    {
        $sql = "SELECT al.*, u.name as actor_name, u.email as actor_email
                FROM audit_logs al
                LEFT JOIN users u ON al.actor_user_id = u.id
                WHERE al.credential_id = :credential_id
                OR (al.entity_type = 'credential' AND al.entity_id = :credential_id)
                ORDER BY al.created_at ASC";

        return $this->database->query($sql, ['credential_id' => $credentialId]);
    }

    public function getUserActivitySummary(int $userId, int $days = 30): array
    {
        $sql = "SELECT
                    action,
                    entity_type,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM audit_logs
                WHERE actor_user_id = :user_id
                AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                GROUP BY action, entity_type, DATE(created_at)
                ORDER BY created_at DESC";

        return $this->database->query($sql, [
            'user_id' => $userId,
            'days' => $days
        ]);
    }

    public function getInstitutionActivitySummary(int $institutionId, int $days = 30): array
    {
        $sql = "SELECT
                    action,
                    entity_type,
                    COUNT(*) as count,
                    DATE(created_at) as date,
                    u.name as actor_name
                FROM audit_logs al
                LEFT JOIN users u ON al.actor_user_id = u.id
                WHERE al.institution_id = :institution_id
                AND al.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                GROUP BY action, entity_type, DATE(created_at), u.name
                ORDER BY created_at DESC";

        return $this->database->query($sql, [
            'institution_id' => $institutionId,
            'days' => $days
        ]);
    }

    public function cleanupOldLogs(int $retentionDays = 365): int
    {
        $sql = "DELETE FROM audit_logs
                WHERE created_at < DATE_SUB(NOW(), INTERVAL :retention_days DAY)";

        return $this->database->execute($sql, ['retention_days' => $retentionDays]);
    }
}