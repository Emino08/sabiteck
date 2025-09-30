<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Database\Connection;

class ReportRepository
{
    private Connection $db;

    public function __construct(Connection $db)
    {
        $this->db = $db;
    }

    public function findById(int $id): ?array
    {
        $result = $this->db->table('reports')
            ->select([
                'reports.*',
                'report_categories.name as category_name',
                'report_categories.color_code as category_color',
                'users.full_name as reporter_name',
                'institutions.name as institution_name',
                'investigators.full_name as investigator_name'
            ])
            ->leftJoin('report_categories', 'reports.category_id', '=', 'report_categories.id')
            ->leftJoin('users', 'reports.reporter_id', '=', 'users.id')
            ->leftJoin('institutions', 'reports.institution_id', '=', 'institutions.id')
            ->leftJoin('users as investigators', 'reports.assigned_investigator_id', '=', 'investigators.id')
            ->where('reports.id', $id)
            ->first();

        return $result ? (array)$result : null;
    }

    public function findByCaseId(string $caseId): ?array
    {
        $result = $this->db->table('reports')
            ->select([
                'reports.*',
                'report_categories.name as category_name',
                'report_categories.color_code as category_color',
                'users.full_name as reporter_name',
                'institutions.name as institution_name',
                'investigators.full_name as investigator_name'
            ])
            ->leftJoin('report_categories', 'reports.category_id', '=', 'report_categories.id')
            ->leftJoin('users', 'reports.reporter_id', '=', 'users.id')
            ->leftJoin('institutions', 'reports.institution_id', '=', 'institutions.id')
            ->leftJoin('users as investigators', 'reports.assigned_investigator_id', '=', 'investigators.id')
            ->where('reports.case_id', $caseId)
            ->first();

        return $result ? (array)$result : null;
    }

    public function create(array $data): int
    {
        $data['created_at'] = now();
        $data['updated_at'] = now();
        $data['submitted_at'] = now();

        return $this->db->table('reports')->insertGetId($data);
    }

    public function update(int $id, array $data): bool
    {
        $data['updated_at'] = now();

        return $this->db->table('reports')
            ->where('id', $id)
            ->update($data) > 0;
    }

    public function updateStatus(int $id, string $status, int $changedByUserId, ?string $notes = null): bool
    {
        $report = $this->findById($id);
        if (!$report) {
            return false;
        }

        $this->db->beginTransaction();

        try {
            // Update report status
            $updated = $this->db->table('reports')
                ->where('id', $id)
                ->update([
                    'status' => $status,
                    'reviewed_at' => in_array($status, ['under_review', 'investigating']) ? now() : null,
                    'closed_at' => in_array($status, ['action_taken', 'closed', 'rejected']) ? now() : null,
                    'updated_at' => now()
                ]);

            if ($updated) {
                // Record status history
                $this->db->table('report_status_history')->insert([
                    'report_id' => $id,
                    'previous_status' => $report['status'],
                    'new_status' => $status,
                    'changed_by_user_id' => $changedByUserId,
                    'notes' => $notes,
                    'changed_at' => now()
                ]);

                $this->db->commit();
                return true;
            }

            $this->db->rollBack();
            return false;

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function assignReport(int $id, int $investigatorId, int $assignedByUserId): bool
    {
        $updated = $this->db->table('reports')
            ->where('id', $id)
            ->update([
                'assigned_investigator_id' => $investigatorId,
                'updated_at' => now()
            ]);

        if ($updated) {
            // Log assignment in status history
            $this->db->table('report_status_history')->insert([
                'report_id' => $id,
                'previous_status' => null,
                'new_status' => 'assigned',
                'changed_by_user_id' => $assignedByUserId,
                'notes' => "Report assigned to investigator ID: {$investigatorId}",
                'changed_at' => now()
            ]);
        }

        return $updated > 0;
    }

    public function paginate(array $filters = [], array $options = []): array
    {
        $page = $options['page'] ?? 1;
        $perPage = $options['per_page'] ?? 20;
        $offset = ($page - 1) * $perPage;

        $query = $this->db->table('reports')
            ->select([
                'reports.*',
                'report_categories.name as category_name',
                'report_categories.color_code as category_color',
                'users.full_name as reporter_name',
                'institutions.name as institution_name',
                'investigators.full_name as investigator_name'
            ])
            ->leftJoin('report_categories', 'reports.category_id', '=', 'report_categories.id')
            ->leftJoin('users', 'reports.reporter_id', '=', 'users.id')
            ->leftJoin('institutions', 'reports.institution_id', '=', 'institutions.id')
            ->leftJoin('users as investigators', 'reports.assigned_investigator_id', '=', 'investigators.id');

        // Apply filters
        if (!empty($filters['reporter_id'])) {
            $query->where('reports.reporter_id', $filters['reporter_id']);
        }

        if (!empty($filters['assigned_investigator_id'])) {
            $query->where('reports.assigned_investigator_id', $filters['assigned_investigator_id']);
        }

        if (!empty($filters['institution_id'])) {
            $query->where('reports.institution_id', $filters['institution_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('reports.category_id', $filters['category_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('reports.status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->where('reports.priority', $filters['priority']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('reports.title', 'like', $search)
                  ->orWhere('reports.description', 'like', $search)
                  ->orWhere('reports.case_id', 'like', $search);
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('reports.submitted_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('reports.submitted_at', '<=', $filters['date_to']);
        }

        // Get total count
        $total = $query->count();

        // Get paginated results
        $data = $query
            ->orderBy('reports.submitted_at', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->toArray();

        return [
            'data' => array_map(fn($item) => (array)$item, $data),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage)
        ];
    }

    public function getMediaByReportId(int $reportId): array
    {
        $media = $this->db->table('report_media')
            ->where('report_id', $reportId)
            ->orderBy('uploaded_at', 'asc')
            ->get()
            ->toArray();

        return array_map(fn($item) => (array)$item, $media);
    }

    public function addMedia(int $reportId, array $mediaData): int
    {
        $mediaData['report_id'] = $reportId;
        $mediaData['uploaded_at'] = now();
        $mediaData['created_at'] = now();

        return $this->db->table('report_media')->insertGetId($mediaData);
    }

    public function getCommentsByReportId(int $reportId): array
    {
        $comments = $this->db->table('report_comments')
            ->select([
                'report_comments.*',
                'users.full_name as user_name'
            ])
            ->join('users', 'report_comments.user_id', '=', 'users.id')
            ->where('report_id', $reportId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->toArray();

        return array_map(fn($item) => (array)$item, $comments);
    }

    public function addComment(int $reportId, int $userId, string $comment, bool $isInternal = true): int
    {
        return $this->db->table('report_comments')->insertGetId([
            'report_id' => $reportId,
            'user_id' => $userId,
            'comment' => $comment,
            'is_internal' => $isInternal,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function getStatusHistory(int $reportId): array
    {
        $history = $this->db->table('report_status_history')
            ->select([
                'report_status_history.*',
                'users.full_name as changed_by_name'
            ])
            ->leftJoin('users', 'report_status_history.changed_by_user_id', '=', 'users.id')
            ->where('report_id', $reportId)
            ->orderBy('changed_at', 'desc')
            ->get()
            ->toArray();

        return array_map(fn($item) => (array)$item, $history);
    }

    public function getPublicSuccessStories(array $options = []): array
    {
        $limit = $options['limit'] ?? 10;

        $stories = $this->db->table('reports')
            ->select([
                'reports.title',
                'reports.submitted_at',
                'reports.closed_at',
                'report_categories.name as category_name',
                'report_categories.color_code as category_color'
            ])
            ->join('report_categories', 'reports.category_id', '=', 'report_categories.id')
            ->where('reports.status', 'action_taken')
            ->where('reports.is_public', true)
            ->orderBy('reports.closed_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();

        return array_map(function ($story) {
            $story = (array)$story;
            // Anonymize titles
            $story['title'] = $this->anonymizeTitle($story['title']);
            return $story;
        }, $stories);
    }

    public function getAnalytics(array $filters = []): array
    {
        $query = $this->db->table('reports');

        // Apply date filters
        if (!empty($filters['date_from'])) {
            $query->where('submitted_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('submitted_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['institution_id'])) {
            $query->where('institution_id', $filters['institution_id']);
        }

        // Basic counts
        $totalReports = $query->count();
        $resolvedReports = (clone $query)->whereIn('status', ['action_taken', 'closed'])->count();
        $pendingReports = (clone $query)->whereIn('status', ['received', 'under_review', 'investigating'])->count();
        $anonymousReports = (clone $query)->where('is_anonymous', true)->count();

        // Status breakdown
        $statusBreakdown = $this->db->table('reports')
            ->select(['status', $this->db->raw('COUNT(*) as count')])
            ->when(!empty($filters['date_from']), fn($q) => $q->where('submitted_at', '>=', $filters['date_from']))
            ->when(!empty($filters['date_to']), fn($q) => $q->where('submitted_at', '<=', $filters['date_to']))
            ->when(!empty($filters['institution_id']), fn($q) => $q->where('institution_id', $filters['institution_id']))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Category breakdown
        $categoryBreakdown = $this->db->table('reports')
            ->select([
                'report_categories.name',
                'report_categories.color_code',
                $this->db->raw('COUNT(*) as count')
            ])
            ->join('report_categories', 'reports.category_id', '=', 'report_categories.id')
            ->when(!empty($filters['date_from']), fn($q) => $q->where('submitted_at', '>=', $filters['date_from']))
            ->when(!empty($filters['date_to']), fn($q) => $q->where('submitted_at', '<=', $filters['date_to']))
            ->when(!empty($filters['institution_id']), fn($q) => $q->where('institution_id', $filters['institution_id']))
            ->groupBy('report_categories.id', 'report_categories.name', 'report_categories.color_code')
            ->orderBy('count', 'desc')
            ->get()
            ->toArray();

        return [
            'totals' => [
                'total_reports' => $totalReports,
                'resolved_reports' => $resolvedReports,
                'pending_reports' => $pendingReports,
                'anonymous_reports' => $anonymousReports,
                'resolution_rate' => $totalReports > 0 ? round(($resolvedReports / $totalReports) * 100, 2) : 0
            ],
            'status_breakdown' => $statusBreakdown,
            'category_breakdown' => array_map(fn($item) => (array)$item, $categoryBreakdown)
        ];
    }

    private function anonymizeTitle(string $title): string
    {
        // Simple anonymization - replace names and specific locations
        $anonymized = preg_replace('/\b[A-Z][a-z]+ [A-Z][a-z]+\b/', '[Name]', $title);
        $anonymized = preg_replace('/\b\d{4,}\b/', '[Number]', $anonymized);

        return $anonymized;
    }
}