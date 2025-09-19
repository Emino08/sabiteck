<?php

declare(strict_types=1);

namespace App\Services;

use Psr\Log\LoggerInterface;

class ConversionService
{
    public function __construct(
        private StorageService $storage,
        private LoggerInterface $logger
    ) {}

    public function convertPdfToWord(string $inputPath, string $outputPath, array $options = []): bool
    {
        try {
            $libreOfficePath = $_ENV['LIBREOFFICE_PATH'] ?? 'libreoffice';
            $format = $options['format'] ?? 'docx';
            $pages = $options['pages'] ?? null;

            $tempDir = dirname($outputPath);
            $command = sprintf(
                '%s --headless --convert-to %s --outdir %s %s',
                escapeshellcmd($libreOfficePath),
                escapeshellarg($format),
                escapeshellarg($tempDir),
                escapeshellarg($inputPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("LibreOffice conversion failed: " . implode("\n", $output));
            }

            // LibreOffice creates a file with the same name but different extension
            $baseName = pathinfo($inputPath, PATHINFO_FILENAME);
            $libreOfficeOutput = $tempDir . '/' . $baseName . '.' . $format;

            if (file_exists($libreOfficeOutput)) {
                rename($libreOfficeOutput, $outputPath);
                return true;
            }

            throw new \RuntimeException("LibreOffice output file not found");

        } catch (\Exception $e) {
            $this->logger->error("PDF to Word conversion failed: " . $e->getMessage());
            return false;
        }
    }

    public function convertPdfToImages(string $inputPath, string $outputDir, array $options = []): array
    {
        try {
            $dpi = $options['dpi'] ?? 150;
            $format = $options['format'] ?? 'png';
            $pages = $options['pages'] ?? null;
            $combine = $options['combine'] ?? false;

            $popplerPath = $_ENV['POPPLER_PATH'] ?? 'pdftoppm';

            $outputPrefix = $outputDir . '/page';
            $command = sprintf(
                '%s -r %d -%s %s %s',
                escapeshellcmd($popplerPath),
                (int)$dpi,
                escapeshellarg($format),
                escapeshellarg($inputPath),
                escapeshellarg($outputPrefix)
            );

            if ($pages) {
                $pageList = is_array($pages) ? implode(',', $pages) : $pages;
                $command .= sprintf(' -f %s -l %s',
                    escapeshellarg(explode(',', $pageList)[0]),
                    escapeshellarg(end(explode(',', $pageList)))
                );
            }

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("PDF to images conversion failed: " . implode("\n", $output));
            }

            // Find generated files
            $generatedFiles = glob($outputPrefix . '*.' . $format);

            if (empty($generatedFiles)) {
                throw new \RuntimeException("No image files were generated");
            }

            if ($combine && count($generatedFiles) > 1) {
                return $this->combineImages($generatedFiles, $outputDir . '/combined.' . $format);
            }

            return $generatedFiles;

        } catch (\Exception $e) {
            $this->logger->error("PDF to images conversion failed: " . $e->getMessage());
            return [];
        }
    }

    public function convertWordToPdf(string $inputPath, string $outputPath, array $options = []): bool
    {
        try {
            $libreOfficePath = $_ENV['LIBREOFFICE_PATH'] ?? 'libreoffice';
            $tempDir = dirname($outputPath);

            $command = sprintf(
                '%s --headless --convert-to pdf --outdir %s %s',
                escapeshellcmd($libreOfficePath),
                escapeshellarg($tempDir),
                escapeshellarg($inputPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("LibreOffice conversion failed: " . implode("\n", $output));
            }

            // LibreOffice creates a PDF with the same base name
            $baseName = pathinfo($inputPath, PATHINFO_FILENAME);
            $libreOfficeOutput = $tempDir . '/' . $baseName . '.pdf';

            if (file_exists($libreOfficeOutput)) {
                rename($libreOfficeOutput, $outputPath);
                return true;
            }

            throw new \RuntimeException("LibreOffice output file not found");

        } catch (\Exception $e) {
            $this->logger->error("Word to PDF conversion failed: " . $e->getMessage());
            return false;
        }
    }

    public function convertImageToWord(string $inputPath, string $outputPath, array $options = []): bool
    {
        try {
            $language = $options['language'] ?? 'eng';
            $tempTextFile = $this->storage->createTempFile('ocr_', '.txt');

            // Run OCR with Tesseract
            $tesseractPath = $_ENV['TESSERACT_PATH'] ?? 'tesseract';
            $command = sprintf(
                '%s %s %s -l %s',
                escapeshellcmd($tesseractPath),
                escapeshellarg($inputPath),
                escapeshellarg(pathinfo($tempTextFile, PATHINFO_FILENAME)),
                escapeshellarg($language)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("Tesseract OCR failed: " . implode("\n", $output));
            }

            if (!file_exists($tempTextFile)) {
                throw new \RuntimeException("OCR output file not found");
            }

            // Create Word document with PHPWord
            $phpWord = new \PhpOffice\PhpWord\PhpWord();
            $section = $phpWord->addSection();

            // Add OCR text
            $ocrText = file_get_contents($tempTextFile);
            if (!empty(trim($ocrText))) {
                $section->addText($ocrText);
            }

            // Add original image
            $section->addPageBreak();
            $section->addImage($inputPath, [
                'width' => 400,
                'height' => 300,
                'positioning' => 'relative'
            ]);

            // Save the document
            $writer = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
            $writer->save($outputPath);

            // Cleanup
            unlink($tempTextFile);

            return true;

        } catch (\Exception $e) {
            $this->logger->error("Image to Word conversion failed: " . $e->getMessage());
            if (isset($tempTextFile) && file_exists($tempTextFile)) {
                unlink($tempTextFile);
            }
            return false;
        }
    }

    public function resizeFile(string $inputPath, string $outputPath, array $options = []): bool
    {
        $mimeType = mime_content_type($inputPath);

        if (str_starts_with($mimeType, 'image/')) {
            return $this->resizeImage($inputPath, $outputPath, $options);
        } elseif ($mimeType === 'application/pdf') {
            return $this->compressPdf($inputPath, $outputPath, $options);
        }

        // For other file types, just copy
        return copy($inputPath, $outputPath);
    }

    public function resizeImage(string $inputPath, string $outputPath, array $options = []): bool
    {
        try {
            $width = $options['width'] ?? null;
            $height = $options['height'] ?? null;
            $quality = $options['quality'] ?? 85;
            $preserveAspect = $options['preserve_aspect'] ?? true;
            $fit = $options['fit'] ?? 'contain';

            $imagickPath = $_ENV['IMAGEMAGICK_PATH'] ?? 'convert';

            $command = [$imagickPath, escapeshellarg($inputPath)];

            if ($width && $height) {
                $geometry = $width . 'x' . $height;
                if ($preserveAspect) {
                    $geometry .= ($fit === 'cover') ? '^' : '';
                } else {
                    $geometry .= '!';
                }
                $command[] = '-resize ' . escapeshellarg($geometry);
            }

            if ($fit === 'cover' && $width && $height) {
                $command[] = '-gravity center';
                $command[] = '-extent ' . escapeshellarg($width . 'x' . $height);
            }

            $command[] = '-quality ' . escapeshellarg((string)$quality);
            $command[] = escapeshellarg($outputPath);

            $fullCommand = implode(' ', $command);
            exec($fullCommand, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("ImageMagick resize failed: " . implode("\n", $output));
            }

            return file_exists($outputPath);

        } catch (\Exception $e) {
            $this->logger->error("Image resize failed: " . $e->getMessage());
            return false;
        }
    }

    private function compressPdf(string $inputPath, string $outputPath, array $options = []): bool
    {
        try {
            $compressLevel = $options['compress_level'] ?? 'medium';
            $gsPath = $_ENV['GHOSTSCRIPT_PATH'] ?? 'gs';

            $dPDFSETTINGS = match($compressLevel) {
                'low' => '/screen',
                'medium' => '/ebook',
                'high' => '/prepress',
                default => '/ebook'
            };

            $command = sprintf(
                '%s -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=%s -dNOPAUSE -dQUIET -dBATCH -sOutputFile=%s %s',
                escapeshellcmd($gsPath),
                escapeshellarg($dPDFSETTINGS),
                escapeshellarg($outputPath),
                escapeshellarg($inputPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("Ghostscript compression failed: " . implode("\n", $output));
            }

            return file_exists($outputPath);

        } catch (\Exception $e) {
            $this->logger->error("PDF compression failed: " . $e->getMessage());
            return false;
        }
    }

    private function combineImages(array $imagePaths, string $outputPath): array
    {
        try {
            $imagickPath = $_ENV['IMAGEMAGICK_PATH'] ?? 'convert';
            $command = sprintf(
                '%s %s -append %s',
                escapeshellcmd($imagickPath),
                implode(' ', array_map('escapeshellarg', $imagePaths)),
                escapeshellarg($outputPath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException("ImageMagick combine failed: " . implode("\n", $output));
            }

            // Clean up individual files
            foreach ($imagePaths as $imagePath) {
                unlink($imagePath);
            }

            return [$outputPath];

        } catch (\Exception $e) {
            $this->logger->error("Image combine failed: " . $e->getMessage());
            return $imagePaths; // Return original files if combine fails
        }
    }
}