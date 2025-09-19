<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Job;
use App\Services\ConversionService;
use App\Services\StorageService;
use Psr\Log\LoggerInterface;

class PdfToImagesJob
{
    public function __construct(
        private ConversionService $conversionService,
        private StorageService $storageService,
        private LoggerInterface $logger
    ) {}

    public function handle(Job $job): array
    {
        $payload = $job->getPayload();
        $this->logger->info("Processing PDF to Images job: {$job->getId()}");

        try {
            // Create temporary files and directories
            $tempInputFile = $this->storageService->createTempFile('pdf_input_', '.pdf');
            $tempOutputDir = sys_get_temp_dir() . '/pdf_images_' . $job->getId();
            mkdir($tempOutputDir, 0755, true);

            $this->updateProgress($job, 25, 'Preparing PDF for image conversion...');

            // Perform the conversion
            $imageFiles = $this->conversionService->convertPdfToImages($tempInputFile, $tempOutputDir, [
                'dpi' => $payload['dpi'],
                'format' => $payload['format'],
                'pages' => $payload['pages'] ?? null,
                'combine' => $payload['combine'] ?? false
            ]);

            if (empty($imageFiles)) {
                throw new \RuntimeException('PDF to images conversion failed - no images generated');
            }

            $this->updateProgress($job, 75, 'Images generated, packaging results...');

            $result = [];

            if ($payload['combine'] || count($imageFiles) === 1) {
                // Store single image or combined image
                $imagePath = $imageFiles[0];
                $storedPath = $this->storageService->storeFromPath($imagePath);

                $result = [
                    'download_url' => $this->storageService->getUrl($storedPath),
                    'file_path' => $storedPath,
                    'file_size' => $this->storageService->getSize($storedPath),
                    'image_count' => 1,
                    'format' => $payload['format'],
                    'dpi' => $payload['dpi']
                ];
            } else {
                // Create ZIP archive for multiple images
                $zipFile = $tempOutputDir . '/images.zip';
                $zip = new \ZipArchive();

                if ($zip->open($zipFile, \ZipArchive::CREATE) !== true) {
                    throw new \RuntimeException('Cannot create ZIP archive');
                }

                foreach ($imageFiles as $index => $imagePath) {
                    $zip->addFile($imagePath, 'page_' . ($index + 1) . '.' . $payload['format']);
                }
                $zip->close();

                $storedPath = $this->storageService->storeFromPath($zipFile);

                $result = [
                    'download_url' => $this->storageService->getUrl($storedPath),
                    'file_path' => $storedPath,
                    'file_size' => $this->storageService->getSize($storedPath),
                    'image_count' => count($imageFiles),
                    'format' => 'zip',
                    'images_format' => $payload['format'],
                    'dpi' => $payload['dpi']
                ];
            }

            $this->updateProgress($job, 100, 'Job completed successfully');

            // Cleanup
            $this->cleanupTempFiles($tempInputFile, $tempOutputDir, $imageFiles);

            return $result;

        } catch (\Exception $e) {
            // Cleanup on error
            if (isset($tempInputFile) && file_exists($tempInputFile)) unlink($tempInputFile);
            if (isset($tempOutputDir) && is_dir($tempOutputDir)) $this->removeDirectory($tempOutputDir);

            throw $e;
        }
    }

    private function updateProgress(Job $job, int $progress, string $message): void
    {
        $this->logger->info("Job {$job->getId()}: {$message} ({$progress}%)");
    }

    private function cleanupTempFiles(string $tempInputFile, string $tempOutputDir, array $imageFiles): void
    {
        if (file_exists($tempInputFile)) unlink($tempInputFile);

        foreach ($imageFiles as $imagePath) {
            if (file_exists($imagePath)) unlink($imagePath);
        }

        if (is_dir($tempOutputDir)) {
            $this->removeDirectory($tempOutputDir);
        }
    }

    private function removeDirectory(string $dir): void
    {
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}