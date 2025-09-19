<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\QueueService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class JobController
{
    public function __construct(
        private QueueService $queueService,
        private LoggerInterface $logger
    ) {}

    public function status(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $jobId = $args['jobId'] ?? '';

            if (empty($jobId)) {
                return $this->errorResponse($response, 'Job ID is required', 400);
            }

            $job = $this->queueService->getJob($jobId);

            if (!$job) {
                return $this->errorResponse($response, 'Job not found', 404);
            }

            // Check if the requester has access to this job
            $apiKey = $request->getAttribute('api_key');
            if ($job->getApiKey() && $job->getApiKey() !== $apiKey) {
                return $this->errorResponse($response, 'Access denied', 403);
            }

            $responseData = [
                'job_id' => $job->getId(),
                'status' => $job->getStatus(),
                'progress' => $job->getProgress(),
                'created_at' => date('c', $job->getCreatedAt()),
                'updated_at' => date('c', $job->getUpdatedAt())
            ];

            // Add result if job is completed
            if ($job->getStatus() === 'success' && $job->getResult()) {
                $responseData['result'] = $job->getResult();
            }

            // Add error if job failed
            if ($job->getStatus() === 'failed' && $job->getError()) {
                $responseData['error'] = $job->getError();
            }

            // Add estimated time remaining for processing jobs
            if ($job->getStatus() === 'processing') {
                $processingTime = time() - $job->getUpdatedAt();
                $estimatedTotal = $this->estimateProcessingTime($job->getType());
                $remainingTime = max(0, $estimatedTotal - $processingTime);

                $responseData['processing_time'] = $processingTime;
                $responseData['estimated_remaining'] = $remainingTime;
            }

            return $this->jsonResponse($response, $responseData);

        } catch (\Exception $e) {
            $this->logger->error('Job status check error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Failed to get job status');
        }
    }

    private function estimateProcessingTime(string $jobType): int
    {
        // Estimated processing times in seconds based on job type
        $estimates = [
            'pdf_to_word' => 30,
            'pdf_to_images' => 45,
            'word_to_pdf' => 20,
            'image_to_word' => 60,
            'resize_file' => 15,
            'resize_image' => 10
        ];

        return $estimates[$jobType] ?? 30;
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private function errorResponse(ResponseInterface $response, string $message, int $status = 500): ResponseInterface
    {
        return $this->jsonResponse($response, [
            'error' => $message,
            'code' => $this->getErrorCode($status)
        ], $status);
    }

    private function getErrorCode(int $status): string
    {
        return match($status) {
            400 => 'BAD_REQUEST',
            401 => 'UNAUTHORIZED',
            403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',
            429 => 'RATE_LIMIT_EXCEEDED',
            default => 'INTERNAL_ERROR'
        };
    }
}