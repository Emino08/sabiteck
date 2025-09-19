<?php

declare(strict_types=1);

use DI\Container;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Illuminate\Database\Capsule\Manager as Capsule;
use EmergencyResponse\Services\AuthService;
use EmergencyResponse\Services\EncryptionService;
use EmergencyResponse\Services\FileService;
use EmergencyResponse\Services\LocationService;
use EmergencyResponse\Services\NotificationService;
use EmergencyResponse\Services\CaseService;
use EmergencyResponse\Utils\Database;

return function (Container $container) {
    // Logger
    $container->set(Logger::class, function () {
        $logger = new Logger('emergency-response');
        $logger->pushHandler(new StreamHandler(__DIR__ . '/../logs/app.log', Logger::INFO));
        return $logger;
    });

    // Database
    $container->set('database', function () {
        $capsule = new Capsule;
        $capsule->addConnection([
            'driver' => 'mysql',
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'port' => $_ENV['DB_PORT'] ?? 3306,
            'database' => $_ENV['DB_DATABASE'] ?? 'emergency_response',
            'username' => $_ENV['DB_USERNAME'] ?? 'root',
            'password' => $_ENV['DB_PASSWORD'] ?? '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        ]);

        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        return $capsule;
    });

    // Redis
    $container->set('redis', function () {
        return new \Predis\Client([
            'scheme' => 'tcp',
            'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
            'port' => $_ENV['REDIS_PORT'] ?? 6379,
            'password' => $_ENV['REDIS_PASSWORD'] ?? null,
        ]);
    });

    // Services
    $container->set(AuthService::class, function (Container $c) {
        return new AuthService(
            $c->get('database'),
            $c->get('redis'),
            $c->get(Logger::class)
        );
    });

    $container->set(EncryptionService::class, function () {
        return new EncryptionService($_ENV['ENCRYPTION_KEY']);
    });

    $container->set(FileService::class, function (Container $c) {
        return new FileService(
            $c->get(EncryptionService::class),
            $c->get(Logger::class)
        );
    });

    $container->set(LocationService::class, function (Container $c) {
        return new LocationService(
            $c->get('database'),
            $c->get(Logger::class)
        );
    });

    $container->set(NotificationService::class, function (Container $c) {
        return new NotificationService(
            $c->get('redis'),
            $c->get(Logger::class)
        );
    });

    $container->set(CaseService::class, function (Container $c) {
        return new CaseService(
            $c->get('database'),
            $c->get(LocationService::class),
            $c->get(NotificationService::class),
            $c->get(Logger::class)
        );
    });
};