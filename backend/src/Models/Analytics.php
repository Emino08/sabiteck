<?php

namespace DevCo\Models;

use PDO;
use PDOException;
use Monolog\Logger;

class Analytics
{
    private $db;
    private $logger;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->logger = new Logger('analytics');
    }

    /**
     * Track a visitor and create/update visitor record
     */
    public function trackVisitor(array $visitorData): string
    {
        try {
            $visitorId = $visitorData['visitor_id'];

            // Check if visitor exists
            $stmt = $this->db->prepare("SELECT id, total_visits FROM analytics_visitors WHERE visitor_id = ?");
            $stmt->execute([$visitorId]);
            $existing = $stmt->fetch();

            if ($existing) {
                // Update existing visitor
                $stmt = $this->db->prepare("
                    UPDATE analytics_visitors
                    SET last_visit_at = NOW(),
                        total_visits = total_visits + 1,
                        country = COALESCE(?, country),
                        region = COALESCE(?, region),
                        city = COALESCE(?, city),
                        ip_address = ?,
                        anonymized_ip = ?,
                        user_agent = ?,
                        device_type = ?,
                        device_model = COALESCE(?, device_model),
                        operating_system = ?,
                        browser = ?,
                        browser_version = ?,
                        screen_resolution = COALESCE(?, screen_resolution),
                        language = COALESCE(?, language),
                        timezone = COALESCE(?, timezone),
                        is_gdpr_compliant = ?,
                        updated_at = NOW()
                    WHERE visitor_id = ?
                ");
                $stmt->execute([
                    $visitorData['country'] ?? null,
                    $visitorData['region'] ?? null,
                    $visitorData['city'] ?? null,
                    $visitorData['ip_address'] ?? null,
                    $visitorData['anonymized_ip'] ?? null,
                    $visitorData['user_agent'] ?? null,
                    $visitorData['device_type'] ?? 'desktop',
                    $visitorData['device_model'] ?? null,
                    $visitorData['operating_system'] ?? null,
                    $visitorData['browser'] ?? null,
                    $visitorData['browser_version'] ?? null,
                    $visitorData['screen_resolution'] ?? null,
                    $visitorData['language'] ?? null,
                    $visitorData['timezone'] ?? null,
                    $visitorData['is_gdpr_compliant'] ?? 0,
                    $visitorId
                ]);
            } else {
                // Create new visitor
                $stmt = $this->db->prepare("
                    INSERT INTO analytics_visitors (
                        visitor_id, country, region, city, ip_address, anonymized_ip,
                        user_agent, device_type, device_model, operating_system, browser,
                        browser_version, screen_resolution, language, timezone, is_gdpr_compliant
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $visitorId,
                    $visitorData['country'] ?? null,
                    $visitorData['region'] ?? null,
                    $visitorData['city'] ?? null,
                    $visitorData['ip_address'] ?? null,
                    $visitorData['anonymized_ip'] ?? null,
                    $visitorData['user_agent'] ?? null,
                    $visitorData['device_type'] ?? 'desktop',
                    $visitorData['device_model'] ?? null,
                    $visitorData['operating_system'] ?? null,
                    $visitorData['browser'] ?? null,
                    $visitorData['browser_version'] ?? null,
                    $visitorData['screen_resolution'] ?? null,
                    $visitorData['language'] ?? null,
                    $visitorData['timezone'] ?? null,
                    $visitorData['is_gdpr_compliant'] ?? 0
                ]);
            }

            return $visitorId;
        } catch (PDOException $e) {
            $this->logger->error('Failed to track visitor: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a new session
     */
    public function createSession(array $sessionData): string
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO analytics_sessions (
                    session_id, visitor_id, referrer_url, referrer_domain, referrer_type,
                    entry_page, utm_source, utm_medium, utm_campaign, utm_term, utm_content
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $sessionData['session_id'],
                $sessionData['visitor_id'],
                $sessionData['referrer_url'] ?? null,
                $sessionData['referrer_domain'] ?? null,
                $sessionData['referrer_type'] ?? 'direct',
                $sessionData['entry_page'] ?? null,
                $sessionData['utm_source'] ?? null,
                $sessionData['utm_medium'] ?? null,
                $sessionData['utm_campaign'] ?? null,
                $sessionData['utm_term'] ?? null,
                $sessionData['utm_content'] ?? null
            ]);

            return $sessionData['session_id'];
        } catch (PDOException $e) {
            $this->logger->error('Failed to create session: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update session data
     */
    public function updateSession(string $sessionId, array $updateData): bool
    {
        try {
            $setParts = [];
            $params = [];

            foreach ($updateData as $key => $value) {
                $setParts[] = "{$key} = ?";
                $params[] = $value;
            }

            $setParts[] = "updated_at = NOW()";
            $params[] = $sessionId;

            $sql = "UPDATE analytics_sessions SET " . implode(', ', $setParts) . " WHERE session_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            $this->logger->error('Failed to update session: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Track a page view
     */
    public function trackPageView(array $pageData): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO analytics_page_views (
                    session_id, visitor_id, page_url, page_title, page_path,
                    time_on_page, scroll_depth, is_entry_page, is_exit_page
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $pageData['session_id'],
                $pageData['visitor_id'],
                $pageData['page_url'],
                $pageData['page_title'] ?? null,
                $pageData['page_path'],
                $pageData['time_on_page'] ?? 0,
                $pageData['scroll_depth'] ?? 0,
                $pageData['is_entry_page'] ?? false,
                $pageData['is_exit_page'] ?? false
            ]);

            // Update session page count
            $this->db->prepare("UPDATE analytics_sessions SET page_views = page_views + 1, is_bounce = false WHERE session_id = ? AND page_views > 0")->execute([$pageData['session_id']]);

            // Update visitor page count
            $this->db->prepare("UPDATE analytics_visitors SET total_page_views = total_page_views + 1 WHERE visitor_id = ?")->execute([$pageData['visitor_id']]);

            return true;
        } catch (PDOException $e) {
            $this->logger->error('Failed to track page view: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Track an event
     */
    public function trackEvent(array $eventData): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO analytics_events (
                    session_id, visitor_id, event_category, event_action, event_label,
                    event_value, page_url, page_title, element_selector
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $eventData['session_id'],
                $eventData['visitor_id'],
                $eventData['event_category'],
                $eventData['event_action'],
                $eventData['event_label'] ?? null,
                $eventData['event_value'] ?? null,
                $eventData['page_url'] ?? null,
                $eventData['page_title'] ?? null,
                $eventData['element_selector'] ?? null
            ]);

            return true;
        } catch (PDOException $e) {
            $this->logger->error('Failed to track event: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update realtime data for dashboard
     */
    public function updateRealtime(array $realtimeData): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO analytics_realtime (
                    visitor_id, session_id, page_url, page_title, country, device_type
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    page_url = VALUES(page_url),
                    page_title = VALUES(page_title),
                    last_activity = NOW()
            ");
            $stmt->execute([
                $realtimeData['visitor_id'],
                $realtimeData['session_id'],
                $realtimeData['page_url'],
                $realtimeData['page_title'] ?? null,
                $realtimeData['country'] ?? null,
                $realtimeData['device_type'] ?? 'desktop'
            ]);

            return true;
        } catch (PDOException $e) {
            $this->logger->error('Failed to update realtime data: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Clean old realtime data
     */
    public function cleanRealtimeData(int $minutesOld = 5): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM analytics_realtime WHERE last_activity < DATE_SUB(NOW(), INTERVAL ? MINUTE)");
            $stmt->execute([$minutesOld]);
            return true;
        } catch (PDOException $e) {
            $this->logger->error('Failed to clean realtime data: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(string $period = '30d'): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            // Get basic stats
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(DISTINCT v.visitor_id) as unique_visitors,
                    COUNT(DISTINCT s.session_id) as sessions,
                    COUNT(pv.id) as page_views,
                    AVG(s.duration) as avg_session_duration,
                    AVG(s.page_views) as avg_pages_per_session,
                    (COUNT(DISTINCT CASE WHEN s.is_bounce = 1 THEN s.session_id END) * 100.0 / COUNT(DISTINCT s.session_id)) as bounce_rate
                FROM analytics_visitors v
                LEFT JOIN analytics_sessions s ON v.visitor_id = s.visitor_id
                LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
                WHERE v.first_visit_at >= DATE_SUB(NOW(), INTERVAL {$interval})
            ");
            $stmt->execute();
            $basicStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get realtime users
            $stmt = $this->db->prepare("SELECT COUNT(DISTINCT visitor_id) as active_users FROM analytics_realtime WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
            $stmt->execute();
            $realtimeStats = $stmt->fetch(PDO::FETCH_ASSOC);

            return array_merge($basicStats, $realtimeStats);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get dashboard stats: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get popular pages
     */
    public function getPopularPages(string $period = '30d', int $limit = 10): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            $stmt = $this->db->prepare("
                SELECT
                    page_path,
                    page_title,
                    COUNT(*) as page_views,
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    AVG(time_on_page) as avg_time_on_page,
                    COUNT(CASE WHEN is_entry_page = 1 THEN 1 END) as entries,
                    COUNT(CASE WHEN is_exit_page = 1 THEN 1 END) as exits
                FROM analytics_page_views
                WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                GROUP BY page_path, page_title
                ORDER BY page_views DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get popular pages: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get referrer statistics
     */
    public function getReferrerStats(string $period = '30d', int $limit = 10): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            $stmt = $this->db->prepare("
                SELECT
                    referrer_domain,
                    referrer_type,
                    COUNT(DISTINCT session_id) as sessions,
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    AVG(duration) as avg_session_duration,
                    AVG(page_views) as avg_pages_per_session
                FROM analytics_sessions
                WHERE started_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                AND referrer_domain IS NOT NULL
                GROUP BY referrer_domain, referrer_type
                ORDER BY sessions DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get referrer stats: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get device statistics
     */
    public function getDeviceStats(string $period = '30d'): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            $stmt = $this->db->prepare("
                SELECT
                    device_type,
                    COUNT(DISTINCT visitor_id) as visitors,
                    COUNT(DISTINCT visitor_id) * 100.0 / (
                        SELECT COUNT(DISTINCT visitor_id)
                        FROM analytics_visitors
                        WHERE first_visit_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                    ) as percentage
                FROM analytics_visitors
                WHERE first_visit_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                GROUP BY device_type
                ORDER BY visitors DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get device stats: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get geographical statistics
     */
    public function getGeographicalStats(string $period = '30d', int $limit = 20): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            $stmt = $this->db->prepare("
                SELECT
                    country,
                    region,
                    city,
                    COUNT(DISTINCT visitor_id) as visitors,
                    COUNT(DISTINCT visitor_id) * 100.0 / (
                        SELECT COUNT(DISTINCT visitor_id)
                        FROM analytics_visitors
                        WHERE first_visit_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                    ) as percentage
                FROM analytics_visitors
                WHERE first_visit_at >= DATE_SUB(NOW(), INTERVAL {$interval})
                AND country IS NOT NULL
                GROUP BY country, region, city
                ORDER BY visitors DESC
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get geographical stats: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get daily statistics for charts
     */
    public function getDailyStats(string $period = '30d'): array
    {
        try {
            $interval = $this->getPeriodInterval($period);

            $stmt = $this->db->prepare("
                SELECT
                    DATE(viewed_at) as date,
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    COUNT(DISTINCT session_id) as sessions,
                    COUNT(*) as page_views,
                    AVG(time_on_page) as avg_time_on_page
                FROM analytics_page_views pv
                JOIN analytics_sessions s ON pv.session_id = s.session_id
                WHERE viewed_at >= DATE_SUB(CURDATE(), INTERVAL {$interval})
                GROUP BY DATE(viewed_at)
                ORDER BY date DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error('Failed to get daily stats: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get settings
     */
    public function getSettings(): array
    {
        try {
            $stmt = $this->db->prepare("SELECT setting_key, setting_value, setting_type FROM analytics_settings");
            $stmt->execute();
            $settings = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $value = $row['setting_value'];

                // Convert based on type
                switch ($row['setting_type']) {
                    case 'boolean':
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                        break;
                    case 'integer':
                        $value = (int) $value;
                        break;
                    case 'json':
                        $value = json_decode($value, true);
                        break;
                }

                $settings[$row['setting_key']] = $value;
            }

            return $settings;
        } catch (PDOException $e) {
            $this->logger->error('Failed to get settings: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Update setting
     */
    public function updateSetting(string $key, $value, string $type = 'string'): bool
    {
        try {
            // Convert value based on type
            switch ($type) {
                case 'boolean':
                    $value = $value ? 'true' : 'false';
                    break;
                case 'json':
                    $value = json_encode($value);
                    break;
            }

            $stmt = $this->db->prepare("
                INSERT INTO analytics_settings (setting_key, setting_value, setting_type)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $stmt->execute([$key, $value, $type]);
            return true;
        } catch (PDOException $e) {
            $this->logger->error('Failed to update setting: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Convert period string to SQL interval
     */
    private function getPeriodInterval(string $period): string
    {
        switch ($period) {
            case '1d':
                return '1 DAY';
            case '7d':
                return '7 DAY';
            case '30d':
                return '30 DAY';
            case '90d':
                return '90 DAY';
            case '1y':
                return '1 YEAR';
            default:
                return '30 DAY';
        }
    }
}