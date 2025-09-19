<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\ReportController;
use App\Controllers\UserController;
use App\Controllers\InstitutionController;
use App\Controllers\CategoryController;
use App\Controllers\AnalyticsController;
use App\Controllers\NotificationController;
use App\Middleware\AuthMiddleware;
use App\Middleware\PermissionMiddleware;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    $container = $app->getContainer();

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => $_ENV['APP_VERSION']
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // Public routes (no authentication required)
    $app->group('', function (RouteCollectorProxy $group) {
        // Authentication
        $group->post('/auth/login', [AuthController::class, 'login']);
        $group->post('/auth/register', [AuthController::class, 'register']);
        $group->post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
        $group->post('/auth/reset-password', [AuthController::class, 'resetPassword']);
        $group->post('/auth/refresh', [AuthController::class, 'refresh']);

        // Public report submission (anonymous)
        $group->post('/reports/anonymous', [ReportController::class, 'createAnonymous']);

        // Public categories
        $group->get('/categories', [CategoryController::class, 'index']);

        // Public institutions
        $group->get('/institutions/public', [InstitutionController::class, 'getPublic']);

        // Public trust section
        $group->get('/trust/stories', [ReportController::class, 'getPublicStories']);
        $group->get('/trust/stats', [AnalyticsController::class, 'getPublicStats']);
    });

    // Protected routes (authentication required)
    $app->group('', function (RouteCollectorProxy $group) {
        // Authentication
        $group->post('/auth/logout', [AuthController::class, 'logout']);
        $group->get('/auth/me', [AuthController::class, 'me']);
        $group->post('/auth/change-password', [AuthController::class, 'changePassword']);
        $group->post('/auth/enable-2fa', [AuthController::class, 'enableTwoFactor']);
        $group->post('/auth/verify-2fa', [AuthController::class, 'verifyTwoFactor']);

        // User profile
        $group->get('/profile', [UserController::class, 'getProfile']);
        $group->put('/profile', [UserController::class, 'updateProfile']);

        // Reports
        $group->get('/reports', [ReportController::class, 'index']);
        $group->post('/reports', [ReportController::class, 'create']);
        $group->get('/reports/{id}', [ReportController::class, 'show']);
        $group->put('/reports/{id}', [ReportController::class, 'update']);
        $group->delete('/reports/{id}', [ReportController::class, 'delete']);

        // Report media
        $group->post('/reports/{id}/media', [ReportController::class, 'uploadMedia']);
        $group->get('/reports/{id}/media/{mediaId}', [ReportController::class, 'getMedia']);
        $group->delete('/reports/{id}/media/{mediaId}', [ReportController::class, 'deleteMedia']);

        // Report comments
        $group->get('/reports/{id}/comments', [ReportController::class, 'getComments']);
        $group->post('/reports/{id}/comments', [ReportController::class, 'addComment']);

        // Report status
        $group->put('/reports/{id}/status', [ReportController::class, 'updateStatus']);
        $group->get('/reports/{id}/history', [ReportController::class, 'getStatusHistory']);

        // Report assignment
        $group->put('/reports/{id}/assign', [ReportController::class, 'assignReport']);

        // Notifications
        $group->get('/notifications', [NotificationController::class, 'index']);
        $group->put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        $group->post('/notifications/register-token', [NotificationController::class, 'registerPushToken']);

        // Export
        $group->get('/reports/export/csv', [ReportController::class, 'exportCsv']);
        $group->get('/reports/export/pdf', [ReportController::class, 'exportPdf']);

    })->add(new AuthMiddleware($container->get('App\Services\AuthService')));

    // Admin routes (require specific permissions)
    $app->group('/admin', function (RouteCollectorProxy $group) {
        // User management
        $group->get('/users', [UserController::class, 'index']);
        $group->post('/users', [UserController::class, 'create']);
        $group->get('/users/{id}', [UserController::class, 'show']);
        $group->put('/users/{id}', [UserController::class, 'update']);
        $group->delete('/users/{id}', [UserController::class, 'delete']);

        // Institution management
        $group->get('/institutions', [InstitutionController::class, 'index']);
        $group->post('/institutions', [InstitutionController::class, 'create']);
        $group->get('/institutions/{id}', [InstitutionController::class, 'show']);
        $group->put('/institutions/{id}', [InstitutionController::class, 'update']);
        $group->delete('/institutions/{id}', [InstitutionController::class, 'delete']);

        // Category management
        $group->post('/categories', [CategoryController::class, 'create']);
        $group->put('/categories/{id}', [CategoryController::class, 'update']);
        $group->delete('/categories/{id}', [CategoryController::class, 'delete']);

        // Analytics
        $group->get('/analytics/dashboard', [AnalyticsController::class, 'getDashboard']);
        $group->get('/analytics/reports', [AnalyticsController::class, 'getReportAnalytics']);
        $group->get('/analytics/trends', [AnalyticsController::class, 'getTrends']);
        $group->get('/analytics/export', [AnalyticsController::class, 'exportAnalytics']);

        // Audit logs
        $group->get('/audit-logs', [UserController::class, 'getAuditLogs']);

        // System settings
        $group->get('/settings', [UserController::class, 'getSettings']);
        $group->put('/settings', [UserController::class, 'updateSettings']);

    })
    ->add(new AuthMiddleware($container->get('App\Services\AuthService')))
    ->add(new PermissionMiddleware($container->get('App\Services\AuthService')));
};