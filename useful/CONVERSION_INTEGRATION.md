# File Conversion Microservice Integration

This document explains how the file conversion microservice has been integrated into the Sabiteck website.

## Integration Overview

The file conversion microservice is now integrated into the Sabiteck website under the **Tools** page as a new tab called "File Converter". Users can access various document conversion and file processing features directly from the website.

## Files Added/Modified

### New Files Added

1. **`frontend/src/services/conversionApi.js`** - API service layer for communication with the microservice
2. **`frontend/src/components/tools/FileConverter.jsx`** - Main React component for the file converter interface
3. **`frontend/.env.example`** - Environment configuration template
4. **`conversion-microservice/`** - Complete PHP microservice (separate folder)

### Modified Files

1. **`frontend/src/components/pages/Tools.jsx`** - Updated to include the File Converter tab

## Features Available

### Document Conversion
- **PDF to Word** - Convert PDF documents to editable Word files (DOC/DOCX)
- **PDF to Images** - Extract PDF pages as image files (PNG/JPG) with quality options
- **Word to PDF** - Convert Word documents to PDF format
- **Image to Word (OCR)** - Extract text from images using optical character recognition

### File Processing
- **File Compressor** - Reduce file size for PDFs and images
- **Image Resizer** - Resize images to specific dimensions with aspect ratio control

### Advanced Features
- **Async Processing** - Large files are processed in the background with progress tracking
- **Job Status Tracking** - Real-time progress updates and job monitoring
- **Conversion History** - Track recent conversions with download links
- **File Validation** - Automatic file type and size validation
- **Error Handling** - Comprehensive error reporting and user feedback

## Setup Instructions

### 1. Backend Setup (Microservice)

```bash
# Navigate to the microservice directory
cd conversion-microservice

# Install PHP dependencies
composer install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start Redis server (required)
redis-server

# Start the API server
composer start

# Start worker processes (in separate terminals)
composer worker
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Copy environment configuration
cp .env.example .env

# Update .env with your microservice URL and API key
# VITE_CONVERSION_API_URL=http://localhost:8080
# VITE_CONVERSION_API_KEY=your-api-key-here

# Install dependencies (if not already done)
npm install

# Start development server
npm start
```

### 3. External Tools Installation

The microservice requires these external tools to be installed:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    libreoffice \
    ghostscript \
    imagemagick \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    clamav

# macOS (using Homebrew)
brew install libreoffice ghostscript imagemagick tesseract poppler clamav

# Windows
# Download and install each tool manually or use package managers like Chocolatey
```

## Configuration Options

### Environment Variables

#### Frontend (`.env`)
```bash
VITE_CONVERSION_API_URL=http://localhost:8080
VITE_CONVERSION_API_KEY=your-api-key-here
```

#### Backend (`conversion-microservice/.env`)
```bash
# Application
APP_ENV=development
APP_DEBUG=true
JWT_SECRET=your-jwt-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# File Limits
MAX_FILE_SIZE=100000000  # 100MB
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# External Tools Paths
LIBREOFFICE_PATH=/usr/bin/libreoffice
GHOSTSCRIPT_PATH=/usr/bin/gs
IMAGEMAGICK_PATH=/usr/bin/convert
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin/pdftoppm
```

## Usage Guide

1. **Navigate to Tools Page** - Go to the Tools section on the Sabiteck website
2. **Select File Converter Tab** - Click on the "File Converter" tab
3. **Choose Conversion Type** - Select from the available conversion options
4. **Upload File** - Drag and drop or click to select your file
5. **Configure Options** - Adjust conversion settings as needed
6. **Start Conversion** - Click "Start Conversion" button
7. **Monitor Progress** - Watch the progress bar for async conversions
8. **Download Result** - Click download when conversion completes

## API Integration Details

### Service Layer (`conversionApi.js`)

The service provides methods for:
- File upload and validation
- Conversion job submission
- Progress polling
- Result retrieval
- Error handling

### Component Architecture (`FileConverter.jsx`)

The component includes:
- **Tabbed Interface** - Switch between conversion types
- **File Upload Area** - Drag-and-drop with validation
- **Options Panel** - Conversion-specific settings
- **Progress Tracking** - Real-time progress updates
- **Result Display** - Download links and file info
- **History Panel** - Recent conversion tracking

## Security Features

- **File Validation** - Type, size, and content validation
- **API Key Authentication** - Secure API access
- **Rate Limiting** - Prevent abuse
- **Malware Scanning** - Optional ClamAV integration
- **HTTPS Support** - Secure data transmission

## Production Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
cd conversion-microservice
docker-compose up -d
```

### Manual Deployment

1. **Deploy Microservice** - Set up PHP server with all dependencies
2. **Configure Nginx** - Set up reverse proxy with rate limiting
3. **Start Redis** - Ensure Redis is running for job queue
4. **Start Workers** - Run multiple worker processes
5. **Update Frontend** - Set production API URL and key

### Scaling Considerations

- **Horizontal Scaling** - Run multiple API and worker instances
- **Load Balancing** - Distribute requests across instances
- **Redis Cluster** - Scale job queue for high availability
- **File Storage** - Use S3 or distributed storage for files
- **Monitoring** - Set up health checks and alerting

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size limits
   - Verify file type support
   - Ensure API is accessible

2. **Conversion Errors**
   - Verify external tools are installed
   - Check file permissions
   - Review error logs

3. **Job Stuck Processing**
   - Restart worker processes
   - Check Redis connection
   - Verify job queue status

4. **API Connection Issues**
   - Verify API URL and key
   - Check CORS settings
   - Test health endpoint

### Health Check

Test the microservice health:
```bash
curl http://localhost:8080/health
```

### Logs

Check application logs:
```bash
# API logs
tail -f conversion-microservice/logs/app.log

# Worker logs
tail -f conversion-microservice/logs/worker.log
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review microservice logs for errors
3. Test the health endpoint
4. Verify all external tools are properly installed