<?php

declare(strict_types=1);

namespace App\Models;

class Job
{
    private string $id;
    private string $type;
    private array $payload;
    private string $status;
    private int $progress;
    private ?array $result;
    private ?string $error;
    private ?string $apiKey;
    private int $createdAt;
    private int $updatedAt;

    public function __construct(array $data)
    {
        $this->id = $data['id'];
        $this->type = $data['type'];
        $this->payload = $data['payload'];
        $this->status = $data['status'];
        $this->progress = $data['progress'] ?? 0;
        $this->result = $data['result'] ?? null;
        $this->error = $data['error'] ?? null;
        $this->apiKey = $data['api_key'] ?? null;
        $this->createdAt = $data['created_at'];
        $this->updatedAt = $data['updated_at'];
    }

    public static function fromArray(array $data): self
    {
        return new self($data);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'payload' => $this->payload,
            'status' => $this->status,
            'progress' => $this->progress,
            'result' => $this->result,
            'error' => $this->error,
            'api_key' => $this->apiKey,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }

    public function getProgress(): int
    {
        return $this->progress;
    }

    public function setProgress(int $progress): void
    {
        $this->progress = $progress;
    }

    public function getResult(): ?array
    {
        return $this->result;
    }

    public function setResult(array $result): void
    {
        $this->result = $result;
    }

    public function getError(): ?string
    {
        return $this->error;
    }

    public function setError(string $error): void
    {
        $this->error = $error;
    }

    public function getApiKey(): ?string
    {
        return $this->apiKey;
    }

    public function getCreatedAt(): int
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): int
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(int $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }
}