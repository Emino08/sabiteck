<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class ValidationMiddleware implements MiddlewareInterface
{
    private const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/tiff',
        'image/bmp'
    ];

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['file'])) {
            return $this->errorResponse('File is required', 'FILE_REQUIRED');
        }

        $file = $uploadedFiles['file'];

        // Check for upload errors
        if ($file->getError() !== UPLOAD_ERR_OK) {
            return $this->errorResponse('File upload error: ' . $this->getUploadErrorMessage($file->getError()), 'UPLOAD_ERROR');
        }

        // Check file size
        $maxSize = (int)($_ENV['MAX_FILE_SIZE'] ?? self::MAX_FILE_SIZE);
        if ($file->getSize() > $maxSize) {
            return $this->errorResponse('File too large. Maximum size: ' . $this->formatBytes($maxSize), 'FILE_TOO_LARGE');
        }

        // Check MIME type
        $mimeType = $file->getClientMediaType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
            return $this->errorResponse('Invalid file type. Allowed: ' . implode(', ', self::ALLOWED_MIME_TYPES), 'INVALID_FILE_TYPE');
        }

        // Validate file extension matches MIME type
        $filename = $file->getClientFilename();
        if (!$this->validateFileExtension($filename, $mimeType)) {
            return $this->errorResponse('File extension does not match content type', 'EXTENSION_MISMATCH');
        }

        // Scan for malware if enabled and in production
        if (($_ENV['CLAMAV_PATH'] ?? null) && $_ENV['APP_ENV'] === 'production') {
            $tempFile = tempnam(sys_get_temp_dir(), 'upload_scan_');
            $file->moveTo($tempFile);

            if (!$this->scanForMalware($tempFile)) {
                unlink($tempFile);
                return $this->errorResponse('File failed security scan', 'SECURITY_SCAN_FAILED');
            }

            // Move back to uploaded file for processing
            $stream = fopen($tempFile, 'r');
            $file = $file->withStream(\Slim\Psr7\Factory\StreamFactory::createFromResource($stream));
            unlink($tempFile);
        }

        return $handler->handle($request);
    }

    private function validateFileExtension(string $filename, string $mimeType): bool
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $validExtensions = [
            'application/pdf' => ['pdf'],
            'application/msword' => ['doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png' => ['png'],
            'image/gif' => ['gif'],
            'image/webp' => ['webp'],
            'image/tiff' => ['tiff', 'tif'],
            'image/bmp' => ['bmp']
        ];

        return in_array($extension, $validExtensions[$mimeType] ?? []);
    }

    private function scanForMalware(string $filePath): bool
    {
        $clamavPath = $_ENV['CLAMAV_PATH'];
        $command = escapeshellcmd($clamavPath) . ' ' . escapeshellarg($filePath);

        exec($command, $output, $returnCode);

        // ClamAV returns 0 for clean files, 1 for infected
        return $returnCode === 0;
    }

    private function getUploadErrorMessage(int $error): string
    {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'File too large';
            case UPLOAD_ERR_PARTIAL:
                return 'File partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'No temporary directory';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Cannot write file';
            case UPLOAD_ERR_EXTENSION:
                return 'File upload stopped by extension';
            default:
                return 'Unknown upload error';
        }
    }

    private function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;

        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }

        return round($size, 2) . ' ' . $units[$i];
    }

    private function errorResponse(string $message, string $code): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'error' => $message,
            'code' => $code
        ]));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
}