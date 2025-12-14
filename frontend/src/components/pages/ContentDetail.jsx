import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Tag,
    Share2,
    Eye,
    Heart,
    MessageCircle,
    Twitter,
    Facebook,
    Linkedin,
    Globe,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import SEOHead from '../SEO/SEOHead';
import { sanitizeHTML, secureLog } from '../../utils/security';
import { toast } from 'sonner';

const ContentDetail = ({ contentType = 'blog', parentRoute = '/blog', parentName = 'Blog' }) => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openShareDropdown, setOpenShareDropdown] = useState(false);

    useEffect(() => {
        if (!slug) return;
        loadContent();
    }, [slug]);

    const loadContent = async () => {
        try {
            setLoading(true);
            const response = await apiRequest(`/api/content/${slug}`);

            if (response.success && response.data) {
                setContent(response.data);
                // Track view
                apiRequest(`/api/content/${response.data.id}/view`, { method: 'POST' }).catch(() => { });
            } else {
                setError(response.message || 'Content not found');
            }
        } catch (err) {
            setError('Failed to load content');
            secureLog('error', 'Error loading content detail', { error: err.message, slug });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getReadingTime = (text) => {
        if (!text) return 0;
        const wordsPerMinute = 200;
        const words = text.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    };

    const handleShare = (platform) => {
        if (!content) return;

        const url = window.location.href;
        const text = `Check out this article: ${content.title}`;

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(content.title)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
        setOpenShareDropdown(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 pt-32 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen bg-slate-900 pt-32 flex items-center justify-center">
                <div className="text-center text-white">
                    <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Content Not Found</h1>
                    <p className="text-gray-400 mb-6">{error || "The article you're looking for doesn't exist."}</p>
                    <Link to={parentRoute} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Back to {parentName}
                    </Link>
                </div>
            </div>
        );
    }

    const tags = content.tags ? (typeof content.tags === 'string' ? JSON.parse(content.tags) : content.tags) : [];
    const keywords = tags.join(', ');

    // Prepare structured data
    const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": content.title,
        "image": content.featured_image ? [content.featured_image] : [],
        "datePublished": content.created_at,
        "dateModified": content.updated_at || content.created_at,
        "author": [{
            "@type": "Person",
            "name": content.author || "Sabiteck Team"
        }]
    };

    return (
        <div className="min-h-screen bg-slate-900 pt-24 pb-16 relative overflow-hidden">
            <SEOHead
                title={`${content.title} | Sabiteck ${parentName}`}
                description={content.excerpt || content.meta_description || content.content?.replace(/<[^>]*>/g, '').substring(0, 160) || `Read ${content.title} on Sabiteck`}
                image={content.featured_image}
                url={window.location.href}
                type="article"
                keywords={keywords}
                schema={schema}
            />

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
                <div className="absolute top-20 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate(parentRoute)}
                    className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors group"
                >
                    <div className="p-2 bg-white/5 rounded-lg mr-3 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    Back to {parentName}
                </button>

                <article className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="mb-10 text-center">
                        {content.category && (
                            <div className="inline-block px-4 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold mb-6 border border-blue-500/30">
                                {content.category}
                            </div>
                        )}

                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {content.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                {formatDate(content.created_at)}
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-green-400" />
                                {getReadingTime(content.content)} min read
                            </div>
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-purple-400" />
                                {content.author || 'Sabiteck Team'}
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {content.featured_image && (
                        <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-white/10 aspect-video relative group">
                            <img
                                src={content.featured_image}
                                alt={content.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-xl">
                        <div
                            className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-code:text-pink-300"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content.content) }}
                        />

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-white/10">
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="flex items-center px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-full text-sm transition-colors cursor-default border border-white/5">
                                            <Tag className="w-3 h-3 mr-2 text-blue-400" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Engagement & Share */}
                        <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center text-gray-400">
                                    <Eye className="w-5 h-5 mr-2 text-blue-400" />
                                    <span>{content.views || 0} views</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <Heart className="w-5 h-5 mr-2 text-red-400" />
                                    <span>{content.like_count || 0} likes</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm font-medium">Share:</span>
                                <button onClick={() => handleShare('twitter')} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors">
                                    <Twitter className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleShare('facebook')} className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-full transition-colors">
                                    <Facebook className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleShare('linkedin')} className="p-2 bg-blue-700/10 hover:bg-blue-700/20 text-blue-600 rounded-full transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleShare('whatsapp')} className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-full transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ContentDetail;
