<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Job;
use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;
use Ramsey\Uuid\Uuid;

class QueueService
{
    private const QUEUE_KEY = 'jobs:queue';
    private const PROCESSING_KEY = 'jobs:processing';
    private const JOB_PREFIX = 'job:';

    public function __construct(
        private RedisClient $redis,
        private LoggerInterface $logger
    ) {}

    public function enqueueJob(string $type, array $payload, ?string $apiKey = null): string
    {
        $jobId = Uuid::uuid4()->toString();

        $job = new Job([
            'id' => $jobId,
            'type' => $type,
            'payload' => $payload,
            'status' => 'queued',
            'progress' => 0,
            'api_key' => $apiKey,
            'created_at' => time(),
            'updated_at' => time()
        ]);

        // Store job data
        $this->redis->setex(
            self::JOB_PREFIX . $jobId,
            (int)($_ENV['JOB_RETENTION_HOURS'] ?? 24) * 3600,
            json_encode($job->toArray())
        );

        // Add to queue
        $this->redis->lpush(self::QUEUE_KEY, $jobId);

        $this->logger->info("Job enqueued: {$jobId}", ['type' => $type]);

        return $jobId;
    }

    public function getNextJob(): ?Job
    {
        // Move job from queue to processing
        $jobId = $this->redis->brpoplpush(self::QUEUE_KEY, self::PROCESSING_KEY, 1);

        if (!$jobId) {
            return null;
        }

        $jobData = $this->redis->get(self::JOB_PREFIX . $jobId);
        if (!$jobData) {
            $this->logger->warning("Job data not found: {$jobId}");
            return null;
        }

        $job = Job::fromArray(json_decode($jobData, true));
        $this->updateJobStatus($job->getId(), 'processing');

        return $job;
    }

    public function getJob(string $jobId): ?Job
    {
        $jobData = $this->redis->get(self::JOB_PREFIX . $jobId);
        if (!$jobData) {
            return null;
        }

        return Job::fromArray(json_decode($jobData, true));
    }

    public function updateJobStatus(string $jobId, string $status, int $progress = null): bool
    {
        $jobData = $this->redis->get(self::JOB_PREFIX . $jobId);
        if (!$jobData) {
            return false;
        }

        $job = Job::fromArray(json_decode($jobData, true));
        $job->setStatus($status);
        $job->setUpdatedAt(time());

        if ($progress !== null) {
            $job->setProgress($progress);
        }

        $this->redis->setex(
            self::JOB_PREFIX . $jobId,
            (int)($_ENV['JOB_RETENTION_HOURS'] ?? 24) * 3600,
            json_encode($job->toArray())
        );

        // Remove from processing queue if completed or failed
        if (in_array($status, ['success', 'failed'])) {
            $this->redis->lrem(self::PROCESSING_KEY, 1, $jobId);
        }

        $this->logger->info("Job status updated: {$jobId}", ['status' => $status, 'progress' => $progress]);

        return true;
    }

    public function setJobResult(string $jobId, array $result): bool
    {
        $jobData = $this->redis->get(self::JOB_PREFIX . $jobId);
        if (!$jobData) {
            return false;
        }

        $job = Job::fromArray(json_decode($jobData, true));
        $job->setResult($result);
        $job->setUpdatedAt(time());

        $this->redis->setex(
            self::JOB_PREFIX . $jobId,
            (int)($_ENV['JOB_RETENTION_HOURS'] ?? 24) * 3600,
            json_encode($job->toArray())
        );

        return true;
    }

    public function setJobError(string $jobId, string $error): bool
    {
        $jobData = $this->redis->get(self::JOB_PREFIX . $jobId);
        if (!$jobData) {
            return false;
        }

        $job = Job::fromArray(json_decode($jobData, true));
        $job->setError($error);
        $job->setStatus('failed');
        $job->setUpdatedAt(time());

        $this->redis->setex(
            self::JOB_PREFIX . $jobId,
            (int)($_ENV['JOB_RETENTION_HOURS'] ?? 24) * 3600,
            json_encode($job->toArray())
        );

        // Remove from processing queue
        $this->redis->lrem(self::PROCESSING_KEY, 1, $jobId);

        $this->logger->error("Job failed: {$jobId}", ['error' => $error]);

        return true;
    }

    public function getQueueStats(): array
    {
        return [
            'queued' => $this->redis->llen(self::QUEUE_KEY),
            'processing' => $this->redis->llen(self::PROCESSING_KEY)
        ];
    }

    public function requeueStaleJobs(): int
    {
        $staleTimeout = (int)($_ENV['QUEUE_DEFAULT_TIMEOUT'] ?? 300);
        $processingJobs = $this->redis->lrange(self::PROCESSING_KEY, 0, -1);
        $requeuedCount = 0;

        foreach ($processingJobs as $jobId) {
            $job = $this->getJob($jobId);
            if (!$job) {
                $this->redis->lrem(self::PROCESSING_KEY, 1, $jobId);
                continue;
            }

            // Check if job has been processing too long
            if (time() - $job->getUpdatedAt() > $staleTimeout) {
                $this->redis->lrem(self::PROCESSING_KEY, 1, $jobId);
                $this->redis->lpush(self::QUEUE_KEY, $jobId);
                $this->updateJobStatus($jobId, 'queued');
                $requeuedCount++;

                $this->logger->warning("Requeued stale job: {$jobId}");
            }
        }

        return $requeuedCount;
    }
}