<?php

declare(strict_types=1);

use Slim\App;
use EmergencyResponse\Controllers\AuthController;
use EmergencyResponse\Controllers\CaseController;
use EmergencyResponse\Controllers\UserController;
use EmergencyResponse\Controllers\MediaController;
use EmergencyResponse\Controllers\LocationController;
use EmergencyResponse\Controllers\AdminController;
use EmergencyResponse\Controllers\IntegrationController;
use EmergencyResponse\Middleware\AuthMiddleware;
use EmergencyResponse\Middleware\RoleMiddleware;

return function (App $app) {
    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'healthy', 'timestamp' => time()]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // API base group
    $app->group('/api/v1', function ($group) {

        // Authentication routes (no auth required)
        $group->group('/auth', function ($group) {
            $group->post('/login', [AuthController::class, 'login']);
            $group->post('/register', [AuthController::class, 'register']);
            $group->post('/refresh', [AuthController::class, 'refresh']);
            $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
            $group->post('/reset-password', [AuthController::class, 'resetPassword']);
        });

        // Emergency SOS routes (minimal auth for critical operations)
        $group->group('/sos', function ($group) {
            $group->post('', [CaseController::class, 'createEmergency']);
            $group->get('/{caseId}', [CaseController::class, 'getCase']);
            $group->post('/{caseId}/location', [LocationController::class, 'updateLocation']);
            $group->post('/{caseId}/assign', [CaseController::class, 'assignResponder']);
            $group->post('/{caseId}/verify', [CaseController::class, 'verifyResponder']);
            $group->patch('/{caseId}/status', [CaseController::class, 'updateStatus']);
            $group->post('/{caseId}/cancel', [CaseController::class, 'cancelCase']);
        })->add(new AuthMiddleware());

        // Media upload routes
        $group->group('/media', function ($group) {
            $group->post('/upload', [MediaController::class, 'upload']);
            $group->get('/{mediaId}', [MediaController::class, 'download']);
            $group->get('/{mediaId}/thumbnail', [MediaController::class, 'thumbnail']);
            $group->delete('/{mediaId}', [MediaController::class, 'delete']);
        })->add(new AuthMiddleware());

        // User management routes
        $group->group('/users', function ($group) {
            $group->get('/profile', [UserController::class, 'getProfile']);
            $group->patch('/profile', [UserController::class, 'updateProfile']);
            $group->post('/trusted-contacts', [UserController::class, 'addTrustedContact']);
            $group->get('/trusted-contacts', [UserController::class, 'getTrustedContacts']);
            $group->delete('/trusted-contacts/{contactId}', [UserController::class, 'removeTrustedContact']);
            $group->post('/volunteer/apply', [UserController::class, 'applyVolunteer']);
            $group->patch('/settings', [UserController::class, 'updateSettings']);
        })->add(new AuthMiddleware());

        // Case management routes
        $group->group('/cases', function ($group) {
            $group->get('', [CaseController::class, 'getCases']);
            $group->get('/{caseId}', [CaseController::class, 'getCase']);
            $group->get('/{caseId}/timeline', [CaseController::class, 'getTimeline']);
            $group->post('/{caseId}/messages', [CaseController::class, 'sendMessage']);
            $group->get('/{caseId}/messages', [CaseController::class, 'getMessages']);
            $group->patch('/{caseId}/notes', [CaseController::class, 'updateNotes']);
        })->add(new AuthMiddleware());

        // Location and tracking routes
        $group->group('/location', function ($group) {
            $group->get('/nearby-responders', [LocationController::class, 'getNearbyResponders']);
            $group->get('/nearby-stations', [LocationController::class, 'getNearbyStations']);
            $group->post('/stream/{caseId}', [LocationController::class, 'streamLocation']);
        })->add(new AuthMiddleware());

        // Admin routes (requires admin role)
        $group->group('/admin', function ($group) {

            // User management
            $group->group('/users', function ($group) {
                $group->get('', [AdminController::class, 'getUsers']);
                $group->post('', [AdminController::class, 'createUser']);
                $group->patch('/{userId}', [AdminController::class, 'updateUser']);
                $group->delete('/{userId}', [AdminController::class, 'deleteUser']);
                $group->post('/{userId}/roles', [AdminController::class, 'assignRole']);
            });

            // Agency and station management
            $group->group('/agencies', function ($group) {
                $group->get('', [AdminController::class, 'getAgencies']);
                $group->post('', [AdminController::class, 'createAgency']);
                $group->patch('/{agencyId}', [AdminController::class, 'updateAgency']);
                $group->delete('/{agencyId}', [AdminController::class, 'deleteAgency']);

                $group->get('/{agencyId}/stations', [AdminController::class, 'getStations']);
                $group->post('/{agencyId}/stations', [AdminController::class, 'createStation']);
                $group->patch('/{agencyId}/stations/{stationId}', [AdminController::class, 'updateStation']);
                $group->delete('/{agencyId}/stations/{stationId}', [AdminController::class, 'deleteStation']);
            });

            // Case management
            $group->get('/cases', [AdminController::class, 'getAllCases']);
            $group->get('/cases/analytics', [AdminController::class, 'getCaseAnalytics']);
            $group->get('/cases/export', [AdminController::class, 'exportCases']);

            // Volunteer management
            $group->get('/volunteers', [AdminController::class, 'getVolunteers']);
            $group->patch('/volunteers/{userId}/approve', [AdminController::class, 'approveVolunteer']);
            $group->patch('/volunteers/{userId}/reject', [AdminController::class, 'rejectVolunteer']);

            // System configuration
            $group->get('/config', [AdminController::class, 'getConfig']);
            $group->patch('/config', [AdminController::class, 'updateConfig']);

            // Audit logs
            $group->get('/audit-logs', [AdminController::class, 'getAuditLogs']);

            // Integrations
            $group->get('/integrations', [IntegrationController::class, 'getIntegrations']);
            $group->post('/integrations', [IntegrationController::class, 'createIntegration']);
            $group->patch('/integrations/{integrationId}', [IntegrationController::class, 'updateIntegration']);
            $group->delete('/integrations/{integrationId}', [IntegrationController::class, 'deleteIntegration']);
            $group->post('/integrations/{integrationId}/test', [IntegrationController::class, 'testIntegration']);

        })->add(new RoleMiddleware(['station_admin', 'agency_admin', 'super_admin']));

        // Webhook endpoints for external integrations
        $group->group('/webhooks', function ($group) {
            $group->post('/dispatch', [IntegrationController::class, 'handleDispatchWebhook']);
            $group->post('/hospital', [IntegrationController::class, 'handleHospitalWebhook']);
            $group->post('/sms', [IntegrationController::class, 'handleSmsWebhook']);
        });

    });
};