<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Job;
use App\Services\ConversionService;
use App\Services\StorageService;
use Psr\Log\LoggerInterface;

class ResizeFileJob
{
    public function __construct(
        private ConversionService $conversionService,
        private StorageService $storageService,
        private LoggerInterface $logger
    ) {}

    public function handle(Job $job): array
    {
        $payload = $job->getPayload();
        $this->logger->info("Processing File Resize job: {$job->getId()}");

        try {
            // Create temporary files
            $extension = pathinfo($payload['file_name'], PATHINFO_EXTENSION);
            $tempInputFile = $this->storageService->createTempFile('resize_input_', ".{$extension}");
            $tempOutputFile = $this->storageService->createTempFile('resize_output_', ".{$extension}");

            $this->updateProgress($job, 25, 'Analyzing file for resize options...');

            $originalSize = $payload['file_size'];
            $targetSizeBytes = $payload['target_size_kb'] * 1024;

            // Calculate if resize is needed
            if ($originalSize <= $targetSizeBytes) {
                // File is already smaller than target, just copy
                copy($tempInputFile, $tempOutputFile);
                $compressionRatio = 1.0;
                $method = 'no_compression_needed';
            } else {
                $this->updateProgress($job, 50, 'Compressing file...');

                // Perform file resize/compression
                $success = $this->conversionService->resizeFile($tempInputFile, $tempOutputFile, [
                    'target_size_kb' => $payload['target_size_kb'],
                    'quality' => $payload['quality'],
                    'compress_level' => $payload['compress_level'],
                    'mime_type' => $payload['mime_type']
                ]);

                if (!$success) {
                    throw new \RuntimeException('File resize/compression failed');
                }

                $compressionRatio = filesize($tempOutputFile) / $originalSize;
                $method = $this->getCompressionMethod($payload['mime_type']);
            }

            $this->updateProgress($job, 80, 'Storing compressed file...');

            // Store the result
            $storedPath = $this->storageService->storeFromPath($tempOutputFile);
            $newFileSize = $this->storageService->getSize($storedPath);

            $this->updateProgress($job, 100, 'Job completed successfully');

            // Cleanup temp files
            if (file_exists($tempInputFile)) unlink($tempInputFile);
            if (file_exists($tempOutputFile)) unlink($tempOutputFile);

            return [
                'download_url' => $this->storageService->getUrl($storedPath),
                'file_path' => $storedPath,
                'original_size' => $originalSize,
                'new_size' => $newFileSize,
                'target_size' => $targetSizeBytes,
                'compression_ratio' => round($compressionRatio, 3),
                'size_reduction_percent' => round((1 - $compressionRatio) * 100, 2),
                'compression_method' => $method,
                'quality_setting' => $payload['quality'] ?? null,
                'compress_level' => $payload['compress_level'] ?? null
            ];

        } catch (\Exception $e) {
            // Cleanup temp files on error
            if (isset($tempInputFile) && file_exists($tempInputFile)) unlink($tempInputFile);
            if (isset($tempOutputFile) && file_exists($tempOutputFile)) unlink($tempOutputFile);

            throw $e;
        }
    }

    private function updateProgress(Job $job, int $progress, string $message): void
    {
        $this->logger->info("Job {$job->getId()}: {$message} ({$progress}%)");
    }

    private function getCompressionMethod(string $mimeType): string
    {
        return match($mimeType) {
            'application/pdf' => 'ghostscript_compression',
            'image/jpeg', 'image/jpg' => 'jpeg_quality_reduction',
            'image/png' => 'png_optimization',
            'image/webp' => 'webp_quality_reduction',
            'image/tiff' => 'tiff_compression',
            default => 'generic_compression'
        };
    }
}