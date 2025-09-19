<?php

declare(strict_types=1);

use Slim\App;
use EmergencyResponse\Middleware\RateLimitMiddleware;
use EmergencyResponse\Middleware\SecurityHeadersMiddleware;
use EmergencyResponse\Middleware\AuditLogMiddleware;

return function (App $app) {
    // Security headers
    $app->add(new SecurityHeadersMiddleware());

    // Rate limiting
    if ($_ENV['RATE_LIMIT_ENABLED'] ?? true) {
        $app->add(new RateLimitMiddleware(
            (int) ($_ENV['RATE_LIMIT_REQUESTS'] ?? 100),
            (int) ($_ENV['RATE_LIMIT_WINDOW'] ?? 3600)
        ));
    }

    // Audit logging for all API requests
    $app->add(new AuditLogMiddleware());

    // Body parsing middleware
    $app->addBodyParsingMiddleware();

    // Routing middleware
    $app->addRoutingMiddleware();
};