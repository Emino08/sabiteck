<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Database\Connection;
use Predis\Client as RedisClient;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use Psr\Log\LoggerInterface;

class NotificationService
{
    private Connection $db;
    private RedisClient $redis;
    private string $fcmServerKey;
    private LoggerInterface $logger;

    public function __construct(
        Connection $db,
        RedisClient $redis,
        string $fcmServerKey,
        LoggerInterface $logger = null
    ) {
        $this->db = $db;
        $this->redis = $redis;
        $this->fcmServerKey = $fcmServerKey;
        $this->logger = $logger;
    }

    public function sendStatusUpdateNotification(int $userId, int $reportId, string $newStatus): void
    {
        $report = $this->getReportDetails($reportId);
        if (!$report) {
            return;
        }

        $title = 'Report Status Updated';
        $message = $this->generateStatusMessage($report['case_id'], $newStatus);

        $this->createNotification([
            'user_id' => $userId,
            'report_id' => $reportId,
            'type' => 'status_update',
            'title' => $title,
            'message' => $message,
        ]);

        // Send push notification
        $this->sendPushNotification($userId, $title, $message, [
            'type' => 'status_update',
            'report_id' => $reportId,
            'case_id' => $report['case_id'],
            'status' => $newStatus,
        ]);

        // Send email notification if enabled
        $this->sendEmailNotification($userId, $title, $message);
    }

    public function sendAssignmentNotification(int $investigatorId, int $reportId): void
    {
        $report = $this->getReportDetails($reportId);
        if (!$report) {
            return;
        }

        $title = 'New Case Assigned';
        $message = "You have been assigned to investigate case #{$report['case_id']}: {$report['title']}";

        $this->createNotification([
            'user_id' => $investigatorId,
            'report_id' => $reportId,
            'type' => 'assignment',
            'title' => $title,
            'message' => $message,
        ]);

        // Send push notification
        $this->sendPushNotification($investigatorId, $title, $message, [
            'type' => 'assignment',
            'report_id' => $reportId,
            'case_id' => $report['case_id'],
        ]);

        // Send email notification
        $this->sendEmailNotification($investigatorId, $title, $message);
    }

    public function sendCommentNotification(int $userId, int $reportId, string $comment, bool $isInternal = true): void
    {
        $report = $this->getReportDetails($reportId);
        if (!$report) {
            return;
        }

        $title = $isInternal ? 'Internal Comment Added' : 'New Comment on Your Report';
        $message = "A new comment has been added to case #{$report['case_id']}: " . substr($comment, 0, 100);

        $this->createNotification([
            'user_id' => $userId,
            'report_id' => $reportId,
            'type' => 'comment',
            'title' => $title,
            'message' => $message,
        ]);

        // Only send push for non-internal comments to reporters
        if (!$isInternal) {
            $this->sendPushNotification($userId, $title, $message, [
                'type' => 'comment',
                'report_id' => $reportId,
                'case_id' => $report['case_id'],
            ]);
        }
    }

    public function sendSystemNotification(string $title, string $message, array $userIds = [], array $roles = []): void
    {
        $targetUsers = [];

        // Get users by IDs
        if (!empty($userIds)) {
            $users = $this->db->table('users')
                ->whereIn('id', $userIds)
                ->where('is_active', true)
                ->get(['id', 'email', 'full_name']);
            $targetUsers = array_merge($targetUsers, $users->toArray());
        }

        // Get users by roles
        if (!empty($roles)) {
            $users = $this->db->table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->whereIn('roles.name', $roles)
                ->where('users.is_active', true)
                ->get(['users.id', 'users.email', 'users.full_name']);
            $targetUsers = array_merge($targetUsers, $users->toArray());
        }

        // Remove duplicates
        $targetUsers = array_unique($targetUsers, SORT_REGULAR);

        foreach ($targetUsers as $user) {
            $this->createNotification([
                'user_id' => $user->id,
                'type' => 'system',
                'title' => $title,
                'message' => $message,
            ]);

            $this->sendPushNotification($user->id, $title, $message, [
                'type' => 'system',
            ]);
        }
    }

    public function sendBulkNotification(array $userIds, string $title, string $message, array $data = []): void
    {
        foreach ($userIds as $userId) {
            $this->createNotification([
                'user_id' => $userId,
                'type' => 'bulk',
                'title' => $title,
                'message' => $message,
            ]);

            $this->sendPushNotification($userId, $title, $message, array_merge($data, [
                'type' => 'bulk',
            ]));
        }
    }

    public function registerPushToken(int $userId, string $token, string $deviceId, string $platform): void
    {
        $this->db->table('push_tokens')->updateOrInsert(
            [
                'user_id' => $userId,
                'device_id' => $deviceId,
            ],
            [
                'token' => $token,
                'platform' => $platform,
                'is_active' => true,
                'updated_at' => now(),
            ]
        );
    }

    public function revokePushToken(int $userId, string $deviceId): void
    {
        $this->db->table('push_tokens')
            ->where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->update(['is_active' => false]);
    }

    public function getUserNotifications(int $userId, array $options = []): array
    {
        $page = $options['page'] ?? 1;
        $perPage = $options['per_page'] ?? 20;
        $offset = ($page - 1) * $perPage;

        $query = $this->db->table('notifications')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        if (isset($options['unread_only']) && $options['unread_only']) {
            $query->where('is_read', false);
        }

        if (isset($options['type'])) {
            $query->where('type', $options['type']);
        }

        $total = $query->count();
        $notifications = $query->offset($offset)->limit($perPage)->get();

        return [
            'data' => $notifications->toArray(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'has_more' => ($page * $perPage) < $total,
        ];
    }

    public function markNotificationAsRead(int $notificationId, int $userId): bool
    {
        return $this->db->table('notifications')
            ->where('id', $notificationId)
            ->where('user_id', $userId)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]) > 0;
    }

    public function markAllNotificationsAsRead(int $userId): int
    {
        return $this->db->table('notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public function getUnreadNotificationCount(int $userId): int
    {
        return $this->db->table('notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    private function createNotification(array $data): int
    {
        $data['created_at'] = now();
        return $this->db->table('notifications')->insertGetId($data);
    }

    private function sendPushNotification(int $userId, string $title, string $message, array $data = []): void
    {
        if (empty($this->fcmServerKey)) {
            return;
        }

        try {
            $tokens = $this->getUserPushTokens($userId);
            if (empty($tokens)) {
                return;
            }

            $payload = [
                'registration_ids' => $tokens,
                'notification' => [
                    'title' => $title,
                    'body' => $message,
                    'sound' => 'default',
                    'badge' => $this->getUnreadNotificationCount($userId),
                ],
                'data' => $data,
                'priority' => 'high',
                'content_available' => true,
            ];

            $headers = [
                'Authorization: key=' . $this->fcmServerKey,
                'Content-Type: application/json',
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                $this->logger?->warning('FCM push notification failed', [
                    'user_id' => $userId,
                    'http_code' => $httpCode,
                    'response' => $response,
                ]);
            }

            // Update notification as sent
            $this->db->table('notifications')
                ->where('user_id', $userId)
                ->where('title', $title)
                ->where('message', $message)
                ->update(['push_sent' => true]);

        } catch (\Exception $e) {
            $this->logger?->error('Push notification error', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function sendEmailNotification(int $userId, string $title, string $message): void
    {
        try {
            $user = $this->db->table('users')->find($userId);
            if (!$user || !$user->email) {
                return;
            }

            $mail = new PHPMailer(true);

            // Server settings
            $mail->isSMTP();
            $mail->Host = $_ENV['MAIL_HOST'];
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['MAIL_USERNAME'];
            $mail->Password = $_ENV['MAIL_PASSWORD'];
            $mail->SMTPSecure = $_ENV['MAIL_ENCRYPTION'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = $_ENV['MAIL_PORT'];

            // Recipients
            $mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);
            $mail->addAddress($user->email, $user->full_name);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $title;
            $mail->Body = $this->generateEmailTemplate($title, $message, $user->full_name);

            $mail->send();

            // Update notification as sent
            $this->db->table('notifications')
                ->where('user_id', $userId)
                ->where('title', $title)
                ->where('message', $message)
                ->update(['email_sent' => true]);

        } catch (\Exception $e) {
            $this->logger?->error('Email notification error', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getUserPushTokens(int $userId): array
    {
        return $this->db->table('push_tokens')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('token')
            ->toArray();
    }

    private function getReportDetails(int $reportId): ?array
    {
        $report = $this->db->table('reports')
            ->where('id', $reportId)
            ->first(['id', 'case_id', 'title', 'status']);

        return $report ? (array)$report : null;
    }

    private function generateStatusMessage(string $caseId, string $status): string
    {
        $statusMessages = [
            'received' => 'Your report has been received and is being reviewed.',
            'under_review' => 'Your report is currently under review by our team.',
            'investigating' => 'An investigation has been initiated for your report.',
            'action_taken' => 'Action has been taken based on your report.',
            'closed' => 'Your report has been closed.',
            'rejected' => 'Your report has been reviewed and closed.',
        ];

        $message = $statusMessages[$status] ?? 'Your report status has been updated.';
        return "Case #{$caseId}: {$message}";
    }

    private function generateEmailTemplate(string $title, string $message, string $userName): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>{$title}</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #1E40AF; color: white; padding: 20px; text-align: center;'>
                    <h1 style='margin: 0;'>Corruption Reporter</h1>
                </div>

                <div style='padding: 20px; border: 1px solid #ddd;'>
                    <h2>{$title}</h2>
                    <p>Dear {$userName},</p>
                    <p>{$message}</p>

                    <div style='margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #1E40AF;'>
                        <p style='margin: 0;'><strong>Note:</strong> This is an automated notification. Please do not reply to this email.</p>
                    </div>

                    <p>Thank you for using our secure reporting platform.</p>
                    <p>Best regards,<br>The Corruption Reporter Team</p>
                </div>

                <div style='text-align: center; padding: 20px; color: #666; font-size: 12px;'>
                    <p>This email was sent from a secure, encrypted system.</p>
                    <p>&copy; " . date('Y') . " Corruption Reporter. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    public function cleanupOldNotifications(int $daysToKeep = 90): int
    {
        $cutoffDate = now()->subDays($daysToKeep);

        return $this->db->table('notifications')
            ->where('created_at', '<', $cutoffDate)
            ->where('is_read', true)
            ->delete();
    }
}