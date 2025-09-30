<?php

declare(strict_types=1);

namespace App;

use App\Controllers\ConversionController;
use App\Controllers\ResizeController;
use App\Controllers\JobController;
use App\Controllers\HealthController;
use App\Middleware\AuthMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Middleware\ValidationMiddleware;
use App\Middleware\SecurityMiddleware;
use App\Middleware\CorsMiddleware;
use App\Services\QueueService;
use App\Services\StorageService;
use App\Services\ConversionService;
use App\Services\ValidationService;
use Slim\App;
use Slim\Middleware\ErrorMiddleware;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Predis\Client as RedisClient;
use League\Flysystem\Filesystem;
use League\Flysystem\Local\LocalFilesystemAdapter;

class Application
{
    public function configure(App $app, ContainerInterface $container): void
    {
        $this->registerDependencies($container);
        $this->registerMiddleware($app);
        $this->registerRoutes($app);
    }

    private function registerDependencies(ContainerInterface $container): void
    {
        // Logger
        $container->set(LoggerInterface::class, function () {
            $logger = new Logger($_ENV['APP_NAME'] ?? 'conversion-service');
            $handler = new StreamHandler($_ENV['LOG_PATH'] ?? 'php://stdout', $_ENV['LOG_LEVEL'] ?? Logger::INFO);
            $logger->pushHandler($handler);
            return $logger;
        });

        // Redis
        $container->set(RedisClient::class, function () {
            return new RedisClient([
                'scheme' => 'tcp',
                'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
                'port' => (int)($_ENV['REDIS_PORT'] ?? 6379),
                'password' => $_ENV['REDIS_PASSWORD'] ?? null,
                'database' => (int)($_ENV['REDIS_DATABASE'] ?? 0),
            ]);
        });

        // Storage
        $container->set(Filesystem::class, function () {
            $adapter = new LocalFilesystemAdapter($_ENV['STORAGE_ROOT'] ?? 'storage');
            return new Filesystem($adapter);
        });

        // Services
        $container->set(QueueService::class, function (ContainerInterface $c) {
            return new QueueService(
                $c->get(RedisClient::class),
                $c->get(LoggerInterface::class)
            );
        });

        $container->set(StorageService::class, function (ContainerInterface $c) {
            return new StorageService(
                $c->get(Filesystem::class),
                $c->get(LoggerInterface::class)
            );
        });

        $container->set(ValidationService::class, function (ContainerInterface $c) {
            return new ValidationService($c->get(LoggerInterface::class));
        });

        $container->set(ConversionService::class, function (ContainerInterface $c) {
            return new ConversionService(
                $c->get(StorageService::class),
                $c->get(LoggerInterface::class)
            );
        });

        // Controllers
        $container->set(ConversionController::class, function (ContainerInterface $c) {
            return new ConversionController(
                $c->get(QueueService::class),
                $c->get(ConversionService::class),
                $c->get(ValidationService::class),
                $c->get(LoggerInterface::class)
            );
        });

        $container->set(ResizeController::class, function (ContainerInterface $c) {
            return new ResizeController(
                $c->get(QueueService::class),
                $c->get(ConversionService::class),
                $c->get(ValidationService::class),
                $c->get(LoggerInterface::class)
            );
        });

        $container->set(JobController::class, function (ContainerInterface $c) {
            return new JobController(
                $c->get(QueueService::class),
                $c->get(LoggerInterface::class)
            );
        });

        $container->set(HealthController::class, function (ContainerInterface $c) {
            return new HealthController(
                $c->get(RedisClient::class),
                $c->get(LoggerInterface::class)
            );
        });
    }

    private function registerMiddleware(App $app): void
    {
        $app->addRoutingMiddleware();

        // Security middleware
        $app->add(new CorsMiddleware());
        $app->add(new SecurityMiddleware());
        $app->add(new RateLimitMiddleware());
        $app->add(new AuthMiddleware());

        // Error middleware
        $errorMiddleware = $app->addErrorMiddleware(
            (bool)($_ENV['APP_DEBUG'] ?? false),
            true,
            true
        );
    }

    private function registerRoutes(App $app): void
    {
        // Health check
        $app->get('/health', HealthController::class . ':health');

        // Conversion endpoints
        $app->group('/convert', function ($group) {
            $group->post('/pdf-to-word', ConversionController::class . ':pdfToWord');
            $group->post('/pdf-to-images', ConversionController::class . ':pdfToImages');
            $group->post('/word-to-pdf', ConversionController::class . ':wordToPdf');
            $group->post('/image-to-word', ConversionController::class . ':imageToWord');
        })->add(new ValidationMiddleware());

        // Resize endpoints
        $app->group('/resize', function ($group) {
            $group->post('/file', ResizeController::class . ':file');
            $group->post('/image', ResizeController::class . ':image');
        })->add(new ValidationMiddleware());

        // Job status
        $app->get('/jobs/{jobId}', JobController::class . ':status');
    }
}