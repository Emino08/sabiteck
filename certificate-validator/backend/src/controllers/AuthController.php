<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\Database;
use App\Utils\AuditLogger;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

class AuthController
{
    private Database $database;
    private array $jwtSettings;
    private AuditLogger $auditLogger;

    public function __construct(Database $database, array $jwtSettings, AuditLogger $auditLogger)
    {
        $this->database = $database;
        $this->jwtSettings = $jwtSettings;
        $this->auditLogger = $auditLogger;
    }

    public function login(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $mfaCode = $data['mfa_code'] ?? '';

        if (empty($email) || empty($password)) {
            return $this->errorResponse($response, 'Email and password are required', 400);
        }

        try {
            // Get user with institution info
            $user = $this->database->queryOne(
                "SELECT u.*, i.name as institution_name, i.is_active as institution_active
                 FROM users u
                 LEFT JOIN institutions i ON u.institution_id = i.id
                 WHERE u.email = :email AND u.is_active = 1",
                ['email' => $email]
            );

            if (!$user || !password_verify($password, $user['password_hash'])) {
                $this->auditLogger->log(null, null, null, 'login_failed', 'auth', null, [
                    'email' => $email,
                    'ip_address' => $this->getClientIp($request)
                ]);
                return $this->errorResponse($response, 'Invalid credentials', 401);
            }

            // Check if institution is active (for non-super admins)
            if ($user['role'] !== 'super_admin' && !$user['institution_active']) {
                return $this->errorResponse($response, 'Institution is inactive', 403);
            }

            // Check MFA if enabled
            if ($user['mfa_secret'] && !$this->verifyMFA($user['mfa_secret'], $mfaCode)) {
                return $this->errorResponse($response, 'Invalid MFA code', 401);
            }

            // Generate JWT
            $payload = [
                'sub' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'institution_id' => $user['institution_id'],
                'institution_name' => $user['institution_name'],
                'iat' => time(),
                'exp' => time() + $this->jwtSettings['expiry']
            ];

            $token = JWT::encode($payload, $this->jwtSettings['secret'], $this->jwtSettings['algorithm']);

            // Update last login
            $this->database->execute(
                "UPDATE users SET last_login_at = NOW() WHERE id = :id",
                ['id' => $user['id']]
            );

            // Log successful login
            $this->auditLogger->log($user['id'], $user['institution_id'], null, 'login_success', 'auth', null, [
                'ip_address' => $this->getClientIp($request)
            ]);

            return $this->successResponse($response, [
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'institution_id' => $user['institution_id'],
                    'institution_name' => $user['institution_name'],
                    'permissions' => json_decode($user['permissions'] ?? '[]', true),
                    'mfa_enabled' => !empty($user['mfa_secret'])
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Login failed', 500);
        }
    }

    public function refresh(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');

        if (!$user) {
            return $this->errorResponse($response, 'Invalid token', 401);
        }

        // Generate new JWT
        $payload = [
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'institution_id' => $user['institution_id'],
            'institution_name' => $user['institution_name'],
            'iat' => time(),
            'exp' => time() + $this->jwtSettings['expiry']
        ];

        $token = JWT::encode($payload, $this->jwtSettings['secret'], $this->jwtSettings['algorithm']);

        return $this->successResponse($response, ['token' => $token]);
    }

    public function logout(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');

        if ($user) {
            $this->auditLogger->log($user['id'], $user['institution_id'], null, 'logout', 'auth', null, [
                'ip_address' => $this->getClientIp($request)
            ]);
        }

        return $this->successResponse($response, ['message' => 'Logged out successfully']);
    }

    public function forgotPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? '';

        if (empty($email)) {
            return $this->errorResponse($response, 'Email is required', 400);
        }

        $user = $this->database->queryOne(
            "SELECT id, name FROM users WHERE email = :email AND is_active = 1",
            ['email' => $email]
        );

        // Always return success to prevent email enumeration
        $this->successResponse($response, ['message' => 'If the email exists, a reset link has been sent']);

        if ($user) {
            // Generate reset token
            $resetToken = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

            // Store reset token (you might want a separate table for this)
            $this->database->execute(
                "UPDATE users SET password_reset_token = :token, password_reset_expires = :expires WHERE id = :id",
                [
                    'token' => hash('sha256', $resetToken),
                    'expires' => $expiresAt,
                    'id' => $user['id']
                ]
            );

            // TODO: Send email with reset link
            // $this->sendPasswordResetEmail($email, $resetToken);

            $this->auditLogger->log($user['id'], null, null, 'password_reset_requested', 'auth', null, [
                'email' => $email,
                'ip_address' => $this->getClientIp($request)
            ]);
        }

        return $this->successResponse($response, ['message' => 'If the email exists, a reset link has been sent']);
    }

    public function resetPassword(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();
        $token = $data['token'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($token) || empty($password)) {
            return $this->errorResponse($response, 'Token and password are required', 400);
        }

        if (strlen($password) < 8) {
            return $this->errorResponse($response, 'Password must be at least 8 characters long', 400);
        }

        $user = $this->database->queryOne(
            "SELECT id FROM users
             WHERE password_reset_token = :token
             AND password_reset_expires > NOW()
             AND is_active = 1",
            ['token' => hash('sha256', $token)]
        );

        if (!$user) {
            return $this->errorResponse($response, 'Invalid or expired reset token', 400);
        }

        // Update password and clear reset token
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $this->database->execute(
            "UPDATE users SET
             password_hash = :password_hash,
             password_reset_token = NULL,
             password_reset_expires = NULL
             WHERE id = :id",
            [
                'password_hash' => $passwordHash,
                'id' => $user['id']
            ]
        );

        $this->auditLogger->log($user['id'], null, null, 'password_reset_completed', 'auth', null, [
            'ip_address' => $this->getClientIp($request)
        ]);

        return $this->successResponse($response, ['message' => 'Password reset successfully']);
    }

    public function enableMFA(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        $code = $data['code'] ?? '';

        if (empty($code)) {
            return $this->errorResponse($response, 'MFA code is required', 400);
        }

        // Generate secret if not exists
        if (empty($user['mfa_secret'])) {
            $secret = $this->generateMFASecret();
            $this->database->execute(
                "UPDATE users SET mfa_secret = :secret WHERE id = :id",
                ['secret' => $secret, 'id' => $user['id']]
            );
            $user['mfa_secret'] = $secret;
        }

        if (!$this->verifyMFA($user['mfa_secret'], $code)) {
            return $this->errorResponse($response, 'Invalid MFA code', 400);
        }

        $this->auditLogger->log($user['id'], $user['institution_id'], null, 'mfa_enabled', 'auth', null);

        return $this->successResponse($response, [
            'message' => 'MFA enabled successfully',
            'backup_codes' => $this->generateBackupCodes($user['id'])
        ]);
    }

    public function disableMFA(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        $password = $data['password'] ?? '';

        if (empty($password)) {
            return $this->errorResponse($response, 'Password confirmation required', 400);
        }

        $userRecord = $this->database->queryOne(
            "SELECT password_hash FROM users WHERE id = :id",
            ['id' => $user['id']]
        );

        if (!password_verify($password, $userRecord['password_hash'])) {
            return $this->errorResponse($response, 'Invalid password', 401);
        }

        $this->database->execute(
            "UPDATE users SET mfa_secret = NULL WHERE id = :id",
            ['id' => $user['id']]
        );

        $this->auditLogger->log($user['id'], $user['institution_id'], null, 'mfa_disabled', 'auth', null);

        return $this->successResponse($response, ['message' => 'MFA disabled successfully']);
    }

    private function verifyMFA(string $secret, string $code): bool
    {
        // Simple TOTP implementation (in production, use a proper library like spomky-labs/otphp)
        $timeSlice = floor(time() / 30);
        $secretKey = base32_decode($secret);

        for ($i = -1; $i <= 1; $i++) {
            $calculatedCode = hash_hmac('sha1', pack('N*', 0, $timeSlice + $i), $secretKey, true);
            $offset = ord($calculatedCode[19]) & 0xf;
            $calculatedCode = (
                ((ord($calculatedCode[$offset + 0]) & 0x7f) << 24) |
                ((ord($calculatedCode[$offset + 1]) & 0xff) << 16) |
                ((ord($calculatedCode[$offset + 2]) & 0xff) << 8) |
                (ord($calculatedCode[$offset + 3]) & 0xff)
            ) % pow(10, 6);

            if (sprintf('%06d', $calculatedCode) === $code) {
                return true;
            }
        }

        return false;
    }

    private function generateMFASecret(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $secret;
    }

    private function generateBackupCodes(int $userId): array
    {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }

        // Store hashed backup codes in database
        $hashedCodes = array_map('password_hash', $codes);
        $this->database->execute(
            "UPDATE users SET mfa_backup_codes = :codes WHERE id = :id",
            ['codes' => json_encode($hashedCodes), 'id' => $userId]
        );

        return $codes;
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

function base32_decode($input) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $output = '';
    $v = 0;
    $vbits = 0;
    for ($i = 0; $i < strlen($input); $i++) {
        $v <<= 5;
        $v += strpos($alphabet, $input[$i]);
        $vbits += 5;
        if ($vbits >= 8) {
            $output .= chr(($v >> ($vbits - 8)) & 255);
            $vbits -= 8;
        }
    }
    return $output;
}