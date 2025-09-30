<?php

declare(strict_types=1);

namespace EmergencyResponse\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use EmergencyResponse\Services\AuthService;
use Respect\Validation\Validator as v;

class AuthController
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validate input
        $validator = v::keySet(
            v::key('email', v::email()->notEmpty()),
            v::key('password', v::stringType()->notEmpty())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $deviceInfo = [
                'device_id' => $data['device_id'] ?? null,
                'device_name' => $data['device_name'] ?? null,
                'ip_address' => $this->getClientIp($request)
            ];

            $result = $this->authService->login($data['email'], $data['password'], $deviceInfo);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validate input
        $validator = v::keySet(
            v::key('name', v::stringType()->notEmpty()),
            v::key('email', v::email()->notEmpty()),
            v::key('password', v::stringType()->length(8, null)),
            v::key('phone', v::stringType()->notEmpty()),
            v::keyOptional('role', v::in(['citizen', 'responder'])),
            v::keyOptional('agency_id', v::intType()),
            v::keyOptional('station_id', v::intType())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $user = $this->authService->register($data);

            $response->getBody()->write(json_encode([
                'message' => 'User registered successfully',
                'user' => $user
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function refresh(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['refresh_token'])) {
            $response->getBody()->write(json_encode(['error' => 'Refresh token is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $result = $this->authService->refreshToken($data['refresh_token']);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function logout(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (!empty($data['refresh_token'])) {
            $this->authService->revokeRefreshToken($data['refresh_token']);
        }

        $response->getBody()->write(json_encode(['message' => 'Logged out successfully']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['email'])) {
            $response->getBody()->write(json_encode(['error' => 'Email is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // TODO: Implement password reset functionality
        $response->getBody()->write(json_encode(['message' => 'Password reset email sent if account exists']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $validator = v::keySet(
            v::key('token', v::stringType()->notEmpty()),
            v::key('password', v::stringType()->length(8, null))
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // TODO: Implement password reset functionality
        $response->getBody()->write(json_encode(['message' => 'Password reset successfully']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    private function getClientIp(Request $request): string
    {
        $serverParams = $request->getServerParams();

        if (!empty($serverParams['HTTP_X_FORWARDED_FOR'])) {
            return explode(',', $serverParams['HTTP_X_FORWARDED_FOR'])[0];
        }

        if (!empty($serverParams['HTTP_X_REAL_IP'])) {
            return $serverParams['HTTP_X_REAL_IP'];
        }

        return $serverParams['REMOTE_ADDR'] ?? 'unknown';
    }
}