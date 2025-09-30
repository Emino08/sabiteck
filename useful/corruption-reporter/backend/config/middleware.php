<?php

declare(strict_types=1);

use App\Middleware\AuthMiddleware;
use App\Middleware\CorsMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Middleware\AuditMiddleware;
use App\Middleware\ValidationMiddleware;
use Slim\App;
use Tuupola\Middleware\CorsMiddleware as TuupolaCors;

return function (App $app) {
    $container = $app->getContainer();

    // CORS middleware
    $app->add(new TuupolaCors([
        'origin' => explode(',', $_ENV['CORS_ALLOWED_ORIGINS']),
        'methods' => explode(',', $_ENV['CORS_ALLOWED_METHODS']),
        'headers.allow' => explode(',', $_ENV['CORS_ALLOWED_HEADERS']),
        'headers.expose' => ['X-Total-Count', 'X-Page-Count'],
        'credentials' => true,
        'cache' => 86400,
    ]));

    // Rate limiting middleware
    $app->add(new RateLimitMiddleware(
        $container->get('redis'),
        (int)$_ENV['API_RATE_LIMIT'],
        (int)$_ENV['API_RATE_LIMIT_WINDOW']
    ));

    // Audit middleware (log all requests)
    $app->add(new AuditMiddleware($container->get('App\Services\AuditService')));

    // Body parsing middleware
    $app->addBodyParsingMiddleware();

    // Routing middleware
    $app->addRoutingMiddleware();
};