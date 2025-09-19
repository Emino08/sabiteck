<?php

namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Analytics;
use DevCo\Utils\AnalyticsService;
use DevCo\Utils\ReportGenerator;
use Monolog\Logger;

class AnalyticsController
{
    private $analytics;
    private $analyticsService;
    private $reportGenerator;
    private $logger;

    public function __construct()
    {
        $this->analytics = new Analytics();
        $this->analyticsService = new AnalyticsService();
        $this->reportGenerator = new ReportGenerator();
        $this->logger = new Logger('analytics-controller');
    }

    /**
     * Track a page view (called by JavaScript)
     */
    public function track(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!$data) {
                return $this->errorResponse($response, 'Invalid JSON data', 400);
            }

            // Validate required fields
            $required = ['visitor_id', 'session_id', 'page_url', 'page_path'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->errorResponse($response, "Missing required field: {$field}", 400);
                }
            }

            // Check if user has opted out
            if ($this->analyticsService->hasOptedOut($data['visitor_id'])) {
                return $this->successResponse($response, ['status' => 'opted_out']);
            }

            // Track page view
            $pageViewData = [
                'session_id' => $data['session_id'],
                'visitor_id' => $data['visitor_id'],
                'page_url' => $data['page_url'],
                'page_title' => $data['page_title'] ?? null,
                'page_path' => $data['page_path'],
                'time_on_page' => $data['time_on_page'] ?? 0,
                'scroll_depth' => $data['scroll_depth'] ?? 0,
                'is_entry_page' => $data['is_entry_page'] ?? false,
                'is_exit_page' => $data['is_exit_page'] ?? false
            ];

            $success = $this->analyticsService->trackPageView($pageViewData);

            if ($success) {
                // Update realtime data
                $this->analytics->updateRealtime([
                    'visitor_id' => $data['visitor_id'],
                    'session_id' => $data['session_id'],
                    'page_url' => $data['page_url'],
                    'page_title' => $data['page_title'] ?? null,
                    'country' => $data['country'] ?? null,
                    'device_type' => $data['device_type'] ?? 'desktop'
                ]);

                return $this->successResponse($response, ['status' => 'tracked']);
            }

            return $this->errorResponse($response, 'Failed to track page view', 500);

        } catch (\Exception $e) {
            $this->logger->error('Track endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Internal server error', 500);
        }
    }

    /**
     * Track an event (called by JavaScript)
     */
    public function trackEvent(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!$data) {
                return $this->errorResponse($response, 'Invalid JSON data', 400);
            }

            // Validate required fields
            $required = ['visitor_id', 'session_id', 'event_category', 'event_action'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->errorResponse($response, "Missing required field: {$field}", 400);
                }
            }

            // Check if user has opted out
            if ($this->analyticsService->hasOptedOut($data['visitor_id'])) {
                return $this->successResponse($response, ['status' => 'opted_out']);
            }

            $eventData = [
                'session_id' => $data['session_id'],
                'visitor_id' => $data['visitor_id'],
                'event_category' => $data['event_category'],
                'event_action' => $data['event_action'],
                'event_label' => $data['event_label'] ?? null,
                'event_value' => $data['event_value'] ?? null,
                'page_url' => $data['page_url'] ?? null,
                'page_title' => $data['page_title'] ?? null,
                'element_selector' => $data['element_selector'] ?? null
            ];

            $success = $this->analyticsService->trackEvent($eventData);

            if ($success) {
                return $this->successResponse($response, ['status' => 'tracked']);
            }

            return $this->errorResponse($response, 'Failed to track event', 500);

        } catch (\Exception $e) {
            $this->logger->error('Track event endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Internal server error', 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function dashboard(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';

            $stats = $this->analytics->getDashboardStats($period);

            return $this->successResponse($response, [
                'stats' => $stats,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Dashboard endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get dashboard stats', 500);
        }
    }

    /**
     * Get popular pages
     */
    public function popularPages(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';
            $limit = min((int)($queryParams['limit'] ?? 10), 100);

            $pages = $this->analytics->getPopularPages($period, $limit);

            return $this->successResponse($response, [
                'pages' => $pages,
                'period' => $period,
                'limit' => $limit
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Popular pages endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get popular pages', 500);
        }
    }

    /**
     * Get referrer statistics
     */
    public function referrers(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';
            $limit = min((int)($queryParams['limit'] ?? 10), 100);

            $referrers = $this->analytics->getReferrerStats($period, $limit);

            return $this->successResponse($response, [
                'referrers' => $referrers,
                'period' => $period,
                'limit' => $limit
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Referrers endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get referrer stats', 500);
        }
    }

    /**
     * Get device statistics
     */
    public function devices(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';

            $devices = $this->analytics->getDeviceStats($period);

            return $this->successResponse($response, [
                'devices' => $devices,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Devices endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get device stats', 500);
        }
    }

    /**
     * Get geographical statistics
     */
    public function geography(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';
            $limit = min((int)($queryParams['limit'] ?? 20), 100);

            $geography = $this->analytics->getGeographicalStats($period, $limit);

            return $this->successResponse($response, [
                'geography' => $geography,
                'period' => $period,
                'limit' => $limit
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Geography endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get geographical stats', 500);
        }
    }

    /**
     * Get daily statistics for charts
     */
    public function daily(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $period = $queryParams['period'] ?? '30d';

            $dailyStats = $this->analytics->getDailyStats($period);

            return $this->successResponse($response, [
                'daily_stats' => $dailyStats,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Daily stats endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get daily stats', 500);
        }
    }

    /**
     * Get real-time statistics
     */
    public function realtime(Request $request, Response $response, array $args): Response
    {
        try {
            $stmt = $this->analytics->db->prepare("
                SELECT
                    COUNT(DISTINCT visitor_id) as active_users,
                    page_url,
                    page_title,
                    country,
                    device_type,
                    COUNT(*) as count
                FROM analytics_realtime
                WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                GROUP BY page_url, page_title, country, device_type
                ORDER BY count DESC
                LIMIT 20
            ");
            $stmt->execute();
            $realtimeData = $stmt->fetchAll();

            // Get total active users
            $stmt = $this->analytics->db->prepare("
                SELECT COUNT(DISTINCT visitor_id) as total_active_users
                FROM analytics_realtime
                WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ");
            $stmt->execute();
            $totalActive = $stmt->fetch();

            return $this->successResponse($response, [
                'total_active_users' => $totalActive['total_active_users'] ?? 0,
                'active_pages' => $realtimeData,
                'last_updated' => date('c')
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Realtime endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get realtime stats', 500);
        }
    }

    /**
     * Export analytics report
     */
    public function exportReport(Request $request, Response $response, array $args): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $format = $queryParams['format'] ?? 'csv'; // csv, pdf
            $period = $queryParams['period'] ?? '30d';
            $reportType = $queryParams['type'] ?? 'overview'; // overview, pages, referrers, devices

            if (!in_array($format, ['csv', 'pdf'])) {
                return $this->errorResponse($response, 'Invalid format. Use csv or pdf.', 400);
            }

            $reportData = $this->getReportData($reportType, $period);

            if ($format === 'csv') {
                $csv = $this->reportGenerator->generateCSV($reportData, $reportType);
                $response = $response->withHeader('Content-Type', 'text/csv');
                $response = $response->withHeader('Content-Disposition', "attachment; filename=\"analytics-{$reportType}-{$period}.csv\"");
                $response->getBody()->write($csv);
            } else {
                $pdf = $this->reportGenerator->generatePDF($reportData, $reportType, $period);
                $response = $response->withHeader('Content-Type', 'application/pdf');
                $response = $response->withHeader('Content-Disposition', "attachment; filename=\"analytics-{$reportType}-{$period}.pdf\"");
                $response->getBody()->write($pdf);
            }

            return $response;

        } catch (\Exception $e) {
            $this->logger->error('Export report endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to export report', 500);
        }
    }

    /**
     * Handle opt-out request
     */
    public function optOut(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $visitorId = $data['visitor_id'] ?? null;

            if (!$visitorId) {
                return $this->errorResponse($response, 'Missing visitor_id', 400);
            }

            $success = $this->analyticsService->setOptOut($visitorId, true);

            if ($success) {
                return $this->successResponse($response, ['status' => 'opted_out']);
            }

            return $this->errorResponse($response, 'Failed to process opt-out request', 500);

        } catch (\Exception $e) {
            $this->logger->error('Opt-out endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Internal server error', 500);
        }
    }

    /**
     * Handle opt-in request
     */
    public function optIn(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            $visitorId = $data['visitor_id'] ?? null;

            if (!$visitorId) {
                return $this->errorResponse($response, 'Missing visitor_id', 400);
            }

            $success = $this->analyticsService->setOptOut($visitorId, false);

            if ($success) {
                return $this->successResponse($response, ['status' => 'opted_in']);
            }

            return $this->errorResponse($response, 'Failed to process opt-in request', 500);

        } catch (\Exception $e) {
            $this->logger->error('Opt-in endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Internal server error', 500);
        }
    }

    /**
     * Get analytics settings
     */
    public function getSettings(Request $request, Response $response, array $args): Response
    {
        try {
            $settings = $this->analytics->getSettings();
            return $this->successResponse($response, ['settings' => $settings]);

        } catch (\Exception $e) {
            $this->logger->error('Get settings endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get settings', 500);
        }
    }

    /**
     * Update analytics settings
     */
    public function updateSettings(Request $request, Response $response, array $args): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);

            if (!$data) {
                return $this->errorResponse($response, 'Invalid JSON data', 400);
            }

            foreach ($data as $key => $value) {
                $type = $this->getSettingType($key);
                $this->analytics->updateSetting($key, $value, $type);
            }

            return $this->successResponse($response, ['status' => 'updated']);

        } catch (\Exception $e) {
            $this->logger->error('Update settings endpoint error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to update settings', 500);
        }
    }

    /**
     * Get report data for export
     */
    private function getReportData(string $reportType, string $period): array
    {
        switch ($reportType) {
            case 'pages':
                return $this->analytics->getPopularPages($period, 100);
            case 'referrers':
                return $this->analytics->getReferrerStats($period, 100);
            case 'devices':
                return $this->analytics->getDeviceStats($period);
            case 'geography':
                return $this->analytics->getGeographicalStats($period, 100);
            default:
                return [
                    'stats' => $this->analytics->getDashboardStats($period),
                    'popular_pages' => $this->analytics->getPopularPages($period, 10),
                    'referrers' => $this->analytics->getReferrerStats($period, 10),
                    'devices' => $this->analytics->getDeviceStats($period),
                    'geography' => $this->analytics->getGeographicalStats($period, 10)
                ];
        }
    }

    /**
     * Get setting type based on key
     */
    private function getSettingType(string $key): string
    {
        $booleanSettings = ['gdpr_enabled', 'anonymize_ip', 'track_outbound_links', 'track_downloads', 'track_scroll_depth', 'email_reports_enabled'];
        $integerSettings = ['session_timeout', 'realtime_cleanup_interval', 'data_retention_days'];
        $jsonSettings = ['email_report_recipients'];

        if (in_array($key, $booleanSettings)) {
            return 'boolean';
        } elseif (in_array($key, $integerSettings)) {
            return 'integer';
        } elseif (in_array($key, $jsonSettings)) {
            return 'json';
        }

        return 'string';
    }

    /**
     * Success response helper
     */
    private function successResponse(Response $response, array $data = []): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => $data
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Error response helper
     */
    private function errorResponse(Response $response, string $message, int $statusCode = 500): Response
    {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message
        ]));
        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
}