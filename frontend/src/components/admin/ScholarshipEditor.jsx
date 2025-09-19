import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, 
    Eye, 
    ArrowLeft, 
    Calendar, 
    DollarSign, 
    Globe, 
    GraduationCap,
    Award,
    Upload,
    X,
    Plus,
    Minus,
    AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { sanitizeHTML, secureLog } from '../../utils/security';

const ScholarshipEditor = ({ scholarship, onSave, onCancel }) => {
    const isEditing = !!scholarship;
    
    // Editor state
    const editorRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        short_description: '',
        full_description: '',
        content: '',
        provider: '',
        provider_logo: '',
        website_url: '',
        application_url: '',
        application_deadline: '',
        program_start_date: '',
        program_end_date: '',
        notification_date: '',
        funding_amount: '',
        currency: 'USD',
        funding_type_id: '',
        covers_tuition: false,
        covers_living: false,
        covers_travel: false,
        age_limit_min: '',
        age_limit_max: '',
        gpa_requirement: '',
        language_requirements: '',
        other_requirements: '',
        category_id: '',
        education_level_id: '',
        study_fields: [''],
        status: 'draft',
        featured: false,
        verified: false,
        meta_title: '',
        meta_description: '',
        tags: [''],
        regions: []
    });

    // Lookup data
    const [categories, setCategories] = useState([]);
    const [regions, setRegions] = useState([]);
    const [educationLevels, setEducationLevels] = useState([]);
    const [fundingTypes, setFundingTypes] = useState([]);

    // Rich text editor setup
    const [editorInitialized, setEditorInitialized] = useState(false);

    useEffect(() => {
        loadLookupData();
        initializeEditor();
    }, []);

    // Separate useEffect to populate form after lookup data is loaded
    useEffect(() => {
        if (isEditing && scholarship) {
            console.log('Populating form with scholarship:', scholarship);
            console.log('Categories loaded:', categories.length);
            console.log('Education levels loaded:', educationLevels.length);
            populateFormWithScholarship(scholarship);
        }
    }, [scholarship, categories, educationLevels]);

    const initializeEditor = () => {
        // Initialize TinyMCE or similar rich text editor
        // For now, we'll use a simple textarea with enhanced functionality
        setEditorInitialized(true);
    };

    const loadLookupData = async () => {
        try {
            const [categoriesRes, regionsRes, levelsRes] = await Promise.all([
                apiRequest('/api/admin/scholarships/categories'),
                apiRequest('/api/scholarships/regions'),
                apiRequest('/api/scholarships/education-levels')
            ]);

            if (categoriesRes.success) {
                const categoriesData = categoriesRes.data || categoriesRes.categories || [];
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            }
            if (regionsRes.success) {
                const regionsData = regionsRes.data || regionsRes.regions || [];
                setRegions(Array.isArray(regionsData) ? regionsData : []);
            }
            if (levelsRes.success) {
                const levelsData = levelsRes.data || levelsRes.education_levels || [];
                setEducationLevels(Array.isArray(levelsData) ? levelsData : []);
            }

            // Mock funding types - in real app, this would come from API
            setFundingTypes([
                { id: 1, name: 'Full Funding' },
                { id: 2, name: 'Partial Funding' },
                { id: 3, name: 'Tuition Only' },
                { id: 4, name: 'Stipend Only' },
                { id: 5, name: 'Travel Grant' },
                { id: 6, name: 'Research Grant' }
            ]);
        } catch (err) {
            console.error('Error loading lookup data:', err);
            // Ensure arrays are always initialized
            setCategories([]);
            setRegions([]);
            setEducationLevels([]);
        }
    };

    const populateFormWithScholarship = (scholarshipData) => {
        try {
            setIsLoading(true);

            // Find category ID by name - fallback to using the name directly if no categories loaded yet
            let categoryId = '';
            if (scholarshipData.category) {
                if (categories.length > 0) {
                    const foundCategory = categories.find(cat =>
                        cat.name === scholarshipData.category || cat.id === scholarshipData.category_id
                    );
                    categoryId = foundCategory ? (foundCategory.id || foundCategory.name) : scholarshipData.category;
                } else {
                    categoryId = scholarshipData.category;
                }
            }

            // Find education level ID by name - fallback to using the name directly if no levels loaded yet
            let educationLevelId = '';
            if (scholarshipData.education_level) {
                if (educationLevels.length > 0) {
                    const foundLevel = educationLevels.find(level =>
                        level.name === scholarshipData.education_level || level.id === scholarshipData.education_level_id
                    );
                    educationLevelId = foundLevel ? (foundLevel.id || foundLevel.name) : scholarshipData.education_level;
                } else {
                    educationLevelId = scholarshipData.education_level;
                }
            }

            // Map scholarship data to form fields using the correct field names
            setFormData(prevData => ({
                ...prevData,
                // Basic fields
                title: scholarshipData.title || '',
                slug: scholarshipData.slug || '',
                short_description: scholarshipData.description || '',
                full_description: scholarshipData.description || '',
                content: scholarshipData.requirements || '',
                provider: scholarshipData.organization || '',
                provider_logo: scholarshipData.provider_logo || '',
                website_url: scholarshipData.website_url || '',
                application_url: scholarshipData.application_url || '',
                application_deadline: scholarshipData.deadline || '',
                program_start_date: scholarshipData.program_start_date || '',
                program_end_date: scholarshipData.program_end_date || '',
                notification_date: scholarshipData.notification_date || '',
                funding_amount: scholarshipData.amount || '',
                currency: scholarshipData.currency || 'USD',
                funding_type_id: scholarshipData.funding_type_id || '1',
                covers_tuition: Boolean(scholarshipData.covers_tuition),
                covers_living: Boolean(scholarshipData.covers_living),
                covers_travel: Boolean(scholarshipData.covers_travel),
                age_limit_min: scholarshipData.age_limit_min || '',
                age_limit_max: scholarshipData.age_limit_max || '',
                gpa_requirement: scholarshipData.gpa_requirement || '',
                language_requirements: scholarshipData.language_requirements || '',
                other_requirements: scholarshipData.eligibility_criteria || '',
                category_id: categoryId,
                education_level_id: educationLevelId,
                status: scholarshipData.status || 'active',
                featured: Boolean(scholarshipData.featured),
                verified: Boolean(scholarshipData.verified),
                meta_title: scholarshipData.title || '',
                meta_description: scholarshipData.description || '',

                // Handle array fields that might be stored as JSON strings
                study_fields: Array.isArray(scholarshipData.study_fields)
                    ? scholarshipData.study_fields
                    : (scholarshipData.study_fields ?
                        (typeof scholarshipData.study_fields === 'string' ?
                            JSON.parse(scholarshipData.study_fields || '[""]') : [scholarshipData.study_fields])
                        : ['']),
                tags: Array.isArray(scholarshipData.tags)
                    ? scholarshipData.tags
                    : (scholarshipData.tags ?
                        (typeof scholarshipData.tags === 'string' ?
                            JSON.parse(scholarshipData.tags || '[""]') : [scholarshipData.tags])
                        : ['']),
                regions: scholarshipData.regions
                    ? (Array.isArray(scholarshipData.regions) ?
                        scholarshipData.regions :
                        (typeof scholarshipData.regions === 'string' ?
                            scholarshipData.regions.split(',').map(r => r.trim()) : [scholarshipData.regions]))
                    : []
            }));
        } catch (err) {
            console.error('Error populating form:', err);
            setError('Failed to load scholarship data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug from title
        if (name === 'title') {
            const slug = value.toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug }));
        }

        // Auto-generate meta title from title
        if (name === 'title' && !formData.meta_title) {
            setFormData(prev => ({ ...prev, meta_title: value }));
        }
    };

    const handleArrayChange = (fieldName, index, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayItem = (fieldName) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: [...prev[fieldName], '']
        }));
    };

    const removeArrayItem = (fieldName, index) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((_, i) => i !== index)
        }));
    };

    const handleRegionToggle = (regionName) => {
        setFormData(prev => ({
            ...prev,
            regions: prev.regions.includes(regionName)
                ? prev.regions.filter(r => r !== regionName)
                : [...prev.regions, regionName]
        }));
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const validateForm = () => {
        const errors = [];
        
        if (!formData.title.trim()) errors.push('Title is required');
        if (!formData.slug.trim()) errors.push('Slug is required');
        if (!formData.short_description.trim()) errors.push('Short description is required');
        if (!formData.provider.trim()) errors.push('Provider is required');
        if (!formData.category_id) errors.push('Category is required');
        if (!formData.education_level_id) errors.push('Education level is required');
        if (!formData.funding_type_id) errors.push('Funding type is required');
        if (formData.regions.length === 0) errors.push('At least one region is required');
        
        return errors;
    };

    const handleSave = async (publish = false) => {
        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const payload = {
                ...formData,
                study_fields: JSON.stringify(formData.study_fields.filter(f => f.trim())),
                tags: JSON.stringify(formData.tags.filter(t => t.trim())),
                regions: formData.regions.join(', '),
                status: publish ? 'active' : formData.status,
                published_at: publish ? new Date().toISOString() : formData.published_at
            };

            const response = await apiRequest(
                isEditing ? `/api/admin/scholarships/${scholarship.id}` : '/api/admin/scholarships',
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );

            if (response.success) {
                onSave && onSave();
            } else {
                setError(response.message || 'Failed to save scholarship');
            }
        } catch (err) {
            setError('Failed to save scholarship');
            console.error('Error saving scholarship:', err);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onCancel && onCancel()}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Scholarship' : 'Create New Scholarship'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {isEditing ? 'Update scholarship details and content' : 'Add a new scholarship opportunity'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                        >
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                        </button>
                        
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                        </button>
                        
                        <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                            <Award className="w-4 h-4" />
                            <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter scholarship title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL Slug *
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="url-friendly-slug"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This will be used in the URL: /scholarships/{formData.slug}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Short Description *
                                    </label>
                                    <textarea
                                        name="short_description"
                                        value={formData.short_description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Brief description for listings and previews"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Description
                                    </label>
                                    <textarea
                                        name="full_description"
                                        value={formData.full_description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Detailed description (plain text)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Rich Content Editor */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rich Content</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Use this editor to create detailed scholarship content with formatting, lists, and links.
                            </p>
                            
                            {/* Rich Text Toolbar */}
                            <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-4 py-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => document.execCommand('bold')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                    title="Bold"
                                >
                                    <strong>B</strong>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => document.execCommand('italic')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                    title="Italic"
                                >
                                    <em>I</em>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => document.execCommand('insertUnorderedList')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                    title="Bullet List"
                                >
                                    • List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => document.execCommand('insertOrderedList')}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                    title="Numbered List"
                                >
                                    1. List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = prompt('Enter URL:');
                                        if (url) document.execCommand('createLink', false, url);
                                    }}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                                    title="Insert Link"
                                >
                                    Link
                                </button>
                            </div>

                            <div
                                ref={editorRef}
                                contentEditable
                                className="w-full min-h-64 px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-auto"
                                style={{ minHeight: '16rem' }}
                                onInput={(e) => handleContentChange(e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: sanitizeHTML(formData.content) }}
                            />
                            
                            <p className="text-xs text-gray-500 mt-2">
                                You can use basic HTML formatting. Content will be sanitized for security.
                            </p>
                        </div>

                        {/* Provider Information */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Provider Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="provider"
                                        value={formData.provider}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Gates Foundation, University of Oxford"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Provider Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        name="provider_logo"
                                        value={formData.provider_logo}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Website URL
                                    </label>
                                    <input
                                        type="url"
                                        name="website_url"
                                        value={formData.website_url}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://provider-website.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Application URL *
                                    </label>
                                    <input
                                        type="url"
                                        name="application_url"
                                        value={formData.application_url}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://application-link.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Application Deadline
                                    </label>
                                    <input
                                        type="date"
                                        name="application_deadline"
                                        value={formData.application_deadline}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Program Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="program_start_date"
                                        value={formData.program_start_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Program End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="program_end_date"
                                        value={formData.program_end_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notification Date
                                    </label>
                                    <input
                                        type="date"
                                        name="notification_date"
                                        value={formData.notification_date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Study Fields */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Fields</h2>
                            
                            {formData.study_fields.map((field, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={field}
                                        onChange={(e) => handleArrayChange('study_fields', index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Computer Science, Medicine, Engineering"
                                    />
                                    {formData.study_fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('study_fields', index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => addArrayItem('study_fields')}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Study Field</span>
                            </button>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Min Age
                                        </label>
                                        <input
                                            type="number"
                                            name="age_limit_min"
                                            value={formData.age_limit_min}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="18"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Max Age
                                        </label>
                                        <input
                                            type="number"
                                            name="age_limit_max"
                                            value={formData.age_limit_max}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="35"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            GPA Requirement
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="4.0"
                                            name="gpa_requirement"
                                            value={formData.gpa_requirement}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="3.5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language Requirements
                                    </label>
                                    <textarea
                                        name="language_requirements"
                                        value={formData.language_requirements}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., IELTS 7.0, TOEFL 100+"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Other Requirements
                                    </label>
                                    <textarea
                                        name="other_requirements"
                                        value={formData.other_requirements}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Additional requirements, restrictions, or qualifications"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                            
                            {formData.tags.map((tag, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={tag}
                                        onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., undergraduate, stem, international"
                                    />
                                    {formData.tags.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('tags', index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => addArrayItem('tags')}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Tag</span>
                            </button>
                        </div>

                        {/* SEO */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO & Meta Data</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        name="meta_title"
                                        value={formData.meta_title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="SEO title for search engines"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.meta_title.length}/60 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Description
                                    </label>
                                    <textarea
                                        name="meta_description"
                                        value={formData.meta_description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Brief description for search engine results"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.meta_description.length}/160 characters
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publication Status */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        name="featured"
                                        checked={formData.featured}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                                        Featured Scholarship
                                    </label>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="verified"
                                        name="verified"
                                        checked={formData.verified}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                                        Verified Scholarship
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Category & Classification */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Category</option>
                                        {Array.isArray(categories) && categories.map((category, index) => (
                                            <option key={category.id || category.name || `category-${index}`} value={category.id || category.name}>
                                                {category.name || category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Education Level *
                                    </label>
                                    <select
                                        name="education_level_id"
                                        value={formData.education_level_id}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Level</option>
                                        {educationLevels.map((level, index) => (
                                            <option key={level.id || level.name || `level-${index}`} value={level.id || level.name}>
                                                {level.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Funding Information */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Funding Amount
                                    </label>
                                    <input
                                        type="text"
                                        name="funding_amount"
                                        value={formData.funding_amount}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., $50,000, Full funding, Up to €25,000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="CAD">CAD</option>
                                        <option value="AUD">AUD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Funding Type *
                                    </label>
                                    <select
                                        name="funding_type_id"
                                        value={formData.funding_type_id}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Type</option>
                                        {fundingTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">Coverage</h4>
                                    
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="covers_tuition"
                                            name="covers_tuition"
                                            checked={formData.covers_tuition}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="covers_tuition" className="text-sm text-gray-700">
                                            Covers Tuition
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="covers_living"
                                            name="covers_living"
                                            checked={formData.covers_living}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="covers_living" className="text-sm text-gray-700">
                                            Covers Living Expenses
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="covers_travel"
                                            name="covers_travel"
                                            checked={formData.covers_travel}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="covers_travel" className="text-sm text-gray-700">
                                            Covers Travel
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eligible Regions */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligible Regions *</h3>
                            
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {regions.map((region, index) => (
                                    <div key={region.id || region.name || `region-${index}`} className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id={`region-${region.id || region.name || index}`}
                                            checked={formData.regions.includes(region.name)}
                                            onChange={() => handleRegionToggle(region.name)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`region-${region.id || region.name || index}`} className="text-sm text-gray-700">
                                            {region.name}
                                            {region.continent && region.continent !== region.name && (
                                                <span className="text-gray-500"> ({region.continent})</span>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScholarshipEditor;