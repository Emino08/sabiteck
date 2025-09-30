<?php

declare(strict_types=1);

namespace EmergencyResponse\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Database\Capsule\Manager as DB;
use Monolog\Logger;
use Predis\Client as Redis;
use Ramsey\Uuid\Uuid;

class AuthService
{
    private DB $db;
    private Redis $redis;
    private Logger $logger;
    private string $jwtSecret;
    private int $jwtExpiry;
    private int $refreshTokenExpiry;

    public function __construct(DB $db, Redis $redis, Logger $logger)
    {
        $this->db = $db;
        $this->redis = $redis;
        $this->logger = $logger;
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret';
        $this->jwtExpiry = (int) ($_ENV['JWT_EXPIRY'] ?? 900); // 15 minutes
        $this->refreshTokenExpiry = (int) ($_ENV['REFRESH_TOKEN_EXPIRY'] ?? 2592000); // 30 days
    }

    public function login(string $email, string $password, array $deviceInfo = []): array
    {
        $user = $this->db->table('users')
            ->where('email', $email)
            ->where('is_active', 1)
            ->first();

        if (!$user || !password_verify($password, $user->password_hash)) {
            $this->logger->warning('Failed login attempt', ['email' => $email]);
            throw new \Exception('Invalid credentials');
        }

        // Update last login
        $this->db->table('users')
            ->where('id', $user->id)
            ->update(['last_login' => date('Y-m-d H:i:s')]);

        // Generate tokens
        $accessToken = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken($user, $deviceInfo);

        $this->logger->info('User logged in', ['user_id' => $user->id]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtExpiry,
            'user' => $this->formatUser($user)
        ];
    }

    public function register(array $userData): array
    {
        // Validate required fields
        $required = ['name', 'email', 'password', 'phone'];
        foreach ($required as $field) {
            if (empty($userData[$field])) {
                throw new \Exception("Field {$field} is required");
            }
        }

        // Check if user already exists
        $existingUser = $this->db->table('users')
            ->where('email', $userData['email'])
            ->first();

        if ($existingUser) {
            throw new \Exception('User already exists with this email');
        }

        // Create user
        $userId = $this->db->table('users')->insertGetId([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => $userData['name'],
            'email' => $userData['email'],
            'phone' => $userData['phone'],
            'password_hash' => password_hash($userData['password'], PASSWORD_ARGON2ID),
            'role' => $userData['role'] ?? 'citizen',
            'agency_id' => $userData['agency_id'] ?? null,
            'station_id' => $userData['station_id'] ?? null,
            'is_verified' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $user = $this->db->table('users')->where('id', $userId)->first();

        $this->logger->info('User registered', ['user_id' => $userId]);

        return $this->formatUser($user);
    }

    public function refreshToken(string $refreshToken): array
    {
        $tokenData = $this->db->table('refresh_tokens')
            ->where('token_hash', hash('sha256', $refreshToken))
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->where('is_revoked', 0)
            ->first();

        if (!$tokenData) {
            throw new \Exception('Invalid or expired refresh token');
        }

        $user = $this->db->table('users')
            ->where('id', $tokenData->user_id)
            ->where('is_active', 1)
            ->first();

        if (!$user) {
            throw new \Exception('User not found or inactive');
        }

        // Generate new access token
        $accessToken = $this->generateAccessToken($user);

        return [
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtExpiry
        ];
    }

    public function validateToken(string $token): ?object
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));

            // Check if user still exists and is active
            $user = $this->db->table('users')
                ->where('id', $decoded->user_id)
                ->where('is_active', 1)
                ->first();

            return $user ?: null;
        } catch (\Exception $e) {
            $this->logger->warning('Invalid token', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function revokeRefreshToken(string $refreshToken): bool
    {
        $affected = $this->db->table('refresh_tokens')
            ->where('token_hash', hash('sha256', $refreshToken))
            ->update(['is_revoked' => 1]);

        return $affected > 0;
    }

    public function revokeAllUserTokens(int $userId): bool
    {
        $affected = $this->db->table('refresh_tokens')
            ->where('user_id', $userId)
            ->update(['is_revoked' => 1]);

        return $affected > 0;
    }

    private function generateAccessToken(object $user): string
    {
        $payload = [
            'iss' => $_ENV['APP_URL'] ?? 'emergency-response',
            'aud' => $_ENV['APP_URL'] ?? 'emergency-response',
            'iat' => time(),
            'exp' => time() + $this->jwtExpiry,
            'user_id' => $user->id,
            'role' => $user->role,
            'agency_id' => $user->agency_id,
            'station_id' => $user->station_id
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    private function generateRefreshToken(object $user, array $deviceInfo = []): string
    {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        $this->db->table('refresh_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'expires_at' => date('Y-m-d H:i:s', time() + $this->refreshTokenExpiry),
            'device_id' => $deviceInfo['device_id'] ?? null,
            'device_name' => $deviceInfo['device_name'] ?? null,
            'ip_address' => $deviceInfo['ip_address'] ?? null,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        return $token;
    }

    private function formatUser(object $user): array
    {
        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'agency_id' => $user->agency_id,
            'station_id' => $user->station_id,
            'is_verified' => (bool) $user->is_verified,
            'created_at' => $user->created_at
        ];
    }
}