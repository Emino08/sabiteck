import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    MapPin, 
    Building2, 
    Clock, 
    DollarSign, 
    Briefcase,
    Calendar,
    Users,
    ExternalLink,
    Mail,
    Globe,
    CheckCircle,
    XCircle,
    AlertCircle,
    Share2,
    Heart,
    ArrowLeft,
    Send,
    User,
    FileText,
    Star
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeHTML, secureLog } from '../../utils/security';

const JobDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    // State management
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [submittingApplication, setSubmittingApplication] = useState(false);
    
    // Application form state
    const [applicationForm, setApplicationForm] = useState({
        cover_letter: '',
        additional_info: '',
        portfolio_url: '',
        linkedin_url: '',
        expected_salary: '',
        available_from: '',
        resume_url: ''
    });
    
    // File upload state
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    
    // Helper function to ensure skills are in array format
    const getSkillsArray = (skills) => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'string') {
            // Handle comma-separated string
            return skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        }
        return [];
    };

    // Load job and check authentication status
    useEffect(() => {
        if (!slug || slug === 'null' || slug === 'undefined') {
            setError('Invalid job identifier');
            setLoading(false);
            return;
        }
        loadJob();
    }, [slug]);

    // Check application status when user changes
    useEffect(() => {
        if (job && user) {
            checkApplicationStatus();
        }
    }, [job, user]);
    
    const loadJob = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(`/api/jobs/${slug}`);
            if (response?.success && response?.data) {
                setJob(response.data);
            } else if (response?.id || response?.title) {
                // Some backends may return the job object directly
                setJob(response);
            } else {
                setError(response?.message || 'Job not found');
            }
        } catch (err) {
            setError('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };
    
    const checkApplicationStatus = async () => {
        if (!job || !user) return;
        try {
            const response = await apiRequest(`/api/jobs/${job.id}/check-application`);
            if (response?.success) {
                const normalized = {
                    has_applied: !!response.has_applied,
                    application: {
                        status: response.application_status || 'pending',
                        applied_at: response.applied_at || null
                    }
                };
                setApplicationStatus(normalized);
            }
        } catch (err) {
            secureLog('error', 'Failed to check application status', { error: err.message });
        }
    };
    
    const handleApplyClick = () => {
        if (!isAuthenticated()) {
            toast.error('Please log in to apply for this job');
            navigate('/login', { state: { returnTo: `/jobs/${slug}` } });
            return;
        }
        
        if (applicationStatus?.has_applied) {
            toast.info('You have already applied for this job');
            return;
        }
        
        setShowApplicationForm(true);
    };
    
    const handleApplicationSubmit = async (e) => {
        e.preventDefault();
        
        if (!applicationForm.cover_letter.trim()) {
            toast.error('Please provide a cover letter');
            return;
        }
        
        if (!applicationForm.resume_url) {
            toast.error('Please upload your resume/CV');
            return;
        }
        
        try {
            setSubmittingApplication(true);
            const response = await apiRequest(`/api/jobs/${job.id}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationForm)
            });
            
            if (response.success) {
                toast.success(response.message || 'Application submitted successfully!');
                setShowApplicationForm(false);
                setApplicationStatus({
                    has_applied: true,
                    application: {
                        status: 'pending',
                        applied_at: new Date().toISOString()
                    }
                });
                
                // Reset form
                setApplicationForm({
                    cover_letter: '',
                    additional_info: '',
                    portfolio_url: '',
                    linkedin_url: '',
                    expected_salary: '',
                    available_from: '',
                    resume_url: ''
                });
                setResumeFile(null);
            } else {
                toast.error(response.message || 'Application failed');
            }
        } catch (err) {
            toast.error('Failed to submit application');
        } finally {
            setSubmittingApplication(false);
        }
    };

    const handleResumeUpload = async (file) => {
        if (!file) return null;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF or Word document');
            return null;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return null;
        }

        try {
            setUploadingResume(true);
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('http://localhost:8000/api/upload/resume', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                toast.success('Resume uploaded successfully');
                return result.url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            toast.error('Failed to upload resume');
            return null;
        } finally {
            setUploadingResume(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
            const uploadedUrl = await handleResumeUpload(file);
            if (uploadedUrl) {
                setApplicationForm(prev => ({ ...prev, resume_url: uploadedUrl }));
            }
        }
    };
    
    const formatSalary = (min, max, currency = 'SLL', period = 'monthly') => {
        if (!min && !max) return 'Salary negotiable';
        
        const formatAmount = (amount) => {
            if (currency === 'SLL' && amount >= 1000) {
                return `${(amount / 1000).toFixed(0)}K`;
            }
            return amount.toLocaleString();
        };
        
        const range = min && max ? 
            `${formatAmount(min)} - ${formatAmount(max)}` : 
            (min ? `From ${formatAmount(min)}` : `Up to ${formatAmount(max)}`);
            
        return `${range} ${currency}/${period}`;
    };
    
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Not specified';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'reviewing': return 'text-blue-600 bg-blue-100';
            case 'shortlisted': return 'text-green-600 bg-green-100';
            case 'interviewed': return 'text-purple-600 bg-purple-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'hired': return 'text-green-800 bg-green-200';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32">
                <div className="flex items-center justify-center">
                    <LoadingSpinner size="large" />
                </div>
            </div>
        );
    }
    
    if (error || !job) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
                        <p className="text-gray-600 mb-6">
                            {error || 'The job you\'re looking for doesn\'t exist or has been removed.'}
                        </p>
                        <Link
                            to="/jobs"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                        >
                            Browse All Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    const jobDeadline = job.application_deadline || job.deadline;
    const isDeadlinePassed = jobDeadline && new Date(jobDeadline) < new Date();
    const canApply = !isDeadlinePassed && job.status === 'active';
    
    return (
        <div className="min-h-screen bg-gray-50 pt-24">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Jobs
                    </button>
                </div>
            </div>
            
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job Header */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        {job.featured && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                <Star className="w-3 h-3 mr-1" />
                                                Featured
                                            </span>
                                        )}
                                        {job.urgent && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                Urgent
                                            </span>
                                        )}
                                        {job.remote_work && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                Remote
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        {job.title}
                                    </h1>
                                    
                                    <div className="flex items-center space-x-6 text-gray-600">
                                        <div className="flex items-center">
                                            <Building2 className="w-5 h-5 mr-2" />
                                            <span className="font-medium">{job.company_name}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="w-5 h-5 mr-2" />
                                            <span>{job.location}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-5 h-5 mr-2" />
                                            <span>{formatTimeAgo(job.published_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {job.view_count} views • {job.application_count} applicants
                                    </div>
                                </div>
                            </div>
                            
                            {/* Job Meta Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="flex items-center">
                                    <Briefcase className="w-5 h-5 mr-2 text-gray-400" />
                                    <div>
                                        <div className="text-sm text-gray-500">Job Type</div>
                                        <div className="font-medium">
                                            {job.job_type ? job.job_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-gray-400" />
                                    <div>
                                        <div className="text-sm text-gray-500">Experience Level</div>
                                        <div className="font-medium capitalize">
                                            {job.experience_level || 'Not specified'}
                                        </div>
                                    </div>
                                </div>
                                
                                {jobDeadline && (
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                                        <div>
                                            <div className="text-sm text-gray-500">Application Deadline</div>
                                            <div className={`font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                                                {new Date(jobDeadline).toLocaleDateString()}
                                                {isDeadlinePassed && (
                                                    <span className="text-red-600 text-sm ml-2">(Expired)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Application Status */}
                        {applicationStatus?.has_applied && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                    <div>
                                        <div className="font-medium text-blue-900">Application Submitted</div>
                                        <div className="text-blue-700 text-sm">
                                            Your application was submitted on {new Date(applicationStatus.application.applied_at).toLocaleDateString()}.
                                            Current status: 
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(applicationStatus.application.status)}`}>
                                                {applicationStatus.application.status.charAt(0).toUpperCase() + applicationStatus.application.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Job Description */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                            <div className="prose prose-gray max-w-none">
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    {job.short_description}
                                </p>
                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHTML(job.description?.replace(/\n/g, '<br>')) || 'No detailed description available.'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Requirements */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                            <div
                                className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHTML(job.requirements?.replace(/\n/g, '<br>')) || 'No specific requirements listed.'
                                }}
                            />
                        </div>
                        
                        {/* Benefits */}
                        {job.benefits && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
                                <div
                                    className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHTML(job.benefits.replace(/\n/g, '<br>'))
                                    }}
                                />
                            </div>
                        )}
                        
                        {/* Skills Required */}
                        {job.skills_required && getSkillsArray(job.skills_required).length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Required</h2>
                                <div className="flex flex-wrap gap-2">
                                    {getSkillsArray(job.skills_required).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Similar Jobs */}
                        {job.similar_jobs && job.similar_jobs.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Jobs</h2>
                                <div className="space-y-4">
                                    {job.similar_jobs.map(similarJob => (
                                        <div key={similarJob.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">
                                                        <Link 
                                                            to={`/jobs/${similarJob.slug}`}
                                                            className="hover:text-blue-600 transition-colors duration-200"
                                                        >
                                                            {similarJob.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-gray-600 text-sm flex items-center">
                                                        <Building2 className="w-4 h-4 mr-1" />
                                                        {similarJob.company_name} • {similarJob.location}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatTimeAgo(similarJob.published_at)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Button */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                            <div className="text-center mb-4">
                                {canApply ? (
                                    !applicationStatus?.has_applied ? (
                                        <button
                                            onClick={handleApplyClick}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <Send className="w-5 h-5 mr-2" />
                                            Apply Now
                                        </button>
                                    ) : (
                                        <div className="w-full bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Application Submitted
                                        </div>
                                    )
                                ) : (
                                    <div className="w-full bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        {isDeadlinePassed ? 'Application Closed' : 'Not Available'}
                                    </div>
                                )}
                            </div>
                            
                            {job.external_application_url && (
                                <a
                                    href={job.external_application_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center mb-4"
                                >
                                    <ExternalLink className="w-5 h-5 mr-2" />
                                    Apply on Company Site
                                </a>
                            )}
                            
                            {job.application_email && (
                                <a
                                    href={`mailto:${job.application_email}`}
                                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                                >
                                    <Mail className="w-5 h-5 mr-2" />
                                    Email Application
                                </a>
                            )}
                        </div>
                        
                        {/* Company Info */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Company</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                                    <span className="text-gray-700">{job.company_name}</span>
                                </div>
                                
                                <div className="flex items-center">
                                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                                    <span className="text-gray-700">{job.location}</span>
                                </div>
                                
                                {job.company_website && (
                                    <div className="flex items-center">
                                        <Globe className="w-5 h-5 text-gray-400 mr-3" />
                                        <a 
                                            href={job.company_website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Job Stats */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Views</span>
                                    <span className="font-medium text-gray-900">{job.view_count}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Applications</span>
                                    <span className="font-medium text-gray-900">{job.application_count}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Posted</span>
                                    <span className="font-medium text-gray-900">
                                        {formatTimeAgo(job.published_at)}
                                    </span>
                                </div>
                                
                                {jobDeadline && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deadline</span>
                                        <span className={`font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                                            {new Date(jobDeadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Application Form Modal */}
            {showApplicationForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Apply for {job.title}
                                </h3>
                                <button
                                    onClick={() => setShowApplicationForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleApplicationSubmit} className="p-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cover Letter *
                                        </label>
                                        <textarea
                                            value={applicationForm.cover_letter}
                                            onChange={(e) => setApplicationForm(prev => ({ ...prev, cover_letter: e.target.value }))}
                                            rows={6}
                                            required
                                            placeholder="Tell us why you're interested in this position and how you can contribute..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Information
                                        </label>
                                        <textarea
                                            value={applicationForm.additional_info}
                                            onChange={(e) => setApplicationForm(prev => ({ ...prev, additional_info: e.target.value }))}
                                            rows={4}
                                            placeholder="Any additional information you'd like to share..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Portfolio URL
                                            </label>
                                            <input
                                                type="url"
                                                value={applicationForm.portfolio_url}
                                                onChange={(e) => setApplicationForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                                                placeholder="https://yourportfolio.com"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                LinkedIn Profile
                                            </label>
                                            <input
                                                type="url"
                                                value={applicationForm.linkedin_url}
                                                onChange={(e) => setApplicationForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Expected Salary ({job.salary_currency})
                                            </label>
                                            <input
                                                type="number"
                                                value={applicationForm.expected_salary}
                                                onChange={(e) => setApplicationForm(prev => ({ ...prev, expected_salary: e.target.value }))}
                                                placeholder="e.g. 5000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Available From
                                            </label>
                                            <input
                                                type="date"
                                                value={applicationForm.available_from}
                                                onChange={(e) => setApplicationForm(prev => ({ ...prev, available_from: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Resume Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Upload Resume/CV *
                                        </label>
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                    </svg>
                                                    {uploadingResume ? (
                                                        <p className="text-sm text-blue-600">Uploading...</p>
                                                    ) : resumeFile ? (
                                                        <div className="text-center">
                                                            <p className="text-sm text-green-600 font-medium">{resumeFile.name}</p>
                                                            <p className="text-xs text-gray-500">Click to replace</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                            <p className="text-xs text-gray-500">PDF or DOC (MAX. 5MB)</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                    disabled={uploadingResume}
                                                />
                                            </label>
                                        </div>
                                        {applicationForm.resume_url && (
                                            <p className="mt-2 text-sm text-green-600">✓ Resume uploaded successfully</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex space-x-4 mt-6 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowApplicationForm(false)}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingApplication || !applicationForm.cover_letter.trim() || !applicationForm.resume_url}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                    >
                                        {submittingApplication ? (
                                            <>
                                                <LoadingSpinner size="small" className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit Application
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;

