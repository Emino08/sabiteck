import React, { useState, useEffect } from 'react';

// Custom UI Components
const Button = ({ children, onClick, disabled, variant, size, className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white",
    ghost: "text-purple-600 hover:bg-purple-50",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant || 'default']} ${sizes[size || 'default']} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-slate-900/60 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-2xl ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-white ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 pb-6 ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-3 bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${className}`}
    {...props}
  />
);

// Simple toast function
const toast = {
  success: (message) => console.log('Success:', message),
  error: (message) => console.error('Error:', message)
};

import {
  BookOpen,
  Download,
  Search,
  Filter,
  Monitor,
  Briefcase,
  Cog,
  Heart,
  GraduationCap,
  Palette,
  FileText,
  Star,
  Users,
  Database,
  Globe,
  ChevronRight,
  Clock,
  Award,
  BookMarked,
  CheckCircle,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// Enhanced PDF Viewer Component
const PDFViewer = ({ pdfUrl, subjectName, subjectData, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingTime, setReadingTime] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Calculate reading time based on subject data
  useEffect(() => {
    if (subjectData) {
      // Estimate reading time based on credit hours (roughly 15-20 pages per credit hour)
      const estimatedPages = subjectData.credit_hours * 18;
      const wordsPerPage = 250; // Average words per academic page
      const readingSpeed = 200; // Average reading speed (words per minute)
      const totalWords = estimatedPages * wordsPerPage;
      const timeInMinutes = Math.ceil(totalWords / readingSpeed);
      setReadingTime(timeInMinutes);
      setPageCount(estimatedPages);
    }
  }, [subjectData]);

  const formatReadingTime = (minutes) => {
    if (minutes < 60) return `${minutes} min read`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m read`;
  };

  const handleDownload = async () => {
    try {
      // Use the download endpoint specifically for downloading
      const downloadUrl = `${API_BASE_URL}/api/curriculum/download?subject_id=${selectedPDF.data.id}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${subjectName}_curriculum.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('Download error:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleZoom = (action) => {
    if (action === 'in' && zoom < 200) {
      setZoom(zoom + 25);
    } else if (action === 'out' && zoom > 50) {
      setZoom(zoom - 25);
    } else if (action === 'reset') {
      setZoom(100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-white/10">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{subjectName}</h3>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center text-emerald-300">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatReadingTime(readingTime)}
                </span>
                <span className="flex items-center text-blue-300">
                  <FileText className="w-4 h-4 mr-1" />
                  ~{pageCount} pages
                </span>
                <span className="flex items-center text-purple-300">
                  <Award className="w-4 h-4 mr-1" />
                  {subjectData?.credit_hours} Credits
                </span>
              </div>
            </div>
          </div>

          {/* Reading Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <Button
                onClick={() => handleZoom('out')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm font-medium px-2">{zoom}%</span>
              <Button
                onClick={() => handleZoom('in')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleDownload}
              variant="success"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>

            <Button
              onClick={toggleFullscreen}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Fullscreen</span>
            </Button>

            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>Reading Progress</span>
            <span>{readingProgress}% completed</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar with Reading Tools */}
        <div className="w-80 bg-slate-900/50 backdrop-blur-lg border-r border-white/10 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Document Info */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-3">Document Overview</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Course Code:</span>
                    <span className="text-white font-medium">{subjectData?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Credits:</span>
                    <span className="text-white font-medium">{subjectData?.credit_hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Prerequisites:</span>
                    <span className="text-white font-medium">{subjectData?.prerequisites}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white font-medium">{subjectData?.category_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reading Analytics */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-3">Reading Analytics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Estimated Time:</span>
                    <span className="text-emerald-400 font-medium">{formatReadingTime(readingTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Pages:</span>
                    <span className="text-blue-400 font-medium">~{pageCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Difficulty:</span>
                    <span className="text-yellow-400 font-medium">
                      {subjectData?.credit_hours > 3 ? 'Advanced' : 'Intermediate'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleZoom('reset')}
                    variant="outline"
                    size="sm"
                    className="w-full text-white border-white/20 hover:bg-white/10"
                  >
                    Reset Zoom
                  </Button>
                  <Button
                    onClick={() => setReadingProgress(Math.min(100, readingProgress + 10))}
                    variant="outline"
                    size="sm"
                    className="w-full text-white border-white/20 hover:bg-white/10"
                  >
                    Mark Progress +10%
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="success"
                    size="sm"
                    className="w-full"
                  >
                    Save for Offline
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Outcomes */}
            {subjectData?.learning_outcomes && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h4 className="text-white font-semibold mb-3">Learning Outcomes</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {subjectData.learning_outcomes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* PDF Display Area */}
        <div className="flex-1 bg-gray-50 relative">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">Unable to display PDF</h3>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <div className="space-x-3">
                  <Button onClick={handleDownload} variant="success" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF Instead
                  </Button>
                  <Button onClick={onClose} variant="outline" size="lg">
                    Close Viewer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              <iframe
                src={`${pdfUrl}#zoom=${zoom}`}
                className="w-full h-full border-0"
                title={`${subjectName} Curriculum`}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('PDF could not be displayed in browser. This may be due to browser security settings or PDF format compatibility.');
                }}
              />

              {/* Floating Page Navigator */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-lg rounded-full px-6 py-3 flex items-center space-x-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white font-medium">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Document...</h3>
                <p className="text-gray-500">Preparing your reading experience</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CurriculumViewer = () => {
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const iconMap = {
    Monitor: Monitor,
    Briefcase: Briefcase,
    Cog: Cog,
    Heart: Heart,
    GraduationCap: GraduationCap,
    Palette: Palette,
    BookOpen: BookOpen,
    FileText: FileText,
    Star: Star,
    Users: Users,
    Database: Database,
    Globe: Globe
  };

  useEffect(() => {
    fetchData();
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, selectedCategory, searchTerm]);

  const fetchData = async () => {
    try {
      const [categoriesResponse, subjectsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/curriculum/categories`),
        fetch(`${API_BASE_URL}/api/curriculum/subjects`)
      ]);

      const categoriesData = await categoriesResponse.json();
      const subjectsData = await subjectsResponse.json();

      if (categoriesData.success && subjectsData.success) {
        setCategories(categoriesData.data);
        setSubjects(subjectsData.data);
      } else {
        throw new Error('Failed to fetch curriculum data');
      }
    } catch (error) {
      toast.error('Failed to load curriculum data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (selectedCategory) {
      filtered = filtered.filter(subject => subject.category_id === selectedCategory.id);
    }

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category);
  };

  const handleViewPDF = (subject) => {
    // Check if it's an external link
    if (subject.file_path && (subject.file_path.startsWith('http://') || subject.file_path.startsWith('https://'))) {
      // For external links, open in new tab
      window.open(subject.file_path, '_blank');
      return;
    }

    // Create a direct PDF URL for viewing (inline, not download)
    const pdfUrl = `${API_BASE_URL}/api/curriculum/view?subject_id=${subject.id}`;
    setSelectedPDF({ url: pdfUrl, name: subject.name, data: subject });
  };

  const handleDownloadPDF = async (subject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/curriculum/download?subject_id=${subject.id}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${subject.name}_curriculum.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Curriculum downloaded successfully');
    } catch (error) {
      toast.error('Failed to download curriculum');
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading curriculum data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-blue-900 p-4 rounded-2xl">
      {/* Header */}
      <div className={`text-center transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
              <BookOpen className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
          Academic Curriculum
        </h2>
        <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
          Access comprehensive curriculum materials for various academic programs. View online or download for offline study.
        </p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{categories.length}</h3>
            <p className="text-gray-200">Academic Categories</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full">
                <BookMarked className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{subjects.length}</h3>
            <p className="text-gray-200">Available Subjects</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full">
                <Award className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{subjects.length}</h3>
            <p className="text-gray-200">PDF Documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className={`flex flex-col lg:flex-row gap-6 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search subjects, codes, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>
        <div className="lg:w-80">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory?.id || ''}
              onChange={(e) => {
                const categoryId = parseInt(e.target.value);
                const category = categories.find(cat => cat.id === categoryId);
                setSelectedCategory(category || null);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id} className="bg-gray-800 text-white">
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
        {categories.map((category, index) => {
          const IconComponent = iconMap[category.icon] || BookOpen;
          const isSelected = selectedCategory?.id === category.id;

          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:border-white/30 ${
                isSelected ? 'ring-2 ring-emerald-500 border-emerald-500/50' : ''
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${category.color}-500/20 rounded-lg`}>
                    <IconComponent className={`w-8 h-8 text-${category.color}-400`} />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{category.subject_count}</span>
                    <p className="text-gray-200 text-sm">Subjects</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                <p className="text-gray-200 text-sm mb-4">{category.description}</p>
                <div className="flex justify-between items-center">
                  <Button
                    variant={isSelected ? "success" : "outline"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <span>{isSelected ? 'Selected' : 'View Subjects'}</span>
                    {isSelected ? <CheckCircle className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subjects List */}
      {filteredSubjects.length > 0 && (
        <div className={`transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              {selectedCategory ? `${selectedCategory.name} Subjects` : 'All Subjects'}
            </h3>
            <span className="text-gray-200">{filteredSubjects.length} subjects found</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubjects.map((subject, index) => (
              <Card key={subject.id} className="group hover:scale-105 hover:border-white/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full bg-${subject.category_color}-500/20 text-${subject.category_color}-400`}>
                          {subject.code}
                        </span>
                        <span className="text-gray-200 text-sm">{subject.credit_hours} Credits</span>
                      </div>
                      <CardTitle className="text-white group-hover:text-emerald-400 transition-colors duration-200">
                        {subject.name}
                      </CardTitle>
                      <p className="text-gray-200 text-sm mt-2">{subject.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-300 font-medium">Prerequisites:</span>
                        <p className="text-gray-200">{subject.prerequisites}</p>
                      </div>
                      <div>
                        <span className="text-gray-300 font-medium">Category:</span>
                        <p className="text-gray-200">{subject.category_name}</p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleViewPDF(subject)}
                        variant="success"
                        className="flex-1 flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View PDF</span>
                      </Button>
                      <Button
                        onClick={() => handleDownloadPDF(subject)}
                        variant="outline"
                        className="flex-1 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredSubjects.length === 0 && !loading && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No subjects found</h3>
          <p className="text-gray-200">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <PDFViewer
          pdfUrl={selectedPDF.url}
          subjectName={selectedPDF.name}
          subjectData={selectedPDF.data}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
};

export default CurriculumViewer;