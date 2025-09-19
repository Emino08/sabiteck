<?php

declare(strict_types=1);

namespace EmergencyResponse\Services;

use Defuse\Crypto\Crypto;
use Defuse\Crypto\Key;
use Defuse\Crypto\Exception\CryptoException;

class EncryptionService
{
    private Key $encryptionKey;

    public function __construct(string $keyAscii)
    {
        try {
            $this->encryptionKey = Key::loadFromAsciiSafeString($keyAscii);
        } catch (CryptoException $e) {
            // If key loading fails, create a new one for development
            $this->encryptionKey = Key::createNewRandomKey();
        }
    }

    /**
     * Encrypt data using envelope encryption
     */
    public function encrypt(string $data): array
    {
        try {
            // Generate a random data encryption key (DEK)
            $dataKey = Key::createNewRandomKey();

            // Encrypt the data with the DEK
            $encryptedData = Crypto::encrypt($data, $dataKey);

            // Encrypt the DEK with the master key (envelope encryption)
            $encryptedKey = Crypto::encrypt($dataKey->saveToAsciiSafeString(), $this->encryptionKey);

            return [
                'encrypted_data' => base64_encode($encryptedData),
                'encrypted_key' => base64_encode($encryptedKey),
                'algorithm' => 'AES-256-GCM',
                'created_at' => time()
            ];
        } catch (CryptoException $e) {
            throw new \Exception('Encryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Decrypt data using envelope encryption
     */
    public function decrypt(string $encryptedData, string $encryptedKey): string
    {
        try {
            // Decode base64
            $encryptedData = base64_decode($encryptedData);
            $encryptedKey = base64_decode($encryptedKey);

            // Decrypt the DEK with the master key
            $dataKeyString = Crypto::decrypt($encryptedKey, $this->encryptionKey);
            $dataKey = Key::loadFromAsciiSafeString($dataKeyString);

            // Decrypt the data with the DEK
            return Crypto::decrypt($encryptedData, $dataKey);
        } catch (CryptoException $e) {
            throw new \Exception('Decryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Generate a secure hash for file integrity verification
     */
    public function generateFileHash(string $filePath): string
    {
        if (!file_exists($filePath)) {
            throw new \Exception('File not found: ' . $filePath);
        }

        return hash_file('sha256', $filePath);
    }

    /**
     * Verify file integrity using hash
     */
    public function verifyFileIntegrity(string $filePath, string $expectedHash): bool
    {
        $actualHash = $this->generateFileHash($filePath);
        return hash_equals($expectedHash, $actualHash);
    }

    /**
     * Encrypt file data for storage
     */
    public function encryptFile(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new \Exception('File not found: ' . $filePath);
        }

        $fileData = file_get_contents($filePath);
        if ($fileData === false) {
            throw new \Exception('Failed to read file: ' . $filePath);
        }

        // Generate hash before encryption for integrity verification
        $originalHash = hash('sha256', $fileData);

        // Encrypt the file data
        $encryptionResult = $this->encrypt($fileData);

        return array_merge($encryptionResult, [
            'original_hash' => $originalHash,
            'file_size' => filesize($filePath)
        ]);
    }

    /**
     * Decrypt file data and save to disk
     */
    public function decryptFile(string $encryptedData, string $encryptedKey, string $outputPath): bool
    {
        try {
            $decryptedData = $this->decrypt($encryptedData, $encryptedKey);

            $result = file_put_contents($outputPath, $decryptedData);
            return $result !== false;
        } catch (\Exception $e) {
            throw new \Exception('File decryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Generate a secure random token
     */
    public function generateSecureToken(int $length = 32): string
    {
        return bin2hex(random_bytes($length));
    }

    /**
     * Generate a key derivation function hash for passwords
     */
    public function hashPassword(string $password, ?string $salt = null): array
    {
        if ($salt === null) {
            $salt = random_bytes(16);
        } else {
            $salt = base64_decode($salt);
        }

        $hash = hash_pbkdf2('sha256', $password, $salt, 10000, 32, true);

        return [
            'hash' => base64_encode($hash),
            'salt' => base64_encode($salt),
            'algorithm' => 'PBKDF2-SHA256',
            'iterations' => 10000
        ];
    }

    /**
     * Verify password against hash
     */
    public function verifyPassword(string $password, string $hash, string $salt): bool
    {
        $passwordData = $this->hashPassword($password, $salt);
        return hash_equals($hash, $passwordData['hash']);
    }

    /**
     * Generate QR code data for responder verification
     */
    public function generateQRVerificationData(int $responderId, int $caseId): array
    {
        $timestamp = time();
        $nonce = random_bytes(16);

        $data = [
            'responder_id' => $responderId,
            'case_id' => $caseId,
            'timestamp' => $timestamp,
            'nonce' => base64_encode($nonce),
            'expires_at' => $timestamp + 300 // 5 minutes
        ];

        $dataString = json_encode($data);
        $signature = hash_hmac('sha256', $dataString, $this->encryptionKey->saveToAsciiSafeString());

        return [
            'data' => $data,
            'signature' => $signature,
            'qr_string' => base64_encode($dataString . '.' . $signature)
        ];
    }

    /**
     * Verify QR code data
     */
    public function verifyQRData(string $qrString): ?array
    {
        try {
            $decoded = base64_decode($qrString);
            $parts = explode('.', $decoded);

            if (count($parts) !== 2) {
                return null;
            }

            [$dataString, $signature] = $parts;
            $data = json_decode($dataString, true);

            if (!$data) {
                return null;
            }

            // Verify signature
            $expectedSignature = hash_hmac('sha256', $dataString, $this->encryptionKey->saveToAsciiSafeString());
            if (!hash_equals($signature, $expectedSignature)) {
                return null;
            }

            // Check expiration
            if (time() > $data['expires_at']) {
                return null;
            }

            return $data;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate end-to-end encryption keys for messaging
     */
    public function generateE2EKeys(): array
    {
        $privateKey = sodium_crypto_box_keypair();
        $publicKey = sodium_crypto_box_publickey($privateKey);
        $secretKey = sodium_crypto_box_secretkey($privateKey);

        return [
            'public_key' => base64_encode($publicKey),
            'private_key' => base64_encode($secretKey),
            'key_id' => $this->generateSecureToken(16)
        ];
    }

    /**
     * Encrypt message for end-to-end encryption
     */
    public function encryptE2EMessage(string $message, string $recipientPublicKey, string $senderPrivateKey): array
    {
        try {
            $publicKey = base64_decode($recipientPublicKey);
            $privateKey = base64_decode($senderPrivateKey);

            $nonce = random_bytes(SODIUM_CRYPTO_BOX_NONCEBYTES);
            $ciphertext = sodium_crypto_box($message, $nonce, sodium_crypto_box_keypair_from_secretkey_and_publickey($privateKey, $publicKey));

            return [
                'encrypted_message' => base64_encode($ciphertext),
                'nonce' => base64_encode($nonce),
                'algorithm' => 'NaCl-Box',
                'timestamp' => time()
            ];
        } catch (\Exception $e) {
            throw new \Exception('E2E encryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Decrypt message for end-to-end encryption
     */
    public function decryptE2EMessage(string $encryptedMessage, string $nonce, string $senderPublicKey, string $recipientPrivateKey): string
    {
        try {
            $ciphertext = base64_decode($encryptedMessage);
            $nonceBytes = base64_decode($nonce);
            $publicKey = base64_decode($senderPublicKey);
            $privateKey = base64_decode($recipientPrivateKey);

            $plaintext = sodium_crypto_box_open($ciphertext, $nonceBytes, sodium_crypto_box_keypair_from_secretkey_and_publickey($privateKey, $publicKey));

            if ($plaintext === false) {
                throw new \Exception('Failed to decrypt message');
            }

            return $plaintext;
        } catch (\Exception $e) {
            throw new \Exception('E2E decryption failed: ' . $e->getMessage());
        }
    }
}