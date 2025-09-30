# File Conversion and Resizing Microservice

A production-ready PHP microservice built with Slim Framework that provides file conversion and resizing capabilities with async processing support.

## Features

### Core Conversions
- **PDF to Word** (DOC/DOCX) with page range support
- **PDF to Images** (PNG/JPG) with DPI control and combining options
- **Word to PDF** with page size and margin presets
- **Image to Word** using OCR with multi-language support
- **File Resizing** with compression for PDFs and images
- **Image Resizing** with aspect ratio control and fit options

### Production Features
- Asynchronous job processing with Redis queue
- Real-time job status tracking
- Rate limiting per API key/IP
- File validation and security scanning
- API key/JWT authentication
- Comprehensive health checks
- Structured logging with Monolog
- Docker support for easy deployment

## Quick Start

### Prerequisites
- PHP 8.1 or later
- Composer
- Redis server
- External tools: LibreOffice, Ghostscript, ImageMagick, Tesseract, Poppler

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd conversion-microservice
composer install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services**
```bash
# Start the API server
composer start

# Start worker processes (in separate terminals)
composer worker
```

### Docker Setup
```bash
docker-compose up -d
```

## API Reference

### Authentication
All endpoints (except `/health`) require authentication via:
- **API Key**: Include `X-API-Key` header
- **JWT Token**: Include `Authorization: Bearer <token>` header

### Endpoints

#### Convert PDF to Word
```http
POST /convert/pdf-to-word
Content-Type: multipart/form-data

file: [PDF file]
pages: "1-5,8,10" (optional)
output_format: "docx" | "doc" (default: docx)
sync: true (optional, for synchronous processing)
```

**Response (Async)**:
```json
{
  "job_id": "uuid-here",
  "status": "queued",
  "message": "PDF to Word conversion queued for processing"
}
```

#### Convert PDF to Images
```http
POST /convert/pdf-to-images
Content-Type: multipart/form-data

file: [PDF file]
dpi: 150 (optional, 72-300)
format: "png" | "jpg" (default: png)
pages: "1-3" (optional)
combine: true (optional, creates single image or ZIP)
```

#### Convert Word to PDF
```http
POST /convert/word-to-pdf
Content-Type: multipart/form-data

file: [Word file]
page_size: "A4" | "Letter" (optional)
margin_preset: "normal" | "narrow" | "wide" (optional)
```

#### Image to Word (OCR)
```http
POST /convert/image-to-word
Content-Type: multipart/form-data

file: [Image file]
language: "eng" | "fra" | "deu" | ... (default: eng)
orientation: "auto" (optional)
```

#### Resize File
```http
POST /resize/file
Content-Type: multipart/form-data

file: [Any supported file]
target_size_kb: 1024 (required)
quality: 85 (optional, 1-100 for images)
compress_level: "low" | "medium" | "high" (for PDFs)
```

#### Resize Image
```http
POST /resize/image
Content-Type: multipart/form-data

file: [Image file]
width: 800 (required)
height: 600 (required)
preserve_aspect: true (optional)
fit: "contain" | "cover" | "fill" (optional)
quality: 85 (optional, 1-100)
```

#### Job Status
```http
GET /jobs/{jobId}
```

**Response**:
```json
{
  "job_id": "uuid-here",
  "status": "success",
  "progress": 100,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:45Z",
  "result": {
    "download_url": "/download/path/to/file.docx",
    "file_size": 1024000,
    "processing_time": 45.2
  }
}
```

#### Health Check
```http
GET /health
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Application environment | `development` |
| `APP_DEBUG` | Enable debug mode | `true` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `MAX_FILE_SIZE` | Maximum upload size | `100000000` (100MB) |
| `RATE_LIMIT_REQUESTS` | Requests per window | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit window (seconds) | `3600` |

### External Tools Configuration
Configure paths to external tools in `.env`:

```bash
LIBREOFFICE_PATH=/usr/bin/libreoffice
GHOSTSCRIPT_PATH=/usr/bin/gs
IMAGEMAGICK_PATH=/usr/bin/convert
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin/pdftoppm
CLAMAV_PATH=/usr/bin/clamdscan
```

## Security Features

### File Validation
- MIME type and extension validation
- File size limits (configurable)
- Malware scanning (ClamAV integration)
- Filename sanitization

### Access Control
- API key authentication
- JWT token support
- Rate limiting per API key/IP
- HTTPS enforcement in production

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy

## Deployment

### Production Checklist
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Set up Redis with authentication
- [ ] Configure file storage (S3 recommended)
- [ ] Set up monitoring and logging
- [ ] Configure rate limits for production
- [ ] Set up malware scanning
- [ ] Configure backup strategy

### Scaling
- Run multiple worker processes for job processing
- Use Redis Cluster for high availability
- Configure load balancer for API instances
- Use S3 or distributed storage for file storage

### Monitoring
- Monitor `/health` endpoint
- Track queue length and processing times
- Monitor disk usage and cleanup temp files
- Set up alerts for failed conversions

## Development

### Running Tests
```bash
composer test
```

### Code Quality
```bash
composer cs-check    # Check code style
composer cs-fix      # Fix code style issues
```

### Adding New Conversions
1. Create job class in `src/Jobs/`
2. Add service methods in `ConversionService`
3. Create controller endpoint
4. Register routes in `Application.php`
5. Update documentation

## Troubleshooting

### Common Issues

**LibreOffice conversion fails**
- Ensure LibreOffice is installed with headless support
- Check file permissions for temp directory
- Verify LibreOffice can run without X11

**Redis connection errors**
- Verify Redis is running: `redis-cli ping`
- Check Redis configuration and authentication
- Ensure Redis has sufficient memory

**File upload errors**
- Check PHP upload limits: `upload_max_filesize`, `post_max_size`
- Verify disk space in temp directory
- Check file permissions

### Performance Optimization
- Increase worker processes for parallel job processing
- Tune Redis memory settings
- Use SSD storage for temp files
- Configure PHP-FPM for better throughput

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the project repository
- Check the troubleshooting section
- Review server logs for error details