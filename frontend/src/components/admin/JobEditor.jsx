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
    Minus
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
            <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                        <p className="text-sm text-gray-600">Essential details about the job position</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Senior Software Engineer"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Tech Corp"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => handleInputChange('category_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Category</option>
                                {Array.isArray(categories) && categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., San Francisco, CA"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Type
                            </label>
                            <select
                                value={formData.job_type}
                                onChange={(e) => handleInputChange('job_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option key="full-time" value="full-time">Full-time</option>
                                <option key="part-time" value="part-time">Part-time</option>
                                <option key="contract" value="contract">Contract</option>
                                <option key="freelance" value="freelance">Freelance</option>
                                <option key="internship" value="internship">Internship</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Short Description
                        </label>
                        <textarea
                            value={formData.short_description}
                            onChange={(e) => handleInputChange('short_description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief overview of the position (1-2 sentences)"
                        />
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Job Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Detailed job description, responsibilities, and requirements..."
                            required
                        />
                    </div>
                </div>

                {/* Requirements & Skills */}
                <div className="bg-white">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Requirements & Skills</h3>
                        <p className="text-sm text-gray-600">Specify the qualifications and skills needed</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Experience Level
                            </label>
                            <select
                                value={formData.experience_level}
                                onChange={(e) => handleInputChange('experience_level', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option key="entry" value="entry">Entry Level</option>
                                <option key="junior" value="junior">Junior</option>
                                <option key="mid" value="mid">Mid Level</option>
                                <option key="senior" value="senior">Senior</option>
                                <option key="lead" value="lead">Lead</option>
                                <option key="executive" value="executive">Executive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Education Level
                            </label>
                            <select
                                value={formData.education_level}
                                onChange={(e) => handleInputChange('education_level', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option key="none" value="">No specific requirement</option>
                                <option key="high-school" value="high-school">High School</option>
                                <option key="associate" value="associate">Associate Degree</option>
                                <option key="bachelor" value="bachelor">Bachelor's Degree</option>
                                <option key="master" value="master">Master's Degree</option>
                                <option key="phd" value="phd">PhD</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Required Skills
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {Array.isArray(formData.skills_required) && formData.skills_required.map((skill, index) => (
                                <span key={`skill-${index}-${skill}`} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(index)}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={handleSkillKeyPress}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Add a skill..."
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Compensation */}
                <div className="bg-white">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Compensation</h3>
                        <p className="text-sm text-gray-600">Salary range and currency</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.salary_currency}
                                onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option key="USD" value="USD">USD</option>
                                <option key="EUR" value="EUR">EUR</option>
                                <option key="GBP" value="GBP">GBP</option>
                                <option key="CAD" value="CAD">CAD</option>
                                <option key="AUD" value="AUD">AUD</option>
                                <option key="SLL" value="SLL">SLL (Sierra Leone Leone)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Salary
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.salary_min}
                                    onChange={(e) => handleInputChange('salary_min', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="50000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Salary
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.salary_max}
                                    onChange={(e) => handleInputChange('salary_max', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="80000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company & Contact Information */}
                <div className="bg-white">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Company & Contact Information</h3>
                        <p className="text-sm text-gray-600">Additional company details and contact information</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Logo URL
                            </label>
                            <div className="relative">
                                <Upload className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.company_logo}
                                    onChange={(e) => handleInputChange('company_logo', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.company_website}
                                    onChange={(e) => handleInputChange('company_website', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="hr@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                External Application URL
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.external_url}
                                    onChange={(e) => handleInputChange('external_url', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://company.com/careers/apply"
                                />
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                                If provided, applicants will be redirected to this URL instead of using the built-in application form
                            </p>
                        </div>
                    </div>
                </div>

                {/* Publication Settings */}
                <div className="bg-white">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Publication Settings</h3>
                        <p className="text-sm text-gray-600">Control how and when this job is published</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Application Deadline
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.application_deadline}
                                    onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option key="draft" value="draft">Draft</option>
                                <option key="active" value="active">Active</option>
                                <option key="closed" value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remote_work"
                                checked={formData.remote_work}
                                onChange={(e) => handleInputChange('remote_work', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remote_work" className="ml-2 text-sm text-gray-900">
                                Remote Work Available
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="featured"
                                checked={formData.featured}
                                onChange={(e) => handleInputChange('featured', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="featured" className="ml-2 text-sm text-gray-900 flex items-center">
                                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                Feature this job (appears in featured listings)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                {jobId ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {jobId ? 'Update Job' : 'Create Job'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobEditor;

