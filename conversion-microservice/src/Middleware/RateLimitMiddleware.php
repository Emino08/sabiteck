<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
use Predis\Client as RedisClient;

class RateLimitMiddleware implements MiddlewareInterface
{
    private ?RedisClient $redis;
    private int $requests;
    private int $window;

    public function __construct()
    {
        // Skip Redis connection for development
        try {
            $this->redis = new RedisClient([
                'scheme' => 'tcp',
                'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
                'port' => (int)($_ENV['REDIS_PORT'] ?? 6379),
            ]);
        } catch (\Exception $e) {
            $this->redis = null; // Disable rate limiting if Redis is not available
        }
        $this->requests = (int)($_ENV['RATE_LIMIT_REQUESTS'] ?? 100);
        $this->window = (int)($_ENV['RATE_LIMIT_WINDOW'] ?? 3600);
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Skip rate limiting if Redis is not available
        if (!$this->redis) {
            return $handler->handle($request);
        }

        $clientIp = $this->getClientIp($request);
        $apiKey = $request->getHeaderLine($_ENV['API_KEY_HEADER'] ?? 'X-API-Key');

        // Use API key if available, otherwise fall back to IP
        $identifier = $apiKey ?: $clientIp;
        $key = "rate_limit:{$identifier}";

        try {
            $current = (int)$this->redis->get($key);

            if ($current >= $this->requests) {
                $ttl = $this->redis->ttl($key);
                $response = new Response();
                $response->getBody()->write(json_encode([
                    'error' => 'Rate limit exceeded',
                    'code' => 'RATE_LIMIT_EXCEEDED',
                    'retry_after' => $ttl > 0 ? $ttl : $this->window
                ]));

                return $response
                    ->withStatus(429)
                    ->withHeader('Content-Type', 'application/json')
                    ->withHeader('Retry-After', (string)($ttl > 0 ? $ttl : $this->window))
                    ->withHeader('X-RateLimit-Limit', (string)$this->requests)
                    ->withHeader('X-RateLimit-Remaining', '0')
                    ->withHeader('X-RateLimit-Reset', (string)(time() + ($ttl > 0 ? $ttl : $this->window)));
            }

            // Increment counter
            if ($current === 0) {
                $this->redis->setex($key, $this->window, 1);
            } else {
                $this->redis->incr($key);
            }

            $response = $handler->handle($request);
            $remaining = max(0, $this->requests - $current - 1);
            $ttl = $this->redis->ttl($key);

            return $response
                ->withHeader('X-RateLimit-Limit', (string)$this->requests)
                ->withHeader('X-RateLimit-Remaining', (string)$remaining)
                ->withHeader('X-RateLimit-Reset', (string)(time() + ($ttl > 0 ? $ttl : $this->window)));
        } catch (\Exception $e) {
            // If Redis fails, just continue without rate limiting
            return $handler->handle($request);
        }
    }

    private function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();

        // Check for IP behind proxy
        if (!empty($serverParams['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $serverParams['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }

        if (!empty($serverParams['HTTP_X_REAL_IP'])) {
            return $serverParams['HTTP_X_REAL_IP'];
        }

        return $serverParams['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}