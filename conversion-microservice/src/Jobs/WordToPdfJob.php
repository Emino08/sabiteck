<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Job;
use App\Services\ConversionService;
use App\Services\StorageService;
use Psr\Log\LoggerInterface;

class WordToPdfJob
{
    public function __construct(
        private ConversionService $conversionService,
        private StorageService $storageService,
        private LoggerInterface $logger
    ) {}

    public function handle(Job $job): array
    {
        $payload = $job->getPayload();
        $this->logger->info("Processing Word to PDF job: {$job->getId()}");

        try {
            // Create temporary files
            $tempInputFile = $this->storageService->createTempFile('word_input_', $this->getWordExtension($payload['file_name']));
            $tempOutputFile = $this->storageService->createTempFile('pdf_output_', '.pdf');

            $this->updateProgress($job, 25, 'Preparing Word document for conversion...');

            // Perform the conversion
            $success = $this->conversionService->convertWordToPdf($tempInputFile, $tempOutputFile, [
                'page_size' => $payload['page_size'] ?? 'A4',
                'margin_preset' => $payload['margin_preset'] ?? 'normal'
            ]);

            if (!$success) {
                throw new \RuntimeException('Word to PDF conversion failed');
            }

            $this->updateProgress($job, 75, 'PDF generated, storing result...');

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
                'page_size' => $payload['page_size'] ?? 'A4',
                'margin_preset' => $payload['margin_preset'] ?? 'normal',
                'original_format' => pathinfo($payload['file_name'], PATHINFO_EXTENSION)
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

    private function getWordExtension(string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($extension, ['doc', 'docx']) ? ".{$extension}" : '.docx';
    }
}