<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class SecurityMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Only allow HTTPS in production
        if ($_ENV['APP_ENV'] === 'production' && $request->getUri()->getScheme() !== 'https') {
            $response = new Response();
            $response->getBody()->write(json_encode([
                'error' => 'HTTPS required',
                'code' => 'HTTPS_REQUIRED'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Add security headers
        $response = $handler->handle($request);

        return $response
            ->withHeader('X-Frame-Options', 'DENY')
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-XSS-Protection', '1; mode=block')
            ->withHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
            ->withHeader('Content-Security-Policy', "default-src 'self'")
            ->withHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}