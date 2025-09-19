<?php
namespace DevCo\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class CorsMiddleware implements Middleware
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Get the origin from the request
        $origin = $request->getHeaderLine('Origin');

        // List of allowed origins
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3001',
            'http://localhost:3000',
            'http://localhost:3003',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3003',
            'https://sabiteck.com',
            'https://www.sabiteck.com'
        ];

        // Check if the origin is allowed
        $allowOrigin = in_array($origin, $allowedOrigins) ? $origin : '*';

        // If no origin header, allow all for now
        if (empty($origin)) {
            $allowOrigin = '*';
        }

        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            $response = new SlimResponse();
            return $response
                ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
                ->withHeader('Access-Control-Allow-Credentials', 'true')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization, X-Custom-Auth, Cache-Control, Pragma, X-HTTP-Method-Override')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
                ->withHeader('Access-Control-Max-Age', '86400')
                ->withHeader('Content-Length', '0')
                ->withStatus(204);
        }
        
        // Process the actual request
        $response = $handler->handle($request);
        
        // Add CORS headers to the response
        return $response
            ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization, X-Custom-Auth, Cache-Control, Pragma')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    }
}
