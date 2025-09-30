<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Services\AuthService;
use App\Repositories\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class PermissionMiddleware implements MiddlewareInterface
{
    private AuthService $authService;
    private UserRepository $userRepository;

    private array $routePermissions = [
        // User management
        'GET /admin/users' => 'users.read',
        'POST /admin/users' => 'users.create',
        'PUT /admin/users/*' => 'users.update',
        'DELETE /admin/users/*' => 'users.delete',

        // Institution management
        'GET /admin/institutions' => 'institutions.read',
        'POST /admin/institutions' => 'institutions.create',
        'PUT /admin/institutions/*' => 'institutions.update',
        'DELETE /admin/institutions/*' => 'institutions.delete',

        // Category management
        'POST /admin/categories' => 'roles.create',
        'PUT /admin/categories/*' => 'roles.update',
        'DELETE /admin/categories/*' => 'roles.delete',

        // Analytics
        'GET /admin/analytics/*' => 'analytics.read',

        // Audit logs
        'GET /admin/audit-logs' => 'audit.read',

        // Settings
        'GET /admin/settings' => 'settings.read',
        'PUT /admin/settings' => 'settings.update',
    ];

    public function __construct(AuthService $authService, UserRepository $userRepository)
    {
        $this->authService = $authService;
        $this->userRepository = $userRepository;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user) {
            return $this->forbiddenResponse();
        }

        // Super admin has access to everything
        if ($user['role'] === 'super_admin') {
            return $handler->handle($request);
        }

        $method = $request->getMethod();
        $path = $request->getUri()->getPath();

        // Find required permission for this route
        $requiredPermission = $this->getRequiredPermission($method, $path);

        if (!$requiredPermission) {
            // No specific permission required for this route
            return $handler->handle($request);
        }

        // Check if user has the required permission
        $userPermissions = $this->userRepository->getUserPermissions($user['id']);

        if (!in_array($requiredPermission, $userPermissions)) {
            return $this->forbiddenResponse('Insufficient permissions');
        }

        return $handler->handle($request);
    }

    private function getRequiredPermission(string $method, string $path): ?string
    {
        foreach ($this->routePermissions as $route => $permission) {
            [$routeMethod, $routePath] = explode(' ', $route, 2);

            if ($method !== $routeMethod) {
                continue;
            }

            // Convert route pattern to regex
            $pattern = str_replace('*', '[^/]+', $routePath);
            $pattern = '/^' . str_replace('/', '\/', $pattern) . '$/';

            if (preg_match($pattern, $path)) {
                return $permission;
            }
        }

        return null;
    }

    private function forbiddenResponse(string $message = 'Access denied'): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'error' => 'Forbidden',
            'message' => $message
        ]));

        return $response
            ->withStatus(403)
            ->withHeader('Content-Type', 'application/json');
    }
}