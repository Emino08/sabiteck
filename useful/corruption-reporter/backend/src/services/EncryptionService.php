<?php

declare(strict_types=1);

namespace App\Services;

class EncryptionService
{
    private string $encryptionKey;

    public function __construct(string $encryptionKey)
    {
        // Remove base64: prefix if present
        if (strpos($encryptionKey, 'base64:') === 0) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        $this->encryptionKey = $encryptionKey;
    }

    public function encrypt(string $data): array
    {
        $method = 'AES-256-CBC';
        $iv = random_bytes(16);

        $encrypted = openssl_encrypt($data, $method, $this->encryptionKey, 0, $iv);

        if ($encrypted === false) {
            throw new \RuntimeException('Encryption failed');
        }

        return [
            'data' => base64_encode($encrypted),
            'iv' => base64_encode($iv),
            'method' => $method
        ];
    }

    public function decrypt(array $encryptedData): string
    {
        $data = base64_decode($encryptedData['data']);
        $iv = base64_decode($encryptedData['iv']);
        $method = $encryptedData['method'] ?? 'AES-256-CBC';

        $decrypted = openssl_decrypt($data, $method, $this->encryptionKey, 0, $iv);

        if ($decrypted === false) {
            throw new \RuntimeException('Decryption failed');
        }

        return $decrypted;
    }

    public function generateFileHash(string $filePath): string
    {
        return hash_file('sha256', $filePath);
    }

    public function generateDataHash(string $data): string
    {
        return hash('sha256', $data);
    }

    public function encryptFile(string $inputPath, string $outputPath): array
    {
        $data = file_get_contents($inputPath);

        if ($data === false) {
            throw new \RuntimeException('Failed to read input file');
        }

        $encrypted = $this->encrypt($data);

        // Store encrypted data as JSON
        $encryptedJson = json_encode($encrypted);

        if (file_put_contents($outputPath, $encryptedJson) === false) {
            throw new \RuntimeException('Failed to write encrypted file');
        }

        return $encrypted;
    }

    public function decryptFile(string $inputPath, string $outputPath): void
    {
        $encryptedJson = file_get_contents($inputPath);

        if ($encryptedJson === false) {
            throw new \RuntimeException('Failed to read encrypted file');
        }

        $encryptedData = json_decode($encryptedJson, true);

        if (!$encryptedData) {
            throw new \RuntimeException('Invalid encrypted file format');
        }

        $decrypted = $this->decrypt($encryptedData);

        if (file_put_contents($outputPath, $decrypted) === false) {
            throw new \RuntimeException('Failed to write decrypted file');
        }
    }
}