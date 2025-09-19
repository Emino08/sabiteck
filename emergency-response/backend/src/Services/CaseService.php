<?php

declare(strict_types=1);

namespace EmergencyResponse\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Monolog\Logger;
use Ramsey\Uuid\Uuid;

class CaseService
{
    private DB $db;
    private LocationService $locationService;
    private NotificationService $notificationService;
    private Logger $logger;

    public function __construct(
        DB $db,
        LocationService $locationService,
        NotificationService $notificationService,
        Logger $logger
    ) {
        $this->db = $db;
        $this->locationService = $locationService;
        $this->notificationService = $notificationService;
        $this->logger = $logger;
    }

    public function createEmergencyCase(array $caseData, ?int $userId = null): array
    {
        $caseUid = 'CASE-' . date('Y-m-d') . '-' . str_pad((string) rand(1, 9999), 4, '0', STR_PAD_LEFT);

        $caseId = $this->db->table('cases')->insertGetId([
            'case_uid' => $caseUid,
            'reporter_user_id' => $userId,
            'reporter_device_id' => $caseData['device_id'] ?? null,
            'anonymous' => $caseData['anonymous'] ?? ($userId ? 0 : 1),
            'incident_type' => $caseData['incident_type'] ?? 'general',
            'priority' => $this->calculatePriority($caseData),
            'status' => 'pending',
            'title' => $caseData['title'] ?? null,
            'description' => $caseData['description'] ?? null,
            'initial_location' => $this->formatLocationForDB($caseData['location']),
            'created_at' => date('Y-m-d H:i:s')
        ]);

        // Add initial location
        if (!empty($caseData['location'])) {
            $this->locationService->addLocationUpdate($caseId, $caseData['location']);
        }

        // Add to timeline
        $this->addTimelineEntry($caseId, $userId, 'created', 'Emergency case created');

        // Auto-assign if enabled
        if ($_ENV['AUTO_ASSIGN_RESPONDERS'] ?? true) {
            $this->autoAssignResponder($caseId, $caseData);
        }

        // Send notifications
        $this->sendEmergencyNotifications($caseId, $caseData);

        $case = $this->getCase($caseId);

        $this->logger->info('Emergency case created', [
            'case_id' => $caseId,
            'case_uid' => $caseUid,
            'incident_type' => $caseData['incident_type'],
            'reporter_id' => $userId
        ]);

        return $case;
    }

    public function getCase(int $caseId, ?int $userId = null): array
    {
        $query = $this->db->table('cases as c')
            ->leftJoin('users as reporter', 'c.reporter_user_id', '=', 'reporter.id')
            ->leftJoin('users as responder', 'c.assigned_responder_id', '=', 'responder.id')
            ->leftJoin('agencies as agency', 'c.assigned_agency_id', '=', 'agency.id')
            ->leftJoin('stations as station', 'c.assigned_station_id', '=', 'station.id')
            ->select([
                'c.*',
                'reporter.name as reporter_name',
                'reporter.phone as reporter_phone',
                'responder.name as responder_name',
                'responder.phone as responder_phone',
                'agency.name as agency_name',
                'station.name as station_name'
            ])
            ->where('c.id', $caseId);

        // Apply access control
        if ($userId) {
            $user = $this->db->table('users')->where('id', $userId)->first();
            if ($user && !in_array($user->role, ['super_admin', 'agency_admin'])) {
                $query->where(function ($q) use ($userId, $user) {
                    $q->where('c.reporter_user_id', $userId)
                      ->orWhere('c.assigned_responder_id', $userId);

                    if ($user->agency_id) {
                        $q->orWhere('c.assigned_agency_id', $user->agency_id);
                    }
                });
            }
        }

        $case = $query->first();

        if (!$case) {
            throw new \Exception('Case not found or access denied');
        }

        // Get current location
        $currentLocation = $this->locationService->getLatestLocation($caseId);

        // Get media count
        $mediaCount = $this->db->table('case_media')
            ->where('case_id', $caseId)
            ->count();

        return [
            'id' => $case->id,
            'case_uid' => $case->case_uid,
            'incident_type' => $case->incident_type,
            'priority' => $case->priority,
            'status' => $case->status,
            'title' => $case->title,
            'description' => $case->description,
            'anonymous' => (bool) $case->anonymous,
            'reporter' => $case->reporter_name ? [
                'name' => $case->anonymous ? 'Anonymous' : $case->reporter_name,
                'phone' => $case->anonymous ? null : $case->reporter_phone
            ] : null,
            'responder' => $case->responder_name ? [
                'name' => $case->responder_name,
                'phone' => $case->responder_phone
            ] : null,
            'agency' => $case->agency_name,
            'station' => $case->station_name,
            'current_location' => $currentLocation,
            'media_count' => $mediaCount,
            'response_time_seconds' => $case->response_time_seconds,
            'created_at' => $case->created_at,
            'updated_at' => $case->updated_at,
            'closed_at' => $case->closed_at
        ];
    }

    public function assignResponder(int $caseId, int $responderId, int $assignedBy): bool
    {
        $responder = $this->db->table('users')
            ->where('id', $responderId)
            ->where('role', 'responder')
            ->where('is_active', 1)
            ->first();

        if (!$responder) {
            throw new \Exception('Responder not found or inactive');
        }

        $updated = $this->db->table('cases')
            ->where('id', $caseId)
            ->update([
                'assigned_responder_id' => $responderId,
                'assigned_agency_id' => $responder->agency_id,
                'assigned_station_id' => $responder->station_id,
                'status' => 'assigned',
                'updated_at' => date('Y-m-d H:i:s')
            ]);

        if ($updated) {
            $this->addTimelineEntry($caseId, $assignedBy, 'assigned', "Case assigned to {$responder->name}");
            $this->notificationService->sendCaseAssignmentNotification($caseId, $responderId);

            $this->logger->info('Case assigned', [
                'case_id' => $caseId,
                'responder_id' => $responderId,
                'assigned_by' => $assignedBy
            ]);
        }

        return $updated > 0;
    }

    public function updateStatus(int $caseId, string $status, int $userId, ?string $notes = null): bool
    {
        $validStatuses = ['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled'];

        if (!in_array($status, $validStatuses)) {
            throw new \Exception('Invalid status');
        }

        $case = $this->db->table('cases')->where('id', $caseId)->first();
        if (!$case) {
            throw new \Exception('Case not found');
        }

        $updateData = [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        // Calculate response time for certain status changes
        if ($status === 'on_scene' && $case->status === 'en_route') {
            $assignedTime = strtotime($case->updated_at);
            $updateData['response_time_seconds'] = time() - $assignedTime;
        }

        if (in_array($status, ['resolved', 'cancelled'])) {
            $updateData['closed_at'] = date('Y-m-d H:i:s');
        }

        $updated = $this->db->table('cases')
            ->where('id', $caseId)
            ->update($updateData);

        if ($updated) {
            $description = $notes ?: "Status changed to {$status}";
            $this->addTimelineEntry($caseId, $userId, 'status_update', $description, $case->status, $status);

            $this->logger->info('Case status updated', [
                'case_id' => $caseId,
                'old_status' => $case->status,
                'new_status' => $status,
                'user_id' => $userId
            ]);
        }

        return $updated > 0;
    }

    public function verifyResponder(int $caseId, int $responderId, string $method, array $verificationData): bool
    {
        $verificationId = $this->db->table('responder_verifications')->insertGetId([
            'case_id' => $caseId,
            'responder_user_id' => $responderId,
            'verification_method' => $method,
            'verification_code' => $verificationData['code'] ?? null,
            'qr_code_data' => $verificationData['qr_data'] ?? null,
            'verified_at' => date('Y-m-d H:i:s'),
            'verified_by_user_id' => $verificationData['verified_by'] ?? null,
            'location' => $this->formatLocationForDB($verificationData['location'] ?? null),
            'created_at' => date('Y-m-d H:i:s')
        ]);

        if ($verificationId) {
            $this->addTimelineEntry($caseId, $responderId, 'verified', "Responder verified via {$method}");

            $this->logger->info('Responder verified', [
                'case_id' => $caseId,
                'responder_id' => $responderId,
                'method' => $method
            ]);
        }

        return $verificationId > 0;
    }

    public function getTimeline(int $caseId): array
    {
        $timeline = $this->db->table('case_timeline as ct')
            ->leftJoin('users as u', 'ct.actor_user_id', '=', 'u.id')
            ->select([
                'ct.*',
                'u.name as actor_name',
                'u.role as actor_role'
            ])
            ->where('ct.case_id', $caseId)
            ->orderBy('ct.created_at', 'asc')
            ->get();

        return $timeline->map(function ($entry) {
            return [
                'id' => $entry->id,
                'action' => $entry->action,
                'description' => $entry->description,
                'old_value' => $entry->old_value,
                'new_value' => $entry->new_value,
                'metadata' => $entry->metadata ? json_decode($entry->metadata, true) : null,
                'actor' => $entry->actor_name ? [
                    'name' => $entry->actor_name,
                    'role' => $entry->actor_role
                ] : null,
                'created_at' => $entry->created_at
            ];
        })->toArray();
    }

    private function calculatePriority(array $caseData): string
    {
        // Simple priority calculation based on incident type and keywords
        $highPriorityTypes = ['medical', 'fire'];
        $criticalKeywords = ['chest pain', 'fire', 'shooting', 'explosion', 'unconscious'];

        if (in_array($caseData['incident_type'] ?? '', $highPriorityTypes)) {
            return 'high';
        }

        $description = strtolower($caseData['description'] ?? '');
        foreach ($criticalKeywords as $keyword) {
            if (strpos($description, $keyword) !== false) {
                return 'critical';
            }
        }

        return 'normal';
    }

    private function autoAssignResponder(int $caseId, array $caseData): void
    {
        if (empty($caseData['location'])) {
            return;
        }

        // Find nearest available responder based on incident type and location
        $incidentType = $caseData['incident_type'];
        $location = $caseData['location'];

        $responder = $this->locationService->findNearestResponder($location, $incidentType);

        if ($responder) {
            $this->assignResponder($caseId, $responder->id, 0); // System assignment
        }
    }

    private function sendEmergencyNotifications(int $caseId, array $caseData): void
    {
        // Send to trusted contacts if user is known
        if (!empty($caseData['reporter_user_id'])) {
            $this->notificationService->notifyTrustedContacts($caseData['reporter_user_id'], $caseId);
        }

        // Send to community volunteers if enabled
        if ($_ENV['ENABLE_COMMUNITY_WATCH'] ?? true) {
            $this->notificationService->notifyNearbyVolunteers($caseId, $caseData['location']);
        }

        // Send to external systems via webhooks
        $this->notificationService->triggerEmergencyWebhooks($caseId, $caseData);
    }

    private function addTimelineEntry(
        int $caseId,
        ?int $actorId,
        string $action,
        string $description,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?array $metadata = null
    ): void {
        $this->db->table('case_timeline')->insert([
            'case_id' => $caseId,
            'actor_user_id' => $actorId,
            'action' => $action,
            'description' => $description,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }

    private function formatLocationForDB(?array $location): ?string
    {
        if (!$location || empty($location['latitude']) || empty($location['longitude'])) {
            return null;
        }

        return "POINT({$location['longitude']} {$location['latitude']})";
    }
}