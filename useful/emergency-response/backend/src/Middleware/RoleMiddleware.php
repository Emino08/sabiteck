<?php

declare(strict_types=1);

namespace EmergencyResponse\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class RoleMiddleware implements MiddlewareInterface
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles)
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user) {
            return $this->forbiddenResponse('User not authenticated');
        }

        if (!in_array($user->role, $this->allowedRoles)) {
            return $this->forbiddenResponse('Insufficient permissions');
        }

        return $handler->handle($request);
    }

    private function forbiddenResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'error' => 'Forbidden',
            'message' => $message,
            'code' => 403
        ]));

        return $response
            ->withStatus(403)
            ->withHeader('Content-Type', 'application/json');
    }
}