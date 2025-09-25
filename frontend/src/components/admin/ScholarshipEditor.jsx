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
    AlertCircle,
    Crown,
    Sparkles,
    Zap,
    Target,
    Shield,
    Rocket,
    Diamond,
    Briefcase,
    TrendingUp,
    CheckCircle2,
    Clock,
    Settings,
    Layers,
    UserCheck,
    Star,
    Building
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

    // Rich text editor functions
    const saveSelection = () => {
        if (window.getSelection && editorRef.current) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                return selection.getRangeAt(0);
            }
        }
        return null;
    };

    const restoreSelection = (range) => {
        if (range && window.getSelection && editorRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    const execCommand = (command, value = null) => {
        if (editorRef.current) {
            editorRef.current.focus();

            // Handle list commands specially since they can be problematic
            if (command === 'insertUnorderedList') {
                insertList('ul');
                return;
            }

            if (command === 'insertOrderedList') {
                insertList('ol');
                return;
            }

            document.execCommand(command, false, value);
            // Update content after command
            const content = editorRef.current.innerHTML;
            setFormData(prev => ({ ...prev, content }));
        }
    };

    const insertList = (listType) => {
        if (!editorRef.current) return;

        try {
            editorRef.current.focus();

            // Try the standard approach first
            const command = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
            const success = document.execCommand(command, false, null);

            if (!success) {
                // Fallback: manual list creation
                const selection = window.getSelection();
                if (selection.rangeCount === 0) return;

                const range = selection.getRangeAt(0);
                const list = document.createElement(listType);
                const listItem = document.createElement('li');

                if (range.collapsed) {
                    listItem.textContent = 'List item';
                    list.appendChild(listItem);
                    range.insertNode(list);

                    // Position cursor in the list item
                    const textNode = listItem.firstChild;
                    const newRange = document.createRange();
                    newRange.setStart(textNode, textNode.textContent.length);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    const contents = range.extractContents();
                    listItem.appendChild(contents);
                    list.appendChild(listItem);
                    range.insertNode(list);
                }
            }

            // Update content
            const content = editorRef.current.innerHTML;
            setFormData(prev => ({ ...prev, content }));

        } catch (error) {
            console.error('List creation error:', error);
        }
    };

    const handleEditorInput = (e) => {
        const content = e.target.innerHTML;
        handleContentChange(content);
    };

    // Handle editor content initialization
    useEffect(() => {
        if (editorRef.current) {
            // Only set content if editor is empty or different
            const currentContent = editorRef.current.innerHTML;
            const sanitizedContent = sanitizeHTML(formData.content || '');

            if (currentContent !== sanitizedContent) {
                // Save current cursor position
                const selection = saveSelection();
                editorRef.current.innerHTML = sanitizedContent;

                // Restore cursor position if content was already present
                if (selection && currentContent) {
                    setTimeout(() => restoreSelection(selection), 0);
                }
            }
        }
    }, [scholarship]); // Only run when scholarship changes, not on every content change

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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <GraduationCap className="w-16 h-16 text-purple-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Scholarship Editor...</h2>
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

            {/* Elite Header */}
            <div className="relative z-10">
                <div className="text-center py-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <GraduationCap className="w-12 h-12 text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        {isEditing ? 'Elite Scholarship Editor' : 'Elite Scholarship Creator'}
                    </h1>
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Professional Academic Opportunity Studio</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                        {isEditing ? 'Transform scholarship opportunities with our premium editing suite' : 'Create exceptional scholarship opportunities that inspire academic excellence'}
                    </p>

                    {/* Elite Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                        <button
                            onClick={() => onCancel && onCancel()}
                            className="inline-flex items-center px-6 py-3 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Management
                        </button>

                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`inline-flex items-center px-6 py-3 backdrop-blur-lg border text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 ${
                                previewMode
                                    ? 'bg-cyan-500/30 border-cyan-400/50 hover:bg-cyan-500/40'
                                    : 'bg-black/30 border-white/20 hover:bg-white/10'
                            }`}
                        >
                            <Eye className="w-5 h-5 mr-2" />
                            {previewMode ? 'Exit Preview' : 'Elite Preview'}
                        </button>

                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="inline-flex items-center px-6 py-3 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-white/10 font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {isSaving ? 'Saving Elite Draft...' : 'Save Elite Draft'}
                        </button>

                        <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            <Rocket className="w-5 h-5 mr-2" />
                            {isSaving ? 'Publishing Elite...' : 'Publish Elite Scholarship'}
                        </button>
                    </div>

                    {/* Elite Error Display */}
                    {error && (
                        <div className="max-w-4xl mx-auto mb-8">
                            <div className="bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-500 rounded-lg mr-3">
                                        <AlertCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-300 mb-1">
                                            Elite System Alert
                                        </h3>
                                        <div className="text-red-200">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Elite Form */}
            <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                {previewMode ? (
                    /* Elite Preview Mode */
                    <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center">
                                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mr-4">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">Elite Preview Mode</h2>
                                    <p className="text-gray-300">Preview how your scholarship will appear to students</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewMode(false)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300"
                            >
                                Back to Edit
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <h1 className="text-4xl font-black text-white mb-4">
                                        {formData.title || 'Scholarship Title'}
                                    </h1>
                                    {formData.featured && (
                                        <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-semibold">
                                            <Star className="w-4 h-4 mr-1 fill-current" />
                                            Featured
                                        </span>
                                    )}
                                </div>

                                {/* Provider */}
                                {formData.provider && (
                                    <div className="flex items-center text-gray-300">
                                        <Building className="w-5 h-5 mr-2" />
                                        <span className="text-lg">Provided by {formData.provider}</span>
                                    </div>
                                )}

                                {/* Description */}
                                {formData.short_description && (
                                    <div className="text-xl text-gray-200 leading-relaxed">
                                        {formData.short_description}
                                    </div>
                                )}

                                {/* Content */}
                                {formData.content && (
                                    <div className="prose prose-invert max-w-none">
                                        <div
                                            className="text-white leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(formData.content) }}
                                        />
                                    </div>
                                )}

                                {/* Key Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    {formData.funding_amount && (
                                        <div className="bg-black/30 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-gray-300 mb-2">FUNDING AMOUNT</h3>
                                            <p className="text-2xl font-black text-white">{formData.funding_amount}</p>
                                        </div>
                                    )}

                                    {formData.application_deadline && (
                                        <div className="bg-black/30 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-gray-300 mb-2">APPLICATION DEADLINE</h3>
                                            <p className="text-xl font-bold text-white">{new Date(formData.application_deadline).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Application Button */}
                                <div className="mt-8">
                                    <button
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:scale-105 transition-all duration-300"
                                        disabled
                                    >
                                        Apply Now (Preview Mode)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Elite Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Elite Basic Information */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-4">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">Elite Scholarship Foundation</h2>
                                    <p className="text-gray-300">Essential details that define your premium academic opportunity</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-black rounded-full text-xs font-black">
                                        ACADEMIC
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Scholarship Title *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <GraduationCap className="w-5 h-5 text-purple-400" />
                                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 text-lg transition-all duration-300 relative z-20"
                                            placeholder="e.g., Elite Rhodes Scholarship for Academic Excellence"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite URL Slug *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <Zap className="w-5 h-5 text-purple-400" />
                                            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="elite-academic-opportunity"
                                        />
                                    </div>
                                    <p className="text-xs text-purple-300 mt-2 flex items-center">
                                        💎 <span className="ml-2">Elite URL: /scholarships/{formData.slug}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Summary *
                                    </label>
                                    <textarea
                                        name="short_description"
                                        value={formData.short_description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 resize-none transition-all duration-300 relative z-20"
                                        placeholder="Compelling elite overview that captures the essence of this premium academic opportunity..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Full Description
                                    </label>
                                    <textarea
                                        name="full_description"
                                        value={formData.full_description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 resize-none transition-all duration-300 relative z-20"
                                        placeholder="Detailed elite description showcasing the exceptional nature of this academic opportunity..."
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-xs text-gray-400">💡 Pro Tip: Use compelling language that attracts top-tier students</p>
                                        <div className="text-xs text-gray-400">
                                            {formData.full_description?.length || 0} characters
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Rich Content Editor */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl mr-4">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">Elite Content Studio</h2>
                                    <p className="text-gray-300">Professional rich text editor for premium scholarship content</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-400 to-blue-400 text-black rounded-full text-xs font-black">
                                        EDITOR
                                    </span>
                                </div>
                            </div>
                            
                            <label className="block text-sm font-bold text-white mb-3">
                                Elite Requirements & Content *
                            </label>

                            {/* Elite Rich Text Toolbar */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/20 rounded-t-2xl px-6 py-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => execCommand('bold')}
                                    className="px-4 py-2 text-sm bg-black/50 border border-white/20 rounded-xl text-white hover:bg-white/10 font-bold transition-all duration-300 hover:scale-105"
                                    title="Elite Bold"
                                >
                                    <strong className="flex items-center">
                                        <Diamond className="w-3 h-3 mr-1 text-indigo-400" />
                                        B
                                    </strong>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => execCommand('italic')}
                                    className="px-4 py-2 text-sm bg-black/50 border border-white/20 rounded-xl text-white hover:bg-white/10 italic transition-all duration-300 hover:scale-105"
                                    title="Elite Italic"
                                >
                                    <em className="flex items-center">
                                        <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                                        I
                                    </em>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('Bullet list clicked');
                                        insertList('ul');
                                    }}
                                    className="px-4 py-2 text-sm bg-black/50 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
                                    title="Elite Bullet List"
                                >
                                    <span className="flex items-center">
                                        <Target className="w-3 h-3 mr-1 text-cyan-400" />
                                        • List
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('Numbered list clicked');
                                        insertList('ol');
                                    }}
                                    className="px-4 py-2 text-sm bg-black/50 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
                                    title="Elite Numbered List"
                                >
                                    <span className="flex items-center">
                                        <Layers className="w-3 h-3 mr-1 text-emerald-400" />
                                        1. List
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = prompt('Enter Elite URL:');
                                        if (url) document.execCommand('createLink', false, url);
                                    }}
                                    className="px-4 py-2 text-sm bg-black/50 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
                                    title="Elite Link"
                                >
                                    <span className="flex items-center">
                                        <Globe className="w-3 h-3 mr-1 text-blue-400" />
                                        Link
                                    </span>
                                </button>
                            </div>

                            <div
                                ref={editorRef}
                                contentEditable
                                className="w-full min-h-64 px-6 py-4 bg-black/50 border border-white/20 border-t-0 rounded-b-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 resize-none overflow-auto text-white transition-all duration-300 relative z-20 [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_li]:ml-4 [&_li]:mb-1"
                                style={{
                                    minHeight: '20rem',
                                    color: 'white',
                                    ...(!formData.content && {
                                        '::before': {
                                            content: '"Start writing your elite scholarship content here..."',
                                            color: '#9ca3af',
                                            pointerEvents: 'none'
                                        }
                                    })
                                }}
                                onInput={handleEditorInput}
                                onKeyDown={(e) => {
                                    // Handle Enter key in lists
                                    if (e.key === 'Enter') {
                                        const selection = window.getSelection();
                                        if (selection.rangeCount > 0) {
                                            const range = selection.getRangeAt(0);
                                            let listItem = range.startContainer;

                                            // Find if we're in a list item
                                            while (listItem && listItem !== e.target) {
                                                if (listItem.tagName === 'LI') {
                                                    e.preventDefault();

                                                    // Check if current list item is empty
                                                    if (listItem.textContent.trim() === '') {
                                                        // Exit list
                                                        const list = listItem.parentNode;
                                                        const newDiv = document.createElement('div');
                                                        newDiv.innerHTML = '<br>';
                                                        list.parentNode.insertBefore(newDiv, list.nextSibling);
                                                        listItem.remove();

                                                        // Move cursor to new div
                                                        const newRange = document.createRange();
                                                        newRange.setStart(newDiv, 0);
                                                        newRange.collapse(true);
                                                        selection.removeAllRanges();
                                                        selection.addRange(newRange);
                                                    } else {
                                                        // Create new list item
                                                        const newLi = document.createElement('li');
                                                        newLi.innerHTML = '<br>';
                                                        listItem.parentNode.insertBefore(newLi, listItem.nextSibling);

                                                        // Move cursor to new list item
                                                        const newRange = document.createRange();
                                                        newRange.setStart(newLi, 0);
                                                        newRange.collapse(true);
                                                        selection.removeAllRanges();
                                                        selection.addRange(newRange);
                                                    }

                                                    // Update content
                                                    const content = e.target.innerHTML;
                                                    setFormData(prev => ({ ...prev, content }));
                                                    return;
                                                }
                                                listItem = listItem.parentNode;
                                            }
                                        }
                                    }
                                }}
                                onFocus={(e) => {
                                    if (!formData.content) {
                                        e.target.classList.add('focused');
                                    }
                                }}
                                onBlur={(e) => {
                                    e.target.classList.remove('focused');
                                }}
                                suppressContentEditableWarning={true}
                            />
                            
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-xs text-indigo-300 flex items-center">
                                    <Shield className="w-3 h-3 mr-1" />
                                    💎 Elite HTML formatting supported. Content automatically secured.
                                </p>
                                <div className="text-xs text-gray-400">
                                    Elite Content Studio v2.0
                                </div>
                            </div>
                        </div>

                        {/* Elite Provider Information */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mr-4">
                                    <Building className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">Elite Provider Hub</h2>
                                    <p className="text-gray-300">Professional organization and contact details</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-full text-xs font-black">
                                        ORGANIZATION
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Provider Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <Building className="w-5 h-5 text-emerald-400" />
                                            <Award className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            name="provider"
                                            value={formData.provider}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="e.g., Elite Gates Foundation, Oxford University"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Provider Logo URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <Upload className="w-5 h-5 text-emerald-400" />
                                            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            name="provider_logo"
                                            value={formData.provider_logo}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="https://elite-provider.com/premium-logo.png"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Website URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <Globe className="w-5 h-5 text-emerald-400" />
                                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            name="website_url"
                                            value={formData.website_url}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="https://elite-provider-website.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Application Portal *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10">
                                            <Rocket className="w-5 h-5 text-emerald-400" />
                                            <Target className="w-4 h-4 text-teal-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            name="application_url"
                                            value={formData.application_url}
                                            onChange={handleInputChange}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="https://elite-application-portal.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl mr-4">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">Elite Timeline Hub</h2>
                                    <p className="text-gray-300">Critical dates and deadlines for scholarship success</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-pink-400 to-rose-400 text-black rounded-full text-xs font-black">
                                        TIMELINE
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Application Deadline
                                    </label>
                                    <input
                                        type="date"
                                        name="application_deadline"
                                        value={formData.application_deadline}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white transition-all duration-300 relative z-20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Program Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="program_start_date"
                                        value={formData.program_start_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white transition-all duration-300 relative z-20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Program End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="program_end_date"
                                        value={formData.program_end_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white transition-all duration-300 relative z-20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Notification Date
                                    </label>
                                    <input
                                        type="date"
                                        name="notification_date"
                                        value={formData.notification_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white transition-all duration-300 relative z-20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Study Fields */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-6">Study Fields</h2>
                            
                            {formData.study_fields.map((field, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={field}
                                        onChange={(e) => handleArrayChange('study_fields', index, e.target.value)}
                                        className="flex-1 px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
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
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-6">Requirements</h2>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-white mb-3">
                                            Min Age
                                        </label>
                                        <input
                                            type="number"
                                            name="age_limit_min"
                                            value={formData.age_limit_min}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="18"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white mb-3">
                                            Max Age
                                        </label>
                                        <input
                                            type="number"
                                            name="age_limit_max"
                                            value={formData.age_limit_max}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="35"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white mb-3">
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
                                            className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                            placeholder="3.5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Language Requirements
                                    </label>
                                    <textarea
                                        name="language_requirements"
                                        value={formData.language_requirements}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                        placeholder="e.g., IELTS 7.0, TOEFL 100+"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Other Requirements
                                    </label>
                                    <textarea
                                        name="other_requirements"
                                        value={formData.other_requirements}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                        placeholder="Additional requirements, restrictions, or qualifications"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-6">Tags</h2>
                            
                            {formData.tags.map((tag, index) => (
                                <div key={index} className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="text"
                                        value={tag}
                                        onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                                        className="flex-1 px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
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
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-6">SEO & Meta Data</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        name="meta_title"
                                        value={formData.meta_title}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                        placeholder="SEO title for search engines"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.meta_title.length}/60 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Meta Description
                                    </label>
                                    <textarea
                                        name="meta_description"
                                        value={formData.meta_description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                        placeholder="Brief description for search engine results"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.meta_description.length}/160 characters
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Elite Sidebar */}
                    <div className="space-y-8">
                        {/* Elite Publication Status */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mr-4">
                                    <Rocket className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white mb-2">Elite Publication</h3>
                                    <p className="text-gray-300 text-sm">Control your scholarship's visibility</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Status
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                            <CheckCircle2 className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 text-white transition-all duration-300 relative z-20"
                                        >
                                            <option value="draft">🚧 Elite Draft</option>
                                            <option value="active">🚀 Active & Live</option>
                                            <option value="archived">🗄️ Archived</option>
                                            <option value="expired">⏰ Expired</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                id="featured"
                                                name="featured"
                                                checked={formData.featured}
                                                onChange={handleInputChange}
                                                className="h-5 w-5 text-yellow-500 focus:ring-yellow-500 border-gray-400 rounded bg-black/50"
                                            />
                                            <label htmlFor="featured" className="text-white font-semibold flex items-center">
                                                <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
                                                Featured Elite Scholarship
                                                <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-bold animate-pulse">
                                                    PREMIUM SPOTLIGHT
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="checkbox"
                                                id="verified"
                                                name="verified"
                                                checked={formData.verified}
                                                onChange={handleInputChange}
                                                className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-400 rounded bg-black/50"
                                            />
                                            <label htmlFor="verified" className="text-white font-semibold flex items-center">
                                                <Shield className="w-5 h-5 mr-2 text-green-400" />
                                                Verified Elite Scholarship
                                                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs font-bold">
                                                    CERTIFIED
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Category & Classification */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mr-4">
                                    <Layers className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white mb-2">Elite Classification</h3>
                                    <p className="text-gray-300 text-sm">Academic categorization and levels</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Category *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                            <Target className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white transition-all duration-300 relative z-20"
                                        >
                                            <option value="">Select Elite Category</option>
                                            {Array.isArray(categories) && categories.map((category, index) => (
                                                <option key={category.id || category.name || `category-${index}`} value={category.id || category.name}>
                                                    ⭐ {category.name || category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Education Level *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                            <GraduationCap className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <select
                                            name="education_level_id"
                                            value={formData.education_level_id}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white transition-all duration-300 relative z-20"
                                        >
                                            <option value="">Select Elite Level</option>
                                            {educationLevels.map((level, index) => (
                                                <option key={level.id || level.name || `level-${index}`} value={level.id || level.name}>
                                                    🎓 {level.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Funding Information */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6">Funding</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Funding Amount
                                    </label>
                                    <input
                                        type="text"
                                        name="funding_amount"
                                        value={formData.funding_amount}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                        placeholder="e.g., $50,000, Full funding, Up to €25,000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Currency
                                    </label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="CAD">CAD</option>
                                        <option value="AUD">AUD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Funding Type *
                                    </label>
                                    <select
                                        name="funding_type_id"
                                        value={formData.funding_type_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300 relative z-20"
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
                                    <h4 className="text-sm font-bold text-white mb-3">Coverage</h4>
                                    
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="covers_tuition"
                                            name="covers_tuition"
                                            checked={formData.covers_tuition}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="covers_tuition" className="text-sm font-semibold text-white">
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
                                        <label htmlFor="covers_living" className="text-sm font-semibold text-white">
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
                                        <label htmlFor="covers_travel" className="text-sm font-semibold text-white">
                                            Covers Travel
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eligible Regions */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6">Eligible Regions *</h3>
                            
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
                )}
            </div>
        </div>
    );
};

export default ScholarshipEditor;