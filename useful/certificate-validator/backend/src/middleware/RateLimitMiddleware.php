<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Database\Database;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class RateLimitMiddleware implements MiddlewareInterface
{
    private Database $database;
    private array $settings;

    public function __construct(Database $database, array $settings)
    {
        $this->database = $database;
        $this->settings = $settings;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $identifier = $this->getIdentifier($request);
        $action = $this->getAction($request);

        if ($this->isRateLimited($identifier, $action)) {
            return $this->createRateLimitResponse();
        }

        $this->recordAttempt($identifier, $action);

        return $handler->handle($request);
    }

    private function getIdentifier(ServerRequestInterface $request): string
    {
        // Use X-Forwarded-For if available, otherwise use REMOTE_ADDR
        $serverParams = $request->getServerParams();
        $ip = $serverParams['HTTP_X_FORWARDED_FOR'] ??
              $serverParams['HTTP_X_REAL_IP'] ??
              $serverParams['REMOTE_ADDR'] ??
              'unknown';

        // If X-Forwarded-For contains multiple IPs, use the first one
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }

        return $ip;
    }

    private function getAction(ServerRequestInterface $request): string
    {
        $path = $request->getUri()->getPath();

        // Different rate limits for different endpoints
        if (strpos($path, '/api/verify') !== false) {
            return 'verify';
        } elseif (strpos($path, '/api/auth') !== false) {
            return 'auth';
        } elseif (strpos($path, '/api/upload') !== false) {
            return 'upload';
        }

        return 'general';
    }

    private function isRateLimited(string $identifier, string $action): bool
    {
        $limit = $this->getLimit($action);
        $windowStart = date('Y-m-d H:i:00'); // Current minute

        $sql = "SELECT attempts FROM rate_limits
                WHERE identifier = :identifier
                AND action = :action
                AND window_start = :window_start";

        $result = $this->database->queryOne($sql, [
            'identifier' => $identifier,
            'action' => $action,
            'window_start' => $windowStart
        ]);

        return $result && $result['attempts'] >= $limit;
    }

    private function getLimit(string $action): int
    {
        $limits = [
            'verify' => $this->settings['per_minute'] * 2, // Higher limit for verification
            'auth' => 10, // Lower limit for authentication attempts
            'upload' => 5, // Very low limit for uploads
            'general' => $this->settings['per_minute']
        ];

        return $limits[$action] ?? $this->settings['per_minute'];
    }

    private function recordAttempt(string $identifier, string $action): void
    {
        $windowStart = date('Y-m-d H:i:00');

        $sql = "INSERT INTO rate_limits (identifier, action, attempts, window_start)
                VALUES (:identifier, :action, 1, :window_start)
                ON DUPLICATE KEY UPDATE attempts = attempts + 1";

        $this->database->execute($sql, [
            'identifier' => $identifier,
            'action' => $action,
            'window_start' => $windowStart
        ]);

        // Clean up old records (older than 1 hour)
        $cleanupTime = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $this->database->execute(
            "DELETE FROM rate_limits WHERE window_start < :cleanup_time",
            ['cleanup_time' => $cleanupTime]
        );
    }

    private function createRateLimitResponse(): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => [
                'type' => 'Rate Limit Exceeded',
                'message' => 'Too many requests. Please try again later.',
                'status' => 429,
                'retry_after' => 60
            ]
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Retry-After', '60')
            ->withStatus(429);
    }
}