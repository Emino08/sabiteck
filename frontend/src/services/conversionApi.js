// API service for file conversion using Sabiteck backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ConversionApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Convert PDF to Word
  async convertPdfToWord(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (options.pages) formData.append('pages', options.pages);
    if (options.outputFormat) formData.append('output_format', options.outputFormat);

    // Backend endpoints don't use sync query parameter

    return this.makeRequest('/api/convert/pdf-to-word', {
      method: 'POST',
      body: formData
    });
  }

  // Convert PDF to Images
  async convertPdfToImages(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (options.dpi) formData.append('dpi', options.dpi.toString());
    if (options.format) formData.append('format', options.format);
    if (options.pages) formData.append('pages', options.pages);
    if (options.combine !== undefined) formData.append('combine', options.combine.toString());

    // Backend endpoints don't use sync query parameter

    return this.makeRequest('/api/convert/pdf-to-images', {
      method: 'POST',
      body: formData
    });
  }

  // Convert Word to PDF
  async convertWordToPdf(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (options.pageSize) formData.append('page_size', options.pageSize);
    if (options.marginPreset) formData.append('margin_preset', options.marginPreset);

    // Backend endpoints don't use sync query parameter

    return this.makeRequest('/api/convert/word-to-pdf', {
      method: 'POST',
      body: formData
    });
  }

  // Convert Image to Word (OCR)
  async convertImageToWord(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (options.language) formData.append('language', options.language);
    if (options.orientation) formData.append('orientation', options.orientation);

    // Backend endpoints don't use sync query parameter

    return this.makeRequest('/api/convert/image-to-word', {
      method: 'POST',
      body: formData
    });
  }

  // Resize File
  async resizeFile(file, targetSizeKb, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_size_kb', targetSizeKb.toString());

    if (options.quality) formData.append('quality', options.quality.toString());
    if (options.compressLevel) formData.append('compress_level', options.compressLevel);

    return this.makeRequest('/api/resize/file', {
      method: 'POST',
      body: formData
    });
  }

  // Resize Image
  async resizeImage(file, width, height, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    if (options.quality) formData.append('quality', options.quality.toString());
    if (options.preserveAspect !== undefined) formData.append('preserve_aspect', options.preserveAspect.toString());
    if (options.fit) formData.append('fit', options.fit);

    return this.makeRequest('/api/resize/image', {
      method: 'POST',
      body: formData
    });
  }

  // Compress File
  async compressFile(file, quality = 75) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality.toString());

    return this.makeRequest('/api/compress/file', {
      method: 'POST',
      body: formData
    });
  }

  // Poll job status for async operations
  async pollJobStatus(jobId, onProgress = null) {
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.makeRequest(`/jobs/${jobId}`);

        if (onProgress && typeof onProgress === 'function') {
          onProgress(response);
        }

        if (response.status === 'success' || response.status === 'completed') {
          return response;
        }

        if (response.status === 'failed' || response.status === 'error') {
          throw new Error(response.error || 'Job failed');
        }

        // Continue polling if status is 'queued' or 'processing'
        if (response.status === 'queued' || response.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Job polling timeout - conversion may still be processing');
  }

  // Check job status once
  async checkJobStatus(jobId) {
    return this.makeRequest(`/jobs/${jobId}`);
  }

  // Health Check
  async healthCheck() {
    return this.makeRequest('/');
  }

  // Format file size for display
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  static getFileTypeIcon(mimeType) {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  }

  // Validate file for conversion
  static validateFile(file, maxSize = 100 * 1024 * 1024) { // 100MB default
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
      'image/bmp'
    ];

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${ConversionApiService.formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    return true;
  }
}

// Export both the class and an instance
export { ConversionApiService };
export default new ConversionApiService();