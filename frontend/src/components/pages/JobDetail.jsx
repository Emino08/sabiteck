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
    Star,
    Crown,
    Shield,
    Sparkles,
    Diamond,
    Zap,
    Trophy,
    TrendingUp,
    Award,
    Target
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pt-24 relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-6000"></div>
            </div>
            {/* Elite Header */}
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 relative z-10">
                <div className="container mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors duration-300 group"
                    >
                        <div className="p-2 bg-black/40 backdrop-blur-lg rounded-xl border border-white/20 mr-3 group-hover:border-indigo-500/30 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">Back to Elite Jobs</span>
                    </button>
                </div>
            </div>
            
            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Elite Job Header */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        {job.featured && (
                                            <span className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">
                                                <Crown className="w-4 h-4 mr-2 fill-current" />
                                                Elite Featured
                                            </span>
                                        )}
                                        {job.urgent && (
                                            <span className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                                <Zap className="w-4 h-4 mr-2" />
                                                Elite Urgent
                                            </span>
                                        )}
                                        {job.remote_work && (
                                            <span className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                                                <Globe className="w-4 h-4 mr-2" />
                                                Elite Remote
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h1 className="text-3xl lg:text-4xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                                        {job.title}
                                    </h1>
                                    
                                    <div className="flex flex-wrap items-center gap-6 text-gray-300">
                                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-2xl border border-white/20">
                                            <Building2 className="w-5 h-5 mr-2 text-indigo-400" />
                                            <span className="font-semibold">{job.company_name}</span>
                                        </div>
                                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-2xl border border-white/20">
                                            <MapPin className="w-5 h-5 mr-2 text-purple-400" />
                                            <span className="font-semibold">{job.location}</span>
                                        </div>
                                        <div className="flex items-center bg-black/40 px-4 py-2 rounded-2xl border border-white/20">
                                            <Clock className="w-5 h-5 mr-2 text-green-400" />
                                            <span className="font-semibold">{formatTimeAgo(job.published_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="text-2xl lg:text-3xl font-black text-green-400 mb-2 flex items-center justify-end">
                                        <DollarSign className="w-8 h-8 mr-2" />
                                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                                    </div>
                                    <div className="flex items-center justify-end gap-4 text-sm text-gray-400">
                                        <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-white/20">
                                            <TrendingUp className="w-4 h-4 mr-1 text-blue-400" />
                                            <span className="font-semibold">{job.view_count} views</span>
                                        </div>
                                        <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-white/20">
                                            <Users className="w-4 h-4 mr-1 text-purple-400" />
                                            <span className="font-semibold">{job.application_count} applicants</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Elite Job Meta Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/20">
                                <div className="flex items-center p-4 bg-black/40 rounded-2xl border border-indigo-500/30 hover:border-indigo-500/50 transition-colors">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl mr-4">
                                        <Briefcase className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-semibold">Elite Job Type</div>
                                        <div className="font-bold text-white">
                                            {job.job_type ? job.job_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Elite Position'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center p-4 bg-black/40 rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-colors">
                                    <div className="p-2 bg-purple-500/20 rounded-xl mr-4">
                                        <Award className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-semibold">Elite Experience</div>
                                        <div className="font-bold text-white capitalize">
                                            {job.experience_level || 'All Elite Levels'}
                                        </div>
                                    </div>
                                </div>

                                {jobDeadline && (
                                    <div className="flex items-center p-4 bg-black/40 rounded-2xl border border-red-500/30 hover:border-red-500/50 transition-colors">
                                        <div className="p-2 bg-red-500/20 rounded-xl mr-4">
                                            <Calendar className="w-6 h-6 text-red-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400 font-semibold">Elite Deadline</div>
                                            <div className={`font-bold ${isDeadlinePassed ? 'text-red-400' : 'text-white'}`}>
                                                {new Date(jobDeadline).toLocaleDateString()}
                                                {isDeadlinePassed && (
                                                    <span className="text-red-400 text-sm ml-2">(Expired)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Elite Application Status */}
                        {applicationStatus?.has_applied && (
                            <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-2xl">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-500/20 rounded-2xl mr-4 animate-pulse">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg mb-2">Elite Application Submitted</div>
                                        <div className="text-gray-300">
                                            Your elite application was submitted on <span className="text-green-400 font-semibold">{new Date(applicationStatus.application.applied_at).toLocaleDateString()}</span>.
                                            <br />Current status:
                                            <span className="ml-2 px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                                                {applicationStatus.application.status.charAt(0).toUpperCase() + applicationStatus.application.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Elite Job Description */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">Elite Job Description</h2>
                            </div>
                            <div className="prose prose-lg max-w-none prose-invert">
                                <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                                    {job.short_description}
                                </p>
                                <div
                                    className="text-gray-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHTML(job.description?.replace(/\n/g, '<br>')) || 'Elite opportunity details coming soon.'
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Elite Requirements */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30">
                                    <Target className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">Elite Requirements</h2>
                            </div>
                            <div
                                className="prose prose-lg max-w-none prose-invert text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHTML(job.requirements?.replace(/\n/g, '<br>')) || 'Elite qualifications will be specified.'
                                }}
                            />
                        </div>
                        
                        {/* Elite Benefits */}
                        {job.benefits && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
                                        <Trophy className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-black bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">Elite Benefits & Perks</h2>
                                </div>
                                <div
                                    className="prose prose-lg max-w-none prose-invert text-gray-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHTML(job.benefits.replace(/\n/g, '<br>'))
                                    }}
                                />
                            </div>
                        )}
                        
                        {/* Elite Skills Required */}
                        {job.skills_required && getSkillsArray(job.skills_required).length > 0 && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30">
                                        <Sparkles className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">Elite Skills Required</h2>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {getSkillsArray(job.skills_required).map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-lg hover:scale-105 transition-transform duration-300"
                                        >
                                            <Diamond className="w-3 h-3 mr-1" />
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Elite Similar Jobs */}
                        {job.similar_jobs && job.similar_jobs.length > 0 && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                                        <TrendingUp className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <h2 className="text-2xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Elite Similar Opportunities</h2>
                                </div>
                                <div className="space-y-4">
                                    {job.similar_jobs.map(similarJob => (
                                        <div key={similarJob.id} className="group bg-black/40 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                                        <Link
                                                            to={`/jobs/${similarJob.slug}`}
                                                            className="flex items-center"
                                                        >
                                                            <Star className="w-4 h-4 mr-2 text-yellow-400" />
                                                            {similarJob.title}
                                                        </Link>
                                                    </h3>
                                                    <p className="text-gray-300 text-sm flex items-center">
                                                        <Building2 className="w-4 h-4 mr-2 text-indigo-400" />
                                                        {similarJob.company_name} • {similarJob.location}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-400 bg-black/40 px-3 py-1 rounded-xl border border-white/20">
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
                        {/* Elite Apply Section */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl sticky top-4 hover:border-white/20 transition-all duration-500">
                            <div className="text-center mb-6">
                                {canApply ? (
                                    !applicationStatus?.has_applied ? (
                                        <button
                                            onClick={handleApplyClick}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                            <Send className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                                            Apply to Elite Position
                                        </button>
                                    ) : (
                                        <div className="w-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-6 py-4 rounded-2xl font-bold border border-green-500/30 flex items-center justify-center animate-pulse">
                                            <CheckCircle className="w-5 h-5 mr-2 fill-current" />
                                            Elite Application Submitted
                                        </div>
                                    )
                                ) : (
                                    <div className="w-full bg-gradient-to-r from-gray-500/20 to-red-500/20 text-gray-400 px-6 py-4 rounded-2xl font-bold border border-gray-500/30 flex items-center justify-center">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        {isDeadlinePassed ? 'Elite Application Closed' : 'Elite Position Unavailable'}
                                    </div>
                                )}
                            </div>
                            
                            {job.external_application_url && (
                                <a
                                    href={job.external_application_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full border border-indigo-500/30 bg-black/40 backdrop-blur-lg text-indigo-400 hover:bg-indigo-500/20 px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center mb-4"
                                >
                                    <ExternalLink className="w-5 h-5 mr-2" />
                                    Apply on Elite Company Site
                                </a>
                            )}

                            {job.application_email && (
                                <a
                                    href={`mailto:${job.application_email}`}
                                    className="w-full border border-purple-500/30 bg-black/40 backdrop-blur-lg text-purple-400 hover:bg-purple-500/20 px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center"
                                >
                                    <Mail className="w-5 h-5 mr-2" />
                                    Elite Email Application
                                </a>
                            )}
                        </div>
                        
                        {/* Elite Company Info */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                                    <Building2 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">Elite Company</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-black/40 rounded-2xl border border-indigo-500/30">
                                    <Building2 className="w-5 h-5 text-indigo-400 mr-3" />
                                    <span className="text-white font-semibold">{job.company_name}</span>
                                </div>

                                <div className="flex items-center p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                                    <MapPin className="w-5 h-5 text-purple-400 mr-3" />
                                    <span className="text-white font-semibold">{job.location}</span>
                                </div>

                                {job.company_website && (
                                    <a
                                        href={job.company_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-3 bg-black/40 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105 group"
                                    >
                                        <Globe className="w-5 h-5 text-green-400 mr-3 group-hover:animate-spin" />
                                        <span className="text-green-400 font-semibold group-hover:text-green-300">Visit Elite Website</span>
                                        <ExternalLink className="w-4 h-4 ml-auto text-green-400" />
                                    </a>
                                )}
                            </div>
                        </div>
                        
                        {/* Elite Job Statistics */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-lg font-black bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">Elite Statistics</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-blue-500/30">
                                    <div className="flex items-center">
                                        <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                                        <span className="text-gray-400 font-semibold">Elite Views</span>
                                    </div>
                                    <span className="font-bold text-blue-400">{job.view_count}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-purple-400 mr-2" />
                                        <span className="text-gray-400 font-semibold">Elite Applications</span>
                                    </div>
                                    <span className="font-bold text-purple-400">{job.application_count}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-green-500/30">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 text-green-400 mr-2" />
                                        <span className="text-gray-400 font-semibold">Elite Posted</span>
                                    </div>
                                    <span className="font-bold text-green-400">
                                        {formatTimeAgo(job.published_at)}
                                    </span>
                                </div>

                                {jobDeadline && (
                                    <div className="flex justify-between items-center p-3 bg-black/40 rounded-2xl border border-red-500/30">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-red-400 mr-2" />
                                            <span className="text-gray-400 font-semibold">Elite Deadline</span>
                                        </div>
                                        <span className={`font-bold ${isDeadlinePassed ? 'text-red-400' : 'text-white'}`}>
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

