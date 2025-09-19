<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\QueueService;
use App\Services\ConversionService;
use App\Services\ValidationService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class ResizeController
{
    public function __construct(
        private QueueService $queueService,
        private ConversionService $conversionService,
        private ValidationService $validationService,
        private LoggerInterface $logger
    ) {}

    public function file(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate and sanitize parameters
            $targetSizeKb = $this->validationService->validateTargetSize((int)($params['target_size_kb'] ?? 1024));
            $quality = $this->validationService->validateQuality((int)($params['quality'] ?? 85));
            $compressLevel = $this->validationService->validateCompressLevel($params['compress_level'] ?? 'medium');
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'target_size_kb' => $targetSizeKb,
                'quality' => $quality,
                'compress_level' => $compressLevel,
                'mime_type' => $file->getClientMediaType()
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processFileResizeSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Queue for async processing
                $jobId = $this->queueService->enqueueJob(
                    'resize_file',
                    $payload,
                    $request->getAttribute('api_key')
                );

                return $this->jsonResponse($response, [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'File resize queued for processing'
                ], 202);
            }

        } catch (\Exception $e) {
            $this->logger->error('File resize error: ' . $e->getMessage());
            return $this->errorResponse($response, 'File resize failed: ' . $e->getMessage());
        }
    }

    public function image(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate required parameters
            if (empty($params['width']) || empty($params['height'])) {
                return $this->errorResponse($response, 'Width and height are required');
            }

            // Validate and sanitize parameters
            [$width, $height] = $this->validationService->validateImageDimensions(
                (int)$params['width'],
                (int)$params['height']
            );
            $preserveAspect = filter_var($params['preserve_aspect'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $fit = $this->validationService->validateImageFit($params['fit'] ?? 'contain');
            $quality = $this->validationService->validateQuality((int)($params['quality'] ?? 85));
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'width' => $width,
                'height' => $height,
                'preserve_aspect' => $preserveAspect,
                'fit' => $fit,
                'quality' => $quality,
                'mime_type' => $file->getClientMediaType()
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processImageResizeSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Queue for async processing
                $jobId = $this->queueService->enqueueJob(
                    'resize_image',
                    $payload,
                    $request->getAttribute('api_key')
                );

                return $this->jsonResponse($response, [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'Image resize queued for processing'
                ], 202);
            }

        } catch (\Exception $e) {
            $this->logger->error('Image resize error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Image resize failed: ' . $e->getMessage());
        }
    }

    private function processFileResizeSync($file, array $payload): array
    {
        // Placeholder for synchronous processing
        $originalSize = $payload['file_size'];
        $targetSize = $payload['target_size_kb'] * 1024;
        $compressionRatio = min(0.8, $targetSize / $originalSize);

        return [
            'status' => 'completed',
            'download_url' => '/download/resized_file.' . pathinfo($payload['file_name'], PATHINFO_EXTENSION),
            'original_size' => $originalSize,
            'new_size' => (int)($originalSize * $compressionRatio),
            'compression_ratio' => $compressionRatio,
            'processing_time' => 2.1
        ];
    }

    private function processImageResizeSync($file, array $payload): array
    {
        // Placeholder for synchronous processing
        return [
            'status' => 'completed',
            'download_url' => '/download/resized_image.' . pathinfo($payload['file_name'], PATHINFO_EXTENSION),
            'original_dimensions' => ['width' => 1920, 'height' => 1080],
            'new_dimensions' => ['width' => $payload['width'], 'height' => $payload['height']],
            'file_size' => (int)($payload['file_size'] * 0.6),
            'processing_time' => 1.5
        ];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private function errorResponse(ResponseInterface $response, string $message, int $status = 400): ResponseInterface
    {
        return $this->jsonResponse($response, ['error' => $message], $status);
    }
}