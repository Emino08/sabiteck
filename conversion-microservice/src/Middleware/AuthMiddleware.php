<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware implements MiddlewareInterface
{
    private array $skipPaths = ['/health'];

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();

        // Skip authentication for preflight requests and health check
        if ($request->getMethod() === 'OPTIONS' || in_array($path, $this->skipPaths)) {
            return $handler->handle($request);
        }

        // Check for API key
        $apiKey = $request->getHeaderLine($_ENV['API_KEY_HEADER'] ?? 'X-API-Key');
        if (!$apiKey) {
            $authHeader = $request->getHeaderLine('Authorization');
            if (str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                try {
                    $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
                    $request = $request->withAttribute('user', $decoded);
                    return $handler->handle($request);
                } catch (\Exception $e) {
                    return $this->unauthorizedResponse('Invalid JWT token');
                }
            }
            return $this->unauthorizedResponse('API key or JWT token required');
        }

        // Validate API key (in production, check against database)
        if (!$this->isValidApiKey($apiKey)) {
            return $this->unauthorizedResponse('Invalid API key');
        }

        $request = $request->withAttribute('api_key', $apiKey);
        return $handler->handle($request);
    }

    private function isValidApiKey(string $apiKey): bool
    {
        // In development, accept any non-empty key
        if ($_ENV['APP_ENV'] !== 'production') {
            return !empty($apiKey);
        }

        // In production, implement proper API key validation
        // This should check against a database or configuration
        $validKeys = explode(',', $_ENV['VALID_API_KEYS'] ?? '');
        return in_array($apiKey, $validKeys);
    }

    private function unauthorizedResponse(string $message): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => $message,
            'code' => 'UNAUTHORIZED'
        ]));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }
}