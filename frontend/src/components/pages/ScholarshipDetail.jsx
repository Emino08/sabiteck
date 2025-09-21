import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Calendar,
    DollarSign,
    MapPin,
    Award,
    Users,
    Clock,
    BookOpen,
    ExternalLink,
    Share2,
    Heart,
    Download,
    ChevronRight,
    GraduationCap,
    Globe,
    Star,
    Crown,
    Shield,
    Sparkles,
    Trophy,
    Diamond,
    Zap,
    CheckCircle
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import { sanitizeHTML, secureLog } from '../../utils/security';

const ScholarshipDetail = () => {
    const { slug } = useParams();
    const [scholarship, setScholarship] = useState(null);
    const [relatedScholarships, setRelatedScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        loadScholarshipDetail();
    }, [slug]);

    const loadScholarshipDetail = async () => {
        try {
            setLoading(true);

            // Check if slug is provided
            if (!slug || slug === 'undefined') {
                setError('Scholarship not found - invalid URL');
                setLoading(false);
                return;
            }

            const response = await apiRequest(`/api/scholarships/${slug}`);

            if (response.success && response.data && response.data.id) {
                setScholarship(response.data);
                // Use category instead of category_id for related scholarships
                if (response.data.category) {
                    loadRelatedScholarships(response.data.category);
                }
            } else {
                setError(response.message || 'Failed to load scholarship details');
            }
        } catch (err) {
            setError('Failed to load scholarship details');
            secureLog('error', 'Error loading scholarship', { error: err.message, slug: slug });
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedScholarships = async (category) => {
        try {
            const response = await apiRequest(`/api/scholarships?category=${encodeURIComponent(category)}&limit=4`);
            if (response && response.success && response.data && Array.isArray(response.data)) {
                // Filter out current scholarship
                const filtered = response.data.filter(s => s.slug !== slug);
                setRelatedScholarships(filtered.slice(0, 3));
            }
        } catch (err) {
            secureLog('error', 'Error loading related scholarships', { error: err.message });
        }
    };

    const handleSaveScholarship = () => {
        setIsSaved(!isSaved);
        // TODO: Implement save to backend
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: scholarship.title,
                text: scholarship.short_description,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            // TODO: Show toast notification
        }
    };

    const formatDeadline = (deadline) => {
        if (!deadline) return 'No deadline specified';
        const date = new Date(deadline);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return 'Deadline passed';
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays <= 30) {
            return `${diffDays} days left`;
        } else {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    };

    const getDeadlineStatus = (deadline) => {
        if (!deadline) return 'text-gray-500';
        const date = new Date(deadline);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-red-600';
        if (diffDays <= 7) return 'text-orange-600';
        if (diffDays <= 30) return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center">
                <ErrorMessage message={error} />
            </div>
        );
    }

    if (!scholarship) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Scholarship Not Found</h2>
                    <p className="text-gray-600 mb-4">The scholarship you're looking for doesn't exist.</p>
                    <Link 
                        to="/scholarships" 
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Browse all scholarships
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pt-24 relative overflow-hidden">
            {/* Elite Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-6000"></div>
            </div>
            {/* Elite Breadcrumb */}
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-300 hover:text-indigo-400 transition-colors">
                                    <Crown className="w-4 h-4 mr-1" />
                                    Home
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                    <Link to="/scholarships" className="ml-1 text-sm font-medium text-gray-300 hover:text-indigo-400 md:ml-2 transition-colors">
                                        <Diamond className="w-4 h-4 mr-1" />
                                        Elite Scholarships
                                    </Link>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                    <span className="ml-1 text-sm font-medium text-yellow-400 md:ml-2 truncate max-w-xs flex items-center">
                                        <Star className="w-4 h-4 mr-1 fill-current" />
                                        {scholarship.title}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Elite Header */}
            <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative group">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                                    {scholarship.provider_logo ? (
                                        <img
                                            src={scholarship.provider_logo}
                                            alt={scholarship.provider}
                                            className="relative w-16 h-16 rounded-lg object-cover border border-white/20 backdrop-blur-lg"
                                        />
                                    ) : (
                                        <div className="relative w-16 h-16 rounded-lg bg-black/50 backdrop-blur-lg border border-white/20 flex items-center justify-center">
                                            <Trophy className="w-8 h-8 text-yellow-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300 flex items-center">
                                        <Shield className="w-4 h-4 mr-1 text-indigo-400" />
                                        {scholarship.provider}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-lg">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {scholarship.category_name}
                                        </span>
                                        {scholarship.featured && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-lg animate-pulse">
                                                <Crown className="w-3 h-3 mr-1 fill-current" />
                                                Elite Featured
                                            </span>
                                        )}
                                        {scholarship.verified && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 backdrop-blur-lg">
                                                <CheckCircle className="w-3 h-3 mr-1 fill-current" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <h1 className="text-3xl lg:text-4xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                                {scholarship.title}
                            </h1>
                            
                            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                                {scholarship.description || scholarship.short_description || 'No description available'}
                            </p>

                            {/* Elite Key Details */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="flex items-center gap-3 p-4 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-green-500/30 transition-all duration-300 group">
                                    <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold">Elite Funding</p>
                                        <p className="font-bold text-green-400">
                                            ${scholarship.amount || 'Premium Package'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-red-500/30 transition-all duration-300 group">
                                    <div className="p-2 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                                        <Calendar className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold">Elite Deadline</p>
                                        <p className={`font-bold ${getDeadlineStatus(scholarship.deadline).replace('text-', 'text-').replace('600', '400')}`}>
                                            {formatDeadline(scholarship.deadline)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-blue-500/30 transition-all duration-300 group">
                                    <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                        <GraduationCap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold">Elite Level</p>
                                        <p className="font-bold text-blue-400">
                                            {scholarship.education_level || 'All Elite Levels'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-purple-500/30 transition-all duration-300 group">
                                    <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold">Elite Region</p>
                                        <p className="font-bold text-purple-400">
                                            {scholarship.region || 'Global Elite'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Action Center */}
                        <div className="flex flex-col gap-4 lg:w-64">
                            <a
                                href={scholarship.application_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <Zap className="w-5 h-5 mr-2 group-hover:animate-spin" />
                                Apply to Elite Program
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveScholarship}
                                    className={`flex-1 px-4 py-3 rounded-2xl border font-bold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-lg ${
                                        isSaved
                                            ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 hover:scale-105'
                                            : 'bg-black/40 border-white/20 text-gray-300 hover:bg-white/10 hover:scale-105'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current animate-pulse' : ''}`} />
                                    {isSaved ? 'Elite Saved' : 'Save Elite'}
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="px-4 py-3 rounded-2xl border border-white/20 text-gray-300 hover:bg-white/10 transition-all duration-300 flex items-center justify-center backdrop-blur-lg hover:scale-105"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {scholarship.website_url && (
                                <a
                                    href={scholarship.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-center text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    Visit Elite Portal
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Elite Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Content */}
                    <div className="lg:col-span-2">
                        {/* Elite Description */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                                    <BookOpen className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">About This Elite Opportunity</h2>
                            </div>
                            {scholarship.content ? (
                                <div
                                    className="prose prose-lg max-w-none prose-invert prose-indigo"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(scholarship.content) }}
                                />
                            ) : (
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    {scholarship.full_description}
                                </p>
                            )}
                        </div>

                        {/* Elite Coverage Details */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
                                    <Shield className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-xl font-black bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">Elite Coverage Package</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                                    scholarship.covers_tuition ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30'
                                }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                        scholarship.covers_tuition ? 'bg-green-500/30 border-green-500/50' : 'bg-gray-500/30 border-gray-500/50'
                                    }`}>
                                        <BookOpen className={`w-5 h-5 ${
                                            scholarship.covers_tuition ? 'text-green-400' : 'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Elite Tuition</p>
                                        <p className={`text-sm font-semibold ${
                                            scholarship.covers_tuition ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                            {scholarship.covers_tuition ? '✓ Fully Covered' : '✗ Not Covered'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                                    scholarship.covers_living ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30'
                                }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                        scholarship.covers_living ? 'bg-green-500/30 border-green-500/50' : 'bg-gray-500/30 border-gray-500/50'
                                    }`}>
                                        <Users className={`w-5 h-5 ${
                                            scholarship.covers_living ? 'text-green-400' : 'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Elite Living</p>
                                        <p className={`text-sm font-semibold ${
                                            scholarship.covers_living ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                            {scholarship.covers_living ? '✓ Fully Covered' : '✗ Not Covered'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                                    scholarship.covers_travel ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30'
                                }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                        scholarship.covers_travel ? 'bg-green-500/30 border-green-500/50' : 'bg-gray-500/30 border-gray-500/50'
                                    }`}>
                                        <MapPin className={`w-5 h-5 ${
                                            scholarship.covers_travel ? 'text-green-400' : 'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Elite Travel</p>
                                        <p className={`text-sm font-semibold ${
                                            scholarship.covers_travel ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                            {scholarship.covers_travel ? '✓ Fully Covered' : '✗ Not Covered'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Elite Requirements */}
                        {(scholarship.language_requirements || scholarship.other_requirements || scholarship.gpa_requirement) && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30">
                                        <Award className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <h3 className="text-xl font-black bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">Elite Requirements</h3>
                                </div>
                                <div className="space-y-6">
                                    {scholarship.gpa_requirement && (
                                        <div className="p-4 bg-black/40 rounded-2xl border border-yellow-500/30">
                                            <h4 className="font-bold text-yellow-400 mb-2 flex items-center">
                                                <Trophy className="w-5 h-5 mr-2" />
                                                Elite Academic Standards
                                            </h4>
                                            <p className="text-gray-300">
                                                Minimum GPA: <span className="font-bold text-yellow-400">{scholarship.gpa_requirement}</span>
                                            </p>
                                        </div>
                                    )}
                                    
                                    {scholarship.language_requirements && (
                                        <div className="p-4 bg-black/40 rounded-2xl border border-blue-500/30">
                                            <h4 className="font-bold text-blue-400 mb-2 flex items-center">
                                                <Globe className="w-5 h-5 mr-2" />
                                                Elite Language Proficiency
                                            </h4>
                                            <p className="text-gray-300">{scholarship.language_requirements}</p>
                                        </div>
                                    )}
                                    
                                    {scholarship.other_requirements && (
                                        <div className="p-4 bg-black/40 rounded-2xl border border-purple-500/30">
                                            <h4 className="font-bold text-purple-400 mb-2 flex items-center">
                                                <Star className="w-5 h-5 mr-2 fill-current" />
                                                Elite Additional Criteria
                                            </h4>
                                            <p className="text-gray-300">{scholarship.other_requirements}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Elite Sidebar */}
                    <div className="space-y-8">
                        {/* Elite Key Dates */}
                        <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30">
                                    <Calendar className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-lg font-black bg-gradient-to-r from-white via-red-200 to-pink-200 bg-clip-text text-transparent">Elite Timeline</h3>
                            </div>
                            <div className="space-y-3">
                                {scholarship.deadline && (
                                    <div className="flex items-center gap-4 p-3 bg-black/40 rounded-2xl border border-red-500/30 hover:border-red-500/50 transition-colors">
                                        <div className="p-2 bg-red-500/20 rounded-xl">
                                            <Calendar className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Elite Application Deadline</p>
                                            <p className="text-sm text-red-400 font-semibold">
                                                {new Date(scholarship.deadline).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {scholarship.program_start_date && (
                                    <div className="flex items-center gap-4 p-3 bg-black/40 rounded-2xl border border-green-500/30 hover:border-green-500/50 transition-colors">
                                        <div className="p-2 bg-green-500/20 rounded-xl">
                                            <Clock className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Elite Program Launch</p>
                                            <p className="text-sm text-green-400 font-semibold">
                                                {new Date(scholarship.program_start_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {scholarship.program_end_date && (
                                    <div className="flex items-center gap-4 p-3 bg-black/40 rounded-2xl border border-blue-500/30 hover:border-blue-500/50 transition-colors">
                                        <div className="p-2 bg-blue-500/20 rounded-xl">
                                            <Clock className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Elite Program Completion</p>
                                            <p className="text-sm text-blue-400 font-semibold">
                                                {new Date(scholarship.program_end_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Elite Study Fields */}
                        {scholarship.study_fields && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">Elite Study Fields</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {(Array.isArray(scholarship.study_fields) ? scholarship.study_fields : JSON.parse(scholarship.study_fields || '[]')).map((field, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-lg hover:scale-105 transition-transform duration-300"
                                        >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Elite Regions */}
                        {scholarship.regions && scholarship.regions.length > 0 && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Elite Global Access</h3>
                                </div>
                                <div className="space-y-3">
                                    {scholarship.regions.map((region, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                                            <div className="p-1 bg-purple-500/20 rounded-lg">
                                                <MapPin className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <span className="text-sm text-gray-300 font-semibold">{region.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Elite Age Requirements */}
                        {(scholarship.age_limit_min || scholarship.age_limit_max) && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                                        <Users className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">Elite Age Criteria</h3>
                                </div>
                                <div className="p-4 bg-black/40 rounded-2xl border border-orange-500/30">
                                    <p className="text-gray-300 font-semibold">
                                        {scholarship.age_limit_min && scholarship.age_limit_max
                                            ? `${scholarship.age_limit_min} - ${scholarship.age_limit_max} years`
                                            : scholarship.age_limit_min
                                            ? `Minimum ${scholarship.age_limit_min} years`
                                            : `Maximum ${scholarship.age_limit_max} years`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Elite Tags */}
                        {scholarship.tags && (
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl hover:border-white/20 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl border border-pink-500/30">
                                        <Star className="w-5 h-5 text-pink-400 fill-current" />
                                    </div>
                                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-pink-200 to-rose-200 bg-clip-text text-transparent">Elite Tags</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {(Array.isArray(scholarship.tags) ? scholarship.tags : JSON.parse(scholarship.tags || '[]')).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30 backdrop-blur-lg hover:scale-105 transition-transform duration-300"
                                        >
                                            <Diamond className="w-3 h-3 mr-1" />
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Elite Related Scholarships */}
                {relatedScholarships.length > 0 && (
                    <div className="mt-16 relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                                <Trophy className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">Elite Related Opportunities</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedScholarships.map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/scholarships/${related.slug}`}
                                    className="group bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 p-6 hover:scale-105 transform"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="relative group/logo">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-50 group-hover/logo:opacity-75 transition duration-500"></div>
                                            {related.provider_logo ? (
                                                <img
                                                    src={related.provider_logo}
                                                    alt={related.provider}
                                                    className="relative w-12 h-12 rounded-xl object-cover border border-white/20 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="relative w-12 h-12 rounded-xl bg-black/50 backdrop-blur-lg border border-white/20 flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-6 h-6 text-yellow-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-indigo-300 transition-colors">
                                                {related.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 flex items-center">
                                                <Shield className="w-3 h-3 mr-1" />
                                                {related.provider}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                                        {related.description || 'Elite opportunity awaiting discovery'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-green-400 flex items-center">
                                            <DollarSign className="w-3 h-3 mr-1" />
                                            ${related.amount || 'Premium Package'}
                                        </span>
                                        <span className={`font-semibold flex items-center ${getDeadlineStatus(related.deadline).replace('text-', 'text-').replace('600', '400')}`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDeadline(related.deadline)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScholarshipDetail;
