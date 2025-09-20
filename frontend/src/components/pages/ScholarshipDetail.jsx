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
    Globe
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
        <div className="min-h-screen bg-gray-50 pt-24">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <Link to="/scholarships" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                                        Scholarships
                                    </Link>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">
                                        {scholarship.title}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                {scholarship.provider_logo ? (
                                    <img 
                                        src={scholarship.provider_logo} 
                                        alt={scholarship.provider}
                                        className="w-16 h-16 rounded-lg object-cover border"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Award className="w-8 h-8 text-blue-600" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">{scholarship.provider}</p>
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                            style={{ 
                                                backgroundColor: `${scholarship.category_color}20`,
                                                color: scholarship.category_color 
                                            }}
                                        >
                                            {scholarship.category_name}
                                        </span>
                                        {scholarship.featured && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <Award className="w-3 h-3 mr-1" />
                                                Featured
                                            </span>
                                        )}
                                        {scholarship.verified && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                {scholarship.title}
                            </h1>
                            
                            <p className="text-lg text-gray-700 mb-6">
                                {scholarship.description || scholarship.short_description || 'No description available'}
                            </p>

                            {/* Key Details */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Funding</p>
                                        <p className="font-semibold text-gray-900">
                                            ${scholarship.amount || 'Amount not specified'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-red-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Deadline</p>
                                        <p className={`font-semibold ${getDeadlineStatus(scholarship.deadline)}`}>
                                            {formatDeadline(scholarship.deadline)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Level</p>
                                        <p className="font-semibold text-gray-900">
                                            {scholarship.education_level || 'All levels'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Region</p>
                                        <p className="font-semibold text-gray-900">
                                            {scholarship.region || 'Global'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 lg:w-64">
                            <a
                                href={scholarship.application_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Apply Now
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveScholarship}
                                    className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors flex items-center justify-center gap-2 ${
                                        isSaved 
                                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                    {isSaved ? 'Saved' : 'Save'}
                                </button>
                                
                                <button
                                    onClick={handleShare}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {scholarship.website_url && (
                                <a
                                    href={scholarship.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-center text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2"
                                >
                                    Visit Website
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Content */}
                    <div className="lg:col-span-2">
                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Scholarship</h2>
                            {scholarship.content ? (
                                <div 
                                    className="prose prose-lg max-w-none"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(scholarship.content) }}
                                />
                            ) : (
                                <p className="text-gray-700 text-lg leading-relaxed">
                                    {scholarship.full_description}
                                </p>
                            )}
                        </div>

                        {/* Coverage Details */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">What's Covered</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                                    scholarship.covers_tuition ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        scholarship.covers_tuition ? 'bg-green-100' : 'bg-gray-200'
                                    }`}>
                                        <BookOpen className={`w-4 h-4 ${
                                            scholarship.covers_tuition ? 'text-green-600' : 'text-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Tuition</p>
                                        <p className={`text-sm ${
                                            scholarship.covers_tuition ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {scholarship.covers_tuition ? 'Covered' : 'Not covered'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                                    scholarship.covers_living ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        scholarship.covers_living ? 'bg-green-100' : 'bg-gray-200'
                                    }`}>
                                        <Users className={`w-4 h-4 ${
                                            scholarship.covers_living ? 'text-green-600' : 'text-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Living</p>
                                        <p className={`text-sm ${
                                            scholarship.covers_living ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {scholarship.covers_living ? 'Covered' : 'Not covered'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                                    scholarship.covers_travel ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        scholarship.covers_travel ? 'bg-green-100' : 'bg-gray-200'
                                    }`}>
                                        <MapPin className={`w-4 h-4 ${
                                            scholarship.covers_travel ? 'text-green-600' : 'text-gray-500'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Travel</p>
                                        <p className={`text-sm ${
                                            scholarship.covers_travel ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {scholarship.covers_travel ? 'Covered' : 'Not covered'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        {(scholarship.language_requirements || scholarship.other_requirements || scholarship.gpa_requirement) && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Requirements</h3>
                                <div className="space-y-4">
                                    {scholarship.gpa_requirement && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Academic Requirements</h4>
                                            <p className="text-gray-700">
                                                Minimum GPA: {scholarship.gpa_requirement}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {scholarship.language_requirements && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Language Requirements</h4>
                                            <p className="text-gray-700">{scholarship.language_requirements}</p>
                                        </div>
                                    )}
                                    
                                    {scholarship.other_requirements && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Other Requirements</h4>
                                            <p className="text-gray-700">{scholarship.other_requirements}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Key Dates */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Important Dates</h3>
                            <div className="space-y-3">
                                {scholarship.deadline && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-red-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Application Deadline</p>
                                            <p className="text-sm text-gray-600">
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
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Program Start</p>
                                            <p className="text-sm text-gray-600">
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
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Program End</p>
                                            <p className="text-sm text-gray-600">
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

                        {/* Study Fields */}
                        {scholarship.study_fields && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Study Fields</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(scholarship.study_fields) ? scholarship.study_fields : JSON.parse(scholarship.study_fields || '[]')).map((field, index) => (
                                        <span 
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                        >
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regions */}
                        {scholarship.regions && scholarship.regions.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Eligible Regions</h3>
                                <div className="space-y-2">
                                    {scholarship.regions.map((region, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700">{region.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Age Limits */}
                        {(scholarship.age_limit_min || scholarship.age_limit_max) && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Age Requirements</h3>
                                <p className="text-gray-700">
                                    {scholarship.age_limit_min && scholarship.age_limit_max 
                                        ? `${scholarship.age_limit_min} - ${scholarship.age_limit_max} years`
                                        : scholarship.age_limit_min 
                                        ? `Minimum ${scholarship.age_limit_min} years`
                                        : `Maximum ${scholarship.age_limit_max} years`}
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {scholarship.tags && (
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(scholarship.tags) ? scholarship.tags : JSON.parse(scholarship.tags || '[]')).map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Scholarships */}
                {relatedScholarships.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Scholarships</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedScholarships.map((related) => (
                                <Link 
                                    key={related.id}
                                    to={`/scholarships/${related.slug}`}
                                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        {related.provider_logo ? (
                                            <img 
                                                src={related.provider_logo} 
                                                alt={related.provider}
                                                className="w-12 h-12 rounded object-cover border flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <Award className="w-6 h-6 text-gray-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                                                {related.title}
                                            </h3>
                                            <p className="text-xs text-gray-600">{related.provider}</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                                        {related.description || 'No description available'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-green-600">
                                            ${related.amount || 'Amount not specified'}
                                        </span>
                                        <span className={getDeadlineStatus(related.deadline)}>
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
