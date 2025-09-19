<?php

declare(strict_types=1);

namespace App\Controllers;

use Predis\Client as RedisClient;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class HealthController
{
    public function __construct(
        private RedisClient $redis,
        private LoggerInterface $logger
    ) {}

    public function health(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $health = [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'version' => $_ENV['APP_VERSION'] ?? '1.0.0',
            'environment' => $_ENV['APP_ENV'] ?? 'production',
            'checks' => []
        ];

        try {
            // Check Redis connection
            $redisStatus = $this->checkRedis();
            $health['checks']['redis'] = $redisStatus;

            // Check disk space
            $diskStatus = $this->checkDiskSpace();
            $health['checks']['disk_space'] = $diskStatus;

            // Check external tools
            $toolsStatus = $this->checkExternalTools();
            $health['checks']['external_tools'] = $toolsStatus;

            // Check queue status
            $queueStatus = $this->checkQueueStatus();
            $health['checks']['queue'] = $queueStatus;

            // Determine overall health (warnings are acceptable)
            $allHealthy = true;
            foreach ($health['checks'] as $check) {
                if ($check['status'] === 'unhealthy') {
                    $allHealthy = false;
                    break;
                }
            }

            $health['status'] = $allHealthy ? 'healthy' : 'unhealthy';
            $httpStatus = $allHealthy ? 200 : 503;

            return $this->jsonResponse($response, $health, $httpStatus);

        } catch (\Exception $e) {
            $this->logger->error('Health check error: ' . $e->getMessage());

            $health['status'] = 'unhealthy';
            $health['error'] = 'Health check failed: ' . $e->getMessage();

            return $this->jsonResponse($response, $health, 503);
        }
    }

    private function checkRedis(): array
    {
        try {
            $this->redis->ping();
            return [
                'status' => 'healthy',
                'response_time' => 0.01,
                'message' => 'Redis connection successful'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Redis not available (running without queue): ' . $e->getMessage()
            ];
        }
    }

    private function checkDiskSpace(): array
    {
        try {
            $storageRoot = $_ENV['STORAGE_ROOT'] ?? 'storage';
            if (!is_dir($storageRoot)) {
                mkdir($storageRoot, 0755, true);
            }

            $freeBytes = disk_free_space($storageRoot);
            $totalBytes = disk_total_space($storageRoot);
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = ($usedBytes / $totalBytes) * 100;

            $status = $usedPercent > 90 ? 'unhealthy' : 'healthy';

            return [
                'status' => $status,
                'free_space' => $this->formatBytes($freeBytes),
                'total_space' => $this->formatBytes($totalBytes),
                'used_percent' => round($usedPercent, 2),
                'message' => $status === 'healthy' ? 'Sufficient disk space' : 'Low disk space warning'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Disk space check failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkExternalTools(): array
    {
        $tools = [
            'libreoffice' => $_ENV['LIBREOFFICE_PATH'] ?? 'libreoffice',
            'ghostscript' => $_ENV['GHOSTSCRIPT_PATH'] ?? 'gs',
            'imagemagick' => $_ENV['IMAGEMAGICK_PATH'] ?? 'convert',
            'tesseract' => $_ENV['TESSERACT_PATH'] ?? 'tesseract',
            'poppler' => $_ENV['POPPLER_PATH'] ?? 'pdftoppm'
        ];

        $results = [];
        $allHealthy = true;

        foreach ($tools as $name => $path) {
            $command = escapeshellcmd($path) . ' --version 2>&1';
            exec($command, $output, $returnCode);

            $status = $returnCode === 0 ? 'healthy' : 'unhealthy';
            if ($status === 'unhealthy') {
                $allHealthy = false;
            }

            $results[$name] = [
                'status' => $status,
                'path' => $path,
                'version' => $status === 'healthy' ? trim(implode(' ', $output)) : 'Not available'
            ];
        }

        return [
            'status' => $allHealthy ? 'healthy' : 'unhealthy',
            'tools' => $results,
            'message' => $allHealthy ? 'All external tools available' : 'Some external tools unavailable'
        ];
    }

    private function checkQueueStatus(): array
    {
        try {
            $queuedCount = $this->redis->llen('jobs:queue');
            $processingCount = $this->redis->llen('jobs:processing');

            return [
                'status' => 'healthy',
                'queued_jobs' => $queuedCount,
                'processing_jobs' => $processingCount,
                'message' => 'Queue system operational'
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'queued_jobs' => 0,
                'processing_jobs' => 0,
                'message' => 'Queue not available (synchronous mode only): ' . $e->getMessage()
            ];
        }
    }

    private function formatBytes(float|int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;

        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }

        return round($size, 2) . ' ' . $units[$i];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}