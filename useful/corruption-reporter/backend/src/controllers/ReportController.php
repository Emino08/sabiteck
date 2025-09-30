<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ReportRepository;
use App\Services\FileStorageService;
use App\Services\AuditService;
use App\Services\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;
use Ramsey\Uuid\Uuid;

class ReportController
{
    private ReportRepository $reportRepository;
    private FileStorageService $fileStorage;
    private AuditService $auditService;
    private NotificationService $notificationService;

    public function __construct(
        ReportRepository $reportRepository,
        FileStorageService $fileStorage,
        AuditService $auditService,
        NotificationService $notificationService
    ) {
        $this->reportRepository = $reportRepository;
        $this->fileStorage = $fileStorage;
        $this->auditService = $auditService;
        $this->notificationService = $notificationService;
    }

    public function index(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $params = $request->getQueryParams();

        // Apply filters based on user role
        $filters = $this->buildFilters($user, $params);

        $reports = $this->reportRepository->paginate($filters, [
            'page' => (int)($params['page'] ?? 1),
            'per_page' => min((int)($params['per_page'] ?? 20), 100)
        ]);

        $response->getBody()->write(json_encode([
            'data' => $reports['data'],
            'meta' => [
                'current_page' => $reports['current_page'],
                'total_pages' => $reports['last_page'],
                'total_count' => $reports['total'],
                'per_page' => $reports['per_page']
            ]
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Validation
        $validator = v::keySet(
            v::key('title', v::stringType()->notEmpty()),
            v::key('description', v::stringType()->notEmpty()),
            v::key('category_id', v::intType()),
            v::key('incident_date', v::date('Y-m-d')->optional()),
            v::key('incident_location', v::stringType()->optional()),
            v::key('is_anonymous', v::boolType()->optional()),
            v::key('gps_latitude', v::floatType()->optional()),
            v::key('gps_longitude', v::floatType()->optional()),
            v::key('gps_accuracy', v::floatType()->optional())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Validation failed',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Generate unique case ID
            $caseId = $this->generateCaseId();

            $reportData = [
                'case_id' => $caseId,
                'reporter_id' => $data['is_anonymous'] ?? false ? null : $user['id'],
                'category_id' => $data['category_id'],
                'title' => $data['title'],
                'description' => $data['description'],
                'incident_date' => $data['incident_date'] ?? null,
                'incident_location' => $data['incident_location'] ?? null,
                'is_anonymous' => $data['is_anonymous'] ?? false,
                'gps_latitude' => $data['gps_latitude'] ?? null,
                'gps_longitude' => $data['gps_longitude'] ?? null,
                'gps_accuracy' => $data['gps_accuracy'] ?? null,
                'device_id' => $request->getHeaderLine('X-Device-ID'),
                'ip_address' => $this->getClientIp($request),
                'user_agent' => $request->getHeaderLine('User-Agent')
            ];

            $reportId = $this->reportRepository->create($reportData);

            // Log the creation
            $this->auditService->log(
                $user['id'],
                'reports.create',
                'reports',
                $reportId,
                ['case_id' => $caseId]
            );

            // Get the created report
            $report = $this->reportRepository->findById($reportId);

            $response->getBody()->write(json_encode([
                'data' => $report,
                'message' => 'Report created successfully'
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create report',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function createAnonymous(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Add anonymous flag
        $data['is_anonymous'] = true;

        // Create a temporary user context for the creation process
        $request = $request->withAttribute('user', ['id' => null]);

        return $this->create($request, $response);
    }

    public function show(Request $request, Response $response): Response
    {
        $reportId = (int)$request->getAttribute('id');
        $user = $request->getAttribute('user');

        $report = $this->reportRepository->findById($reportId);

        if (!$report) {
            $response->getBody()->write(json_encode([
                'error' => 'Report not found'
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Check access permissions
        if (!$this->canAccessReport($user, $report)) {
            $response->getBody()->write(json_encode([
                'error' => 'Access denied'
            ]));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        // Include media and comments
        $report['media'] = $this->reportRepository->getMediaByReportId($reportId);
        $report['comments'] = $this->reportRepository->getCommentsByReportId($reportId);
        $report['status_history'] = $this->reportRepository->getStatusHistory($reportId);

        $response->getBody()->write(json_encode([
            'data' => $report
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function uploadMedia(Request $request, Response $response): Response
    {
        $reportId = (int)$request->getAttribute('id');
        $user = $request->getAttribute('user');

        $report = $this->reportRepository->findById($reportId);

        if (!$report) {
            $response->getBody()->write(json_encode([
                'error' => 'Report not found'
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Check if user can upload to this report
        if (!$this->canModifyReport($user, $report)) {
            $response->getBody()->write(json_encode([
                'error' => 'Access denied'
            ]));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode([
                'error' => 'No file uploaded'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $file = $uploadedFiles['file'];

        try {
            $mediaData = $this->fileStorage->storeReportMedia($file, $reportId);

            $mediaId = $this->reportRepository->addMedia($reportId, $mediaData);

            // Log media upload
            $this->auditService->log(
                $user['id'],
                'reports.media.upload',
                'report_media',
                $mediaId,
                ['report_id' => $reportId, 'filename' => $mediaData['original_filename']]
            );

            $response->getBody()->write(json_encode([
                'data' => array_merge($mediaData, ['id' => $mediaId]),
                'message' => 'Media uploaded successfully'
            ]));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to upload media',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateStatus(Request $request, Response $response): Response
    {
        $reportId = (int)$request->getAttribute('id');
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        $report = $this->reportRepository->findById($reportId);

        if (!$report) {
            $response->getBody()->write(json_encode([
                'error' => 'Report not found'
            ]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Validation
        $allowedStatuses = ['received', 'under_review', 'investigating', 'action_taken', 'closed', 'rejected'];
        if (!in_array($data['status'], $allowedStatuses)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid status'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Update status
            $this->reportRepository->updateStatus(
                $reportId,
                $data['status'],
                $user['id'],
                $data['notes'] ?? null
            );

            // Send notification to reporter
            if ($report['reporter_id']) {
                $this->notificationService->sendStatusUpdateNotification(
                    $report['reporter_id'],
                    $reportId,
                    $data['status']
                );
            }

            // Log status change
            $this->auditService->log(
                $user['id'],
                'reports.status.update',
                'reports',
                $reportId,
                [
                    'old_status' => $report['status'],
                    'new_status' => $data['status'],
                    'notes' => $data['notes'] ?? null
                ]
            );

            $response->getBody()->write(json_encode([
                'message' => 'Status updated successfully'
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update status',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getPublicStories(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $stories = $this->reportRepository->getPublicSuccessStories([
            'limit' => min((int)($params['limit'] ?? 10), 50)
        ]);

        $response->getBody()->write(json_encode([
            'data' => $stories
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    private function generateCaseId(): string
    {
        $prefix = 'CR';
        $year = date('Y');
        $random = str_pad((string)random_int(1, 999999), 6, '0', STR_PAD_LEFT);

        return $prefix . $year . $random;
    }

    private function buildFilters(array $user, array $params): array
    {
        $filters = [];

        // Role-based filtering
        if ($user['role'] === 'reporter') {
            $filters['reporter_id'] = $user['id'];
        } elseif ($user['role'] === 'investigator') {
            $filters['assigned_investigator_id'] = $user['id'];
        } elseif ($user['role'] === 'institution_admin' && $user['institution_id']) {
            $filters['institution_id'] = $user['institution_id'];
        }

        // Additional filters from query params
        if (!empty($params['status'])) {
            $filters['status'] = $params['status'];
        }

        if (!empty($params['category_id'])) {
            $filters['category_id'] = (int)$params['category_id'];
        }

        if (!empty($params['search'])) {
            $filters['search'] = $params['search'];
        }

        return $filters;
    }

    private function canAccessReport(array $user, array $report): bool
    {
        // Super admin can access all reports
        if ($user['role'] === 'super_admin') {
            return true;
        }

        // Reporter can only access their own reports
        if ($user['role'] === 'reporter') {
            return $report['reporter_id'] === $user['id'];
        }

        // Investigator can access assigned reports
        if ($user['role'] === 'investigator') {
            return $report['assigned_investigator_id'] === $user['id'];
        }

        // Institution admin can access reports in their institution
        if ($user['role'] === 'institution_admin') {
            return $report['institution_id'] === $user['institution_id'];
        }

        return false;
    }

    private function canModifyReport(array $user, array $report): bool
    {
        // Only reporter can upload media to their own reports
        if ($user['role'] === 'reporter') {
            return $report['reporter_id'] === $user['id'] &&
                   in_array($report['status'], ['received', 'under_review']);
        }

        return false;
    }

    private function getClientIp(Request $request): ?string
    {
        $forwarded = $request->getHeaderLine('X-Forwarded-For');
        if ($forwarded) {
            return explode(',', $forwarded)[0];
        }

        return $request->getServerParams()['REMOTE_ADDR'] ?? null;
    }
}