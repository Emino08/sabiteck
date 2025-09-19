<?php

declare(strict_types=1);

namespace EmergencyResponse\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Predis\Client as Redis;
use Slim\Psr7\Response as SlimResponse;

class RateLimitMiddleware implements MiddlewareInterface
{
    private Redis $redis;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(int $maxRequests = 100, int $windowSeconds = 3600)
    {
        $this->redis = new Redis([
            'scheme' => 'tcp',
            'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
            'port' => $_ENV['REDIS_PORT'] ?? 6379,
            'password' => $_ENV['REDIS_PASSWORD'] ?? null,
        ]);
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $clientId = $this->getClientIdentifier($request);
        $key = "rate_limit:{$clientId}";

        try {
            // Get current count
            $current = $this->redis->get($key);
            $current = $current ? (int) $current : 0;

            // Check if limit exceeded
            if ($current >= $this->maxRequests) {
                return $this->rateLimitExceededResponse();
            }

            // Increment counter
            $pipe = $this->redis->pipeline();
            $pipe->incr($key);
            if ($current === 0) {
                $pipe->expire($key, $this->windowSeconds);
            }
            $pipe->execute();

            // Add rate limit headers to response
            $response = $handler->handle($request);

            return $response
                ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
                ->withHeader('X-RateLimit-Remaining', (string) max(0, $this->maxRequests - $current - 1))
                ->withHeader('X-RateLimit-Window', (string) $this->windowSeconds);

        } catch (\Exception $e) {
            // If Redis is unavailable, allow the request but log the error
            error_log("Rate limiting failed: " . $e->getMessage());
            return $handler->handle($request);
        }
    }

    private function getClientIdentifier(Request $request): string
    {
        $serverParams = $request->getServerParams();

        // Try to get user ID from authenticated user
        $user = $request->getAttribute('user');
        if ($user && isset($user->id)) {
            return "user:{$user->id}";
        }

        // Fall back to IP address
        $ip = $serverParams['HTTP_X_FORWARDED_FOR'] ??
              $serverParams['HTTP_X_REAL_IP'] ??
              $serverParams['REMOTE_ADDR'] ??
              'unknown';

        // Handle comma-separated IPs in X-Forwarded-For
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }

        return "ip:{$ip}";
    }

    private function rateLimitExceededResponse(): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'error' => 'Rate limit exceeded',
            'message' => "Too many requests. Limit: {$this->maxRequests} requests per {$this->windowSeconds} seconds.",
            'code' => 429
        ]));

        return $response
            ->withStatus(429)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Retry-After', (string) $this->windowSeconds);
    }
}