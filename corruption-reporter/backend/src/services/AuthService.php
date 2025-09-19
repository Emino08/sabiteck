<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\UserRepository;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Predis\Client as RedisClient;
use Ramsey\Uuid\Uuid;

class AuthService
{
    private UserRepository $userRepository;
    private RedisClient $redis;
    private string $jwtSecret;
    private int $jwtExpireTime;
    private int $refreshExpireTime;

    public function __construct(
        UserRepository $userRepository,
        RedisClient $redis,
        string $jwtSecret,
        int $jwtExpireTime,
        int $refreshExpireTime
    ) {
        $this->userRepository = $userRepository;
        $this->redis = $redis;
        $this->jwtSecret = $jwtSecret;
        $this->jwtExpireTime = $jwtExpireTime;
        $this->refreshExpireTime = $refreshExpireTime;
    }

    public function login(string $email, string $password, ?string $deviceId = null): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new \InvalidArgumentException('Invalid credentials');
        }

        if (!$user['is_active']) {
            throw new \InvalidArgumentException('Account is deactivated');
        }

        // Update last login
        $this->userRepository->updateLastLogin($user['id']);

        // Generate tokens
        $accessToken = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken($user['id'], $deviceId);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtExpireTime,
            'user' => $this->sanitizeUser($user)
        ];
    }

    public function register(array $userData): array
    {
        // Check if email already exists
        if ($this->userRepository->findByEmail($userData['email'])) {
            throw new \InvalidArgumentException('Email already exists');
        }

        // Hash password
        $userData['password_hash'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        unset($userData['password']);

        // Set default role as reporter
        if (!isset($userData['role_id'])) {
            $userData['role_id'] = $this->userRepository->getRoleIdByName('reporter');
        }

        $userData['uuid'] = Uuid::uuid4()->toString();
        $userData['is_active'] = true;

        $userId = $this->userRepository->create($userData);
        $user = $this->userRepository->findById($userId);

        return [
            'user' => $this->sanitizeUser($user),
            'message' => 'Registration successful'
        ];
    }

    public function refreshToken(string $refreshToken): array
    {
        $tokenData = $this->redis->get("refresh_token:{$refreshToken}");

        if (!$tokenData) {
            throw new \InvalidArgumentException('Invalid refresh token');
        }

        $tokenData = json_decode($tokenData, true);
        $user = $this->userRepository->findById($tokenData['user_id']);

        if (!$user || !$user['is_active']) {
            throw new \InvalidArgumentException('Invalid user');
        }

        // Generate new access token
        $accessToken = $this->generateAccessToken($user);

        return [
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtExpireTime
        ];
    }

    public function logout(string $refreshToken): void
    {
        $this->redis->del("refresh_token:{$refreshToken}");
    }

    public function validateToken(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            $payload = (array) $decoded;

            $user = $this->userRepository->findById($payload['user_id']);

            if (!$user || !$user['is_active']) {
                throw new \InvalidArgumentException('Invalid user');
            }

            return $this->sanitizeUser($user);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException('Invalid token');
        }
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        $user = $this->userRepository->findById($userId);

        if (!password_verify($currentPassword, $user['password_hash'])) {
            throw new \InvalidArgumentException('Current password is incorrect');
        }

        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->userRepository->updatePassword($userId, $newPasswordHash);
    }

    private function generateAccessToken(array $user): string
    {
        $payload = [
            'iss' => $_ENV['APP_NAME'],
            'iat' => time(),
            'exp' => time() + $this->jwtExpireTime,
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role_name'] ?? 'reporter'
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    private function generateRefreshToken(int $userId, ?string $deviceId): string
    {
        $refreshToken = bin2hex(random_bytes(32));

        $tokenData = [
            'user_id' => $userId,
            'device_id' => $deviceId,
            'created_at' => time()
        ];

        $this->redis->setex(
            "refresh_token:{$refreshToken}",
            $this->refreshExpireTime,
            json_encode($tokenData)
        );

        return $refreshToken;
    }

    private function sanitizeUser(array $user): array
    {
        unset($user['password_hash'], $user['two_factor_secret']);
        return $user;
    }
}