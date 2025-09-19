#!/bin/bash

# Academic Credentials Verification Platform - Deployment Script
# Usage: ./deploy.sh [environment] [branch]
# Example: ./deploy.sh production main

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-staging}
BRANCH=${2:-main}
PROJECT_NAME="credential-verification"
BACKUP_DIR="/backup"
LOG_FILE="/var/log/${PROJECT_NAME}-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Load environment-specific configuration
case $ENVIRONMENT in
    "production")
        DEPLOY_PATH="/var/www/credential-verification"
        DOMAIN="credentials.gov"
        PHP_FPM_SERVICE="php8.1-fpm"
        WEB_SERVER="nginx"
        ;;
    "staging")
        DEPLOY_PATH="/var/www/staging-credential-verification"
        DOMAIN="staging-credentials.gov"
        PHP_FPM_SERVICE="php8.1-fpm"
        WEB_SERVER="nginx"
        ;;
    *)
        error "Unknown environment: $ENVIRONMENT. Use 'production' or 'staging'"
        ;;
esac

log "Starting deployment to $ENVIRONMENT environment"
log "Branch: $BRANCH"
log "Deploy path: $DEPLOY_PATH"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if git is clean (for production)
if [[ $ENVIRONMENT == "production" ]]; then
    if [[ -n $(git status --porcelain) ]]; then
        error "Git working directory is not clean. Commit or stash changes before deployment."
    fi
fi

# Check required services
for service in mysql $PHP_FPM_SERVICE $WEB_SERVER; do
    if ! systemctl is-active --quiet $service; then
        error "Service $service is not running"
    fi
done

# Check disk space (minimum 1GB free)
available_space=$(df / | tail -1 | awk '{print $4}')
if [[ $available_space -lt 1048576 ]]; then
    error "Insufficient disk space. At least 1GB required."
fi

# Backup current deployment
if [[ -d $DEPLOY_PATH ]]; then
    log "Creating backup of current deployment..."
    backup_name="${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
    sudo mkdir -p $BACKUP_DIR
    sudo tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C $(dirname $DEPLOY_PATH) $(basename $DEPLOY_PATH)
    log "Backup created: $BACKUP_DIR/$backup_name.tar.gz"
fi

# Create maintenance page
log "Enabling maintenance mode..."
sudo tee /var/www/maintenance.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - Academic Credentials Platform</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>System Maintenance</h1>
        <p>The Academic Credentials Verification Platform is currently undergoing maintenance. We'll be back shortly.</p>
        <p>For urgent inquiries, please contact support.</p>
    </div>
</body>
</html>
EOF

# Update nginx configuration for maintenance
sudo tee /etc/nginx/sites-available/maintenance > /dev/null << EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/ssl/certs/${DOMAIN}.crt;
    ssl_certificate_key /etc/ssl/private/${DOMAIN}.key;

    location / {
        return 503;
    }

    error_page 503 @maintenance;
    location @maintenance {
        root /var/www;
        try_files /maintenance.html =503;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/maintenance /etc/nginx/sites-enabled/
sudo systemctl reload nginx

# Clone/update repository
log "Updating source code..."
if [[ ! -d $DEPLOY_PATH ]]; then
    sudo git clone -b $BRANCH https://github.com/your-org/credential-verification.git $DEPLOY_PATH
else
    cd $DEPLOY_PATH
    sudo git fetch origin
    sudo git checkout $BRANCH
    sudo git pull origin $BRANCH
fi

cd $DEPLOY_PATH

# Backend deployment
log "Deploying backend..."
cd backend

# Install/update composer dependencies
log "Installing PHP dependencies..."
sudo -u www-data composer install --no-dev --optimize-autoloader --no-interaction

# Update environment configuration
if [[ ! -f .env ]]; then
    log "Creating environment configuration..."
    sudo cp .env.example .env
    warn "Please update .env file with production values!"
else
    log "Environment file exists, keeping current configuration"
fi

# Run database migrations
log "Running database migrations..."
sudo -u www-data php migrations/setup.php migrate

# Clear cache and optimize
log "Optimizing backend..."
sudo -u www-data composer dump-autoload --optimize

# Set proper permissions
log "Setting file permissions..."
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 755 storage/
sudo chmod -R 644 storage/logs/

# Frontend deployment
log "Deploying frontend..."
cd ../frontend

# Install/update npm dependencies
log "Installing Node.js dependencies..."
npm ci --production

# Build frontend
log "Building frontend..."
npm run build

# Deploy frontend files
log "Deploying frontend files..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# Update web server configuration
log "Updating web server configuration..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/ssl/certs/${DOMAIN}.crt;
    ssl_certificate_key /etc/ssl/private/${DOMAIN}.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    root /var/www/html;
    index index.html;

    # Handle frontend routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # QR codes
    location /qr {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security
    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable site and disable maintenance
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/maintenance

# Test nginx configuration
if ! sudo nginx -t; then
    error "Nginx configuration test failed"
fi

# Restart services
log "Restarting services..."
sudo systemctl reload nginx
sudo systemctl restart $PHP_FPM_SERVICE

# Health check
log "Performing health check..."
sleep 5

# Check if site is responding
if curl -f -s https://$DOMAIN/health > /dev/null; then
    log "Health check passed"
else
    error "Health check failed - site is not responding"
fi

# Check API endpoint
if curl -f -s https://$DOMAIN/api/health > /dev/null; then
    log "API health check passed"
else
    error "API health check failed"
fi

# Database optimization (for production)
if [[ $ENVIRONMENT == "production" ]]; then
    log "Optimizing database..."
    mysql -u root << 'EOF'
USE credential_verification;
OPTIMIZE TABLE credentials;
OPTIMIZE TABLE audit_logs;
OPTIMIZE TABLE verification_cache;
EOF
fi

# Clear caches
log "Clearing caches..."
cd $DEPLOY_PATH/backend
sudo -u www-data php -r "
require 'vendor/autoload.php';
use App\Utils\Cache;
use App\Database\Database;

\$database = new Database([
    'host' => \$_ENV['DB_HOST'] ?? 'localhost',
    'database' => \$_ENV['DB_DATABASE'] ?? 'credential_verification',
    'username' => \$_ENV['DB_USERNAME'] ?? 'root',
    'password' => \$_ENV['DB_PASSWORD'] ?? ''
]);

\$cache = new Cache(\$database, ['ttl' => 300]);
\$cache->cleanup();
echo 'Cache cleared\n';
"

# Update crontab for cache cleanup and logs
log "Setting up cron jobs..."
sudo crontab -l 2>/dev/null | grep -v "credential-verification" | sudo crontab -
sudo crontab -l 2>/dev/null | { cat; echo "0 2 * * * /usr/local/bin/backup-credentials.sh"; echo "*/15 * * * * cd $DEPLOY_PATH/backend && php -r \"require 'vendor/autoload.php'; (new App\Utils\Cache(new App\Database\Database(['host'=>'localhost','database'=>'credential_verification','username'=>'root','password'=>'']), ['ttl'=>300]))->cleanup();\""; } | sudo crontab -

# Clean up old backups
log "Cleaning up old backups..."
find $BACKUP_DIR -name "${PROJECT_NAME}_*.tar.gz" -mtime +7 -delete

# Remove maintenance page
sudo rm -f /var/www/maintenance.html

# Final verification
log "Running final verification..."
final_check_url="https://$DOMAIN/verify"
if curl -f -s -o /dev/null "$final_check_url"; then
    log "Final verification passed"
else
    warn "Final verification failed - manual check required"
fi

# Send notification (customize as needed)
log "Sending deployment notification..."
if command -v mail &> /dev/null; then
    echo "Deployment to $ENVIRONMENT completed successfully at $(date)" | mail -s "[$PROJECT_NAME] Deployment Complete" admin@$DOMAIN
fi

log "🎉 Deployment completed successfully!"
log "Site URL: https://$DOMAIN"
log "API URL: https://$DOMAIN/api"
log "Deployment log: $LOG_FILE"

# Display next steps
cat << EOF

📋 Next Steps:
1. Verify the application is working correctly
2. Update DNS if needed
3. Monitor logs for any issues
4. Update monitoring dashboards
5. Notify stakeholders of successful deployment

📊 Monitoring Commands:
- View application logs: tail -f $DEPLOY_PATH/backend/storage/logs/app.log
- View nginx logs: tail -f /var/log/nginx/access.log
- Check service status: systemctl status nginx $PHP_FPM_SERVICE mysql

🔧 Rollback (if needed):
- Restore from backup: tar -xzf $BACKUP_DIR/[backup-name].tar.gz -C $(dirname $DEPLOY_PATH)
- Restart services: systemctl restart nginx $PHP_FPM_SERVICE

EOF

log "Deployment script completed at $(date)"