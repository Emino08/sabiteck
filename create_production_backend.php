<?php

/**
 * Script to create production-ready backend folder
 * Copies only essential files needed for production deployment
 */

echo "🚀 Creating Production Backend\n";
echo "==============================\n\n";

$sourceDir = __DIR__ . '/backend';
$productionDir = __DIR__ . '/backend_production';

// Create production directory structure
$directories = [
    '',
    '/public',
    '/src',
    '/src/Controllers',
    '/src/Middleware',
    '/src/Models',
    '/src/Utils',
    '/migrations',
    '/uploads',
    '/uploads/profiles',
    '/uploads/content',
    '/uploads/jobs',
    '/uploads/temp'
];

echo "📁 Creating directory structure...\n";
foreach ($directories as $dir) {
    $fullPath = $productionDir . $dir;
    if (!is_dir($fullPath)) {
        mkdir($fullPath, 0755, true);
        echo "   ✓ Created: $dir\n";
    }
}

// Essential files to copy
$essentialFiles = [
    // Root files
    'composer.json',
    'setup_analytics_simple.php',
    'add_sample_analytics_data.php',
    'deploy.php',
    'nginx.conf',
    '.env.production' => '.env',

    // Public directory
    'public/index.php',
    'public/.htaccess',

    // Source code - Controllers
    'src/Controllers/AdminController.php',
    'src/Controllers/AnalyticsController.php',
    'src/Controllers/AuthController.php',
    'src/Controllers/ContactController.php',
    'src/Controllers/ContentController.php',
    'src/Controllers/JobController.php',
    'src/Controllers/NewsletterController.php',
    'src/Controllers/ScholarshipController.php',
    'src/Controllers/UserController.php',

    // Source code - Middleware
    'src/Middleware/AdminMiddleware.php',
    'src/Middleware/AnalyticsMiddleware.php',
    'src/Middleware/AuthMiddleware.php',
    'src/Middleware/CorsMiddleware.php',
    'src/Middleware/ValidationMiddleware.php',

    // Source code - Models
    'src/Models/Analytics.php',
    'src/Models/Database.php',
    'src/Models/User.php',

    // Source code - Utils
    'src/Utils/AnalyticsService.php',
    'src/Utils/EmailService.php',
    'src/Utils/FileUploadHandler.php',
    'src/Utils/ImageProcessor.php'
];

echo "\n📄 Copying essential files...\n";
foreach ($essentialFiles as $source => $destination) {
    if (is_numeric($source)) {
        $source = $destination;
    }

    $sourceFile = $sourceDir . '/' . $source;
    $destinationFile = $productionDir . '/' . $destination;

    if (file_exists($sourceFile)) {
        // Create destination directory if it doesn't exist
        $destinationDir = dirname($destinationFile);
        if (!is_dir($destinationDir)) {
            mkdir($destinationDir, 0755, true);
        }

        if (copy($sourceFile, $destinationFile)) {
            echo "   ✓ Copied: $source → $destination\n";
        } else {
            echo "   ❌ Failed: $source\n";
        }
    } else {
        echo "   ⚠️  Not found: $source\n";
    }
}

// Copy migration files
echo "\n📊 Copying migration files...\n";
$migrationFiles = glob($sourceDir . '/migrations/*.sql');
foreach ($migrationFiles as $file) {
    $filename = basename($file);
    $destination = $productionDir . '/migrations/' . $filename;
    if (copy($file, $destination)) {
        echo "   ✓ Copied: migrations/$filename\n";
    }
}

// Create essential configuration files
echo "\n⚙️  Creating configuration files...\n";

// Create uploads .htaccess for security
$uploadsHtaccess = $productionDir . '/uploads/.htaccess';
file_put_contents($uploadsHtaccess, "# Security for uploads directory\n" .
    "Options -Indexes\n" .
    "<FilesMatch \"\.php$\">\n" .
    "    Order allow,deny\n" .
    "    Deny from all\n" .
    "</FilesMatch>\n");
echo "   ✓ Created: uploads/.htaccess\n";

// Create README for production
$readmeContent = "# Sabiteck Backend Production\n\n" .
    "This is the production-ready backend for Sabiteck.\n\n" .
    "## Deployment Instructions\n\n" .
    "1. Update .env with production credentials\n" .
    "2. Run: composer install --no-dev --optimize-autoloader\n" .
    "3. Point web server document root to /public directory\n" .
    "4. Set file permissions: chmod -R 755 . && chmod 600 .env\n" .
    "5. Configure SSL certificates\n" .
    "6. Test all endpoints\n\n" .
    "## Important Files\n\n" .
    "- .env: Environment configuration (update with real credentials)\n" .
    "- public/: Web server document root\n" .
    "- deploy.php: Deployment checklist script\n" .
    "- setup_analytics_simple.php: Database setup\n" .
    "- nginx.conf: Nginx configuration reference\n\n" .
    "## Google OAuth Setup\n\n" .
    "Update Google Cloud Console with:\n" .
    "- Authorized Origins: https://sabiteck.com\n" .
    "- Redirect URIs: https://backend.sabiteck.com/api/auth/google/callback\n\n" .
    "Generated on: " . date('Y-m-d H:i:s');

file_put_contents($productionDir . '/README.md', $readmeContent);
echo "   ✓ Created: README.md\n";

// Create deployment checklist
$deploymentContent = "#!/bin/bash\n\n" .
    "# Production Deployment Script\n" .
    "echo \"🚀 Deploying Sabiteck Backend to Production\"\n\n" .
    "# Install dependencies\n" .
    "echo \"📦 Installing dependencies...\"\n" .
    "composer install --no-dev --optimize-autoloader\n\n" .
    "# Set file permissions\n" .
    "echo \"🔒 Setting file permissions...\"\n" .
    "find . -type d -exec chmod 755 {} \\;\n" .
    "find . -type f -exec chmod 644 {} \\;\n" .
    "chmod 600 .env\n" .
    "chmod +x deploy.sh\n\n" .
    "# Make uploads writable\n" .
    "chmod -R 755 uploads/\n\n" .
    "echo \"✅ Deployment preparation complete!\"\n" .
    "echo \"📝 Next steps:\"\n" .
    "echo \"   1. Update .env with production credentials\"\n" .
    "echo \"   2. Configure web server to point to /public directory\"\n" .
    "echo \"   3. Set up SSL certificates\"\n" .
    "echo \"   4. Run: php setup_analytics_simple.php\"\n" .
    "echo \"   5. Test API endpoints\"\n";

file_put_contents($productionDir . '/deploy.sh', $deploymentContent);
chmod($productionDir . '/deploy.sh', 0755);
echo "   ✓ Created: deploy.sh\n";

// Get directory size
$totalSize = 0;
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($productionDir));
foreach ($iterator as $file) {
    if ($file->isFile()) {
        $totalSize += $file->getSize();
    }
}

echo "\n📊 Production Backend Summary\n";
echo "==============================\n";
echo "Location: $productionDir\n";
echo "Size: " . round($totalSize / 1024 / 1024, 2) . " MB\n";
echo "Files: " . count(glob($productionDir . '/{,*/,*/*/,*/*/*/}*', GLOB_BRACE)) . "\n";

echo "\n✅ Production backend created successfully!\n";
echo "\n📋 Next Steps:\n";
echo "1. Update .env with real production credentials\n";
echo "2. Upload to production server\n";
echo "3. Run: composer install --no-dev --optimize-autoloader\n";
echo "4. Configure web server\n";
echo "5. Set up SSL certificates\n";
echo "6. Test Google OAuth flow\n";

echo "\n🎉 Ready for production deployment!\n";