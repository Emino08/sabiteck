<?php

declare(strict_types=1);

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Middleware\AuthMiddleware;
use App\Controllers\AuthController;
use App\Controllers\VerificationController;
use App\Controllers\InstitutionController;
use App\Controllers\CredentialController;
use App\Controllers\UserController;
use App\Controllers\AuditController;
use App\Utils\AuditLogger;
use App\Utils\Cache;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/** @var App $app */

// Get container services
$container = $app->getContainer();
$database = $container->get(\App\Database\Database::class);
$logger = $container->get(\Monolog\Logger::class);
$settings = $container->get('settings');

// Initialize utilities
$auditLogger = new AuditLogger($database, $logger);
$cache = new Cache($database, $settings['cache']);

// Initialize controllers
$authController = new AuthController($database, $settings['jwt'], $auditLogger);
$verificationController = new VerificationController($database, $auditLogger, $cache, $settings);

// Health check endpoint
$app->get('/health', function (ServerRequestInterface $request, ResponseInterface $response) {
    $response->getBody()->write(json_encode([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'version' => '1.0.0'
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

// Public verification endpoints (no auth required)
$app->group('/api/verify', function (RouteCollectorProxy $group) use ($verificationController) {
    $group->get('/{code}', [$verificationController, 'verify']);
    $group->post('/request', [$verificationController, 'requestDetailedVerification']);
    $group->get('/detailed/{token}', [$verificationController, 'getDetailedVerification']);
    $group->get('/stats', [$verificationController, 'getStatistics']);
});

// Authentication endpoints
$app->group('/api/auth', function (RouteCollectorProxy $group) use ($authController, $database, $settings) {
    $group->post('/login', [$authController, 'login']);
    $group->post('/forgot-password', [$authController, 'forgotPassword']);
    $group->post('/reset-password', [$authController, 'resetPassword']);

    // Protected auth endpoints
    $group->group('', function (RouteCollectorProxy $group) use ($authController) {
        $group->post('/refresh', [$authController, 'refresh']);
        $group->post('/logout', [$authController, 'logout']);
        $group->post('/enable-mfa', [$authController, 'enableMFA']);
        $group->post('/disable-mfa', [$authController, 'disableMFA']);
    })->add(new AuthMiddleware($database, $settings['jwt']));
});

// Protected API routes
$app->group('/api', function (RouteCollectorProxy $group) use ($database, $settings, $auditLogger, $cache) {

    // Institution management
    $group->group('/institutions', function (RouteCollectorProxy $group) {
        $institutionController = new InstitutionController($this->get(\App\Database\Database::class), $this->get(\App\Utils\AuditLogger::class));
        $group->get('', [$institutionController, 'list']);
        $group->post('', [$institutionController, 'create']);
        $group->get('/{id}', [$institutionController, 'get']);
        $group->put('/{id}', [$institutionController, 'update']);
        $group->delete('/{id}', [$institutionController, 'delete']);
        $group->post('/{id}/verify', [$institutionController, 'verify']);
    });

    // User management
    $group->group('/users', function (RouteCollectorProxy $group) {
        $userController = new UserController($this->get(\App\Database\Database::class), $this->get(\App\Utils\AuditLogger::class));
        $group->get('', [$userController, 'list']);
        $group->post('', [$userController, 'create']);
        $group->get('/{id}', [$userController, 'get']);
        $group->put('/{id}', [$userController, 'update']);
        $group->delete('/{id}', [$userController, 'delete']);
        $group->post('/invite', [$userController, 'invite']);
        $group->post('/{id}/reset-password', [$userController, 'resetPassword']);
    });

    // Credential management
    $group->group('/credentials', function (RouteCollectorProxy $group) {
        $credentialController = new CredentialController($this->get(\App\Database\Database::class), $this->get(\App\Utils\AuditLogger::class), $this->get(\App\Utils\Cache::class));
        $group->get('', [$credentialController, 'list']);
        $group->post('', [$credentialController, 'create']);
        $group->get('/{id}', [$credentialController, 'get']);
        $group->put('/{id}', [$credentialController, 'update']);
        $group->delete('/{id}', [$credentialController, 'delete']);
        $group->post('/{id}/approve', [$credentialController, 'approve']);
        $group->post('/{id}/revoke', [$credentialController, 'revoke']);
        $group->post('/bulk-import', [$credentialController, 'bulkImport']);
        $group->get('/export', [$credentialController, 'export']);
    });

    // Verification request management
    $group->group('/verification-requests', function (RouteCollectorProxy $group) {
        $verificationController = new VerificationController($this->get(\App\Database\Database::class), $this->get(\App\Utils\AuditLogger::class), $this->get(\App\Utils\Cache::class), $this->get('settings'));
        $group->get('', function ($request, $response) { /* List requests */ });
        $group->post('/{id}/approve', function ($request, $response) { /* Approve request */ });
        $group->post('/{id}/deny', function ($request, $response) { /* Deny request */ });
    });

    // Audit logs
    $group->group('/audit', function (RouteCollectorProxy $group) {
        $auditController = new AuditController($this->get(\App\Utils\AuditLogger::class));
        $group->get('/logs', [$auditController, 'getLogs']);
        $group->get('/credentials/{id}/trail', [$auditController, 'getCredentialTrail']);
        $group->get('/users/{id}/activity', [$auditController, 'getUserActivity']);
        $group->get('/institutions/{id}/activity', [$auditController, 'getInstitutionActivity']);
    });

    // File uploads
    $group->group('/files', function (RouteCollectorProxy $group) {
        $group->post('/upload', function ($request, $response) {
            // File upload handler
            return $response;
        });
        $group->get('/{id}', function ($request, $response) {
            // File download handler
            return $response;
        });
    });

    // QR code generation
    $group->get('/qr/{slug}', function (ServerRequestInterface $request, ResponseInterface $response) use ($database, $settings) {
        $slug = $request->getAttribute('slug');

        // Get credential
        $credential = $database->queryOne(
            "SELECT verification_slug FROM credentials WHERE verification_slug = :slug AND status = 'valid'",
            ['slug' => $slug]
        );

        if (!$credential) {
            return $response->withStatus(404);
        }

        // Generate QR code
        $verificationUrl = $settings['app']['frontend_url'] . "/verify/$slug";

        // Use endroid/qr-code library
        $qrCode = new \Endroid\QrCode\QrCode($verificationUrl);
        $qrCode->setSize(200);
        $qrCode->setMargin(10);

        $writer = new \Endroid\QrCode\Writer\PngWriter();
        $result = $writer->write($qrCode);

        $response->getBody()->write($result->getString());
        return $response->withHeader('Content-Type', 'image/png');
    });

})->add(new AuthMiddleware($database, $settings['jwt']));

// Error handler for 404
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function (ServerRequestInterface $request, ResponseInterface $response) {
    $response->getBody()->write(json_encode([
        'error' => [
            'type' => 'Not Found',
            'message' => 'Endpoint not found',
            'status' => 404
        ]
    ]));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
});

// Configure DI container for controllers
$container->set(AuditLogger::class, $auditLogger);
$container->set(Cache::class, $cache);