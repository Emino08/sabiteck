<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Job;
use App\Services\ConversionService;
use App\Services\StorageService;
use Psr\Log\LoggerInterface;

class ResizeImageJob
{
    public function __construct(
        private ConversionService $conversionService,
        private StorageService $storageService,
        private LoggerInterface $logger
    ) {}

    public function handle(Job $job): array
    {
        $payload = $job->getPayload();
        $this->logger->info("Processing Image Resize job: {$job->getId()}");

        try {
            // Create temporary files
            $extension = pathinfo($payload['file_name'], PATHINFO_EXTENSION);
            $tempInputFile = $this->storageService->createTempFile('image_input_', ".{$extension}");
            $tempOutputFile = $this->storageService->createTempFile('image_output_', ".{$extension}");

            $this->updateProgress($job, 20, 'Analyzing image dimensions...');

            // Get original dimensions
            $originalDimensions = $this->getImageDimensions($tempInputFile);

            $this->updateProgress($job, 40, 'Resizing image...');

            // Perform image resize
            $success = $this->conversionService->resizeImage($tempInputFile, $tempOutputFile, [
                'width' => $payload['width'],
                'height' => $payload['height'],
                'preserve_aspect' => $payload['preserve_aspect'],
                'fit' => $payload['fit'],
                'quality' => $payload['quality']
            ]);

            if (!$success) {
                throw new \RuntimeException('Image resize failed');
            }

            $this->updateProgress($job, 80, 'Storing resized image...');

            // Get new dimensions and file size
            $newDimensions = $this->getImageDimensions($tempOutputFile);
            $newFileSize = filesize($tempOutputFile);

            // Store the result
            $storedPath = $this->storageService->storeFromPath($tempOutputFile);

            $this->updateProgress($job, 100, 'Job completed successfully');

            // Cleanup temp files
            if (file_exists($tempInputFile)) unlink($tempInputFile);
            if (file_exists($tempOutputFile)) unlink($tempOutputFile);

            return [
                'download_url' => $this->storageService->getUrl($storedPath),
                'file_path' => $storedPath,
                'original_dimensions' => [
                    'width' => $originalDimensions[0],
                    'height' => $originalDimensions[1]
                ],
                'new_dimensions' => [
                    'width' => $newDimensions[0],
                    'height' => $newDimensions[1]
                ],
                'requested_dimensions' => [
                    'width' => $payload['width'],
                    'height' => $payload['height']
                ],
                'original_size' => $payload['file_size'],
                'new_size' => $newFileSize,
                'size_reduction_percent' => round((1 - ($newFileSize / $payload['file_size'])) * 100, 2),
                'preserve_aspect' => $payload['preserve_aspect'],
                'fit_method' => $payload['fit'],
                'quality' => $payload['quality'],
                'format' => $extension
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

    private function getImageDimensions(string $imagePath): array
    {
        try {
            $imageInfo = getimagesize($imagePath);
            return $imageInfo ? [$imageInfo[0], $imageInfo[1]] : [0, 0];
        } catch (\Exception $e) {
            $this->logger->warning("Could not get image dimensions: " . $e->getMessage());
            return [0, 0];
        }
    }
}