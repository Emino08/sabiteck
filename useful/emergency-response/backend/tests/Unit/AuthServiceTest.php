<?php

declare(strict_types=1);

namespace EmergencyResponse\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Mockery;
use EmergencyResponse\Services\AuthService;
use Illuminate\Database\Capsule\Manager as DB;
use Predis\Client as Redis;
use Monolog\Logger;

class AuthServiceTest extends TestCase
{
    private $db;
    private $redis;
    private $logger;
    private AuthService $authService;

    protected function setUp(): void
    {
        $this->db = Mockery::mock(DB::class);
        $this->redis = Mockery::mock(Redis::class);
        $this->logger = Mockery::mock(Logger::class);

        $this->authService = new AuthService($this->db, $this->redis, $this->logger);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testValidateTokenReturnsUserForValidToken(): void
    {
        // Mock user data
        $userData = (object) [
            'id' => 1,
            'email' => 'test@example.com',
            'role' => 'citizen',
            'is_active' => 1
        ];

        // Mock database query
        $queryBuilder = Mockery::mock();
        $queryBuilder->shouldReceive('where')->with('id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('where')->with('is_active', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($userData);

        $this->db->shouldReceive('table')->with('users')->andReturn($queryBuilder);

        // Generate a valid token for testing
        $token = $this->generateTestToken(1, 'citizen');

        $result = $this->authService->validateToken($token);

        $this->assertNotNull($result);
        $this->assertEquals(1, $result->id);
        $this->assertEquals('test@example.com', $result->email);
    }

    public function testValidateTokenReturnsNullForInvalidToken(): void
    {
        $result = $this->authService->validateToken('invalid-token');

        $this->assertNull($result);
    }

    public function testRegisterCreatesNewUser(): void
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'phone' => '+1234567890',
            'role' => 'citizen'
        ];

        // Mock existing user check
        $queryBuilder = Mockery::mock();
        $queryBuilder->shouldReceive('where')->with('email', 'test@example.com')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn(null);

        $this->db->shouldReceive('table')->with('users')->andReturn($queryBuilder);

        // Mock user creation
        $insertQueryBuilder = Mockery::mock();
        $insertQueryBuilder->shouldReceive('insertGetId')->andReturn(1);
        $this->db->shouldReceive('table')->with('users')->andReturn($insertQueryBuilder);

        // Mock user retrieval after creation
        $newUser = (object) [
            'id' => 1,
            'uuid' => 'test-uuid',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+1234567890',
            'role' => 'citizen',
            'agency_id' => null,
            'station_id' => null,
            'is_verified' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

        $retrieveQueryBuilder = Mockery::mock();
        $retrieveQueryBuilder->shouldReceive('where')->with('id', 1)->andReturnSelf();
        $retrieveQueryBuilder->shouldReceive('first')->andReturn($newUser);
        $this->db->shouldReceive('table')->with('users')->andReturn($retrieveQueryBuilder);

        $this->logger->shouldReceive('info')->once();

        $result = $this->authService->register($userData);

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['id']);
        $this->assertEquals('Test User', $result['name']);
        $this->assertEquals('test@example.com', $result['email']);
    }

    public function testRegisterThrowsExceptionForExistingUser(): void
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'phone' => '+1234567890'
        ];

        $existingUser = (object) ['id' => 1, 'email' => 'test@example.com'];

        $queryBuilder = Mockery::mock();
        $queryBuilder->shouldReceive('where')->with('email', 'test@example.com')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingUser);

        $this->db->shouldReceive('table')->with('users')->andReturn($queryBuilder);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('User already exists with this email');

        $this->authService->register($userData);
    }

    private function generateTestToken(int $userId, string $role): string
    {
        $payload = [
            'iss' => 'emergency-response',
            'aud' => 'emergency-response',
            'iat' => time(),
            'exp' => time() + 900,
            'user_id' => $userId,
            'role' => $role
        ];

        return \Firebase\JWT\JWT::encode($payload, 'test-jwt-secret-key', 'HS256');
    }
}