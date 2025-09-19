<?php

declare(strict_types=1);

namespace App\Services;

use Psr\Log\LoggerInterface;
use Psr\Http\Message\UploadedFileInterface;

class ValidationService
{
    public function __construct(
        private LoggerInterface $logger
    ) {}

    public function sanitizeFilename(string $filename): string
    {
        // Remove path traversal attempts
        $filename = basename($filename);

        // Remove or replace dangerous characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);

        // Prevent hidden files
        if (str_starts_with($filename, '.')) {
            $filename = '_' . substr($filename, 1);
        }

        // Limit length
        if (strlen($filename) > 255) {
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            $name = substr(pathinfo($filename, PATHINFO_FILENAME), 0, 255 - strlen($extension) - 1);
            $filename = $name . '.' . $extension;
        }

        return $filename;
    }

    public function validatePageRange(string $pageRange, int $totalPages): array
    {
        if (empty($pageRange)) {
            return range(1, $totalPages);
        }

        $pages = [];
        $ranges = explode(',', $pageRange);

        foreach ($ranges as $range) {
            $range = trim($range);

            if (strpos($range, '-') !== false) {
                [$start, $end] = explode('-', $range, 2);
                $start = max(1, min((int)$start, $totalPages));
                $end = max(1, min((int)$end, $totalPages));

                if ($start <= $end) {
                    $pages = array_merge($pages, range($start, $end));
                }
            } else {
                $page = max(1, min((int)$range, $totalPages));
                $pages[] = $page;
            }
        }

        return array_unique(array_filter($pages));
    }

    public function validateImageDimensions(int $width, int $height): array
    {
        $maxDimension = 10000; // 10k pixels max
        $minDimension = 1;

        $width = max($minDimension, min($width, $maxDimension));
        $height = max($minDimension, min($height, $maxDimension));

        return [$width, $height];
    }

    public function validateQuality(int $quality): int
    {
        return max(1, min(100, $quality));
    }

    public function validateTargetSize(int $targetSizeKb): int
    {
        $maxSize = 100 * 1024; // 100MB in KB
        $minSize = 1; // 1KB

        return max($minSize, min($targetSizeKb, $maxSize));
    }

    public function validateLanguageCode(string $language): string
    {
        $supportedLanguages = [
            'eng', 'fra', 'deu', 'spa', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
            'jpn', 'ara', 'hin', 'ben', 'pan', 'guj', 'ori', 'tam', 'tel', 'kan',
            'mal', 'asm', 'nep', 'sin', 'mya', 'khm', 'lao', 'tha', 'vie'
        ];

        return in_array($language, $supportedLanguages) ? $language : 'eng';
    }

    public function validateOutputFormat(string $format, array $allowedFormats): string
    {
        return in_array(strtolower($format), $allowedFormats) ? strtolower($format) : $allowedFormats[0];
    }

    public function validateCompressLevel(string $level): string
    {
        $validLevels = ['low', 'medium', 'high'];
        return in_array(strtolower($level), $validLevels) ? strtolower($level) : 'medium';
    }

    public function validateImageFit(string $fit): string
    {
        $validFits = ['contain', 'cover', 'fill'];
        return in_array(strtolower($fit), $validFits) ? strtolower($fit) : 'contain';
    }

    public function getPdfPageCount(string $filePath): int
    {
        try {
            // Use Ghostscript to count pages
            $gsPath = $_ENV['GHOSTSCRIPT_PATH'] ?? 'gs';
            $command = sprintf(
                '%s -q -dNODISPLAY -c "(%s) (r) file runpdfbegin pdfpagecount = quit"',
                escapeshellcmd($gsPath),
                escapeshellarg($filePath)
            );

            $output = shell_exec($command);
            return (int)trim($output) ?: 1;

        } catch (\Exception $e) {
            $this->logger->warning("Could not count PDF pages: " . $e->getMessage());
            return 1;
        }
    }

    public function getImageDimensions(string $filePath): array
    {
        try {
            $imageInfo = getimagesize($filePath);
            if ($imageInfo) {
                return [$imageInfo[0], $imageInfo[1]];
            }
        } catch (\Exception $e) {
            $this->logger->warning("Could not get image dimensions: " . $e->getMessage());
        }

        return [0, 0];
    }
}