import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image,
  Download,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  FileImage,
  FileType,
  Maximize2
} from 'lucide-react';
import conversionApi, { ConversionApiService } from '../../services/conversionApi';

const FileConverter = () => {
  const [activeTab, setActiveTab] = useState('pdf-to-word');
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef(null);

  // Conversion options state
  const [options, setOptions] = useState({
    // PDF to Word
    pdfToWordFormat: 'docx',
    pages: '',

    // PDF to Images
    dpi: 150,
    imageFormat: 'png',
    combineImages: false,

    // Word to PDF
    pageSize: 'A4',
    marginPreset: 'normal',

    // Image to Word
    ocrLanguage: 'eng',

    // File Resize
    targetSizeKb: 1024,
    quality: 85,
    compressLevel: 'medium',

    // Image Resize
    width: 800,
    height: 600,
    preserveAspect: true,
    fit: 'contain'
  });

  const conversionTypes = {
    'pdf-to-word': {
      name: 'PDF to Word',
      icon: FileText,
      description: 'Convert PDF documents to editable Word files',
      acceptedTypes: '.pdf',
      mimeTypes: ['application/pdf']
    },
    'pdf-to-images': {
      name: 'PDF to Images',
      icon: FileImage,
      description: 'Extract pages from PDF as image files',
      acceptedTypes: '.pdf',
      mimeTypes: ['application/pdf']
    },
    'word-to-pdf': {
      name: 'Word to PDF',
      icon: FileType,
      description: 'Convert Word documents to PDF format',
      acceptedTypes: '.doc,.docx',
      mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    'image-to-word': {
      name: 'Image to Word (OCR)',
      icon: Image,
      description: 'Extract text from images using OCR technology',
      acceptedTypes: '.jpg,.jpeg,.png,.gif,.webp,.tiff,.bmp',
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp']
    },
    'resize-file': {
      name: 'File Compressor',
      icon: Maximize2,
      description: 'Reduce file size by compressing documents and images',
      acceptedTypes: '.pdf,.jpg,.jpeg,.png,.gif,.webp,.tiff,.bmp',
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp']
    },
    'resize-image': {
      name: 'Image Resizer',
      icon: Maximize2,
      description: 'Resize images to specific dimensions',
      acceptedTypes: '.jpg,.jpeg,.png,.gif,.webp,.tiff,.bmp',
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp']
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      try {
        ConversionApiService.validateFile(selectedFile);
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } catch (error) {
        setError(error.message);
        setFile(null);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      try {
        ConversionApiService.validateFile(droppedFile);
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } catch (error) {
        setError(error.message);
        setFile(null);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setJobId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (conversionResult) => {
    if (downloading) return; // Prevent multiple simultaneous downloads

    try {
      setDownloading(true);
      setError(null); // Clear any previous errors

      // Debug: Log the conversion result structure
      console.log('Download requested for result:', conversionResult);

      // Get download URL from different possible locations in the response
      let downloadUrl = null;

      if (conversionResult.download_info?.download_url) {
        downloadUrl = conversionResult.download_info.download_url;
      } else if (conversionResult.result?.download_url) {
        downloadUrl = conversionResult.result.download_url;
      } else if (conversionResult.download_url) {
        downloadUrl = conversionResult.download_url;
      }

      if (!downloadUrl) {
        console.error('No download URL found. Result structure:', conversionResult);
        setError('Download URL not found in conversion result. The file may have expired or been moved.');
        return;
      }

      console.log('Download URL found:', downloadUrl);

      // Ensure the URL is absolute
      if (downloadUrl.startsWith('/')) {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        downloadUrl = `${baseURL}${downloadUrl}`;
        console.log('Converted to absolute URL:', downloadUrl);
      }

      // Test if the download URL is accessible before triggering download
      try {
        const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`File not accessible: ${testResponse.status} ${testResponse.statusText}`);
        }
        console.log('Download URL is accessible');
      } catch (fetchError) {
        console.warn('Cannot test download URL, proceeding anyway:', fetchError);
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = ''; // Let the browser determine filename from headers
      link.style.display = 'none';
      document.body.appendChild(link);

      try {
        link.click();
        console.log('Download initiated successfully');
        // You could add a success message state here if needed
      } catch (clickError) {
        throw new Error('Failed to initiate download. Please try copying the URL: ' + downloadUrl);
      } finally {
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('Download error:', error);
      setError(`Download failed: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file to convert');
      return;
    }

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      let response;

      switch (activeTab) {
        case 'pdf-to-word':
          response = await conversionApi.convertPdfToWord(file, {
            outputFormat: options.pdfToWordFormat,
            pages: options.pages || undefined
          });
          break;

        case 'pdf-to-images':
          response = await conversionApi.convertPdfToImages(file, {
            dpi: options.dpi,
            format: options.imageFormat,
            pages: options.pages || undefined,
            combine: options.combineImages
          });
          break;

        case 'word-to-pdf':
          response = await conversionApi.convertWordToPdf(file, {
            pageSize: options.pageSize,
            marginPreset: options.marginPreset
          });
          break;

        case 'image-to-word':
          response = await conversionApi.convertImageToWord(file, {
            language: options.ocrLanguage
          });
          break;

        case 'resize-file':
          response = await conversionApi.resizeFile(file, options.targetSizeKb, {
            quality: options.quality,
            compressLevel: options.compressLevel
          });
          break;

        case 'resize-image':
          response = await conversionApi.resizeImage(file, options.width, options.height, {
            preserveAspect: options.preserveAspect,
            fit: options.fit,
            quality: options.quality
          });
          break;

        default:
          throw new Error('Invalid conversion type');
      }

      if (response.job_id) {
        setJobId(response.job_id);

        // Poll for job completion
        const finalResult = await conversionApi.pollJobStatus(
          response.job_id,
          (status) => {
            setProgress(status.progress || 0);
          }
        );

        setResult(finalResult);

        // Add to history
        const historyItem = {
          id: response.job_id,
          type: activeTab,
          filename: file.name,
          timestamp: new Date(),
          result: finalResult
        };
        setConversionHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
      } else {
        // Synchronous conversion
        if (response.status === 'error') {
          setError(response.error || 'Conversion failed');
        } else {
          setResult(response);
          setProgress(100);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setConverting(false);
    }
  };

  const renderOptions = () => {
    switch (activeTab) {
      case 'pdf-to-word':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={options.pdfToWordFormat}
                onChange={(e) => setOptions({...options, pdfToWordFormat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="docx">DOCX (Recommended)</option>
                <option value="doc">DOC (Legacy)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Range (optional)
              </label>
              <input
                type="text"
                value={options.pages}
                onChange={(e) => setOptions({...options, pages: e.target.value})}
                placeholder="e.g., 1-5, 8, 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'pdf-to-images':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DPI Quality
              </label>
              <select
                value={options.dpi}
                onChange={(e) => setOptions({...options, dpi: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={72}>72 DPI (Web)</option>
                <option value={150}>150 DPI (Standard)</option>
                <option value={300}>300 DPI (High Quality)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Format
              </label>
              <select
                value={options.imageFormat}
                onChange={(e) => setOptions({...options, imageFormat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="png">PNG (Best Quality)</option>
                <option value="jpg">JPG (Smaller Size)</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={options.combineImages}
                onChange={(e) => setOptions({...options, combineImages: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                Combine all pages into single image
              </label>
            </div>
          </div>
        );

      case 'image-to-word':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OCR Language
              </label>
              <select
                value={options.ocrLanguage}
                onChange={(e) => setOptions({...options, ocrLanguage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="eng">English</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="spa">Spanish</option>
              </select>
            </div>
          </div>
        );

      case 'resize-file':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Size (KB)
              </label>
              <input
                type="number"
                value={options.targetSizeKb}
                onChange={(e) => setOptions({...options, targetSizeKb: parseInt(e.target.value)})}
                min="1"
                max="10240"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Level
              </label>
              <select
                value={options.compressLevel}
                onChange={(e) => setOptions({...options, compressLevel: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low (Better Quality)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Smaller Size)</option>
              </select>
            </div>
          </div>
        );

      case 'resize-image':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={options.width}
                  onChange={(e) => setOptions({...options, width: parseInt(e.target.value)})}
                  min="1"
                  max="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={options.height}
                  onChange={(e) => setOptions({...options, height: parseInt(e.target.value)})}
                  min="1"
                  max="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={options.preserveAspect}
                onChange={(e) => setOptions({...options, preserveAspect: e.target.checked})}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                Preserve aspect ratio
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Conversion Type Tabs */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {Object.entries(conversionTypes).map(([key, type]) => {
            const Icon = type.icon;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  resetForm();
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  activeTab === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="font-medium text-sm">{type.name}</span>
                </div>
                <p className="text-xs opacity-80">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {conversionTypes[activeTab].name}
          </h3>

          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center space-x-4">
                <div className="text-4xl">
                  {ConversionApiService.getFileTypeIcon(file.type)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {ConversionApiService.formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: {conversionTypes[activeTab].acceptedTypes}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={conversionTypes[activeTab].acceptedTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select File
                </button>
              </div>
            )}
          </div>

          {/* Conversion Options */}
          {file && (
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="font-medium text-gray-900">Conversion Options</h4>
              </div>
              {renderOptions()}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {converting && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Converting...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {jobId && (
                <p className="text-xs text-gray-500 mt-2">Job ID: {jobId}</p>
              )}
            </div>
          )}

          {/* Success Result */}
          {result && (result.status === 'success' || result.status === 'completed') && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Conversion Complete!</span>
              </div>
              {(result.result || result.download_url || result.download_info?.download_url) && (
                <div className="space-y-2 text-sm text-green-700">
                  {(result.download_info?.file_size || result.result?.file_size) && (
                    <p>File size: {result.download_info?.file_size || ConversionApiService.formatFileSize(result.result.file_size)}</p>
                  )}
                  {result.result?.compression_ratio && (
                    <p>Compression: {Math.round((1 - result.result.compression_ratio) * 100)}% reduction</p>
                  )}
                  {(result.ocr_results?.confidence || result.result?.text_extracted) && (
                    <p>Text extraction: {result.ocr_results?.confidence ? `${Math.round(result.ocr_results.confidence * 100)}% confidence` : 'Successful'}</p>
                  )}
                  {result.result?.image_count && (
                    <p>Images extracted: {result.result.image_count}</p>
                  )}
                  {result.ocr_results?.word_count && (
                    <p>Text extracted: {result.ocr_results.word_count} words</p>
                  )}
                  {result.download_info?.expires_in && (
                    <p className="text-yellow-600">Download expires in: {result.download_info.expires_in}</p>
                  )}
                  <button
                    onClick={() => handleDownload(result)}
                    disabled={downloading}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      downloading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {downloading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Convert Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleConvert}
              disabled={!file || converting}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                !file || converting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {converting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                'Start Conversion'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conversion History */}
      {conversionHistory.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversions</h3>
            <div className="space-y-3">
              {conversionHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {ConversionApiService.getFileTypeIcon('application/pdf')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.filename}</p>
                      <p className="text-sm text-gray-500">
                        {conversionTypes[item.type].name} • {item.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {(item.result.result || item.result.download_url || item.result.download_info?.download_url) && (
                    <button
                      onClick={() => handleDownload(item.result)}
                      disabled={downloading}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        downloading
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {downloading ? 'Downloading...' : 'Download'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileConverter;