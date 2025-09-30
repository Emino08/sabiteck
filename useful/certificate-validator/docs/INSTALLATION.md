# Installation Guide

## Prerequisites

- PHP 8.1 or higher
- MySQL 8.0 or higher
- Node.js 18+ and npm
- Composer
- Web server (Apache/Nginx) or use built-in PHP server for development

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd certificate-validator
```

### 2. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

#### Configure Environment Variables

Update the `.env` file with your settings:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=credential_verification
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Email (configure for production)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password

# File Storage
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Security
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Initialize Database

```bash
# Run database migrations
php migrations/setup.php migrate

# Or reset database (drops all data)
php migrations/setup.php reset
```

#### Start Backend Server

```bash
# Development server
composer serve

# Or manually
php -S localhost:8000 -t public
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Production Deployment

### 1. Server Requirements

- Linux server (Ubuntu 20.04+ recommended)
- PHP 8.1+ with extensions: pdo_mysql, gd, zip, curl, mbstring, openssl
- MySQL 8.0+
- Nginx or Apache
- SSL certificate (Let's Encrypt recommended)

### 2. Production Environment Setup

```bash
# Backend
cd backend
composer install --no-dev --optimize-autoloader

# Set production environment
echo "APP_ENV=production" >> .env
echo "APP_DEBUG=false" >> .env

# Generate strong secrets
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env

# Set proper permissions
sudo chown -R www-data:www-data storage/
sudo chmod -R 755 storage/
sudo chmod -R 644 storage/logs/
```

```bash
# Frontend
cd frontend
npm run build

# Copy dist/ folder to your web server
sudo cp -r dist/* /var/www/html/
```

### 3. Web Server Configuration

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    root /var/www/html;
    index index.html;

    # Handle frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Frontend routing
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Backend API proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:8000/api/
    ProxyPassReverse /api/ http://localhost:8000/api/

    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</VirtualHost>
```

### 4. Process Management

#### Using systemd for PHP backend

Create `/etc/systemd/system/credential-api.service`:

```ini
[Unit]
Description=Academic Credentials API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/credential-validator/backend
ExecStart=/usr/bin/php -S localhost:8000 -t public
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable credential-api
sudo systemctl start credential-api
sudo systemctl status credential-api
```

### 5. Database Optimization

```sql
-- Create database indexes for better performance
USE credential_verification;

-- Additional indexes for high-traffic queries
CREATE INDEX idx_credentials_search ON credentials(institution_id, status, created_at);
CREATE INDEX idx_audit_logs_institution_date ON audit_logs(institution_id, created_at);
CREATE INDEX idx_verification_cache_expires ON verification_cache(expires_at);

-- Optimize tables
OPTIMIZE TABLE credentials;
OPTIMIZE TABLE audit_logs;
OPTIMIZE TABLE verification_cache;
```

### 6. Security Hardening

```bash
# Set up firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable server tokens
echo "server_tokens off;" >> /etc/nginx/nginx.conf

# Set up log rotation
sudo logrotate -f /etc/logrotate.d/nginx
```

### 7. Monitoring and Backup

#### Log Monitoring

```bash
# Monitor application logs
tail -f /var/www/credential-validator/backend/storage/logs/app.log

# Monitor web server logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### Database Backup

```bash
# Create backup script
cat > /usr/local/bin/backup-credentials.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p password credential_verification > /backup/credential_verification_$DATE.sql
find /backup -name "credential_verification_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-credentials.sh

# Add to crontab for daily backups
echo "0 2 * * * /usr/local/bin/backup-credentials.sh" | crontab -
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service: `sudo systemctl status mysql`
   - Verify credentials in `.env` file
   - Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

2. **Permission Errors**
   ```bash
   sudo chown -R www-data:www-data backend/storage/
   sudo chmod -R 755 backend/storage/
   ```

3. **Composer Install Fails**
   ```bash
   # Install required PHP extensions
   sudo apt install php8.1-mysql php8.1-gd php8.1-zip php8.1-curl php8.1-mbstring
   ```

4. **Frontend Build Fails**
   ```bash
   # Clear npm cache
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Optimization

1. **Enable PHP OPcache**
   ```ini
   ; php.ini
   opcache.enable=1
   opcache.memory_consumption=256
   opcache.max_accelerated_files=20000
   opcache.validate_timestamps=0
   ```

2. **MySQL Optimization**
   ```ini
   ; my.cnf
   [mysqld]
   innodb_buffer_pool_size=1G
   query_cache_size=64M
   query_cache_type=1
   slow_query_log=1
   long_query_time=2
   ```

3. **Nginx Caching**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Support

For technical support or questions:
- Documentation: `/docs`
- API Reference: `/docs/API.md`
- Security Guidelines: `/docs/SECURITY.md`