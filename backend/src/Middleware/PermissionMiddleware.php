<?php
namespace DevCo\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;
use App\Services\PermissionService;
use DevCo\Models\Database;

class PermissionMiddleware implements Middleware
{
    private $requiredPermissions;
    private $requireAll;
    
    /**
     * @param array|string $requiredPermissions Single permission or array of permissions
     * @param bool $requireAll If true, user must have ALL permissions. If false, ANY permission is enough
     */
    public function __construct($requiredPermissions, $requireAll = false)
    {
        $this->requiredPermissions = is_array($requiredPermissions) ? $requiredPermissions : [$requiredPermissions];
        $this->requireAll = $requireAll;
    }
    
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Get user from request attribute (set by AuthMiddleware)
        $user = $request->getAttribute('user');
        
        if (!$user || !isset($user->user_id)) {
            return $this->unauthorizedResponse('Authentication required');
        }
        
        try {
            $db = Database::getInstance();
            $permissionService = new PermissionService($db);
            
            // Check permissions
            $hasPermission = false;
            
            if ($this->requireAll) {
                // User must have ALL required permissions
                $hasPermission = $permissionService->hasAllPermissions($user->user_id, $this->requiredPermissions);
            } else {
                // User must have ANY of the required permissions
                $hasPermission = $permissionService->hasAnyPermission($user->user_id, $this->requiredPermissions);
            }
            
            if (!$hasPermission) {
                return $this->forbiddenResponse('Insufficient permissions');
            }
            
            return $handler->handle($request);
            
        } catch (\Exception $e) {
            error_log('Permission check error: ' . $e->getMessage());
            return $this->unauthorizedResponse('Permission verification failed');
        }
    }
    
    private function unauthorizedResponse($message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message
        ]));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }
    
    private function forbiddenResponse($message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message
        ]));
        return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
    }
}
