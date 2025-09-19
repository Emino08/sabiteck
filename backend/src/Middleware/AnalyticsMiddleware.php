<?php

namespace DevCo\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use DevCo\Utils\AnalyticsService;
use Monolog\Logger;

class AnalyticsMiddleware implements MiddlewareInterface
{
    private $analyticsService;
    private $logger;
    private $excludedPaths;

    public function __construct()
    {
        $this->analyticsService = new AnalyticsService();
        $this->logger = new Logger('analytics-middleware');

        // Paths to exclude from analytics tracking
        $this->excludedPaths = [
            '/api/',
            '/admin/',
            '/health',
            '/robots.txt',
            '/favicon.ico',
            '.css',
            '.js',
            '.png',
            '.jpg',
            '.gif',
            '.svg',
            '.woff',
            '.woff2',
            '.ttf',
            '.eot'
        ];
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        // Handle preflight OPTIONS request immediately - don't track these
        if ($request->getMethod() === 'OPTIONS') {
            return $handler->handle($request);
        }

        $startTime = microtime(true);
        $response = $handler->handle($request);

        // Only track if this is not an excluded path and is a GET request for HTML content
        if ($this->shouldTrack($request, $response)) {
            $this->trackRequest($request, $response, $startTime);
        }

        return $response;
    }

    /**
     * Determine if this request should be tracked
     */
    private function shouldTrack(Request $request, Response $response): bool
    {
        $uri = $request->getUri();
        $path = $uri->getPath();
        $method = $request->getMethod();

        // Only track GET requests that return successful HTML responses
        if ($method !== 'GET') {
            return false;
        }

        // Check if response is HTML (don't track API JSON responses)
        $contentType = $response->getHeader('Content-Type')[0] ?? '';
        if (strpos($contentType, 'text/html') === false) {
            return false;
        }

        // Check if path is excluded
        foreach ($this->excludedPaths as $excludedPath) {
            if (strpos($path, $excludedPath) !== false) {
                return false;
            }
        }

        // Check response status
        if ($response->getStatusCode() >= 400) {
            return false;
        }

        return true;
    }

    /**
     * Track the request
     */
    private function trackRequest(Request $request, Response $response, float $startTime): void
    {
        try {
            $uri = $request->getUri();
            $headers = $request->getHeaders();
            $cookies = $request->getCookieParams();
            $queryParams = $request->getQueryParams();

            // Extract request data
            $requestData = [
                'ip_address' => $this->getClientIP($request),
                'user_agent' => $headers['User-Agent'][0] ?? '',
                'page_url' => (string) $uri,
                'page_path' => $uri->getPath(),
                'referrer' => $headers['Referer'][0] ?? $headers['Referrer'][0] ?? '',
                'language' => $this->extractLanguage($headers['Accept-Language'][0] ?? ''),
                'visitor_id' => $cookies['analytics_visitor_id'] ?? null,
                'session_id' => $cookies['analytics_session_id'] ?? null,

                // UTM parameters
                'utm_source' => $queryParams['utm_source'] ?? null,
                'utm_medium' => $queryParams['utm_medium'] ?? null,
                'utm_campaign' => $queryParams['utm_campaign'] ?? null,
                'utm_term' => $queryParams['utm_term'] ?? null,
                'utm_content' => $queryParams['utm_content'] ?? null,

                // Additional data
                'response_time' => round((microtime(true) - $startTime) * 1000), // in milliseconds
                'status_code' => $response->getStatusCode()
            ];

            // Process visitor and get tracking data
            $trackingData = $this->analyticsService->processVisitor($requestData);

            // Extract page title from response if HTML
            $pageTitle = $this->extractPageTitle($response);

            // Track the page view
            $pageViewData = [
                'session_id' => $trackingData['session_id'],
                'visitor_id' => $trackingData['visitor_id'],
                'page_url' => $requestData['page_url'],
                'page_title' => $pageTitle,
                'page_path' => $requestData['page_path'],
                'time_on_page' => 0, // Will be updated by JavaScript
                'scroll_depth' => 0, // Will be updated by JavaScript
                'is_entry_page' => true // Assume entry page for server-side tracking
            ];

            $this->analyticsService->trackPageView($pageViewData);

            // Set cookies for client-side tracking
            $this->setCookies($response, $trackingData);

            $this->logger->info('Analytics tracked', [
                'visitor_id' => $trackingData['visitor_id'],
                'session_id' => $trackingData['session_id'],
                'page' => $requestData['page_path']
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Analytics tracking failed: ' . $e->getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private function getClientIP(Request $request): string
    {
        $headers = $request->getHeaders();

        // Check for IP in various headers
        $ipHeaders = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($ipHeaders as $header) {
            if (isset($headers[$header]) && !empty($headers[$header][0])) {
                $ip = trim($headers[$header][0]);

                // Handle comma-separated IPs (from X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }

                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        // Fallback to server variables
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Extract language from Accept-Language header
     */
    private function extractLanguage(string $acceptLanguage): ?string
    {
        if (empty($acceptLanguage)) {
            return null;
        }

        // Extract first language preference
        $languages = explode(',', $acceptLanguage);
        $firstLanguage = trim($languages[0]);

        // Extract just the language code (before any quality values)
        if (strpos($firstLanguage, ';') !== false) {
            $firstLanguage = trim(explode(';', $firstLanguage)[0]);
        }

        return $firstLanguage;
    }

    /**
     * Extract page title from HTML response
     */
    private function extractPageTitle(Response $response): ?string
    {
        $contentType = $response->getHeader('Content-Type')[0] ?? '';

        if (strpos($contentType, 'text/html') === false) {
            return null;
        }

        try {
            $body = (string) $response->getBody();

            // Use regex to extract title tag content
            if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $body, $matches)) {
                return trim(html_entity_decode($matches[1]));
            }
        } catch (\Exception $e) {
            $this->logger->debug('Failed to extract page title: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Set analytics cookies
     */
    private function setCookies(Response $response, array $trackingData): void
    {
        $cookieOptions = [
            'expires' => time() + (365 * 24 * 60 * 60), // 1 year
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => false, // Allow JavaScript access
            'samesite' => 'Lax'
        ];

        // Set visitor ID cookie
        setcookie('analytics_visitor_id', $trackingData['visitor_id'], $cookieOptions);

        // Set session ID cookie with shorter expiry
        $sessionOptions = $cookieOptions;
        $sessionOptions['expires'] = time() + (30 * 60); // 30 minutes
        setcookie('analytics_session_id', $trackingData['session_id'], $sessionOptions);

        // Set device info for client-side access
        if (!empty($trackingData['device_info'])) {
            $deviceInfo = base64_encode(json_encode($trackingData['device_info']));
            setcookie('analytics_device_info', $deviceInfo, $cookieOptions);
        }
    }

    /**
     * Check if visitor has opted out
     */
    public function hasOptedOut(string $visitorId): bool
    {
        return $this->analyticsService->hasOptedOut($visitorId);
    }
}