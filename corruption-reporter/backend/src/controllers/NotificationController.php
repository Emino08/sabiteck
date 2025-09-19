<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\NotificationService;
use App\Services\AuditService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;

class NotificationController
{
    private NotificationService $notificationService;
    private AuditService $auditService;

    public function __construct(
        NotificationService $notificationService,
        AuditService $auditService
    ) {
        $this->notificationService = $notificationService;
        $this->auditService = $auditService;
    }

    public function index(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $params = $request->getQueryParams();

        $options = [
            'page' => (int)($params['page'] ?? 1),
            'per_page' => min((int)($params['per_page'] ?? 20), 100),
        ];

        if (isset($params['unread_only'])) {
            $options['unread_only'] = filter_var($params['unread_only'], FILTER_VALIDATE_BOOLEAN);
        }

        if (isset($params['type'])) {
            $options['type'] = $params['type'];
        }

        try {
            $notifications = $this->notificationService->getUserNotifications($user['id'], $options);

            $response->getBody()->write(json_encode([
                'data' => $notifications['data'],
                'meta' => [
                    'total' => $notifications['total'],
                    'page' => $notifications['page'],
                    'per_page' => $notifications['per_page'],
                    'has_more' => $notifications['has_more'],
                ],
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch notifications',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function markAsRead(Request $request, Response $response): Response
    {
        $notificationId = (int)$request->getAttribute('id');
        $user = $request->getAttribute('user');

        try {
            $success = $this->notificationService->markNotificationAsRead($notificationId, $user['id']);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'error' => 'Notification not found or already read',
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Log the action
            $this->auditService->log(
                $user['id'],
                'notifications.mark_read',
                'notifications',
                $notificationId,
                []
            );

            $response->getBody()->write(json_encode([
                'message' => 'Notification marked as read',
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to mark notification as read',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function markAllAsRead(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');

        try {
            $count = $this->notificationService->markAllNotificationsAsRead($user['id']);

            // Log the action
            $this->auditService->log(
                $user['id'],
                'notifications.mark_all_read',
                'notifications',
                null,
                ['marked_count' => $count]
            );

            $response->getBody()->write(json_encode([
                'message' => 'All notifications marked as read',
                'marked_count' => $count,
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to mark all notifications as read',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getUnreadCount(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');

        try {
            $count = $this->notificationService->getUnreadNotificationCount($user['id']);

            $response->getBody()->write(json_encode([
                'unread_count' => $count,
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to get unread count',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function registerPushToken(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Validation
        $validator = v::keySet(
            v::key('token', v::stringType()->notEmpty()),
            v::key('device_id', v::stringType()->notEmpty()),
            v::key('platform', v::in(['android', 'ios', 'web']))
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Validation failed',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $this->notificationService->registerPushToken(
                $user['id'],
                $data['token'],
                $data['device_id'],
                $data['platform']
            );

            // Log the registration
            $this->auditService->log(
                $user['id'],
                'notifications.register_push_token',
                'push_tokens',
                null,
                [
                    'device_id' => $data['device_id'],
                    'platform' => $data['platform'],
                ]
            );

            $response->getBody()->write(json_encode([
                'message' => 'Push token registered successfully',
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to register push token',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function revokePushToken(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Validation
        $validator = v::keySet(
            v::key('device_id', v::stringType()->notEmpty())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Validation failed',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $this->notificationService->revokePushToken(
                $user['id'],
                $data['device_id']
            );

            // Log the revocation
            $this->auditService->log(
                $user['id'],
                'notifications.revoke_push_token',
                'push_tokens',
                null,
                ['device_id' => $data['device_id']]
            );

            $response->getBody()->write(json_encode([
                'message' => 'Push token revoked successfully',
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to revoke push token',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function sendSystemNotification(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Check if user has permission to send system notifications
        if ($user['role'] !== 'super_admin') {
            $response->getBody()->write(json_encode([
                'error' => 'Insufficient permissions',
            ]));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        // Validation
        $validator = v::keySet(
            v::key('title', v::stringType()->notEmpty()),
            v::key('message', v::stringType()->notEmpty()),
            v::key('user_ids', v::arrayType()->optional()),
            v::key('roles', v::arrayType()->optional())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Validation failed',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $this->notificationService->sendSystemNotification(
                $data['title'],
                $data['message'],
                $data['user_ids'] ?? [],
                $data['roles'] ?? []
            );

            // Log the system notification
            $this->auditService->log(
                $user['id'],
                'notifications.send_system',
                'notifications',
                null,
                [
                    'title' => $data['title'],
                    'user_ids' => $data['user_ids'] ?? [],
                    'roles' => $data['roles'] ?? [],
                ]
            );

            $response->getBody()->write(json_encode([
                'message' => 'System notification sent successfully',
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to send system notification',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function sendBulkNotification(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Check if user has permission to send bulk notifications
        if (!in_array($user['role'], ['super_admin', 'institution_admin'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Insufficient permissions',
            ]));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        // Validation
        $validator = v::keySet(
            v::key('title', v::stringType()->notEmpty()),
            v::key('message', v::stringType()->notEmpty()),
            v::key('user_ids', v::arrayType()->notEmpty())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Validation failed',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $this->notificationService->sendBulkNotification(
                $data['user_ids'],
                $data['title'],
                $data['message'],
                $data['data'] ?? []
            );

            // Log the bulk notification
            $this->auditService->log(
                $user['id'],
                'notifications.send_bulk',
                'notifications',
                null,
                [
                    'title' => $data['title'],
                    'user_count' => count($data['user_ids']),
                ]
            );

            $response->getBody()->write(json_encode([
                'message' => 'Bulk notification sent successfully',
                'user_count' => count($data['user_ids']),
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to send bulk notification',
                'details' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}