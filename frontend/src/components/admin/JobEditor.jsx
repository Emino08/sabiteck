import React, { useState, useEffect } from 'react';
import {
    Save,
    X,
    Upload,
    Link as LinkIcon,
    Calendar,
    MapPin,
    Building,
    DollarSign,
    Users,
    Globe,
    Eye,
    EyeOff,
    Star,
    Plus,
    Minus,
    Crown,
    Sparkles,
    Zap,
    Target,
    Shield,
    Award,
    Rocket,
    Diamond,
    Briefcase,
    TrendingUp,
    CheckCircle2,
    Clock,
    Settings,
    Layers,
    UserCheck
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const JobEditor = ({ jobId, onSave, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        company_name: '',
        company_logo: '',
        company_website: '',
        description: '',
        short_description: '',
        category_id: '',
        location: '',
        job_type: 'full-time',
        remote_work: false,
        experience_level: 'entry',
        education_level: '',
        salary_min: '',
        salary_max: '',
        salary_currency: 'USD',
        skills_required: [],
        application_deadline: '',
        contact_email: '',
        contact_phone: '',
        external_url: '',
        featured: false,
        status: 'draft'
    });

    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        loadCategories();
        if (jobId) {
            loadJob();
        }
    }, [jobId]);

    const loadCategories = async () => {
        try {
            const response = await apiRequest('/api/admin/jobs/categories');
            if (response.success) {
                // Handle different response structures
                const categoriesData = response.data || response.categories || [];
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
            setCategories([]); // Ensure categories is always an array
        }
    };

    const loadJob = async () => {
        if (!jobId) {
            console.warn('JobEditor: No jobId provided');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await apiRequest(`/api/admin/jobs/${jobId}`);
            if (response.success) {
                const job = response.job || response.data;
                setFormData({
                    title: job.title || '',
                    company_name: job.company_name || '',
                    company_logo: job.company_logo || '',
                    company_website: job.company_website || '',
                    description: job.description || '',
                    short_description: job.short_description || '',
                    category_id: job.category_id || '',
                    location: job.location || '',
                    job_type: job.job_type || 'full-time',
                    remote_work: Boolean(job.remote_work),
                    experience_level: job.experience_level || 'entry',
                    education_level: job.education_level || '',
                    salary_min: job.salary_min || '',
                    salary_max: job.salary_max || '',
                    salary_currency: job.salary_currency || 'USD',
                    skills_required: job.skills || job.skills_required || [],
                    application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
                    contact_email: job.contact_email || '',
                    contact_phone: job.contact_phone || '',
                    external_url: job.external_url || '',
                    featured: Boolean(job.featured),
                    status: job.status || 'draft'
                });
            } else {
                setError(response.message || 'Failed to load job');
            }
        } catch (err) {
            setError('Failed to load job');
            console.error('Error loading job:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
            setFormData(prev => ({
                ...prev,
                skills_required: [...prev.skills_required, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills_required: prev.skills_required.filter((_, i) => i !== index)
        }));
    };

    const handleSkillKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.company_name.trim() || !formData.description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const url = jobId ? `/api/admin/jobs/${jobId}` : '/api/admin/jobs';
            const method = jobId ? 'PUT' : 'POST';

            const response = await apiRequest(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.success) {
                onSave();
            } else {
                setError(response.message || `Failed to ${jobId ? 'update' : 'create'} job`);
            }
        } catch (err) {
            setError(`Failed to ${jobId ? 'update' : 'create'} job`);
            console.error('Error saving job:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                        <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                            <Crown className="w-16 h-16 text-yellow-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Loading Elite Job Editor...</h2>
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="container mx-auto px-6 py-8 relative z-10">
                {/* Elite Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                            <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                <Briefcase className="w-12 h-12 text-indigo-400" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                        Elite Job Editor
                    </h1>
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 font-semibold">Professional Job Creation Studio</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Create exceptional job opportunities that attract top-tier talent with our premium job editor
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Elite Basic Information */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mr-4">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">Elite Job Foundation</h3>
                                    <p className="text-gray-300">Essential details that define your elite opportunity</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-400 to-purple-400 text-black rounded-full text-xs font-black">
                                        PREMIUM
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 text-lg transition-all duration-300"
                                        placeholder="e.g., Elite Senior Software Engineer"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Company Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Building className="w-5 h-5 text-indigo-400" />
                                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.company_name}
                                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., Elite Tech Corporation"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Professional Category
                                    </label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white transition-all duration-300"
                                    >
                                        <option value="">Select Elite Category</option>
                                        {Array.isArray(categories) && categories.map((category, index) => (
                                            <option key={category.id || category.name || `category-${index}`} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Prime Location
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <MapPin className="w-5 h-5 text-indigo-400" />
                                            <Globe className="w-4 h-4 text-green-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="e.g., San Francisco, CA (Elite Hub)"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Employment Type
                                    </label>
                                    <select
                                        value={formData.job_type}
                                        onChange={(e) => handleInputChange('job_type', e.target.value)}
                                        className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white transition-all duration-300"
                                    >
                                        <option value="full-time">Full-time Elite</option>
                                        <option value="part-time">Part-time Premium</option>
                                        <option value="contract">Elite Contract</option>
                                        <option value="freelance">Premium Freelance</option>
                                        <option value="internship">Elite Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="block text-sm font-bold text-white mb-3">
                                    Elite Summary
                                </label>
                                <textarea
                                    value={formData.short_description}
                                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 resize-none transition-all duration-300"
                                    placeholder="Compelling elite overview that captures the essence of this premium opportunity..."
                                />
                            </div>

                            <div className="mt-8">
                                <label className="block text-sm font-bold text-white mb-3">
                                    Elite Job Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={10}
                                    className="w-full px-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 resize-none transition-all duration-300"
                                    placeholder="Craft a detailed, compelling description that showcases this elite opportunity, including responsibilities, impact, and what makes this role exceptional..."
                                    required
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <p className="text-xs text-gray-400">💡 Pro Tip: Use compelling language that attracts top-tier talent</p>
                                    <div className="text-xs text-gray-400">
                                        {formData.description?.length || 0} characters
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Requirements & Skills */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-4">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">Elite Requirements & Skills</h3>
                                    <p className="text-gray-300">Define the qualifications for top-tier talent</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-black rounded-full text-xs font-black">
                                        PROFESSIONAL
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Experience Level
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                            <Award className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <select
                                            value={formData.experience_level}
                                            onChange={(e) => handleInputChange('experience_level', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white transition-all duration-300"
                                        >
                                            <option value="entry">Entry Level Elite</option>
                                            <option value="junior">Junior Professional</option>
                                            <option value="mid">Mid Level Expert</option>
                                            <option value="senior">Senior Elite</option>
                                            <option value="lead">Lead Professional</option>
                                            <option value="executive">Executive Elite</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Education Level
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                            <Layers className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <select
                                            value={formData.education_level}
                                            onChange={(e) => handleInputChange('education_level', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white transition-all duration-300"
                                        >
                                            <option value="">No specific requirement</option>
                                            <option value="high-school">High School</option>
                                            <option value="associate">Associate Degree</option>
                                            <option value="bachelor">Bachelor's Degree</option>
                                            <option value="master">Master's Degree</option>
                                            <option value="phd">PhD / Doctorate</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="block text-sm font-bold text-white mb-3">
                                    Elite Skills Portfolio
                                </label>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {Array.isArray(formData.skills_required) && formData.skills_required.map((skill, index) => (
                                        <span key={`skill-${index}-${skill}`} className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 backdrop-blur-lg">
                                            <Diamond className="w-4 h-4 mr-2 text-purple-400" />
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(index)}
                                                className="ml-3 text-pink-400 hover:text-pink-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex space-x-3">
                                    <div className="relative flex-1">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Zap className="w-5 h-5 text-purple-400" />
                                            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyPress={handleSkillKeyPress}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="Add an elite skill..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Elite Skill
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Elite Compensation */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-4">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">Elite Compensation Package</h3>
                                    <p className="text-gray-300">Premium salary range and benefits</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-black rounded-full text-xs font-black">
                                        PREMIUM PAY
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Currency
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                            <TrendingUp className="w-5 h-5 text-green-400" />
                                        </div>
                                        <select
                                            value={formData.salary_currency}
                                            onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-white transition-all duration-300"
                                        >
                                            <option value="USD">💰 USD - US Dollar</option>
                                            <option value="EUR">💶 EUR - Euro</option>
                                            <option value="GBP">💷 GBP - British Pound</option>
                                            <option value="CAD">🍁 CAD - Canadian Dollar</option>
                                            <option value="AUD">🦘 AUD - Australian Dollar</option>
                                            <option value="SLL">🇸🇱 SLL - Sierra Leone Leone</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Minimum Elite Salary
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <DollarSign className="w-5 h-5 text-green-400" />
                                            <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.salary_min}
                                            onChange={(e) => handleInputChange('salary_min', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="75000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Maximum Elite Salary
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <DollarSign className="w-5 h-5 text-green-400" />
                                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.salary_max}
                                            onChange={(e) => handleInputChange('salary_max', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="150000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Company & Contact Information */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mr-4">
                                    <Building className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">Elite Company & Contact Hub</h3>
                                    <p className="text-gray-300">Professional company details and contact channels</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-black rounded-full text-xs font-black">
                                        CORPORATE
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Company Logo URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Upload className="w-5 h-5 text-blue-400" />
                                            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.company_logo}
                                            onChange={(e) => handleInputChange('company_logo', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://elite-company.com/premium-logo.png"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Company Website
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Globe className="w-5 h-5 text-blue-400" />
                                            <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.company_website}
                                            onChange={(e) => handleInputChange('company_website', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://elite-company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Contact Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Users className="w-5 h-5 text-blue-400" />
                                            <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.contact_email}
                                            onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="careers@elite-company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Contact Phone
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <UserCheck className="w-5 h-5 text-blue-400" />
                                            <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.contact_phone}
                                            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="+1 (555) ELITE-HR"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite External Application Portal
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <LinkIcon className="w-5 h-5 text-blue-400" />
                                            <Rocket className="w-4 h-4 text-purple-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.external_url}
                                            onChange={(e) => handleInputChange('external_url', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white placeholder-gray-400 transition-all duration-300"
                                            placeholder="https://elite-company.com/premium-careers/apply"
                                        />
                                    </div>
                                    <p className="mt-3 text-sm text-gray-300 flex items-center">
                                        💡 <span className="ml-2">Premium redirect: Applicants will be directed to your elite application portal instead of the built-in form</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Elite Publication Settings */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex items-center mb-8">
                                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mr-4">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">Elite Publication Control</h3>
                                    <p className="text-gray-300">Advanced settings for elite job visibility and timing</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-black rounded-full text-xs font-black">
                                        CONTROL PANEL
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Application Deadline
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                            <Calendar className="w-5 h-5 text-orange-400" />
                                            <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                                        </div>
                                        <input
                                            type="date"
                                            value={formData.application_deadline}
                                            onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 text-white transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white mb-3">
                                        Elite Status
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                            <Rocket className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 text-white transition-all duration-300"
                                        >
                                            <option value="draft">🚧 Elite Draft</option>
                                            <option value="active">🚀 Active & Live</option>
                                            <option value="closed">🔒 Closed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-6">
                                <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                                    <h4 className="text-lg font-black text-white mb-4 flex items-center">
                                        <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                                        Elite Features & Perks
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="flex items-center p-4 bg-black/40 rounded-xl border border-white/10">
                                            <input
                                                type="checkbox"
                                                id="remote_work"
                                                checked={formData.remote_work}
                                                onChange={(e) => handleInputChange('remote_work', e.target.checked)}
                                                className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-400 rounded bg-black/50"
                                            />
                                            <label htmlFor="remote_work" className="ml-4 text-white font-semibold flex items-center">
                                                <Globe className="w-5 h-5 mr-2 text-green-400" />
                                                Elite Remote Work Available
                                                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs font-bold">
                                                    FLEXIBLE
                                                </span>
                                            </label>
                                        </div>

                                        <div className="flex items-center p-4 bg-black/40 rounded-xl border border-white/10">
                                            <input
                                                type="checkbox"
                                                id="featured"
                                                checked={formData.featured}
                                                onChange={(e) => handleInputChange('featured', e.target.checked)}
                                                className="h-5 w-5 text-yellow-500 focus:ring-yellow-500 border-gray-400 rounded bg-black/50"
                                            />
                                            <label htmlFor="featured" className="ml-4 text-white font-semibold flex items-center">
                                                <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
                                                Feature This Elite Job
                                                <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-bold animate-pulse">
                                                    PREMIUM SPOTLIGHT
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Error Display */}
                        {error && (
                            <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6 mb-8">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-500 rounded-lg mr-3">
                                        <X className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-300 mb-1">
                                            Elite Editor Error
                                        </h3>
                                        <div className="text-red-200">
                                            {error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Elite Action Buttons */}
                        <div className="flex justify-between items-center pt-8 border-t border-white/10 mt-8">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center text-green-400">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    <span className="text-sm font-semibold">Auto-Save Active</span>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-8 py-4 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-red-500 font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            {jobId ? 'Updating Elite Job...' : 'Creating Elite Job...'}
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="w-5 h-5 mr-2" />
                                            {jobId ? 'Update Elite Job' : 'Launch Elite Job'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobEditor;

