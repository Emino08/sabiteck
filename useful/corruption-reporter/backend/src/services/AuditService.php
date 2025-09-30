<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Psr\Log\LoggerInterface;

class AuditService
{
    private Connection $db;
    private LoggerInterface $logger;

    public function __construct(Connection $db, LoggerInterface $logger)
    {
        $this->db = $db;
        $this->logger = $logger;
    }

    public function log(
        ?int $userId,
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        array $additionalData = []
    ): void {
        try {
            $logData = [
                'user_id' => $userId,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'ip_address' => $additionalData['ip_address'] ?? null,
                'user_agent' => $additionalData['user_agent'] ?? null,
                'request_data' => isset($additionalData['request_data']) ? json_encode($additionalData['request_data']) : null,
                'response_data' => isset($additionalData['response_data']) ? json_encode($additionalData['response_data']) : null,
                'created_at' => now()
            ];

            $this->db->table('audit_logs')->insert($logData);

            // Also log to application logger for real-time monitoring
            $this->logger->info('Audit log', $logData);

        } catch (\Exception $e) {
            // Don't let audit logging failures break the application
            $this->logger->error('Failed to write audit log', [
                'error' => $e->getMessage(),
                'audit_data' => $logData ?? []
            ]);
        }
    }

    public function getAuditLogs(array $filters = [], array $options = []): array
    {
        $page = $options['page'] ?? 1;
        $perPage = $options['per_page'] ?? 50;
        $offset = ($page - 1) * $perPage;

        $query = $this->db->table('audit_logs')
            ->select([
                'audit_logs.*',
                'users.full_name as user_name',
                'users.email as user_email'
            ])
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id');

        // Apply filters
        if (!empty($filters['user_id'])) {
            $query->where('audit_logs.user_id', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('audit_logs.action', 'like', '%' . $filters['action'] . '%');
        }

        if (!empty($filters['resource_type'])) {
            $query->where('audit_logs.resource_type', $filters['resource_type']);
        }

        if (!empty($filters['resource_id'])) {
            $query->where('audit_logs.resource_id', $filters['resource_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('audit_logs.created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('audit_logs.created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['ip_address'])) {
            $query->where('audit_logs.ip_address', $filters['ip_address']);
        }

        // Get total count
        $total = $query->count();

        // Get paginated results
        $data = $query
            ->orderBy('audit_logs.created_at', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->toArray();

        return [
            'data' => array_map(function ($item) {
                $item = (array)$item;
                // Decode JSON fields
                if ($item['request_data']) {
                    $item['request_data'] = json_decode($item['request_data'], true);
                }
                if ($item['response_data']) {
                    $item['response_data'] = json_decode($item['response_data'], true);
                }
                return $item;
            }, $data),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage)
        ];
    }

    public function getActivitySummary(array $filters = []): array
    {
        $query = $this->db->table('audit_logs');

        // Apply date filters
        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Action breakdown
        $actionBreakdown = (clone $query)
            ->select(['action', $this->db->raw('COUNT(*) as count')])
            ->groupBy('action')
            ->orderBy('count', 'desc')
            ->get()
            ->pluck('count', 'action')
            ->toArray();

        // Resource type breakdown
        $resourceBreakdown = (clone $query)
            ->select(['resource_type', $this->db->raw('COUNT(*) as count')])
            ->groupBy('resource_type')
            ->orderBy('count', 'desc')
            ->get()
            ->pluck('count', 'resource_type')
            ->toArray();

        // Most active users
        $activeUsers = (clone $query)
            ->select([
                'users.full_name',
                'users.email',
                $this->db->raw('COUNT(*) as action_count')
            ])
            ->join('users', 'audit_logs.user_id', '=', 'users.id')
            ->groupBy('audit_logs.user_id', 'users.full_name', 'users.email')
            ->orderBy('action_count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        // Daily activity (last 30 days)
        $dailyActivity = $this->db->table('audit_logs')
            ->select([
                $this->db->raw('DATE(created_at) as date'),
                $this->db->raw('COUNT(*) as count')
            ])
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy($this->db->raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get()
            ->pluck('count', 'date')
            ->toArray();

        return [
            'action_breakdown' => $actionBreakdown,
            'resource_breakdown' => $resourceBreakdown,
            'active_users' => array_map(fn($item) => (array)$item, $activeUsers),
            'daily_activity' => $dailyActivity
        ];
    }

    public function cleanupOldLogs(int $daysToKeep = 365): int
    {
        $cutoffDate = now()->subDays($daysToKeep);

        $deletedCount = $this->db->table('audit_logs')
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        $this->logger->info("Cleaned up old audit logs", [
            'deleted_count' => $deletedCount,
            'cutoff_date' => $cutoffDate
        ]);

        return $deletedCount;
    }
}