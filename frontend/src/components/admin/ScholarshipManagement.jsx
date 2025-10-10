import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    DollarSign,
    Award,
    Users,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Download,
    Upload,
    Settings,
    X,
    Star,
    Crown,
    Sparkles,
    TrendingUp,
    Target,
    Zap,
    Shield,
    Rocket,
    Diamond,
    Briefcase,
    CheckCircle2,
    Clock,
    Layers,
    GraduationCap,
    Building,
    Globe,
    Copy,
    FileImage,
    FileText,
    Printer,
    Image,
    Layout,
    Palette
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ScholarshipEditor from './ScholarshipEditor';
import EnhancedSearchBar, { AdvancedFiltersPanel } from '../ui/EnhancedSearchBar';
import FilterBasedSearch, { scholarshipFilters } from '../ui/FilterBasedSearch';
import { toast } from 'sonner';

const ScholarshipManagement = () => {
    console.log('🚀 NEW ScholarshipManagement component loaded successfully!');
    // State management
    const [activeTab, setActiveTab] = useState('manage');
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedScholarships, setSelectedScholarships] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingScholarship, setEditingScholarship] = useState(null);
    
    // Enhanced search features
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        amount_min: '',
        amount_max: '',
        deadline_from: '',
        deadline_to: '',
        location: '',
        level: ''
    });
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    
    // Filter-based search
    const [filterBasedFilters, setFilterBasedFilters] = useState({
        status: '',
        category: '',
        amount_min: '',
        amount_max: '',
        deadline_from: '',
        deadline_to: '',
        location: '',
        level: '',
        featured: false
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // Categories - ALWAYS ENSURE ARRAY
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        draft: 0,
        expired: 0,
        featured: 0
    });

    // Load data
    useEffect(() => {
        loadScholarships();
        loadCategories();
        loadStats();
    }, [currentPage, searchTerm, selectedStatus, selectedCategory, advancedFilters, filterBasedFilters]);

    const loadCategories = async () => {
        try {
            console.log('🚀 Loading categories...');
            setCategoriesLoading(true);

            const response = await apiRequest('/api/admin/scholarships/categories');
            console.log('📋 Categories API Response:', response);

            // Handle the exact backend response format
            if (response && response.success && response.data && Array.isArray(response.data)) {
                console.log('✅ Setting categories:', response.data);
                setCategories(response.data);

                toast.success(`📂 ${response.data.length} categories loaded`, {
                    description: 'Scholarship categories are ready for filtering',
                    duration: 1500
                });
            } else {
                console.warn('⚠️ Invalid categories response, using empty array');
                setCategories([]);

                toast.warning('📂 No categories available', {
                    description: 'Categories will be created automatically as needed',
                    duration: 2000
                });
            }
        } catch (err) {
            console.error('❌ Error loading categories:', err);
            setCategoriesError('Failed to load categories');
            setCategories([]);

            toast.error('❌ Failed to load categories', {
                description: 'Unable to retrieve category data',
                duration: 3000
            });
        } finally {
            setCategoriesLoading(false);
        }
    };

    const loadScholarships = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters for backend filtering
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedStatus) params.append('status', selectedStatus);
            if (selectedCategory) params.append('category', selectedCategory);
            
            // Add advanced filters if active
            if (advancedFilters.amount_min) params.append('amount_min', advancedFilters.amount_min);
            if (advancedFilters.amount_max) params.append('amount_max', advancedFilters.amount_max);
            if (advancedFilters.deadline_from) params.append('deadline_from', advancedFilters.deadline_from);
            if (advancedFilters.deadline_to) params.append('deadline_to', advancedFilters.deadline_to);
            if (advancedFilters.location) params.append('location', advancedFilters.location);
            if (advancedFilters.level) params.append('level', advancedFilters.level);
            
            // Add filter-based search parameters
            Object.entries(filterBasedFilters).forEach(([key, value]) => {
                if (value && value !== '' && value !== false && (!Array.isArray(value) || value.length > 0)) {
                    if (Array.isArray(value)) {
                        params.append(key, value.join(','));
                    } else {
                        params.append(key, value);
                    }
                }
            });
            
            params.append('page', currentPage.toString());
            params.append('limit', '10');

            const url = `/api/admin/scholarships${params.toString() ? '?' + params.toString() : ''}`;

            const response = await apiRequest(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response && response.success) {
                const scholarshipData = Array.isArray(response.data) ? response.data : [];

                setScholarships(scholarshipData);
                setTotalCount(response.total || scholarshipData.length);
                setTotalPages(response.total_pages || Math.ceil((response.total || scholarshipData.length) / 10));
                
                // Generate search suggestions from scholarship titles
                if (scholarshipData.length > 0) {
                    const suggestions = scholarshipData
                        .slice(0, 5)
                        .map(s => s.title)
                        .filter(Boolean);
                    setSearchSuggestions(suggestions);
                }

                // Show success toast when data loads successfully
                if (scholarshipData.length > 0) {
                    toast.success(`📚 ${scholarshipData.length} scholarships loaded successfully!`, {
                        description: 'Elite scholarship data retrieved and ready for management',
                        duration: 2000
                    });
                }
            } else {
                setScholarships([]);
                setTotalCount(0);
                setTotalPages(1);
                toast.warning('📋 No scholarships found', {
                    description: 'Create your first scholarship to get started',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Failed to load scholarships:', err);
            setError('Failed to load scholarships');
            setScholarships([]);
            setTotalCount(0);
            setTotalPages(1);

            toast.error('❌ Failed to load scholarships', {
                description: 'Unable to retrieve scholarship data. Please try again.',
                duration: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await apiRequest('/api/admin/scholarships/stats');
            if (response.success && response.data) {
                setStats(response.data.stats || response.data || {
                    total: 0,
                    active: 0,
                    draft: 0,
                    expired: 0,
                    featured: 0
                });
            }
        } catch (err) {
            console.error('Error loading stats:', err);
            setStats({
                total: 0,
                active: 0,
                draft: 0,
                expired: 0,
                featured: 0
            });
        }
    };

    // Event handlers
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const handleStatusFilter = useCallback((status) => {
        setSelectedStatus(prev => prev === status ? '' : status);
        setCurrentPage(1);
    }, []);

    const handleCategoryFilter = useCallback((e) => {
        setSelectedCategory(e.target.value);
        setCurrentPage(1);
    }, []);
    
    const handleToggleAdvancedFilters = useCallback(() => {
        setShowAdvancedFilters(prev => !prev);
    }, []);
    
    const handleApplyAdvancedFilters = useCallback((filters) => {
        setAdvancedFilters(filters);
        setCurrentPage(1);
        setShowAdvancedFilters(false);
        toast.success('Advanced filters applied', {
            description: 'Search results updated with your filters',
            duration: 2000
        });
    }, []);
    
    const handleResetAdvancedFilters = useCallback(() => {
        setAdvancedFilters({
            amount_min: '',
            amount_max: '',
            deadline_from: '',
            deadline_to: '',
            location: '',
            level: ''
        });
        setCurrentPage(1);
        toast.info('Filters reset', {
            description: 'All advanced filters have been cleared',
            duration: 2000
        });
    }, []);
    
    // Filter-based search handlers
    const handleFilterChange = useCallback((filters) => {
        setFilterBasedFilters(filters);
        setCurrentPage(1);
    }, []);
    
    const handleResetFilters = useCallback(() => {
        setFilterBasedFilters({
            status: '',
            category: '',
            amount_min: '',
            amount_max: '',
            deadline_from: '',
            deadline_to: '',
            location: '',
            level: '',
            featured: false
        });
        setCurrentPage(1);
        toast.info('All filters cleared', {
            description: 'Filter-based search reset',
            duration: 2000
        });
    }, []);
    
    const getActiveFiltersCount = useCallback(() => {
        return Object.values(filterBasedFilters).filter(v => 
            v && v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)
        ).length;
    }, [filterBasedFilters]);

    // CRUD handlers
    const handleEditScholarship = (scholarship) => {
        setEditingScholarship(scholarship);
        setShowEditor(true);

        toast.info(`✏️ Editing scholarship`, {
            description: `Opening editor for "${scholarship.title}"`,
            duration: 2000
        });
    };

    const handleViewScholarship = (scholarship) => {
        // For now, we'll treat view the same as edit
        // You could implement a read-only view mode later
        setEditingScholarship(scholarship);
        setShowEditor(true);

        toast.info(`👁️ Viewing scholarship`, {
            description: `Opening detailed view for "${scholarship.title}"`,
            duration: 2000
        });
    };

    const handleDeleteScholarship = async (scholarshipId) => {
        const scholarship = scholarships.find(s => s.id === scholarshipId);
        const scholarshipTitle = scholarship?.title || 'Unknown Scholarship';

        // Create a custom confirmation with Sonner toast
        return new Promise((resolve) => {
            const confirmationId = toast.error(
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚠️</span>
                        <span className="font-bold text-lg">Delete Scholarship</span>
                    </div>
                    <div className="text-sm">
                        <p className="mb-2">Are you sure you want to delete:</p>
                        <p className="font-semibold text-orange-200">"{scholarshipTitle}"</p>
                        <p className="text-xs text-gray-300 mt-2">This action cannot be undone and will permanently remove this scholarship from the system.</p>
                    </div>
                    <div className="flex space-x-2 pt-2">
                        <button
                            onClick={() => {
                                toast.dismiss(confirmationId);
                                resolve(false);
                            }}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(confirmationId);
                                resolve(true);
                                performDelete();
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>,
                {
                    duration: 30000, // 30 second timeout
                    style: {
                        background: 'rgba(31, 41, 55, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'white'
                    }
                }
            );

            // Auto-cancel after timeout
            setTimeout(() => {
                toast.dismiss(confirmationId);
                resolve(false);
            }, 30000);
        });

        async function performDelete() {
            // Show loading toast
            const loadingToast = toast.loading(`🗑️ Deleting "${scholarshipTitle}"...`, {
                description: 'Please wait while we remove this scholarship',
                duration: Infinity
            });

            try {
                const token = localStorage.getItem('auth_token');
                const response = await apiRequest(`/api/admin/scholarships/${scholarshipId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Dismiss loading toast
                toast.dismiss(loadingToast);

                if (response.success) {
                    // Show success toast
                    toast.success(`✅ Scholarship deleted successfully!`, {
                        description: `"${scholarshipTitle}" has been permanently removed`,
                        duration: 4000
                    });

                    // Reload scholarships to update the list
                    loadScholarships();
                } else {
                    toast.error(`❌ Failed to delete scholarship`, {
                        description: response.message || 'An unexpected error occurred',
                        duration: 5000
                    });
                }
            } catch (error) {
                // Dismiss loading toast
                toast.dismiss(loadingToast);

                console.error('Error deleting scholarship:', error);
                toast.error(`❌ Failed to delete scholarship`, {
                    description: 'Network error. Please check your connection and try again.',
                    duration: 5000
                });
            }
        }
    };

    const copyScholarshipLink = async (scholarship) => {
        try {
            // Generate the scholarship link based on the slug or ID
            const baseUrl = window.location.origin;
            const scholarshipUrl = `${baseUrl}/scholarships/${scholarship.slug || scholarship.id}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(scholarshipUrl);

            toast.success('✨ Elite scholarship link copied to clipboard!', {
                description: `${scholarship.title} - ${scholarshipUrl}`,
                duration: 3000
            });
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            const baseUrl = window.location.origin;
            const scholarshipUrl = `${baseUrl}/scholarships/${scholarship.slug || scholarship.id}`;

            textArea.value = scholarshipUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            toast.success('✨ Elite scholarship link copied to clipboard!', {
                description: `${scholarship.title} - ${scholarshipUrl}`,
                duration: 3000
            });
        }
    };

    // Generate single scholarship detail document
    const generateSingleScholarshipDetail = async (scholarship, format = 'pdf') => {
        try {
            const token = localStorage.getItem('auth_token');

            toast.info(`🔄 Generating ${format.toUpperCase()} detail for "${scholarship.title}"...`, {
                duration: 3000
            });

            // Use the correct backend URL
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
            const response = await fetch(`${API_BASE_URL}/api/admin/scholarships/generate-single`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scholarship: scholarship,
                    format: format,
                    includeContact: true,
                    includeRequirements: true
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');

                if (format === 'pdf' || contentType?.includes('application/pdf')) {
                    // Handle PDF blob
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;

                    // Create a safe filename
                    const safeName = scholarship.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const timestamp = new Date().toISOString().split('T')[0];
                    a.download = `${safeName}_detail_${timestamp}.${format}`;

                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`✅ ${format.toUpperCase()} detail generated successfully!`, {
                        description: `"${scholarship.title}" - Full scholarship details`,
                        duration: 4000
                    });
                } else {
                    // Handle JSON or HTML response
                    const responseData = await response.json();
                    if (responseData.success && responseData.data?.html_content) {
                        // For HTML/Image format, open in new window
                        const newWindow = window.open();
                        newWindow.document.write(responseData.data.html_content);
                        newWindow.document.close();

                        toast.success(`✅ ${format.toUpperCase()} detail generated successfully!`, {
                            description: `"${scholarship.title}" - Preview opened in new window`,
                            duration: 4000
                        });
                    } else {
                        throw new Error(responseData.message || `Failed to generate ${format}`);
                    }
                }
            } else {
                // Handle error response
                let errorMessage = `Failed to generate ${format}`;
                try {
                    const errorData = await response.text();
                    // Try to parse as JSON
                    try {
                        const jsonError = JSON.parse(errorData);
                        errorMessage = jsonError.error || jsonError.message || errorMessage;
                    } catch (e) {
                        // If not JSON, use the text response
                        if (errorData.includes('error')) {
                            errorMessage = errorData.substring(0, 100) + '...';
                        }
                    }
                } catch (e) {
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error(`Error generating ${format}:`, error);
            toast.error(`❌ Failed to generate ${format} detail`, {
                description: error.message || 'Please try again later',
                duration: 4000
            });
        }
    };

    // Safe categories render function with enhanced error handling
    const renderCategoriesOptions = () => {
        if (categoriesLoading) {
            return <option disabled>Loading categories...</option>;
        }

        if (categoriesError) {
            return <option disabled>Error loading categories</option>;
        }

        // Multiple safety checks to prevent the map error
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return <option disabled>No categories available</option>;
        }

        try {
            return categories.map((category) => (
                <option key={category?.id || category?._id || Math.random()} value={category?.id || category?._id || ''}>
                    ⭐ {category?.name || 'Unnamed Category'}
                </option>
            ));
        } catch (error) {
            console.error('Error rendering categories:', error);
            return <option disabled>Error rendering categories</option>;
        }
    };

    // PDF/Image Generator Component
    const ScholarshipGeneratorTab = () => {
        const [generatorSettings, setGeneratorSettings] = useState({
            format: 'pdf', // 'pdf' or 'image'
            orientation: 'landscape', // 'portrait' or 'landscape'
            limit: 18,
            includeLinks: false,
            selectedScholarships: [],
            template: 'table', // 'table' or 'cards'
            selectionMode: 'auto' // 'auto' or 'manual'
        });
        const [generating, setGenerating] = useState(false);
        const [availableScholarships, setAvailableScholarships] = useState([]);
        const [loadingScholarships, setLoadingScholarships] = useState(false);

        // Filter out expired scholarships
        const filterActiveScholarships = (scholarships) => {
            const now = new Date();
            return scholarships.filter(scholarship => {
                if (!scholarship.deadline) return true;

                // Parse deadline - handle different formats
                let deadlineDate;
                try {
                    // Try parsing as ISO date first
                    deadlineDate = new Date(scholarship.deadline);

                    // If that fails, try parsing as MM/DD/YYYY or DD/MM/YYYY
                    if (isNaN(deadlineDate.getTime())) {
                        const parts = scholarship.deadline.split(/[\/\-]/);
                        if (parts.length === 3) {
                            // Assume MM/DD/YYYY format
                            deadlineDate = new Date(parts[2], parts[0] - 1, parts[1]);
                        }
                    }
                } catch (error) {
                    console.warn(`Could not parse deadline for scholarship ${scholarship.id}:`, scholarship.deadline);
                    return true; // Include if we can't parse the date
                }

                return !isNaN(deadlineDate.getTime()) && deadlineDate >= now;
            });
        };

        // Load available scholarships on component mount
        useEffect(() => {
            const loadScholarships = async () => {
                setLoadingScholarships(true);
                try {
                    let response;
                    try {
                        // Try active scholarships endpoint first
                        response = await apiRequest('/api/admin/scholarships/active', {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                            }
                        });
                    } catch (activeError) {
                        console.warn('Active scholarships endpoint failed, falling back to all scholarships:', activeError);
                        // Fallback to regular scholarships endpoint
                        response = await apiRequest('/api/admin/scholarships', {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                            }
                        });
                    }

                    if (response && response.success) {
                        // Apply client-side filtering as additional safety check
                        const activeScholarships = filterActiveScholarships(response.data || []);
                        setAvailableScholarships(activeScholarships);
                    } else {
                        setAvailableScholarships([]);
                    }
                } catch (error) {
                    console.error('Failed to load scholarships:', error);
                    toast.error('Failed to load scholarships');
                    setAvailableScholarships([]);
                } finally {
                    setLoadingScholarships(false);
                }
            };

            loadScholarships();
        }, []);

        const handleScholarshipSelection = (scholarshipId, isSelected) => {
            setGeneratorSettings(prev => ({
                ...prev,
                selectedScholarships: isSelected
                    ? [...prev.selectedScholarships, scholarshipId]
                    : prev.selectedScholarships.filter(id => id !== scholarshipId)
            }));
        };

        const handleSelectAll = () => {
            setGeneratorSettings(prev => ({
                ...prev,
                selectedScholarships: availableScholarships.map(s => s.id)
            }));
        };

        const handleDeselectAll = () => {
            setGeneratorSettings(prev => ({
                ...prev,
                selectedScholarships: []
            }));
        };

        const handleGenerate = async () => {
            setGenerating(true);
            try {
                let scholarshipsToGenerate;

                if (generatorSettings.selectionMode === 'manual') {
                    if (generatorSettings.selectedScholarships.length === 0) {
                        toast.error('Please select at least one scholarship to generate');
                        setGenerating(false);
                        return;
                    }
                    // Get full scholarship objects for selected IDs
                    scholarshipsToGenerate = availableScholarships.filter(s =>
                        generatorSettings.selectedScholarships.includes(s.id)
                    );
                } else {
                    // Auto mode - take the first N active scholarships
                    scholarshipsToGenerate = availableScholarships.slice(0, generatorSettings.limit);
                }

                const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

                if (generatorSettings.format === 'pdf') {
                    // For PDF, make a direct fetch request to handle binary response
                    const response = await fetch(`${API_BASE_URL}/api/admin/scholarships/generate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            scholarships: scholarshipsToGenerate,
                            format: generatorSettings.format,
                            orientation: generatorSettings.orientation,
                            includeLinks: generatorSettings.includeLinks,
                            template: generatorSettings.template
                        })
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `scholarships_${new Date().toISOString().split('T')[0]}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        toast.success('PDF generated and downloaded successfully!');
                    } else {
                        throw new Error('Failed to generate PDF');
                    }
                } else {
                    // For image, use apiRequest as it returns JSON
                    const response = await apiRequest('/api/admin/scholarships/generate', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            scholarships: scholarshipsToGenerate,
                            format: generatorSettings.format,
                            orientation: generatorSettings.orientation,
                            includeLinks: generatorSettings.includeLinks,
                            template: generatorSettings.template
                        })
                    });

                    if (response.success) {
                        // For now, we'll show the HTML content since image generation is not fully implemented
                        toast.success('Image generation completed! HTML content provided for preview.');
                        console.log('Generated HTML:', response.data.html_content);

                        // You could open the HTML in a new window for preview
                        const newWindow = window.open();
                        newWindow.document.write(response.data.html_content);
                        newWindow.document.close();
                    }
                }
            } catch (error) {
                console.error('Generation error:', error);
                toast.error('Failed to generate document. Please try again.');
            } finally {
                setGenerating(false);
            }
        };

        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <FileText className="w-12 h-12 text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                        Elite Document Generator
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Generate beautiful PDF documents and appealing images featuring scholarship information with professional formatting
                    </p>
                </div>

                {/* Generator Settings */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Basic Settings */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-blue-400" />
                                Document Settings
                            </h3>

                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Output Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, format: 'pdf'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${
                                            generatorSettings.format === 'pdf'
                                                ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <FileText className="w-6 h-6 mx-auto mb-2" />
                                        PDF Document
                                    </button>
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, format: 'image'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${
                                            generatorSettings.format === 'image'
                                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Image className="w-6 h-6 mx-auto mb-2" />
                                        Image File
                                    </button>
                                </div>
                            </div>

                            {/* Orientation */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Orientation</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, orientation: 'portrait'})}
                                        className={`p-3 rounded-xl border transition-all duration-300 ${
                                            generatorSettings.orientation === 'portrait'
                                                ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        Portrait
                                    </button>
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, orientation: 'landscape'})}
                                        className={`p-3 rounded-xl border transition-all duration-300 ${
                                            generatorSettings.orientation === 'landscape'
                                                ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        Landscape
                                    </button>
                                </div>
                            </div>

                            {/* Selection Mode */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Selection Mode</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, selectionMode: 'auto'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                                            generatorSettings.selectionMode === 'auto'
                                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Zap className="w-5 h-5 mb-2" />
                                        <div className="font-medium">Auto Selection</div>
                                        <div className="text-sm opacity-75">Automatically select first N active scholarships</div>
                                    </button>
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, selectionMode: 'manual'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                                            generatorSettings.selectionMode === 'manual'
                                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Target className="w-5 h-5 mb-2" />
                                        <div className="font-medium">Manual Selection</div>
                                        <div className="text-sm opacity-75">Choose specific scholarships to include</div>
                                    </button>
                                </div>
                            </div>

                            {/* Limit (only show in auto mode) */}
                            {generatorSettings.selectionMode === 'auto' && (
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">Number of Scholarships</label>
                                    <select
                                        value={generatorSettings.limit}
                                        onChange={(e) => setGeneratorSettings({...generatorSettings, limit: parseInt(e.target.value)})}
                                        className="w-full p-3 bg-black/50 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value={6}>6 Scholarships</option>
                                        <option value={12}>12 Scholarships</option>
                                        <option value={18}>18 Scholarships (Optimal)</option>
                                        <option value={24}>24 Scholarships</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Advanced Settings */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Palette className="w-6 h-6 mr-2 text-cyan-400" />
                                Layout & Content
                            </h3>

                            {/* Include Links */}
                            <div>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={generatorSettings.includeLinks}
                                        onChange={(e) => setGeneratorSettings({...generatorSettings, includeLinks: e.target.checked})}
                                        className="w-5 h-5 rounded border-2 border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50"
                                    />
                                    <span className="text-white font-medium">Include Scholarship Links</span>
                                </label>
                                <p className="text-gray-400 text-sm mt-1 ml-8">
                                    Recommended for landscape orientation to accommodate longer URLs
                                </p>
                            </div>

                            {/* Template Style */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Template Style</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, template: 'table'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                                            generatorSettings.template === 'table'
                                                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Layout className="w-5 h-5 mb-2" />
                                        <div className="font-medium">Professional Table</div>
                                        <div className="text-sm opacity-75">Clean tabular format with all scholarship details</div>
                                    </button>
                                    <button
                                        onClick={() => setGeneratorSettings({...generatorSettings, template: 'cards'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                                            generatorSettings.template === 'cards'
                                                ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Award className="w-5 h-5 mb-2" />
                                        <div className="font-medium">Elite Cards</div>
                                        <div className="text-sm opacity-75">Beautiful card-based layout with visual appeal</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scholarship Selection (Manual Mode) */}
                    {generatorSettings.selectionMode === 'manual' && (
                        <div className="mt-8 p-6 bg-black/20 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-bold text-white flex items-center">
                                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
                                    Select Scholarships ({generatorSettings.selectedScholarships.length} selected)
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={handleDeselectAll}
                                        className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {loadingScholarships ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-300">Loading active scholarships...</p>
                                </div>
                            ) : availableScholarships.length === 0 ? (
                                <div className="text-center py-8">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-300">No active scholarships available</p>
                                    <p className="text-gray-500 text-sm">All scholarships may have expired</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                    {availableScholarships.map((scholarship) => (
                                        <div
                                            key={scholarship.id}
                                            className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                                                generatorSettings.selectedScholarships.includes(scholarship.id)
                                                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                                    : 'bg-black/30 border-white/20 text-gray-300 hover:bg-white/10'
                                            }`}
                                            onClick={() => handleScholarshipSelection(
                                                scholarship.id,
                                                !generatorSettings.selectedScholarships.includes(scholarship.id)
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h5 className="font-semibold text-white mb-2 line-clamp-2">
                                                        {scholarship.title}
                                                    </h5>
                                                    <div className="space-y-1 text-sm">
                                                        <p className="flex items-center">
                                                            <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                                                            {scholarship.amount || 'Amount not specified'}
                                                        </p>
                                                        <p className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-cyan-400" />
                                                            {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString() : 'No deadline'}
                                                        </p>
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                scholarship.status === 'active' ? 'bg-green-400' :
                                                                scholarship.status === 'draft' ? 'bg-yellow-400' :
                                                                'bg-red-400'
                                                            }`}></div>
                                                            <span className="text-xs uppercase font-medium">
                                                                {scholarship.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    {generatorSettings.selectedScholarships.includes(scholarship.id) ? (
                                                        <CheckCircle2 className="w-6 h-6 text-blue-400" />
                                                    ) : (
                                                        <div className="w-6 h-6 border-2 border-gray-400 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex justify-center">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="w-5 h-5 mr-3" />
                                        Generate {generatorSettings.format.toUpperCase()}
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-center text-gray-400 text-sm mt-3">
                            Company: <span className="text-white font-semibold">Sabiteck Limited</span> • Professional Academic Solutions
                        </p>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Eye className="w-6 h-6 mr-2 text-yellow-400" />
                        Document Preview
                    </h3>
                    <div className="bg-black/50 rounded-xl p-6 border border-white/20">
                        <div className="text-center mb-4">
                            <h4 className="text-2xl font-bold text-white">Sabiteck Limited</h4>
                            <p className="text-gray-300">Premium Scholarship Opportunities</p>
                        </div>
                        <div className="text-gray-400 text-sm">
                            <p>• Format: {generatorSettings.format.toUpperCase()}</p>
                            <p>• Orientation: {generatorSettings.orientation}</p>
                            <p>• Selection: {generatorSettings.selectionMode === 'manual' ? 'Manual' : 'Auto'}</p>
                            <p>• Scholarships: {
                                generatorSettings.selectionMode === 'manual'
                                    ? `${generatorSettings.selectedScholarships.length} selected`
                                    : `${generatorSettings.limit} (auto)`
                            }</p>
                            <p>• Template: {generatorSettings.template}</p>
                            <p>• Links included: {generatorSettings.includeLinks ? 'Yes' : 'No'}</p>
                            <p>• Active scholarships: {availableScholarships.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Single Scholarship Converter Component
    const SingleScholarshipConverterTab = () => {
        const [selectedScholarship, setSelectedScholarship] = useState(null);
        const [converting, setConverting] = useState(false);
        const [allScholarships, setAllScholarships] = useState([]);
        const [filteredScholarships, setFilteredScholarships] = useState([]);
        const [searchQuery, setSearchQuery] = useState('');
        const [loadingAllScholarships, setLoadingAllScholarships] = useState(true);
        const [converterSettings, setConverterSettings] = useState({
            format: 'pdf',
            includeContact: true,
            includeRequirements: true,
            includeLinks: true
        });

        // Load all scholarships for selection
        useEffect(() => {
            loadAllScholarships();
        }, []);

        // Filter scholarships based on search query
        useEffect(() => {
            if (!searchQuery.trim()) {
                setFilteredScholarships(allScholarships);
            } else {
                const filtered = allScholarships.filter(scholarship =>
                    scholarship.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    scholarship.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    scholarship.category?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredScholarships(filtered);
            }
        }, [searchQuery, allScholarships]);

        const loadAllScholarships = async () => {
            try {
                setLoadingAllScholarships(true);
                const response = await apiRequest('/api/admin/scholarships', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });

                if (response && response.success) {
                    const scholarshipData = Array.isArray(response.data) ? response.data : [];
                    setAllScholarships(scholarshipData);
                    setFilteredScholarships(scholarshipData);
                } else {
                    setAllScholarships([]);
                    setFilteredScholarships([]);
                }
            } catch (error) {
                console.error('Failed to load scholarships:', error);
                setAllScholarships([]);
                setFilteredScholarships([]);
                toast.error('Failed to load scholarships');
            } finally {
                setLoadingAllScholarships(false);
            }
        };

        const handleScholarshipSelect = (scholarship) => {
            setSelectedScholarship(scholarship);
        };

        const handleConvert = async () => {
            if (!selectedScholarship) {
                toast.error('Please select a scholarship first');
                return;
            }

            setConverting(true);
            try {
                await generateSingleScholarshipDetail(selectedScholarship, converterSettings.format);
                toast.success(`✅ ${converterSettings.format.toUpperCase()} generated successfully!`);
            } catch (error) {
                toast.error(`❌ Failed to generate ${converterSettings.format}: ${error.message}`);
            } finally {
                setConverting(false);
            }
        };

        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                        Single Scholarship Converter
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Convert individual scholarship details into professional PDF documents or image-ready HTML files with complete information and Sabitek branding
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Scholarship Selection */}
                    <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Award className="w-6 h-6 mr-3 text-yellow-400" />
                            Select Scholarship ({filteredScholarships.length} available)
                        </h3>

                        {/* Search Input */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search scholarships by title, description, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-black/60 transition-all duration-300"
                            />
                        </div>

                        {/* Scholarship List */}
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {loadingAllScholarships ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-300">Loading scholarships...</p>
                                </div>
                            ) : filteredScholarships.length === 0 ? (
                                <div className="text-center py-8">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    {searchQuery ? (
                                        <>
                                            <p className="text-gray-300">No scholarships found</p>
                                            <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-300">No scholarships available</p>
                                            <p className="text-gray-500 text-sm">Create some scholarships first</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                filteredScholarships.map((scholarship) => (
                                <div
                                    key={scholarship.id}
                                    onClick={() => handleScholarshipSelect(scholarship)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                                        selectedScholarship?.id === scholarship.id
                                            ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                            : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-sm">{scholarship.title}</h4>
                                            <p className="text-xs opacity-75 mt-1">{scholarship.amount} {scholarship.currency}</p>
                                            <p className="text-xs opacity-60 mt-1">Deadline: {scholarship.deadline}</p>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${
                                            selectedScholarship?.id === scholarship.id
                                                ? 'bg-blue-400'
                                                : 'bg-gray-600'
                                        }`}></div>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column - Conversion Settings */}
                    <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Settings className="w-6 h-6 mr-3 text-green-400" />
                            Conversion Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3">Output Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setConverterSettings({...converterSettings, format: 'pdf'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${
                                            converterSettings.format === 'pdf'
                                                ? 'bg-red-500/20 border-red-400/50 text-red-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <FileText className="w-6 h-6 mx-auto mb-2" />
                                        <div className="text-sm font-medium">PDF Document</div>
                                    </button>
                                    <button
                                        onClick={() => setConverterSettings({...converterSettings, format: 'image'})}
                                        className={`p-4 rounded-xl border transition-all duration-300 ${
                                            converterSettings.format === 'image'
                                                ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                                                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <Image className="w-6 h-6 mx-auto mb-2" />
                                        <div className="text-sm font-medium">Image HTML</div>
                                    </button>
                                </div>
                            </div>

                            {/* Include Options */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-3">Include Options</label>
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={converterSettings.includeContact}
                                            onChange={(e) => setConverterSettings({...converterSettings, includeContact: e.target.checked})}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50"
                                        />
                                        <span className="text-white font-medium ml-3">Contact Information</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={converterSettings.includeRequirements}
                                            onChange={(e) => setConverterSettings({...converterSettings, includeRequirements: e.target.checked})}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50"
                                        />
                                        <span className="text-white font-medium ml-3">Requirements & Eligibility</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={converterSettings.includeLinks}
                                            onChange={(e) => setConverterSettings({...converterSettings, includeLinks: e.target.checked})}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50"
                                        />
                                        <span className="text-white font-medium ml-3">Application Links</span>
                                    </label>
                                </div>
                            </div>

                            {/* Selected Scholarship Preview */}
                            {selectedScholarship && (
                                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-400/20">
                                    <h4 className="text-white font-semibold mb-2">Selected Scholarship</h4>
                                    <p className="text-blue-300 text-sm">{selectedScholarship.title}</p>
                                    <p className="text-gray-400 text-xs mt-1">{selectedScholarship.amount} {selectedScholarship.currency}</p>
                                </div>
                            )}

                            {/* Convert Button */}
                            <button
                                onClick={handleConvert}
                                disabled={!selectedScholarship || converting}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                                    !selectedScholarship || converting
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {converting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Generating {converterSettings.format.toUpperCase()}...
                                    </div>
                                ) : (
                                    `Generate ${converterSettings.format.toUpperCase()} Document`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Main Scholarship Management Component
    const MainScholarshipManagement = () => (
        <div className="space-y-8">
            {/* Elite Header */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                        <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <GraduationCap className="w-12 h-12 text-purple-400" />
                        </div>
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                    Elite Scholarship Management Hub
                </h1>
                <div className="flex justify-center items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-semibold">Professional Academic Opportunity Center</span>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                    Orchestrate exceptional academic opportunities and manage elite scholarship programs with our premium management suite
                </p>

                {/* Elite Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 px-4">
                    <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105">
                        <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="text-sm md:text-base">Export Elite Data</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowEditor(true);
                            toast.info(`✨ Creating new scholarship`, {
                                description: 'Opening scholarship creation form',
                                duration: 2000
                            });
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 md:px-8 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl md:rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="text-sm md:text-base">Create Elite Scholarship</span>
                    </button>
                </div>
            </div>

            {/* Elite Stats Dashboard */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 shadow-2xl mb-4 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-8 gap-4">
                    <div className="flex items-center">
                        <div className="p-2 md:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl md:rounded-2xl mr-3 md:mr-4">
                            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Elite Analytics Dashboard</h3>
                            <p className="text-gray-300 text-xs md:text-base">Real-time insights into your premium scholarship ecosystem</p>
                        </div>
                    </div>
                    <div className="md:ml-auto">
                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-full text-xs font-black">
                            LIVE DATA
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                        <div className="p-3 md:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl">
                                        <GraduationCap className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-2 md:ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs md:text-sm font-bold text-gray-300 truncate">
                                            Total Elite
                                        </dt>
                                        <dd className="text-lg md:text-2xl font-black text-white">
                                            {stats.total}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                        <div className="p-3 md:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-1.5 md:p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg md:rounded-xl">
                                        <Rocket className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-2 md:ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs md:text-sm font-bold text-gray-300 truncate">
                                            Active
                                        </dt>
                                        <dd className="text-lg md:text-2xl font-black text-white">
                                            {stats.active}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                        <div className="p-3 md:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-1.5 md:p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg md:rounded-xl">
                                        <Edit className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-2 md:ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs md:text-sm font-bold text-gray-300 truncate">
                                            Drafts
                                        </dt>
                                        <dd className="text-lg md:text-2xl font-black text-white">
                                            {stats.draft}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20">
                        <div className="p-3 md:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-1.5 md:p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg md:rounded-xl">
                                        <Clock className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-2 md:ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs md:text-sm font-bold text-gray-300 truncate">
                                            Expired
                                        </dt>
                                        <dd className="text-lg md:text-2xl font-black text-white">
                                            {stats.expired}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-xl rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20 col-span-2 md:col-span-1">
                        <div className="p-3 md:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg md:rounded-xl">
                                        <Star className="h-4 w-4 md:h-6 md:w-6 text-white fill-current animate-pulse" />
                                    </div>
                                </div>
                                <div className="ml-2 md:ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-xs md:text-sm font-bold text-gray-300 truncate">
                                            Featured
                                        </dt>
                                        <dd className="text-lg md:text-2xl font-black text-white">
                                            {stats.featured}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Elite Search & Filter Hub */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 shadow-2xl mb-4 md:mb-8">
                <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-8 gap-3 md:gap-0">
                    <div className="flex items-center">
                        <div className="p-2 md:p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl md:rounded-2xl mr-3 md:mr-4">
                            <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Enhanced Elite Search Console</h3>
                            <p className="text-gray-300 text-xs md:text-base hidden sm:block">Advanced search with filters, suggestions & history</p>
                        </div>
                    </div>
                    <div className="md:ml-auto flex flex-wrap items-center gap-2 md:gap-3">
                        {/* Active Filters Indicator */}
                        {(searchTerm || selectedStatus || selectedCategory || Object.values(advancedFilters).some(v => v)) && (
                            <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-black rounded-full text-xs font-black">
                                {[searchTerm, selectedStatus, selectedCategory, ...Object.values(advancedFilters)].filter(Boolean).length} FILTER{[searchTerm, selectedStatus, selectedCategory, ...Object.values(advancedFilters)].filter(Boolean).length > 1 ? 'S' : ''} ACTIVE
                            </span>
                        )}
                        <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-black rounded-full text-xs font-black">
                            ENHANCED SEARCH
                        </span>
                    </div>
                </div>

                {/* Enhanced Search Bar */}
                <EnhancedSearchBar
                    searchValue={searchTerm}
                    onSearchChange={handleSearch}
                    placeholder="Search scholarships by title, description, category, amount..."
                    suggestions={searchSuggestions}
                    resultsCount={totalCount}
                    showAdvancedFilters={showAdvancedFilters}
                    onToggleAdvancedFilters={handleToggleAdvancedFilters}
                    debounceTime={500}
                    filters={[
                        {
                            label: 'All Status',
                            active: selectedStatus === '',
                            count: stats.total,
                            icon: Layers
                        },
                        {
                            label: 'Active',
                            active: selectedStatus === 'active',
                            count: stats.active,
                            icon: CheckCircle2
                        },
                        {
                            label: 'Draft',
                            active: selectedStatus === 'draft',
                            count: stats.draft,
                            icon: Edit
                        },
                        {
                            label: 'Expired',
                            active: selectedStatus === 'expired',
                            count: stats.expired,
                            icon: Clock
                        },
                        {
                            label: 'Featured',
                            active: selectedStatus === 'featured',
                            count: stats.featured,
                            icon: Star
                        }
                    ]}
                    onFilterChange={(filter) => {
                        const statusMap = {
                            'All Status': '',
                            'Active': 'active',
                            'Draft': 'draft',
                            'Expired': 'expired',
                            'Featured': 'featured'
                        };
                        handleStatusFilter(statusMap[filter.label]);
                    }}
                    className="mb-4"
                />

                {/* Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                    <div className="relative flex-1">
                        <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2">
                            <Target className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={handleCategoryFilter}
                            disabled={categoriesLoading}
                            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-black/50 border border-white/20 rounded-xl md:rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300"
                        >
                            <option value="">{categoriesLoading ? 'Loading...' : 'All Elite Categories'}</option>
                            {renderCategoriesOptions()}
                        </select>
                    </div>

                    {/* Clear All Filters Button */}
                    {(searchTerm || selectedStatus || selectedCategory || Object.values(advancedFilters).some(v => v)) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedStatus('');
                                setSelectedCategory('');
                                handleResetAdvancedFilters();
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 md:px-6 py-2.5 md:py-3 bg-red-500/20 backdrop-blur-lg border border-red-500/30 text-red-300 hover:bg-red-500/30 font-semibold rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                            Clear All Filters
                        </button>
                    )}
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="mt-4">
                        <AdvancedFiltersPanel
                            filters={advancedFilters}
                            onApply={handleApplyAdvancedFilters}
                            onReset={handleResetAdvancedFilters}
                        />
                    </div>
                )}
            </div>

            {/* Filter-Based Search Panel */}
            <FilterBasedSearch
                onFilterChange={handleFilterChange}
                filters={filterBasedFilters}
                availableFilters={scholarshipFilters.map(filter => {
                    // Populate category options dynamically
                    if (filter.key === 'category') {
                        return {
                            ...filter,
                            options: categories.map(cat => ({
                                value: cat.id || cat._id,
                                label: cat.name
                            }))
                        };
                    }
                    return filter;
                })}
                activeFiltersCount={getActiveFiltersCount()}
                onReset={handleResetFilters}
                className="mb-4 md:mb-8"
            />

            {/* Elite Scholarships Table */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
                        <div className="flex items-center">
                            <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl md:rounded-2xl mr-3 md:mr-4">
                                <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Elite Scholarship Portfolio</h3>
                                <p className="text-gray-300 text-xs md:text-base hidden sm:block">Premium academic opportunities management center</p>
                            </div>
                        </div>
                        <div className="md:ml-auto">
                            <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-black rounded-full text-xs font-black">
                                PORTFOLIO
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-black/40 backdrop-blur-lg">
                            <tr>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                    🎓 Elite Scholarship
                                </th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                    💰 Funding Amount
                                </th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                    ⏰ Application Deadline
                                </th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-black text-purple-300 uppercase tracking-wider">
                                    🚀 Status
                                </th>
                                <th className="px-3 md:px-6 py-3 md:py-4 text-right text-xs font-black text-purple-300 uppercase tracking-wider">
                                    ⚙️ Elite Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-black/20 backdrop-blur-lg divide-y divide-white/10">
                            {Array.isArray(scholarships) && scholarships.length > 0 ? (
                                scholarships.map((scholarship) => (
                                    <tr key={scholarship.id} className="hover:bg-white/5 transition-all duration-300">
                                        <td className="px-3 md:px-6 py-3 md:py-4">
                                            <div className="text-sm md:text-lg font-bold text-white flex items-center min-w-[200px]">
                                                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-purple-400 flex-shrink-0" />
                                                <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-yellow-400 flex-shrink-0" />
                                                <span className="truncate">{scholarship.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                            <div className="text-sm md:text-lg font-bold text-white flex items-center">
                                                <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 text-green-400" />
                                                {scholarship.amount}
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                            <div className="text-xs md:text-sm font-semibold text-white flex items-center">
                                                <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-cyan-400" />
                                                {scholarship.deadline}
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 md:px-3 py-1 md:py-2 text-xs font-bold rounded-lg md:rounded-xl border backdrop-blur-lg ${
                                                scholarship.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                                scholarship.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                                                scholarship.status === 'inactive' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
                                                scholarship.status === 'deleted' ? 'bg-gray-500/20 text-gray-300 border-gray-400/30' :
                                                'bg-red-500/20 text-red-300 border-red-400/30'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1 md:mr-2 ${
                                                    scholarship.status === 'active' ? 'bg-green-400 animate-pulse' :
                                                    scholarship.status === 'draft' ? 'bg-yellow-400' :
                                                    scholarship.status === 'inactive' ? 'bg-orange-400' :
                                                    scholarship.status === 'deleted' ? 'bg-gray-400' :
                                                    'bg-red-400'
                                                }`}></div>
                                                {scholarship.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-1 md:space-x-2">
                                                <button
                                                    onClick={() => copyScholarshipLink(scholarship)}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg md:rounded-xl text-green-400 hover:text-green-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Copy Elite Scholarship Link"
                                                >
                                                    <Copy className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => generateSingleScholarshipDetail(scholarship, 'pdf')}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/30 rounded-lg md:rounded-xl text-orange-400 hover:text-orange-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Generate Full Detail PDF"
                                                >
                                                    <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => generateSingleScholarshipDetail(scholarship, 'image')}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg md:rounded-xl text-purple-400 hover:text-purple-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Generate Full Detail JPEG"
                                                >
                                                    <Image className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewScholarship(scholarship)}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg md:rounded-xl text-blue-400 hover:text-blue-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="View Elite Scholarship"
                                                >
                                                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditScholarship(scholarship)}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg md:rounded-xl text-purple-400 hover:text-purple-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Edit Elite Scholarship"
                                                >
                                                    <Edit className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteScholarship(scholarship.id)}
                                                    className="p-1.5 md:p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-lg md:rounded-xl text-red-400 hover:text-red-300 backdrop-blur-lg transition-all duration-300 hover:scale-110"
                                                    title="Delete Elite Scholarship"
                                                >
                                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 md:px-6 py-8 md:py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-3 md:p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 backdrop-blur-lg mb-3 md:mb-4">
                                                <GraduationCap className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
                                            </div>
                                            <h3 className="text-base md:text-lg font-bold text-white mb-2">
                                                {loading ? 'Loading Elite Scholarships...' : 'No Elite Scholarships Found'}
                                            </h3>
                                            <p className="text-gray-300">
                                                {loading ? 'Searching premium opportunities...' : 'No scholarships match your elite criteria'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Tab definitions
    const tabs = [
        { id: 'manage', label: 'Manage Scholarships', icon: GraduationCap },
        { id: 'generator', label: 'PDF & Image Generator', icon: FileImage },
        { id: 'single-converter', label: 'Single Scholarship Converter', icon: FileText },
    ];

    // Render active tab content
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'manage':
                return <MainScholarshipManagement />;
            case 'generator':
                return <ScholarshipGeneratorTab />;
            case 'single-converter':
                return <SingleScholarshipConverterTab />;
            default:
                return <MainScholarshipManagement />;
        }
    };

    // Show elite loading state
    if (loading && scholarships.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <GraduationCap className="w-16 h-16 text-purple-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Scholarship Management...</h2>
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 relative z-10 space-y-4 md:space-y-8">
                {/* Elite Header */}
                <div className="text-center mb-4 md:mb-8">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-3 md:p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <GraduationCap className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent px-4">
                        Elite Scholarship Management Hub
                    </h1>
                    <div className="flex justify-center items-center gap-2 mb-4 md:mb-6 px-4">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold text-sm md:text-base">Professional Academic Opportunity Center</span>
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-4 md:mb-8 px-4 text-sm md:text-base">
                        Orchestrate exceptional academic opportunities and manage elite scholarship programs with our premium management suite
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 p-3 md:p-6 shadow-2xl mb-4 md:mb-8">
                    <div className="flex items-center justify-start md:justify-center space-x-2 md:space-x-4 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                            : 'bg-black/20 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-102'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                                    <span className="text-xs md:text-sm lg:text-base">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Tab Content */}
                <div className="min-h-[600px]">
                    {renderActiveTabContent()}
                </div>
            </div>

                {/* Elite Editor Modal */}
                {showEditor && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg overflow-y-auto h-full w-full z-50">
                        <div className="relative min-h-screen flex items-center justify-center p-4">
                            <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto">
                                <ScholarshipEditor
                                    scholarship={editingScholarship}
                                    onCancel={() => {
                                        setShowEditor(false);
                                        setEditingScholarship(null);

                                        toast.info(`❌ Editor cancelled`, {
                                            description: 'No changes were saved',
                                            duration: 2000
                                        });
                                    }}
                                    onSave={() => {
                                        const isNew = !editingScholarship;
                                        const action = isNew ? 'created' : 'updated';
                                        const verb = isNew ? 'Creating' : 'Updating';

                                        toast.success(`✅ Scholarship ${action} successfully!`, {
                                            description: `${verb} scholarship completed. Refreshing data...`,
                                            duration: 3000
                                        });

                                        loadScholarships();
                                        setShowEditor(false);
                                        setEditingScholarship(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ScholarshipManagement;
