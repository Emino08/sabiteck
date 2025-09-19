<?php

declare(strict_types=1);

namespace App\Utils;

use App\Database\Database;

class Cache
{
    private Database $database;
    private array $settings;

    public function __construct(Database $database, array $settings)
    {
        $this->database = $database;
        $this->settings = $settings;
    }

    public function get(string $key): mixed
    {
        try {
            $result = $this->database->queryOne(
                "SELECT data FROM verification_cache
                 WHERE cache_key = :key AND expires_at > NOW()",
                ['key' => $key]
            );

            if ($result) {
                return json_decode($result['data'], true);
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function set(string $key, mixed $data, int $ttl = null): bool
    {
        try {
            $ttl = $ttl ?? $this->settings['ttl'];
            $expiresAt = date('Y-m-d H:i:s', time() + $ttl);

            $this->database->execute(
                "INSERT INTO verification_cache (cache_key, data, expires_at)
                 VALUES (:key, :data, :expires_at)
                 ON DUPLICATE KEY UPDATE
                 data = VALUES(data),
                 expires_at = VALUES(expires_at)",
                [
                    'key' => $key,
                    'data' => json_encode($data),
                    'expires_at' => $expiresAt
                ]
            );

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function delete(string $key): bool
    {
        try {
            $this->database->execute(
                "DELETE FROM verification_cache WHERE cache_key = :key",
                ['key' => $key]
            );

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function clear(): bool
    {
        try {
            $this->database->execute("DELETE FROM verification_cache");
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function cleanup(): int
    {
        try {
            return $this->database->execute(
                "DELETE FROM verification_cache WHERE expires_at <= NOW()"
            );
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function invalidateCredential(int $credentialId): bool
    {
        try {
            // Get credential codes to invalidate cache
            $credential = $this->database->queryOne(
                "SELECT certificate_code, verification_slug FROM credentials WHERE id = :id",
                ['id' => $credentialId]
            );

            if ($credential) {
                $this->delete("verification:{$credential['certificate_code']}");
                $this->delete("verification:{$credential['verification_slug']}");
            }

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}