<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\QueueService;
use App\Services\StorageService;
use App\Services\ConversionService;
use App\Jobs\PdfToWordJob;
use App\Jobs\PdfToImagesJob;
use App\Jobs\WordToPdfJob;
use App\Jobs\ImageToWordJob;
use App\Jobs\ResizeFileJob;
use App\Jobs\ResizeImageJob;
use Predis\Client as RedisClient;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use League\Flysystem\Filesystem;
use League\Flysystem\Local\LocalFilesystemAdapter;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set up logging
$logger = new Logger('worker');
$handler = new StreamHandler($_ENV['LOG_PATH'] ?? 'php://stdout', $_ENV['LOG_LEVEL'] ?? Logger::INFO);
$logger->pushHandler($handler);

// Set up services
$redis = new RedisClient([
    'scheme' => 'tcp',
    'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
    'port' => (int)($_ENV['REDIS_PORT'] ?? 6379),
    'password' => $_ENV['REDIS_PASSWORD'] ?? null,
    'database' => (int)($_ENV['REDIS_DATABASE'] ?? 0),
]);

$filesystem = new Filesystem(new LocalFilesystemAdapter($_ENV['STORAGE_ROOT'] ?? 'storage'));
$queueService = new QueueService($redis, $logger);
$storageService = new StorageService($filesystem, $logger);
$conversionService = new ConversionService($storageService, $logger);

// Job handlers
$jobHandlers = [
    'pdf_to_word' => new PdfToWordJob($conversionService, $storageService, $logger),
    'pdf_to_images' => new PdfToImagesJob($conversionService, $storageService, $logger),
    'word_to_pdf' => new WordToPdfJob($conversionService, $storageService, $logger),
    'image_to_word' => new ImageToWordJob($conversionService, $storageService, $logger),
    'resize_file' => new ResizeFileJob($conversionService, $storageService, $logger),
    'resize_image' => new ResizeImageJob($conversionService, $storageService, $logger),
];

$logger->info('Worker started');

// Handle graceful shutdown
$shutdown = false;
pcntl_signal(SIGTERM, function() use (&$shutdown, $logger) {
    $logger->info('Received SIGTERM, shutting down gracefully');
    $shutdown = true;
});

pcntl_signal(SIGINT, function() use (&$shutdown, $logger) {
    $logger->info('Received SIGINT, shutting down gracefully');
    $shutdown = true;
});

// Worker loop
while (!$shutdown) {
    pcntl_signal_dispatch();

    try {
        // Requeue any stale jobs
        $requeuedCount = $queueService->requeueStaleJobs();
        if ($requeuedCount > 0) {
            $logger->info("Requeued {$requeuedCount} stale jobs");
        }

        // Get next job
        $job = $queueService->getNextJob();
        if (!$job) {
            sleep(1);
            continue;
        }

        $logger->info("Processing job: {$job->getId()}", ['type' => $job->getType()]);

        // Find handler for job type
        if (!isset($jobHandlers[$job->getType()])) {
            $queueService->setJobError($job->getId(), "Unknown job type: {$job->getType()}");
            continue;
        }

        $handler = $jobHandlers[$job->getType()];

        try {
            // Process the job
            $result = $handler->handle($job);
            $queueService->updateJobStatus($job->getId(), 'success', 100);
            $queueService->setJobResult($job->getId(), $result);

            $logger->info("Job completed: {$job->getId()}");

        } catch (Exception $e) {
            $queueService->setJobError($job->getId(), $e->getMessage());
            $logger->error("Job failed: {$job->getId()}", ['error' => $e->getMessage()]);
        }

    } catch (Exception $e) {
        $logger->error('Worker error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        sleep(5); // Wait before retrying
    }
}

$logger->info('Worker stopped');