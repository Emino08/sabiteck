<?php

declare(strict_types=1);

namespace EmergencyResponse\Tests\Unit;

use PHPUnit\Framework\TestCase;
use EmergencyResponse\Services\EncryptionService;

class EncryptionServiceTest extends TestCase
{
    private EncryptionService $encryptionService;

    protected function setUp(): void
    {
        $this->encryptionService = new EncryptionService('test-encryption-key-32-characters');
    }

    public function testEncryptAndDecrypt(): void
    {
        $originalData = 'This is sensitive emergency data that needs encryption.';

        // Encrypt the data
        $encryptionResult = $this->encryptionService->encrypt($originalData);

        $this->assertIsArray($encryptionResult);
        $this->assertArrayHasKey('encrypted_data', $encryptionResult);
        $this->assertArrayHasKey('encrypted_key', $encryptionResult);
        $this->assertArrayHasKey('algorithm', $encryptionResult);
        $this->assertArrayHasKey('created_at', $encryptionResult);

        // Decrypt the data
        $decryptedData = $this->encryptionService->decrypt(
            $encryptionResult['encrypted_data'],
            $encryptionResult['encrypted_key']
        );

        $this->assertEquals($originalData, $decryptedData);
    }

    public function testGenerateSecureToken(): void
    {
        $token1 = $this->encryptionService->generateSecureToken(16);
        $token2 = $this->encryptionService->generateSecureToken(16);

        $this->assertIsString($token1);
        $this->assertIsString($token2);
        $this->assertEquals(32, strlen($token1)); // 16 bytes = 32 hex characters
        $this->assertNotEquals($token1, $token2); // Tokens should be unique
    }

    public function testHashAndVerifyPassword(): void
    {
        $password = 'secure-password-123';

        // Hash the password
        $hashResult = $this->encryptionService->hashPassword($password);

        $this->assertIsArray($hashResult);
        $this->assertArrayHasKey('hash', $hashResult);
        $this->assertArrayHasKey('salt', $hashResult);
        $this->assertArrayHasKey('algorithm', $hashResult);
        $this->assertArrayHasKey('iterations', $hashResult);

        // Verify the password
        $isValid = $this->encryptionService->verifyPassword(
            $password,
            $hashResult['hash'],
            $hashResult['salt']
        );

        $this->assertTrue($isValid);

        // Verify with wrong password
        $isInvalid = $this->encryptionService->verifyPassword(
            'wrong-password',
            $hashResult['hash'],
            $hashResult['salt']
        );

        $this->assertFalse($isInvalid);
    }

    public function testGenerateAndVerifyQRCode(): void
    {
        $responderId = 123;
        $caseId = 456;

        // Generate QR verification data
        $qrData = $this->encryptionService->generateQRVerificationData($responderId, $caseId);

        $this->assertIsArray($qrData);
        $this->assertArrayHasKey('data', $qrData);
        $this->assertArrayHasKey('signature', $qrData);
        $this->assertArrayHasKey('qr_string', $qrData);

        $this->assertEquals($responderId, $qrData['data']['responder_id']);
        $this->assertEquals($caseId, $qrData['data']['case_id']);

        // Verify QR code data
        $verifiedData = $this->encryptionService->verifyQRData($qrData['qr_string']);

        $this->assertIsArray($verifiedData);
        $this->assertEquals($responderId, $verifiedData['responder_id']);
        $this->assertEquals($caseId, $verifiedData['case_id']);
    }

    public function testVerifyQRDataReturnsNullForInvalidData(): void
    {
        $invalidQRString = base64_encode('invalid.qr.data');

        $result = $this->encryptionService->verifyQRData($invalidQRString);

        $this->assertNull($result);
    }

    public function testE2EEncryptionAndDecryption(): void
    {
        $message = 'This is a confidential emergency message.';

        // Generate key pairs for sender and recipient
        $senderKeys = $this->encryptionService->generateE2EKeys();
        $recipientKeys = $this->encryptionService->generateE2EKeys();

        $this->assertIsArray($senderKeys);
        $this->assertArrayHasKey('public_key', $senderKeys);
        $this->assertArrayHasKey('private_key', $senderKeys);
        $this->assertArrayHasKey('key_id', $senderKeys);

        // Encrypt message
        $encryptionResult = $this->encryptionService->encryptE2EMessage(
            $message,
            $recipientKeys['public_key'],
            $senderKeys['private_key']
        );

        $this->assertIsArray($encryptionResult);
        $this->assertArrayHasKey('encrypted_message', $encryptionResult);
        $this->assertArrayHasKey('nonce', $encryptionResult);
        $this->assertArrayHasKey('algorithm', $encryptionResult);

        // Decrypt message
        $decryptedMessage = $this->encryptionService->decryptE2EMessage(
            $encryptionResult['encrypted_message'],
            $encryptionResult['nonce'],
            $senderKeys['public_key'],
            $recipientKeys['private_key']
        );

        $this->assertEquals($message, $decryptedMessage);
    }

    public function testFileHashGeneration(): void
    {
        // Create a temporary test file
        $testFile = tempnam(sys_get_temp_dir(), 'emergency_test_');
        $testContent = 'Emergency response test file content for hash verification.';
        file_put_contents($testFile, $testContent);

        try {
            // Generate hash
            $hash1 = $this->encryptionService->generateFileHash($testFile);
            $hash2 = $this->encryptionService->generateFileHash($testFile);

            $this->assertIsString($hash1);
            $this->assertEquals(64, strlen($hash1)); // SHA-256 produces 64-character hex string
            $this->assertEquals($hash1, $hash2); // Same file should produce same hash

            // Verify integrity
            $isValid = $this->encryptionService->verifyFileIntegrity($testFile, $hash1);
            $this->assertTrue($isValid);

            // Modify file and verify integrity fails
            file_put_contents($testFile, $testContent . ' modified');
            $isInvalid = $this->encryptionService->verifyFileIntegrity($testFile, $hash1);
            $this->assertFalse($isInvalid);

        } finally {
            // Clean up
            if (file_exists($testFile)) {
                unlink($testFile);
            }
        }
    }

    public function testEncryptionFailsForInvalidInput(): void
    {
        $this->expectException(\Exception::class);

        // Try to decrypt with invalid data
        $this->encryptionService->decrypt('invalid-base64-data', 'invalid-key-data');
    }
}