<?php

namespace DevCo\Utils;

use GeoIp2\Database\Reader;
use Mobile_Detect;
use DeviceDetector\DeviceDetector;
use WhichBrowser\Parser;
use DevCo\Models\Analytics;
use Monolog\Logger;

class AnalyticsService
{
    private $analytics;
    private $geoipReader;
    private $mobileDetect;
    private $logger;
    private $settings;

    public function __construct()
    {
        $this->analytics = new Analytics();
        $this->logger = new Logger('analytics-service');
        $this->mobileDetect = new Mobile_Detect();
        $this->settings = $this->analytics->getSettings();

        // Initialize GeoIP reader if available
        $geoipPath = __DIR__ . '/../../data/GeoLite2-City.mmdb';
        if (file_exists($geoipPath)) {
            try {
                $this->geoipReader = new Reader($geoipPath);
            } catch (\Exception $e) {
                $this->logger->warning('GeoIP database not available: ' . $e->getMessage());
            }
        }
    }

    /**
     * Process and track a visitor
     */
    public function processVisitor(array $requestData): array
    {
        $visitorId = $this->generateVisitorId($requestData);
        $sessionId = $this->generateSessionId($visitorId);

        // Get visitor information
        $visitorData = $this->extractVisitorData($requestData, $visitorId);

        // Get session information
        $sessionData = $this->extractSessionData($requestData, $visitorId, $sessionId);

        // Track visitor
        $this->analytics->trackVisitor($visitorData);

        // Create or update session
        $this->analytics->createSession($sessionData);

        // Update realtime data
        $this->analytics->updateRealtime([
            'visitor_id' => $visitorId,
            'session_id' => $sessionId,
            'page_url' => $requestData['page_url'] ?? '',
            'page_title' => $requestData['page_title'] ?? '',
            'country' => $visitorData['country'] ?? null,
            'device_type' => $visitorData['device_type'] ?? 'desktop'
        ]);

        return [
            'visitor_id' => $visitorId,
            'session_id' => $sessionId,
            'is_new_visitor' => !isset($requestData['returning_visitor']),
            'device_info' => [
                'type' => $visitorData['device_type'],
                'model' => $visitorData['device_model'],
                'os' => $visitorData['operating_system'],
                'browser' => $visitorData['browser']
            ],
            'location' => [
                'country' => $visitorData['country'],
                'region' => $visitorData['region'],
                'city' => $visitorData['city']
            ]
        ];
    }

    /**
     * Track a page view
     */
    public function trackPageView(array $pageData): bool
    {
        return $this->analytics->trackPageView($pageData);
    }

    /**
     * Track an event
     */
    public function trackEvent(array $eventData): bool
    {
        return $this->analytics->trackEvent($eventData);
    }

    /**
     * Generate unique visitor ID
     */
    private function generateVisitorId(array $requestData): string
    {
        $ip = $requestData['ip_address'] ?? '';
        $userAgent = $requestData['user_agent'] ?? '';
        $fingerprint = $requestData['fingerprint'] ?? '';

        // Use provided visitor ID if available and valid
        if (!empty($requestData['visitor_id']) && strlen($requestData['visitor_id']) === 40) {
            return $requestData['visitor_id'];
        }

        // Generate new visitor ID
        return hash('sha1', $ip . $userAgent . $fingerprint . date('Y-m-d'));
    }

    /**
     * Generate session ID
     */
    private function generateSessionId(string $visitorId): string
    {
        if (!empty($_COOKIE['analytics_session']) && strlen($_COOKIE['analytics_session']) === 40) {
            return $_COOKIE['analytics_session'];
        }

        return hash('sha1', $visitorId . microtime(true) . rand());
    }

    /**
     * Extract visitor data from request
     */
    private function extractVisitorData(array $requestData, string $visitorId): array
    {
        $userAgent = $requestData['user_agent'] ?? '';
        $ip = $requestData['ip_address'] ?? '';

        $data = [
            'visitor_id' => $visitorId,
            'ip_address' => $ip,
            'anonymized_ip' => $this->anonymizeIP($ip),
            'user_agent' => $userAgent,
            'language' => $requestData['language'] ?? null,
            'timezone' => $requestData['timezone'] ?? null,
            'screen_resolution' => $requestData['screen_resolution'] ?? null,
            'is_gdpr_compliant' => $this->settings['gdpr_enabled'] ?? false
        ];

        // Get geographical data
        $geoData = $this->getGeoData($ip);
        $data = array_merge($data, $geoData);

        // Get device data
        $deviceData = $this->getDeviceData($userAgent);
        $data = array_merge($data, $deviceData);

        return $data;
    }

    /**
     * Extract session data from request
     */
    private function extractSessionData(array $requestData, string $visitorId, string $sessionId): array
    {
        $referrer = $requestData['referrer'] ?? '';
        $entryPage = $requestData['page_url'] ?? '';

        return [
            'session_id' => $sessionId,
            'visitor_id' => $visitorId,
            'referrer_url' => $referrer,
            'referrer_domain' => $this->extractDomain($referrer),
            'referrer_type' => $this->classifyReferrer($referrer),
            'entry_page' => $entryPage,
            'utm_source' => $requestData['utm_source'] ?? null,
            'utm_medium' => $requestData['utm_medium'] ?? null,
            'utm_campaign' => $requestData['utm_campaign'] ?? null,
            'utm_term' => $requestData['utm_term'] ?? null,
            'utm_content' => $requestData['utm_content'] ?? null
        ];
    }

    /**
     * Get geographical data from IP
     */
    private function getGeoData(string $ip): array
    {
        if (!$this->geoipReader || empty($ip) || $ip === '127.0.0.1') {
            return [
                'country' => null,
                'region' => null,
                'city' => null
            ];
        }

        try {
            $record = $this->geoipReader->city($ip);

            return [
                'country' => $record->country->name,
                'region' => $record->mostSpecificSubdivision->name,
                'city' => $record->city->name
            ];
        } catch (\Exception $e) {
            $this->logger->debug('GeoIP lookup failed: ' . $e->getMessage());
            return [
                'country' => null,
                'region' => null,
                'city' => null
            ];
        }
    }

    /**
     * Get device information from User Agent
     */
    private function getDeviceData(string $userAgent): array
    {
        if (empty($userAgent)) {
            return [
                'device_type' => 'desktop',
                'device_model' => null,
                'operating_system' => null,
                'browser' => null,
                'browser_version' => null
            ];
        }

        // Use DeviceDetector for detailed device info
        $dd = new DeviceDetector($userAgent);
        $dd->parse();

        // Use WhichBrowser for additional browser info
        $browser = new Parser($userAgent);

        // Use MobileDetect for device type
        $this->mobileDetect->setUserAgent($userAgent);

        // Determine device type
        $deviceType = 'desktop';
        if ($this->mobileDetect->isMobile()) {
            $deviceType = 'mobile';
        } elseif ($this->mobileDetect->isTablet()) {
            $deviceType = 'tablet';
        } elseif ($dd->isBot()) {
            $deviceType = 'bot';
        }

        // Get device model for mobile devices
        $deviceModel = null;
        if ($deviceType === 'mobile' || $deviceType === 'tablet') {
            $deviceModel = $dd->getDeviceName();
            if (empty($deviceModel)) {
                // Try to extract from MobileDetect
                foreach ($this->mobileDetect->getPhoneDevices() as $device => $regex) {
                    if ($this->mobileDetect->is($device)) {
                        $deviceModel = $device;
                        break;
                    }
                }
            }
        }

        return [
            'device_type' => $deviceType,
            'device_model' => $deviceModel,
            'operating_system' => $dd->getOs('name') ?? $browser->os->name ?? null,
            'browser' => $dd->getClient('name') ?? $browser->browser->name ?? null,
            'browser_version' => $dd->getClient('version') ?? $browser->browser->version->value ?? null
        ];
    }

    /**
     * Anonymize IP address for GDPR compliance
     */
    private function anonymizeIP(string $ip): string
    {
        if (!($this->settings['anonymize_ip'] ?? false)) {
            return $ip;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            // IPv4: Replace last octet with 0
            return preg_replace('/\d+$/', '0', $ip);
        } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            // IPv6: Replace last 80 bits with zeros
            $parts = explode(':', $ip);
            if (count($parts) >= 4) {
                array_splice($parts, -5, 5, ['0', '0', '0', '0', '0']);
                return implode(':', $parts);
            }
        }

        return $ip;
    }

    /**
     * Extract domain from URL
     */
    private function extractDomain(string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        $parsed = parse_url($url);
        return $parsed['host'] ?? null;
    }

    /**
     * Classify referrer type
     */
    private function classifyReferrer(string $referrer): string
    {
        if (empty($referrer)) {
            return 'direct';
        }

        $domain = $this->extractDomain($referrer);

        if (!$domain) {
            return 'direct';
        }

        // Search engines
        $searchEngines = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'yandex.'];
        foreach ($searchEngines as $engine) {
            if (strpos($domain, $engine) !== false) {
                return 'search';
            }
        }

        // Social media
        $socialSites = ['facebook.', 'twitter.', 'linkedin.', 'instagram.', 'youtube.', 'tiktok.', 'pinterest.'];
        foreach ($socialSites as $social) {
            if (strpos($domain, $social) !== false) {
                return 'social';
            }
        }

        // Email
        $emailSites = ['gmail.', 'outlook.', 'yahoo.', 'mail.'];
        foreach ($emailSites as $email) {
            if (strpos($domain, $email) !== false) {
                return 'email';
            }
        }

        return 'organic';
    }

    /**
     * Check if user has opted out
     */
    public function hasOptedOut(string $visitorId): bool
    {
        try {
            $stmt = $this->analytics->db->prepare("SELECT opted_out FROM analytics_visitors WHERE visitor_id = ?");
            $stmt->execute([$visitorId]);
            $result = $stmt->fetch();

            return $result ? (bool) $result['opted_out'] : false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Set opt-out status for visitor
     */
    public function setOptOut(string $visitorId, bool $optOut = true): bool
    {
        try {
            $stmt = $this->analytics->db->prepare("UPDATE analytics_visitors SET opted_out = ? WHERE visitor_id = ?");
            return $stmt->execute([$optOut, $visitorId]);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Clean old data according to retention policy
     */
    public function cleanOldData(): void
    {
        try {
            // Clean realtime data older than 5 minutes
            $this->analytics->cleanRealtimeData(5);

            // Clean page views older than 2 years (configurable)
            $retentionDays = $this->settings['data_retention_days'] ?? 730;

            $stmt = $this->analytics->db->prepare("DELETE FROM analytics_page_views WHERE viewed_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$retentionDays]);

            $stmt = $this->analytics->db->prepare("DELETE FROM analytics_events WHERE occurred_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$retentionDays]);

            $stmt = $this->analytics->db->prepare("DELETE FROM analytics_sessions WHERE started_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$retentionDays]);

            $this->logger->info('Analytics data cleanup completed');
        } catch (\Exception $e) {
            $this->logger->error('Failed to clean old data: ' . $e->getMessage());
        }
    }
}