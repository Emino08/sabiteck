<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\AuditService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;

class AuthController
{
    private AuthService $authService;
    private AuditService $auditService;

    public function __construct(AuthService $authService, AuditService $auditService)
    {
        $this->authService = $authService;
        $this->auditService = $auditService;
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validation
        $validator = v::keySet(
            v::key('email', v::email()->notEmpty()),
            v::key('password', v::stringType()->notEmpty()),
            v::key('device_id', v::stringType()->optional())
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
            $result = $this->authService->login(
                $data['email'],
                $data['password'],
                $data['device_id'] ?? null
            );

            // Log successful login
            $this->auditService->log(
                $result['user']['id'],
                'auth.login',
                'auth',
                null,
                $this->getClientInfo($request)
            );

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\InvalidArgumentException $e) {
            // Log failed login attempt
            $this->auditService->log(
                null,
                'auth.login_failed',
                'auth',
                null,
                array_merge($this->getClientInfo($request), ['email' => $data['email']])
            );

            $response->getBody()->write(json_encode([
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validation
        $validator = v::keySet(
            v::key('email', v::email()->notEmpty()),
            v::key('password', v::stringType()->length(8)->notEmpty()),
            v::key('full_name', v::stringType()->notEmpty()),
            v::key('phone', v::stringType()->optional()),
            v::key('institution_id', v::intType()->optional())
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
            $result = $this->authService->register($data);

            // Log registration
            $this->auditService->log(
                $result['user']['id'],
                'auth.register',
                'users',
                $result['user']['id'],
                $this->getClientInfo($request)
            );

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function refresh(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (!isset($data['refresh_token'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Refresh token is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $result = $this->authService->refreshToken($data['refresh_token']);

            $response->getBody()->write(json_encode($result));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function logout(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (isset($data['refresh_token'])) {
            $this->authService->logout($data['refresh_token']);
        }

        // Log logout
        $user = $request->getAttribute('user');
        if ($user) {
            $this->auditService->log(
                $user['id'],
                'auth.logout',
                'auth',
                null,
                $this->getClientInfo($request)
            );
        }

        $response->getBody()->write(json_encode([
            'message' => 'Logged out successfully'
        ]));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function me(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');

        $response->getBody()->write(json_encode([
            'user' => $user
        ]));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function changePassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Validation
        $validator = v::keySet(
            v::key('current_password', v::stringType()->notEmpty()),
            v::key('new_password', v::stringType()->length(8)->notEmpty())
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
            $this->authService->changePassword(
                $user['id'],
                $data['current_password'],
                $data['new_password']
            );

            // Log password change
            $this->auditService->log(
                $user['id'],
                'auth.password_changed',
                'users',
                $user['id'],
                $this->getClientInfo($request)
            );

            $response->getBody()->write(json_encode([
                'message' => 'Password changed successfully'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validation
        $validator = v::keySet(
            v::key('email', v::email()->notEmpty())
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

        // TODO: Implement password reset email functionality
        $response->getBody()->write(json_encode([
            'message' => 'Password reset email sent if account exists'
        ]));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        // TODO: Implement password reset functionality
        $response->getBody()->write(json_encode([
            'message' => 'Password reset functionality not yet implemented'
        ]));
        return $response->withStatus(501)->withHeader('Content-Type', 'application/json');
    }

    public function enableTwoFactor(Request $request, Response $response): Response
    {
        // TODO: Implement 2FA setup
        $response->getBody()->write(json_encode([
            'message' => '2FA functionality not yet implemented'
        ]));
        return $response->withStatus(501)->withHeader('Content-Type', 'application/json');
    }

    public function verifyTwoFactor(Request $request, Response $response): Response
    {
        // TODO: Implement 2FA verification
        $response->getBody()->write(json_encode([
            'message' => '2FA functionality not yet implemented'
        ]));
        return $response->withStatus(501)->withHeader('Content-Type', 'application/json');
    }

    private function getClientInfo(Request $request): array
    {
        return [
            'ip_address' => $request->getHeaderLine('X-Forwarded-For') ?:
                          $request->getServerParams()['REMOTE_ADDR'] ?? null,
            'user_agent' => $request->getHeaderLine('User-Agent')
        ];
    }
}