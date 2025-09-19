<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Database\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class AuthMiddleware implements MiddlewareInterface
{
    private Database $database;
    private array $jwtSettings;
    private array $requiredRoles;

    public function __construct(Database $database, array $jwtSettings, array $requiredRoles = [])
    {
        $this->database = $database;
        $this->jwtSettings = $jwtSettings;
        $this->requiredRoles = $requiredRoles;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $token = $this->extractToken($request);

        if (!$token) {
            return $this->createUnauthorizedResponse('Authentication token required');
        }

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSettings['secret'], $this->jwtSettings['algorithm']));
            $payload = (array)$decoded;

            // Verify user still exists and is active
            $user = $this->database->queryOne(
                "SELECT u.*, i.name as institution_name
                 FROM users u
                 LEFT JOIN institutions i ON u.institution_id = i.id
                 WHERE u.id = :id AND u.is_active = 1",
                ['id' => $payload['sub']]
            );

            if (!$user) {
                return $this->createUnauthorizedResponse('User not found or inactive');
            }

            // Check role requirements
            if (!empty($this->requiredRoles) && !in_array($user['role'], $this->requiredRoles)) {
                return $this->createForbiddenResponse('Insufficient permissions');
            }

            // Add user info to request attributes
            $request = $request->withAttribute('user', $user);
            $request = $request->withAttribute('jwt_payload', $payload);

            // Update last login timestamp
            $this->database->execute(
                "UPDATE users SET last_login_at = NOW() WHERE id = :id",
                ['id' => $user['id']]
            );

            return $handler->handle($request);

        } catch (ExpiredException $e) {
            return $this->createUnauthorizedResponse('Token expired');
        } catch (SignatureInvalidException $e) {
            return $this->createUnauthorizedResponse('Invalid token signature');
        } catch (\Exception $e) {
            return $this->createUnauthorizedResponse('Invalid token');
        }
    }

    private function extractToken(ServerRequestInterface $request): ?string
    {
        $header = $request->getHeaderLine('Authorization');

        if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }

        // Also check for API key in X-API-Key header
        $apiKey = $request->getHeaderLine('X-API-Key');
        if ($apiKey) {
            return $this->validateApiKey($apiKey);
        }

        return null;
    }

    private function validateApiKey(string $apiKey): ?string
    {
        $keyData = $this->database->queryOne(
            "SELECT ak.*, u.id as user_id, u.role, u.institution_id
             FROM api_keys ak
             JOIN users u ON ak.created_by = u.id
             WHERE ak.key_hash = :key_hash
             AND ak.is_active = 1
             AND (ak.expires_at IS NULL OR ak.expires_at > NOW())",
            ['key_hash' => hash('sha256', $apiKey)]
        );

        if (!$keyData) {
            return null;
        }

        // Update last used timestamp
        $this->database->execute(
            "UPDATE api_keys SET last_used_at = NOW() WHERE id = :id",
            ['id' => $keyData['id']]
        );

        // Create a JWT token for the API key
        $payload = [
            'sub' => $keyData['user_id'],
            'role' => $keyData['role'],
            'institution_id' => $keyData['institution_id'],
            'api_key' => true,
            'iat' => time(),
            'exp' => time() + 3600
        ];

        return JWT::encode($payload, $this->jwtSettings['secret'], $this->jwtSettings['algorithm']);
    }

    private function createUnauthorizedResponse(string $message): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => [
                'type' => 'Unauthorized',
                'message' => $message,
                'status' => 401
            ]
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }

    private function createForbiddenResponse(string $message): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => [
                'type' => 'Forbidden',
                'message' => $message,
                'status' => 403
            ]
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(403);
    }
}