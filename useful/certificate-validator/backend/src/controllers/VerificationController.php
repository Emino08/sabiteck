<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\Database;
use App\Utils\AuditLogger;
use App\Utils\Cache;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

class VerificationController
{
    private Database $database;
    private AuditLogger $auditLogger;
    private Cache $cache;
    private array $settings;

    public function __construct(Database $database, AuditLogger $auditLogger, Cache $cache, array $settings)
    {
        $this->database = $database;
        $this->auditLogger = $auditLogger;
        $this->cache = $cache;
        $this->settings = $settings;
    }

    public function verify(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $code = $request->getAttribute('code');

        if (empty($code)) {
            return $this->errorResponse($response, 'Verification code is required', 400);
        }

        try {
            // Check cache first
            $cacheKey = "verification:$code";
            $cachedResult = $this->cache->get($cacheKey);

            if ($cachedResult) {
                $this->logVerificationAttempt($request, $code, true, 'cache_hit');
                return $this->successResponse($response, $cachedResult);
            }

            // Query database
            $credential = $this->database->queryOne(
                "SELECT c.*, i.name as institution_name, i.logo_path as institution_logo,
                        i.is_verified as institution_verified, i.domain_email as institution_domain
                 FROM credentials c
                 JOIN institutions i ON c.institution_id = i.id
                 WHERE (c.certificate_code = :code OR c.verification_slug = :code)
                 AND i.is_active = 1",
                ['code' => $code]
            );

            if (!$credential) {
                $this->logVerificationAttempt($request, $code, false, 'not_found');
                return $this->errorResponse($response, 'Credential not found', 404);
            }

            if ($credential['status'] !== 'valid') {
                $this->logVerificationAttempt($request, $code, false, 'invalid_status', $credential['id']);

                $statusMessages = [
                    'revoked' => 'This credential has been revoked',
                    'pending' => 'This credential is pending approval',
                    'draft' => 'This credential is in draft status'
                ];

                return $this->errorResponse($response, $statusMessages[$credential['status']] ?? 'Invalid credential status', 400);
            }

            // Prepare public verification data
            $verificationData = [
                'certificate_code' => $credential['certificate_code'],
                'verification_slug' => $credential['verification_slug'],
                'student_name' => $credential['student_name'],
                'program_name' => $credential['program_name'],
                'program_type' => $credential['program_type'],
                'award_grade' => $credential['award_grade'],
                'graduation_date' => $credential['graduation_date'],
                'record_type' => $credential['record_type'],
                'public_summary' => $credential['public_summary'],
                'institution' => [
                    'name' => $credential['institution_name'],
                    'logo' => $credential['institution_logo'],
                    'verified' => (bool)$credential['institution_verified'],
                    'domain' => $credential['institution_domain']
                ],
                'status' => $credential['status'],
                'issued_date' => $credential['created_at'],
                'qr_code_url' => $this->generateQRCodeURL($credential['verification_slug']),
                'verification_url' => $this->generateVerificationURL($credential['verification_slug']),
                'trust_score' => $this->calculateTrustScore($credential)
            ];

            // Cache the result
            $this->cache->set($cacheKey, $verificationData, $this->settings['cache']['ttl']);

            $this->logVerificationAttempt($request, $code, true, 'success', $credential['id']);

            return $this->successResponse($response, $verificationData);

        } catch (\Exception $e) {
            $this->logVerificationAttempt($request, $code, false, 'error');
            return $this->errorResponse($response, 'Verification failed', 500);
        }
    }

    public function requestDetailedVerification(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();
        $code = $data['code'] ?? '';
        $requesterEmail = $data['email'] ?? '';
        $requesterName = $data['name'] ?? '';
        $requesterOrganization = $data['organization'] ?? '';
        $reason = $data['reason'] ?? '';

        if (empty($code) || empty($requesterEmail) || empty($reason)) {
            return $this->errorResponse($response, 'Code, email, and reason are required', 400);
        }

        if (!filter_var($requesterEmail, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse($response, 'Invalid email address', 400);
        }

        try {
            $credential = $this->database->queryOne(
                "SELECT c.*, i.name as institution_name
                 FROM credentials c
                 JOIN institutions i ON c.institution_id = i.id
                 WHERE (c.certificate_code = :code OR c.verification_slug = :code)
                 AND c.status = 'valid'
                 AND i.is_active = 1",
                ['code' => $code]
            );

            if (!$credential) {
                return $this->errorResponse($response, 'Credential not found', 404);
            }

            // Check for existing pending request
            $existingRequest = $this->database->queryOne(
                "SELECT id FROM verification_requests
                 WHERE credential_id = :credential_id
                 AND requester_email = :email
                 AND status = 'requested'
                 AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)",
                [
                    'credential_id' => $credential['id'],
                    'email' => $requesterEmail
                ]
            );

            if ($existingRequest) {
                return $this->errorResponse($response, 'A verification request for this credential is already pending', 400);
            }

            // Generate access token
            $accessToken = bin2hex(random_bytes(32));

            // Create verification request
            $requestId = $this->database->insert('verification_requests', [
                'credential_id' => $credential['id'],
                'requester_email' => $requesterEmail,
                'requester_name' => $requesterName,
                'requester_organization' => $requesterOrganization,
                'reason' => $reason,
                'access_token' => $accessToken,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days'))
            ]);

            // Log the request
            $this->auditLogger->logVerificationRequest(
                null,
                $credential['institution_id'],
                $credential['id'],
                'detailed_verification_requested',
                [
                    'requester_email' => $requesterEmail,
                    'requester_name' => $requesterName,
                    'requester_organization' => $requesterOrganization,
                    'reason' => $reason
                ],
                $this->getClientIp($request),
                $request->getHeaderLine('User-Agent')
            );

            // TODO: Send notification email to institution admins
            // $this->sendVerificationRequestNotification($credential, $requestData);

            return $this->successResponse($response, [
                'message' => 'Verification request submitted successfully',
                'request_id' => $requestId,
                'status' => 'pending_approval'
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Request submission failed', 500);
        }
    }

    public function getDetailedVerification(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $token = $request->getAttribute('token');

        if (empty($token)) {
            return $this->errorResponse($response, 'Access token is required', 400);
        }

        try {
            $verificationRequest = $this->database->queryOne(
                "SELECT vr.*, c.*, i.name as institution_name, i.logo_path as institution_logo
                 FROM verification_requests vr
                 JOIN credentials c ON vr.credential_id = c.id
                 JOIN institutions i ON c.institution_id = i.id
                 WHERE vr.access_token = :token
                 AND vr.status = 'approved'
                 AND vr.expires_at > NOW()",
                ['token' => $token]
            );

            if (!$verificationRequest) {
                return $this->errorResponse($response, 'Invalid or expired access token', 404);
            }

            // Mark as accessed
            $this->database->execute(
                "UPDATE verification_requests SET accessed_at = NOW() WHERE id = :id",
                ['id' => $verificationRequest['id']]
            );

            // Get audit trail
            $auditTrail = $this->auditLogger->getCredentialAuditTrail($verificationRequest['credential_id']);

            $detailedData = [
                'certificate_code' => $verificationRequest['certificate_code'],
                'student_name' => $verificationRequest['student_name'],
                'student_id' => $verificationRequest['student_id'],
                'program_name' => $verificationRequest['program_name'],
                'program_type' => $verificationRequest['program_type'],
                'award_grade' => $verificationRequest['award_grade'],
                'graduation_date' => $verificationRequest['graduation_date'],
                'record_type' => $verificationRequest['record_type'],
                'public_summary' => $verificationRequest['public_summary'],
                'institution' => [
                    'name' => $verificationRequest['institution_name'],
                    'logo' => $verificationRequest['institution_logo']
                ],
                'metadata' => json_decode($verificationRequest['metadata'] ?? '{}', true),
                'digital_signature' => $verificationRequest['digital_signature'],
                'issued_date' => $verificationRequest['created_at'],
                'file_available' => !empty($verificationRequest['file_path']),
                'audit_trail' => array_map(function($log) {
                    return [
                        'action' => $log['action'],
                        'timestamp' => $log['created_at'],
                        'actor' => $log['actor_name'] ?? 'System'
                    ];
                }, $auditTrail),
                'trust_score' => $this->calculateTrustScore($verificationRequest),
                'access_info' => [
                    'requested_by' => $verificationRequest['requester_email'],
                    'requested_at' => $verificationRequest['created_at'],
                    'approved_at' => $verificationRequest['approved_at'],
                    'expires_at' => $verificationRequest['expires_at']
                ]
            ];

            $this->auditLogger->logVerificationRequest(
                null,
                $verificationRequest['institution_id'],
                $verificationRequest['credential_id'],
                'detailed_verification_accessed',
                [
                    'requester_email' => $verificationRequest['requester_email'],
                    'access_token' => substr($token, 0, 8) . '...'
                ],
                $this->getClientIp($request),
                $request->getHeaderLine('User-Agent')
            );

            return $this->successResponse($response, $detailedData);

        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Access failed', 500);
        }
    }

    public function getStatistics(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $stats = [
                'total_verifications_today' => $this->getVerificationStats('today'),
                'total_verifications_week' => $this->getVerificationStats('week'),
                'total_verifications_month' => $this->getVerificationStats('month'),
                'top_institutions' => $this->getTopInstitutions(),
                'verification_trends' => $this->getVerificationTrends()
            ];

            return $this->successResponse($response, $stats);

        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Statistics unavailable', 500);
        }
    }

    private function logVerificationAttempt(
        ServerRequestInterface $request,
        string $code,
        bool $success,
        string $result,
        ?int $credentialId = null
    ): void {
        $this->auditLogger->log(
            null,
            null,
            $credentialId,
            'verification_attempt',
            'verification',
            null,
            [
                'code' => substr($code, 0, 8) . '...',
                'success' => $success,
                'result' => $result
            ],
            $this->getClientIp($request),
            $request->getHeaderLine('User-Agent')
        );
    }

    private function calculateTrustScore(array $credential): int
    {
        $score = 50; // Base score

        // Institution verification adds 30 points
        if ($credential['institution_verified'] ?? false) {
            $score += 30;
        }

        // Digital signature adds 15 points
        if (!empty($credential['digital_signature'])) {
            $score += 15;
        }

        // File attachment adds 5 points
        if (!empty($credential['file_path'])) {
            $score += 5;
        }

        return min($score, 100);
    }

    private function generateQRCodeURL(string $slug): string
    {
        return $this->settings['app']['url'] . "/qr/$slug.png";
    }

    private function generateVerificationURL(string $slug): string
    {
        return $this->settings['app']['frontend_url'] . "/verify/$slug";
    }

    private function getVerificationStats(string $period): int
    {
        $sql = "SELECT COUNT(*) as count FROM audit_logs
                WHERE action = 'verification_attempt'
                AND JSON_EXTRACT(metadata, '$.success') = true
                AND created_at >= ";

        switch ($period) {
            case 'today':
                $sql .= "CURDATE()";
                break;
            case 'week':
                $sql .= "DATE_SUB(NOW(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $sql .= "DATE_SUB(NOW(), INTERVAL 30 DAY)";
                break;
            default:
                return 0;
        }

        $result = $this->database->queryOne($sql);
        return (int)($result['count'] ?? 0);
    }

    private function getTopInstitutions(): array
    {
        $sql = "SELECT i.name, COUNT(al.id) as verification_count
                FROM audit_logs al
                JOIN credentials c ON al.credential_id = c.id
                JOIN institutions i ON c.institution_id = i.id
                WHERE al.action = 'verification_attempt'
                AND JSON_EXTRACT(al.metadata, '$.success') = true
                AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY i.id, i.name
                ORDER BY verification_count DESC
                LIMIT 10";

        return $this->database->query($sql);
    }

    private function getVerificationTrends(): array
    {
        $sql = "SELECT DATE(created_at) as date, COUNT(*) as count
                FROM audit_logs
                WHERE action = 'verification_attempt'
                AND JSON_EXTRACT(metadata, '$.success') = true
                AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC";

        return $this->database->query($sql);
    }

    private function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        return $serverParams['HTTP_X_FORWARDED_FOR'] ??
               $serverParams['HTTP_X_REAL_IP'] ??
               $serverParams['REMOTE_ADDR'] ??
               'unknown';
    }

    private function successResponse(ResponseInterface $response, array $data): ResponseInterface
    {
        $response->getBody()->write(json_encode(['success' => true, 'data' => $data]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function errorResponse(ResponseInterface $response, string $message, int $status = 400): ResponseInterface
    {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => ['message' => $message, 'status' => $status]
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}