<?php

declare(strict_types=1);

namespace EmergencyResponse\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use EmergencyResponse\Services\AuthService;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware implements MiddlewareInterface
{
    private AuthService $authService;

    public function __construct(AuthService $authService = null)
    {
        // Use dependency injection when available
        $this->authService = $authService ?? new AuthService(
            app()->getContainer()->get('database'),
            app()->getContainer()->get('redis'),
            app()->getContainer()->get(\Monolog\Logger::class)
        );
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            return $this->unauthorizedResponse('Authorization header missing');
        }

        // Check if it starts with "Bearer "
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->unauthorizedResponse('Invalid authorization header format');
        }

        $token = $matches[1];

        try {
            // Validate the token
            $user = $this->authService->validateToken($token);

            if (!$user) {
                return $this->unauthorizedResponse('Invalid or expired token');
            }

            // Add user to request attributes
            $request = $request->withAttribute('user', $user);
            $request = $request->withAttribute('user_id', $user->id);
            $request = $request->withAttribute('user_role', $user->role);

            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorizedResponse('Authentication failed: ' . $e->getMessage());
        }
    }

    private function unauthorizedResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'error' => 'Unauthorized',
            'message' => $message,
            'code' => 401
        ]));

        return $response
            ->withStatus(401)
            ->withHeader('Content-Type', 'application/json');
    }
}