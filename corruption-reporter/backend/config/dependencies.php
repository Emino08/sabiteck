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
use Illuminate\Database\Capsule\Manager as Capsule;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Predis\Client as RedisClient;
use DI\Container;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return function (Container $container) {
    // Database
    $container->set('db', function () {
        $capsule = new Capsule;

        $capsule->addConnection([
            'driver' => 'mysql',
            'host' => $_ENV['DB_HOST'],
            'port' => $_ENV['DB_PORT'],
            'database' => $_ENV['DB_DATABASE'],
            'username' => $_ENV['DB_USERNAME'],
            'password' => $_ENV['DB_PASSWORD'],
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        ]);

        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        return $capsule->getConnection();
    });

    // Logger
    $container->set(LoggerInterface::class, function () {
        $logger = new Logger('corruption-reporter');

        if ($_ENV['APP_ENV'] === 'production') {
            $logger->pushHandler(new RotatingFileHandler(
                $_ENV['LOG_PATH'] . '/app.log',
                0,
                Logger::INFO
            ));
        } else {
            $logger->pushHandler(new StreamHandler('php://stdout', Logger::DEBUG));
        }

        return $logger;
    });

    // Redis
    $container->set('redis', function () {
        return new RedisClient([
            'scheme' => 'tcp',
            'host' => $_ENV['REDIS_HOST'],
            'port' => $_ENV['REDIS_PORT'],
            'password' => $_ENV['REDIS_PASSWORD'] ?: null,
        ]);
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