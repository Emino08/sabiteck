# API Usage Examples

This document provides practical examples of using the File Conversion Microservice API.

## Authentication

All API calls require authentication. Set your API key in the request header:

```bash
curl -H "X-API-Key: your-api-key-here" ...
```

Or use JWT authentication:

```bash
curl -H "Authorization: Bearer your-jwt-token" ...
```

## 1. PDF to Word Conversion

### Basic PDF to Word conversion (async)

```bash
curl -X POST http://localhost:8080/convert/pdf-to-word \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F "output_format=docx"
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "PDF to Word conversion queued for processing"
}
```

### Synchronous conversion with specific pages

```bash
curl -X POST "http://localhost:8080/convert/pdf-to-word?sync=true" \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F "pages=1-5,8,10" \
  -F "output_format=docx"
```

## 2. PDF to Images Conversion

### Convert PDF to PNG images

```bash
curl -X POST http://localhost:8080/convert/pdf-to-images \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F "format=png" \
  -F "dpi=300" \
  -F "pages=1-3"
```

### Combine all pages into single image

```bash
curl -X POST http://localhost:8080/convert/pdf-to-images \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F "format=jpg" \
  -F "combine=true"
```

## 3. Word to PDF Conversion

### Basic Word to PDF conversion

```bash
curl -X POST http://localhost:8080/convert/word-to-pdf \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.docx" \
  -F "page_size=A4" \
  -F "margin_preset=normal"
```

## 4. Image OCR to Word

### Extract text from image using OCR

```bash
curl -X POST http://localhost:8080/convert/image-to-word \
  -H "X-API-Key: your-api-key" \
  -F "file=@scanned_document.jpg" \
  -F "language=eng" \
  -F "orientation=auto"
```

### Multi-language OCR (French)

```bash
curl -X POST http://localhost:8080/convert/image-to-word \
  -H "X-API-Key: your-api-key" \
  -F "file=@french_document.png" \
  -F "language=fra"
```

## 5. File Resizing

### Compress file to specific size

```bash
curl -X POST http://localhost:8080/resize/file \
  -H "X-API-Key: your-api-key" \
  -F "file=@large_file.pdf" \
  -F "target_size_kb=1024" \
  -F "compress_level=medium"
```

### Compress image with quality control

```bash
curl -X POST http://localhost:8080/resize/file \
  -H "X-API-Key: your-api-key" \
  -F "file=@large_image.jpg" \
  -F "target_size_kb=500" \
  -F "quality=75"
```

## 6. Image Resizing

### Resize image to exact dimensions

```bash
curl -X POST http://localhost:8080/resize/image \
  -H "X-API-Key: your-api-key" \
  -F "file=@image.jpg" \
  -F "width=800" \
  -F "height=600" \
  -F "preserve_aspect=false" \
  -F "quality=90"
```

### Resize with aspect ratio preservation

```bash
curl -X POST http://localhost:8080/resize/image \
  -H "X-API-Key: your-api-key" \
  -F "file=@image.png" \
  -F "width=1200" \
  -F "height=800" \
  -F "preserve_aspect=true" \
  -F "fit=contain"
```

## 7. Job Status Checking

### Check job status

```bash
curl -X GET http://localhost:8080/jobs/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-api-key"
```

**Response (In Progress):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:25Z",
  "processing_time": 25,
  "estimated_remaining": 20
}
```

**Response (Completed):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "success",
  "progress": 100,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:45Z",
  "result": {
    "download_url": "/download/2024/01/15/converted_document.docx",
    "file_size": 1024000,
    "output_format": "docx",
    "pages_converted": "all"
  }
}
```

## 8. Health Check

### Check service health

```bash
curl -X GET http://localhost:8080/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "redis": {
      "status": "healthy",
      "response_time": 0.01,
      "message": "Redis connection successful"
    },
    "disk_space": {
      "status": "healthy",
      "free_space": "10.5 GB",
      "total_space": "20 GB",
      "used_percent": 47.5,
      "message": "Sufficient disk space"
    },
    "external_tools": {
      "status": "healthy",
      "tools": {
        "libreoffice": {
          "status": "healthy",
          "path": "/usr/bin/libreoffice",
          "version": "LibreOffice 7.4.2"
        },
        "ghostscript": {
          "status": "healthy",
          "path": "/usr/bin/gs",
          "version": "GPL Ghostscript 9.56.1"
        }
      },
      "message": "All external tools available"
    },
    "queue": {
      "status": "healthy",
      "queued_jobs": 3,
      "processing_jobs": 1,
      "message": "Queue system operational"
    }
  }
}
```

## Error Responses

### File too large
```json
{
  "error": "File too large. Maximum size: 100 MB",
  "code": "FILE_TOO_LARGE"
}
```

### Invalid file type
```json
{
  "error": "Invalid file type. Allowed: application/pdf, image/jpeg, ...",
  "code": "INVALID_FILE_TYPE"
}
```

### Rate limit exceeded
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

### Job not found
```json
{
  "error": "Job not found",
  "code": "NOT_FOUND"
}
```

### Processing failed
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "progress": 50,
  "error": "LibreOffice conversion failed: File is corrupted",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:30Z"
}
```

## JavaScript/Node.js Examples

### Using Axios for file upload

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function convertPdfToWord(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('output_format', 'docx');

  try {
    const response = await axios.post('http://localhost:8080/convert/pdf-to-word', form, {
      headers: {
        'X-API-Key': 'your-api-key',
        ...form.getHeaders()
      }
    });

    console.log('Job ID:', response.data.job_id);
    return response.data.job_id;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

async function checkJobStatus(jobId) {
  try {
    const response = await axios.get(`http://localhost:8080/jobs/${jobId}`, {
      headers: {
        'X-API-Key': 'your-api-key'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Usage
(async () => {
  const jobId = await convertPdfToWord('./document.pdf');

  // Poll for completion
  const interval = setInterval(async () => {
    const status = await checkJobStatus(jobId);
    console.log('Status:', status.status, 'Progress:', status.progress + '%');

    if (status.status === 'success') {
      console.log('Download URL:', status.result.download_url);
      clearInterval(interval);
    } else if (status.status === 'failed') {
      console.error('Job failed:', status.error);
      clearInterval(interval);
    }
  }, 2000);
})();
```

## Python Examples

### Using requests for file upload

```python
import requests
import time

def convert_pdf_to_word(file_path, api_key):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'output_format': 'docx'}
        headers = {'X-API-Key': api_key}

        response = requests.post(
            'http://localhost:8080/convert/pdf-to-word',
            files=files,
            data=data,
            headers=headers
        )

        if response.status_code == 202:
            return response.json()['job_id']
        else:
            print(f"Error: {response.json()}")
            return None

def check_job_status(job_id, api_key):
    headers = {'X-API-Key': api_key}
    response = requests.get(
        f'http://localhost:8080/jobs/{job_id}',
        headers=headers
    )
    return response.json()

# Usage
api_key = 'your-api-key'
job_id = convert_pdf_to_word('./document.pdf', api_key)

if job_id:
    while True:
        status = check_job_status(job_id, api_key)
        print(f"Status: {status['status']} - Progress: {status['progress']}%")

        if status['status'] == 'success':
            print(f"Download URL: {status['result']['download_url']}")
            break
        elif status['status'] == 'failed':
            print(f"Job failed: {status['error']}")
            break

        time.sleep(2)
```