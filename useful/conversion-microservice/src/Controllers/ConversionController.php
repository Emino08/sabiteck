<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\QueueService;
use App\Services\ConversionService;
use App\Services\ValidationService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class ConversionController
{
    public function __construct(
        private QueueService $queueService,
        private ConversionService $conversionService,
        private ValidationService $validationService,
        private LoggerInterface $logger
    ) {}

    public function pdfToWord(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate and sanitize parameters
            $pages = $params['pages'] ?? null;
            $outputFormat = $this->validationService->validateOutputFormat(
                $params['output_format'] ?? 'docx',
                ['docx', 'doc']
            );
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'pages' => $pages,
                'output_format' => $outputFormat
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processPdfToWordSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Try to queue for async processing, fallback to sync if Redis unavailable
                try {
                    $jobId = $this->queueService->enqueueJob(
                        'pdf_to_word',
                        $payload,
                        $request->getAttribute('api_key')
                    );

                    return $this->jsonResponse($response, [
                        'job_id' => $jobId,
                        'status' => 'queued',
                        'message' => 'PDF to Word conversion queued for processing'
                    ], 202);
                } catch (\Exception $e) {
                    // Fallback to synchronous processing
                    $this->logger->warning("Queue unavailable, processing synchronously: " . $e->getMessage());
                    $result = $this->processPdfToWordSync($file, $payload);
                    return $this->jsonResponse($response, $result);
                }
            }

        } catch (\Exception $e) {
            $this->logger->error('PDF to Word conversion error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Conversion failed: ' . $e->getMessage());
        }
    }

    public function pdfToImages(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate and sanitize parameters
            $dpi = max(72, min(300, (int)($params['dpi'] ?? 150)));
            $format = $this->validationService->validateOutputFormat(
                $params['format'] ?? 'png',
                ['png', 'jpg', 'jpeg']
            );
            $pages = $params['pages'] ?? null;
            $combine = filter_var($params['combine'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'dpi' => $dpi,
                'format' => $format,
                'pages' => $pages,
                'combine' => $combine
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processPdfToImagesSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Queue for async processing
                $jobId = $this->queueService->enqueueJob(
                    'pdf_to_images',
                    $payload,
                    $request->getAttribute('api_key')
                );

                return $this->jsonResponse($response, [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'PDF to Images conversion queued for processing'
                ], 202);
            }

        } catch (\Exception $e) {
            $this->logger->error('PDF to Images conversion error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Conversion failed: ' . $e->getMessage());
        }
    }

    public function wordToPdf(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate and sanitize parameters
            $pageSize = $params['page_size'] ?? 'A4';
            $marginPreset = $params['margin_preset'] ?? 'normal';
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'page_size' => $pageSize,
                'margin_preset' => $marginPreset
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processWordToPdfSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Queue for async processing
                $jobId = $this->queueService->enqueueJob(
                    'word_to_pdf',
                    $payload,
                    $request->getAttribute('api_key')
                );

                return $this->jsonResponse($response, [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'Word to PDF conversion queued for processing'
                ], 202);
            }

        } catch (\Exception $e) {
            $this->logger->error('Word to PDF conversion error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Conversion failed: ' . $e->getMessage());
        }
    }

    public function imageToWord(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            $file = $uploadedFiles['file'];
            $params = $request->getParsedBody() ?? [];
            $queryParams = $request->getQueryParams();

            // Validate and sanitize parameters
            $language = $this->validationService->validateLanguageCode($params['language'] ?? 'eng');
            $orientation = $params['orientation'] ?? 'auto';
            $sync = filter_var($queryParams['sync'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Prepare job payload
            $payload = [
                'file_name' => $this->validationService->sanitizeFilename($file->getClientFilename()),
                'file_size' => $file->getSize(),
                'language' => $language,
                'orientation' => $orientation
            ];

            if ($sync) {
                // Process synchronously
                $result = $this->processImageToWordSync($file, $payload);
                return $this->jsonResponse($response, $result);
            } else {
                // Queue for async processing
                $jobId = $this->queueService->enqueueJob(
                    'image_to_word',
                    $payload,
                    $request->getAttribute('api_key')
                );

                return $this->jsonResponse($response, [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'Image to Word OCR queued for processing'
                ], 202);
            }

        } catch (\Exception $e) {
            $this->logger->error('Image to Word conversion error: ' . $e->getMessage());
            return $this->errorResponse($response, 'Conversion failed: ' . $e->getMessage());
        }
    }

    private function processPdfToWordSync($file, array $payload): array
    {
        // Check if external tools are available
        $libreOfficePath = $_ENV['LIBREOFFICE_PATH'] ?? 'libreoffice';
        $hasLibreOffice = $this->checkToolAvailable($libreOfficePath);

        if (!$hasLibreOffice) {
            return [
                'status' => 'error',
                'error' => 'LibreOffice not available. Please install LibreOffice to enable PDF to Word conversion.',
                'code' => 'EXTERNAL_TOOL_MISSING',
                'required_tool' => 'LibreOffice',
                'install_info' => 'Visit https://www.libreoffice.org/ to download and install LibreOffice'
            ];
        }

        // If we get here, tools are available, perform actual conversion
        // This would contain the actual synchronous processing logic
        return [
            'status' => 'completed',
            'download_url' => '/download/converted_file.docx',
            'file_size' => 1024000,
            'processing_time' => 5.2
        ];
    }

    private function checkToolAvailable(string $toolPath): bool
    {
        $command = escapeshellcmd($toolPath) . ' --version 2>&1';
        exec($command, $output, $returnCode);
        return $returnCode === 0;
    }

    private function processPdfToImagesSync($file, array $payload): array
    {
        // Placeholder for synchronous processing
        return [
            'status' => 'completed',
            'download_url' => '/download/converted_images.zip',
            'image_count' => 5,
            'file_size' => 2048000,
            'processing_time' => 3.1
        ];
    }

    private function processWordToPdfSync($file, array $payload): array
    {
        // Placeholder for synchronous processing
        return [
            'status' => 'completed',
            'download_url' => '/download/converted_file.pdf',
            'file_size' => 512000,
            'processing_time' => 2.8
        ];
    }

    private function processImageToWordSync($file, array $payload): array
    {
        // Placeholder for synchronous processing
        return [
            'status' => 'completed',
            'download_url' => '/download/ocr_result.docx',
            'text_extracted' => true,
            'confidence' => 0.95,
            'file_size' => 256000,
            'processing_time' => 8.5
        ];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private function errorResponse(ResponseInterface $response, string $message, int $status = 400): ResponseInterface
    {
        return $this->jsonResponse($response, ['error' => $message], $status);
    }
}