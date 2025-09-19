<?php

declare(strict_types=1);

namespace App\Services;

use League\Flysystem\FilesystemOperator;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\UploadedFileInterface;

class StorageService
{
    public function __construct(
        private FilesystemOperator $filesystem,
        private LoggerInterface $logger
    ) {}

    public function store(UploadedFileInterface $file, string $path = null): string
    {
        if (!$path) {
            $path = $this->generatePath($file->getClientFilename());
        }

        $stream = $file->getStream();
        $this->filesystem->writeStream($path, $stream->detach());

        $this->logger->info("File stored: {$path}");
        return $path;
    }

    public function storeFromPath(string $sourcePath, string $destinationPath = null): string
    {
        if (!$destinationPath) {
            $destinationPath = $this->generatePath(basename($sourcePath));
        }

        $stream = fopen($sourcePath, 'r');
        if (!$stream) {
            throw new \RuntimeException("Cannot open source file: {$sourcePath}");
        }

        $this->filesystem->writeStream($destinationPath, $stream);
        fclose($stream);

        $this->logger->info("File stored from path: {$destinationPath}");
        return $destinationPath;
    }

    public function get(string $path): string
    {
        return $this->filesystem->read($path);
    }

    public function getStream(string $path)
    {
        return $this->filesystem->readStream($path);
    }

    public function exists(string $path): bool
    {
        return $this->filesystem->fileExists($path);
    }

    public function delete(string $path): bool
    {
        if (!$this->exists($path)) {
            return false;
        }

        $this->filesystem->delete($path);
        $this->logger->info("File deleted: {$path}");
        return true;
    }

    public function getUrl(string $path): string
    {
        // For local storage, return a download URL
        // In production with S3, this would return a pre-signed URL
        return "/download/{$path}";
    }

    public function getSize(string $path): int
    {
        return $this->filesystem->fileSize($path);
    }

    public function getMimeType(string $path): string
    {
        return $this->filesystem->mimeType($path);
    }

    public function createTempFile(string $prefix = 'temp_', string $suffix = ''): string
    {
        $tempDir = $_ENV['TEMP_DIR'] ?? sys_get_temp_dir();
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        return tempnam($tempDir, $prefix) . $suffix;
    }

    public function cleanupTempFiles(): int
    {
        $tempDir = $_ENV['TEMP_DIR'] ?? sys_get_temp_dir();
        $retentionHours = (int)($_ENV['JOB_RETENTION_HOURS'] ?? 24);
        $cutoffTime = time() - ($retentionHours * 3600);

        $count = 0;
        $files = glob($tempDir . '/temp_*');

        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $count++;
            }
        }

        if ($count > 0) {
            $this->logger->info("Cleaned up {$count} temp files");
        }

        return $count;
    }

    private function generatePath(string $filename = null): string
    {
        $date = date('Y/m/d');
        $uuid = bin2hex(random_bytes(16));

        if ($filename) {
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            return "{$date}/{$uuid}.{$extension}";
        }

        return "{$date}/{$uuid}";
    }
}