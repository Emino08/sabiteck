# Corruption Reporter Backend API

A secure, scalable REST API built with Slim PHP framework for the Corruption Reporting Platform.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **File Security**: AES-256 encryption for uploaded media files
- **Rate Limiting**: Redis-based rate limiting per user/IP
- **Audit Logging**: Comprehensive audit trail for all actions
- **Data Validation**: Input validation and sanitization
- **CORS Support**: Configurable CORS for web client access

## Tech Stack

- **Framework**: Slim PHP 4
- **Database**: MySQL with Eloquent ORM
- **Cache**: Redis for sessions and rate limiting
- **Security**: JWT tokens, file encryption, audit logging
- **File Storage**: Local/S3 with encryption at rest

## Installation

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE corruption_reporter"

   # Run migrations
   mysql -u root -p corruption_reporter < database/migrations/001_create_initial_schema.sql

   # Seed initial data
   mysql -u root -p corruption_reporter < database/seeds/002_initial_data.sql
   ```

4. **Set Permissions**
   ```bash
   mkdir -p storage/logs
   chmod -R 755 storage
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Reports
- `GET /api/reports` - List reports (filtered by user role)
- `POST /api/reports` - Create new report
- `GET /api/reports/{id}` - Get report details
- `PUT /api/reports/{id}/status` - Update report status
- `POST /api/reports/{id}/media` - Upload media files

### Admin Routes
- `GET /api/admin/users` - Manage users
- `GET /api/admin/analytics/dashboard` - Analytics dashboard
- `GET /api/admin/audit-logs` - View audit logs

## Security Features

### File Security
- All uploaded files are encrypted with AES-256
- SHA-256 file integrity verification
- File type validation with magic byte checking
- Malware pattern detection

### Authentication
- JWT tokens with configurable expiration
- Refresh token rotation
- Rate limiting per user/IP
- Optional 2FA support

### Audit Trail
- All user actions logged with metadata
- IP address and user agent tracking
- Request/response data logging
- Retention policy for compliance

## Configuration

Key environment variables:

```bash
# Database
DB_HOST=localhost
DB_DATABASE=corruption_reporter
DB_USERNAME=root
DB_PASSWORD=

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=base64:your-32-char-key

# File Storage
STORAGE_DRIVER=local
STORAGE_ROOT=/var/www/storage
MAX_UPLOAD_SIZE=52428800

# Rate Limiting
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=3600
```

## Development

### Running the Development Server
```bash
php -S localhost:8000 -t public
```

### Testing
```bash
composer test
```

### Code Quality
```bash
# Code style check
composer cs

# Static analysis
composer analyze
```

## API Documentation

### Report Creation Example

```bash
curl -X POST http://localhost:8000/api/reports \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Corruption incident report",
    "description": "Detailed description of the incident",
    "category_id": 1,
    "incident_date": "2024-01-15",
    "incident_location": "City Hall",
    "gps_latitude": 40.7128,
    "gps_longitude": -74.0060
  }'
```

### File Upload Example

```bash
curl -X POST http://localhost:8000/api/reports/1/media \
  -H "Authorization: Bearer {token}" \
  -F "file=@evidence.jpg"
```

## Deployment

1. **Production Environment**
   - Set `APP_ENV=production` in .env
   - Configure proper logging paths
   - Set up SSL certificates
   - Configure reverse proxy (nginx)

2. **Database Optimization**
   - Enable MySQL query cache
   - Set up read replicas if needed
   - Configure proper indexes

3. **Security Hardening**
   - Change default JWT secrets
   - Set up firewall rules
   - Enable fail2ban for rate limiting
   - Regular security updates

## Monitoring

- Health check endpoint: `GET /api/health`
- Audit logs for activity monitoring
- Rate limiting metrics in Redis
- Application logs in configured log files

## License

All rights reserved.