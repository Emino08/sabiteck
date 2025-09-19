<?php

declare(strict_types=1);

namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Slim\Psr7\Response;

class SimpleImageController
{
    public function resizeImage(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            // First check if GD is available
            if (!function_exists('imagecreatetruecolor')) {
                return $this->jsonResponse($response, [
                    'error' => 'GD functions not available',
                    'debug' => [
                        'extension_loaded_gd' => extension_loaded('gd'),
                        'function_exists_imagecreatetruecolor' => function_exists('imagecreatetruecolor'),
                        'loaded_extensions' => array_slice(get_loaded_extensions(), 0, 10)
                    ]
                ], 500);
            }

            $uploadedFiles = $request->getUploadedFiles();

            if (empty($uploadedFiles['file'])) {
                return $this->jsonResponse($response, ['error' => 'File is required'], 400);
            }

            $file = $uploadedFiles['file'];

            if ($file->getError() !== UPLOAD_ERR_OK) {
                return $this->jsonResponse($response, ['error' => 'Upload error'], 400);
            }

            // Create a simple 100x100 test image instead of processing the uploaded file
            $image = imagecreatetruecolor(100, 100);
            $white = imagecolorallocate($image, 255, 255, 255);
            $red = imagecolorallocate($image, 255, 0, 0);

            imagefill($image, 0, 0, $white);
            imagefilledrectangle($image, 10, 10, 90, 90, $red);

            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'test_resize_');
            imagejpeg($image, $tempFile . '.jpg', 90);
            imagedestroy($image);

            $size = filesize($tempFile . '.jpg');
            unlink($tempFile . '.jpg');

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'GD is working! Created test image',
                'file_info' => [
                    'original_name' => $file->getClientFilename(),
                    'original_size' => $file->getSize(),
                    'test_image_size' => $size
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'error' => 'Processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}