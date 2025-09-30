<?php

declare(strict_types=1);

namespace App\Services;

use Psr\Http\Message\UploadedFileInterface;

class FileStorageService
{
    private EncryptionService $encryption;
    private string $storageDriver;
    private string $storageRoot;

    private array $allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    private int $maxFileSize;

    public function __construct(
        EncryptionService $encryption,
        string $storageDriver = 'local',
        string $storageRoot = '/tmp'
    ) {
        $this->encryption = $encryption;
        $this->storageDriver = $storageDriver;
        $this->storageRoot = $storageRoot;
        $this->maxFileSize = (int)($_ENV['MAX_UPLOAD_SIZE'] ?? 52428800); // 50MB default
    }

    public function storeReportMedia(UploadedFileInterface $file, int $reportId): array
    {
        // Validate file
        $this->validateFile($file);

        // Generate unique filename
        $originalFilename = $file->getClientFilename();
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $storedFilename = $this->generateUniqueFilename($extension);

        // Create directory structure
        $reportDir = "reports/{$reportId}";
        $fullPath = $this->storageRoot . '/' . $reportDir;

        if (!is_dir($fullPath)) {
            mkdir($fullPath, 0755, true);
        }

        // Store original file temporarily
        $tempPath = $fullPath . '/' . $storedFilename . '.tmp';
        $file->moveTo($tempPath);

        // Generate file hash before encryption
        $fileHash = $this->encryption->generateFileHash($tempPath);

        // Encrypt file
        $encryptedPath = $fullPath . '/' . $storedFilename;
        $encryptionData = $this->encryption->encryptFile($tempPath, $encryptedPath);

        // Remove temporary file
        unlink($tempPath);

        // Determine file type
        $fileType = $this->getFileType($file->getClientMediaType());

        // Get file metadata
        $metadata = $this->getFileMetadata($file, $fileType);

        return [
            'file_type' => $fileType,
            'original_filename' => $originalFilename,
            'stored_filename' => $storedFilename,
            'file_path' => $reportDir . '/' . $storedFilename,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getClientMediaType(),
            'file_hash_sha256' => $fileHash,
            'is_encrypted' => true,
            'is_watermarked' => false, // TODO: Implement watermarking
            'duration_seconds' => $metadata['duration'] ?? null,
            'width' => $metadata['width'] ?? null,
            'height' => $metadata['height'] ?? null
        ];
    }

    public function getReportMedia(int $reportId, string $filename): array
    {
        $filePath = $this->storageRoot . "/reports/{$reportId}/{$filename}";

        if (!file_exists($filePath)) {
            throw new \RuntimeException('File not found');
        }

        // Decrypt file to temporary location
        $tempPath = sys_get_temp_dir() . '/' . uniqid('media_') . '.tmp';
        $this->encryption->decryptFile($filePath, $tempPath);

        return [
            'path' => $tempPath,
            'cleanup' => function () use ($tempPath) {
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
            }
        ];
    }

    public function deleteReportMedia(int $reportId, string $filename): bool
    {
        $filePath = $this->storageRoot . "/reports/{$reportId}/{$filename}";

        if (file_exists($filePath)) {
            return unlink($filePath);
        }

        return false;
    }

    public function generateSecureUrl(string $filePath, int $expiresInSeconds = 3600): string
    {
        // Generate a temporary, signed URL for secure file access
        $expires = time() + $expiresInSeconds;
        $token = hash_hmac('sha256', $filePath . $expires, $_ENV['JWT_SECRET']);

        return "/api/media/secure/{$token}/{$expires}/" . base64_encode($filePath);
    }

    public function validateSecureUrl(string $token, int $expires, string $encodedPath): bool
    {
        if ($expires < time()) {
            return false;
        }

        $filePath = base64_decode($encodedPath);
        $expectedToken = hash_hmac('sha256', $filePath . $expires, $_ENV['JWT_SECRET']);

        return hash_equals($expectedToken, $token);
    }

    private function validateFile(UploadedFileInterface $file): void
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('File upload failed with error code: ' . $file->getError());
        }

        if ($file->getSize() > $this->maxFileSize) {
            throw new \InvalidArgumentException('File size exceeds maximum allowed size');
        }

        $mimeType = $file->getClientMediaType();
        if (!in_array($mimeType, $this->allowedMimeTypes)) {
            throw new \InvalidArgumentException('File type not allowed');
        }

        // Additional security checks
        $this->performSecurityChecks($file);
    }

    private function performSecurityChecks(UploadedFileInterface $file): void
    {
        // Check file signature/magic bytes
        $fileContent = $file->getStream()->getContents();
        $file->getStream()->rewind();

        $mimeType = $file->getClientMediaType();

        // Basic magic byte validation
        $signatures = [
            'image/jpeg' => [0xFF, 0xD8, 0xFF],
            'image/png' => [0x89, 0x50, 0x4E, 0x47],
            'application/pdf' => [0x25, 0x50, 0x44, 0x46],
        ];

        if (isset($signatures[$mimeType])) {
            $signature = $signatures[$mimeType];
            $fileSignature = array_values(unpack('C*', substr($fileContent, 0, count($signature))));

            if ($fileSignature !== $signature) {
                throw new \InvalidArgumentException('File signature does not match declared type');
            }
        }

        // Scan for potential malware patterns (basic check)
        if (strpos($fileContent, '<?php') !== false ||
            strpos($fileContent, '<script') !== false ||
            strpos($fileContent, 'eval(') !== false) {
            throw new \InvalidArgumentException('File contains potentially malicious content');
        }
    }

    private function generateUniqueFilename(string $extension): string
    {
        return uniqid('media_', true) . '.' . $extension;
    }

    private function getFileType(string $mimeType): string
    {
        if (strpos($mimeType, 'image/') === 0) {
            return 'image';
        }

        if (strpos($mimeType, 'video/') === 0) {
            return 'video';
        }

        if (strpos($mimeType, 'audio/') === 0) {
            return 'audio';
        }

        return 'document';
    }

    private function getFileMetadata(UploadedFileInterface $file, string $fileType): array
    {
        $metadata = [];

        // For images, try to get dimensions
        if ($fileType === 'image') {
            $tempPath = sys_get_temp_dir() . '/' . uniqid('meta_');
            $file->getStream()->rewind();
            file_put_contents($tempPath, $file->getStream()->getContents());
            $file->getStream()->rewind();

            $imageInfo = getimagesize($tempPath);
            if ($imageInfo) {
                $metadata['width'] = $imageInfo[0];
                $metadata['height'] = $imageInfo[1];
            }

            unlink($tempPath);
        }

        // For videos and audio, duration would require additional libraries
        // This is a placeholder for future implementation
        if (in_array($fileType, ['video', 'audio'])) {
            // TODO: Implement duration extraction using FFmpeg or similar
            $metadata['duration'] = null;
        }

        return $metadata;
    }
}