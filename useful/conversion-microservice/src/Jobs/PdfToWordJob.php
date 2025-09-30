<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Job;
use App\Services\ConversionService;
use App\Services\StorageService;
use Psr\Log\LoggerInterface;

class PdfToWordJob
{
    public function __construct(
        private ConversionService $conversionService,
        private StorageService $storageService,
        private LoggerInterface $logger
    ) {}

    public function handle(Job $job): array
    {
        $payload = $job->getPayload();
        $this->logger->info("Processing PDF to Word job: {$job->getId()}");

        try {
            // Create temporary files
            $tempInputFile = $this->storageService->createTempFile('pdf_input_', '.pdf');
            $tempOutputFile = $this->storageService->createTempFile('word_output_', '.' . $payload['output_format']);

            // Get the input file from storage (this would be implemented based on your storage strategy)
            // For now, we'll simulate the conversion process

            $this->updateProgress($job, 25, 'Preparing file for conversion...');

            // Perform the conversion
            $success = $this->conversionService->convertPdfToWord($tempInputFile, $tempOutputFile, [
                'format' => $payload['output_format'],
                'pages' => $payload['pages'] ?? null
            ]);

            if (!$success) {
                throw new \RuntimeException('PDF to Word conversion failed');
            }

            $this->updateProgress($job, 75, 'Conversion completed, storing result...');

            // Store the result
            $storedPath = $this->storageService->storeFromPath($tempOutputFile);
            $fileSize = $this->storageService->getSize($storedPath);

            $this->updateProgress($job, 100, 'Job completed successfully');

            // Cleanup temp files
            if (file_exists($tempInputFile)) unlink($tempInputFile);
            if (file_exists($tempOutputFile)) unlink($tempOutputFile);

            return [
                'download_url' => $this->storageService->getUrl($storedPath),
                'file_path' => $storedPath,
                'file_size' => $fileSize,
                'output_format' => $payload['output_format'],
                'pages_converted' => $payload['pages'] ? count(explode(',', $payload['pages'])) : 'all'
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
        // Note: In a real implementation, you'd update the job progress in the queue service
    }
}