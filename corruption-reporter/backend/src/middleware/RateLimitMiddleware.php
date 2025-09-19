<?php

declare(strict_types=1);

namespace App\Middleware;

use Predis\Client as RedisClient;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class RateLimitMiddleware implements MiddlewareInterface
{
    private RedisClient $redis;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(RedisClient $redis, int $maxRequests, int $windowSeconds)
    {
        $this->redis = $redis;
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $clientId = $this->getClientIdentifier($request);
        $key = "rate_limit:{$clientId}";

        $currentRequests = (int)$this->redis->get($key);

        if ($currentRequests >= $this->maxRequests) {
            return $this->rateLimitExceededResponse($currentRequests);
        }

        // Increment counter
        $this->redis->incr($key);

        // Set expiration on first request
        if ($currentRequests === 0) {
            $this->redis->expire($key, $this->windowSeconds);
        }

        $response = $handler->handle($request);

        // Add rate limit headers
        $remaining = max(0, $this->maxRequests - $currentRequests - 1);
        $resetTime = time() + $this->redis->ttl($key);

        return $response
            ->withHeader('X-RateLimit-Limit', (string)$this->maxRequests)
            ->withHeader('X-RateLimit-Remaining', (string)$remaining)
            ->withHeader('X-RateLimit-Reset', (string)$resetTime);
    }

    private function getClientIdentifier(Request $request): string
    {
        // Try to get user ID from token first
        $authHeader = $request->getHeaderLine('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            try {
                $token = $matches[1];
                $decoded = \Firebase\JWT\JWT::decode(
                    $token,
                    new \Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256')
                );
                return 'user:' . $decoded->user_id;
            } catch (\Exception $e) {
                // Fall back to IP-based rate limiting
            }
        }

        // Fall back to IP address
        $forwarded = $request->getHeaderLine('X-Forwarded-For');
        if ($forwarded) {
            $ip = explode(',', $forwarded)[0];
        } else {
            $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown';
        }

        return 'ip:' . $ip;
    }

    private function rateLimitExceededResponse(int $currentRequests): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'error' => 'Rate limit exceeded',
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => $this->windowSeconds
        ]));

        return $response
            ->withStatus(429)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('X-RateLimit-Limit', (string)$this->maxRequests)
            ->withHeader('X-RateLimit-Remaining', '0')
            ->withHeader('Retry-After', (string)$this->windowSeconds);
    }
}