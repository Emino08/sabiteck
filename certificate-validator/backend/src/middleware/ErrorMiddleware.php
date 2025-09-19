<?php

declare(strict_types=1);

namespace App\Middleware;

use Monolog\Logger;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Psr7\Response;
use Throwable;

class ErrorMiddleware implements MiddlewareInterface
{
    private Logger $logger;
    private bool $debug;

    public function __construct(Logger $logger, bool $debug = false)
    {
        $this->logger = $logger;
        $this->debug = $debug;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        try {
            return $handler->handle($request);
        } catch (HttpNotFoundException $e) {
            return $this->createErrorResponse(404, 'Not Found', $e->getMessage());
        } catch (HttpMethodNotAllowedException $e) {
            return $this->createErrorResponse(405, 'Method Not Allowed', $e->getMessage());
        } catch (Throwable $e) {
            $this->logger->error('Unhandled exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'uri' => (string)$request->getUri(),
                'method' => $request->getMethod(),
            ]);

            $message = $this->debug ? $e->getMessage() : 'Internal Server Error';
            $details = $this->debug ? [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString())
            ] : [];

            return $this->createErrorResponse(500, 'Internal Server Error', $message, $details);
        }
    }

    private function createErrorResponse(int $status, string $type, string $message, array $details = []): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => [
                'type' => $type,
                'message' => $message,
                'status' => $status,
                'timestamp' => date('c'),
                'details' => $details
            ]
        ], JSON_PRETTY_PRINT));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}