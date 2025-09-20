<?php

declare(strict_types=1);

use App\Services\AuthService;
use App\Services\FileStorageService;
use App\Services\NotificationService;
use App\Services\AuditService;
use App\Services\EncryptionService;
use App\Repositories\UserRepository;
use App\Repositories\ReportRepository;
use App\Repositories\InstitutionRepository;
use App\Repositories\CategoryRepository;
use App\Database\DatabaseManager;
use App\Database\DatabaseConfig;
use Illuminate\Database\Capsule\Manager as Capsule;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Predis\Client as RedisClient;
use DI\Container;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return function (Container $container) {
    // Logger (initialized first as it's needed by DatabaseManager)
    $container->set(LoggerInterface::class, function () {
        $logger = new Logger('corruption-reporter');

        if ($_ENV['APP_ENV'] === 'production') {
            $logger->pushHandler(new RotatingFileHandler(
                $_ENV['LOG_PATH'] ?? './logs/app.log',
                0,
                Logger::INFO
            ));
        } else {
            $logger->pushHandler(new StreamHandler('php://stdout', Logger::DEBUG));
        }

        return $logger;
    });

    // Database - Using our new DatabaseManager
    $container->set('db', function (ContainerInterface $c) {
        $logger = $c->get(LoggerInterface::class);
        $config = DatabaseConfig::getConfig();

        // Validate configuration
        $errors = DatabaseConfig::validateConfig();
        if (!empty($errors)) {
            throw new \Exception('Database configuration errors: ' . implode(', ', $errors));
        }

        DatabaseManager::initialize($config, $logger);
        return DatabaseManager::getConnection();
    });

    // Database Manager service for advanced operations
    $container->set(DatabaseManager::class, function (ContainerInterface $c) {
        // Ensure database is initialized
        $c->get('db');
        return DatabaseManager::class;
    });

    // Redis
    $container->set('redis', function () {
        $config = DatabaseConfig::getRedisConfig();
        return new RedisClient($config);
    });

    // Services
    $container->set(EncryptionService::class, function (ContainerInterface $c) {
        return new EncryptionService($_ENV['ENCRYPTION_KEY']);
    });

    $container->set(AuthService::class, function (ContainerInterface $c) {
        return new AuthService(
            $c->get(UserRepository::class),
            $c->get('redis'),
            $_ENV['JWT_SECRET'],
            (int)$_ENV['JWT_EXPIRE_TIME'],
            (int)$_ENV['JWT_REFRESH_EXPIRE_TIME']
        );
    });

    $container->set(FileStorageService::class, function (ContainerInterface $c) {
        return new FileStorageService(
            $c->get(EncryptionService::class),
            $_ENV['STORAGE_DRIVER'],
            $_ENV['STORAGE_ROOT']
        );
    });

    $container->set(NotificationService::class, function (ContainerInterface $c) {
        return new NotificationService(
            $c->get('db'),
            $c->get('redis'),
            $_ENV['FCM_SERVER_KEY']
        );
    });

    $container->set(AuditService::class, function (ContainerInterface $c) {
        return new AuditService(
            $c->get('db'),
            $c->get(LoggerInterface::class)
        );
    });

    // Repositories
    $container->set(UserRepository::class, function (ContainerInterface $c) {
        return new UserRepository($c->get('db'));
    });

    $container->set(ReportRepository::class, function (ContainerInterface $c) {
        return new ReportRepository($c->get('db'));
    });

    $container->set(InstitutionRepository::class, function (ContainerInterface $c) {
        return new InstitutionRepository($c->get('db'));
    });

    $container->set(CategoryRepository::class, function (ContainerInterface $c) {
        return new CategoryRepository($c->get('db'));
    });
};