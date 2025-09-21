import React, { useState, useEffect } from 'react'
import { Search, Calendar, User, Tag, Clock, ArrowRight, TrendingUp, Eye, Heart, MessageCircle, Share2, BookOpen, Filter, Star, ChevronDown, ExternalLink, Bell, Crown, Shield, Sparkles, Diamond, Zap, Trophy, Award, Target, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CommentSection from '@/components/ui/CommentSection'
import { apiRequest } from '@/utils/api.js'
import { toast } from 'sonner'
import { sanitizeHTML, secureLog } from '@/utils/security.js'

const Blog = ({ contentType = 'blog' }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Posts', count: 0 }
  ])
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadContent()
  }, [contentType])

  const loadContent = async () => {
    setLoading(true)
    try {
      // Query backend by type to avoid fetching unrelated content
      const response = await apiRequest(`/api/content?type=${encodeURIComponent(contentType)}`)

      let allContent = []
      if (Array.isArray(response)) {
        allContent = response
      } else if (response && Array.isArray(response.data)) {
        allContent = response.data
      } else if (response && Array.isArray(response.content)) {
        allContent = response.content
      } else {
        secureLog('warn', 'Unexpected API response format', { responseType: typeof response })
        allContent = []
      }

      // Ensure published and correct type
      const filteredContent = allContent.filter(item =>
        item.content_type === contentType && (item.published === true || item.published === 1 || item.published === '1')
      )

      // If no content from API, use sample data for demonstration
      let finalContent = filteredContent
      if (filteredContent.length === 0) {
        finalContent = [
          {
            id: 1,
            title: contentType === 'blog' ? 'Getting Started with Modern Web Development' : 'Sabiteck Announces New Technology Partnership',
            content: contentType === 'blog'
              ? 'Explore the latest trends and best practices in modern web development. From React to Node.js, discover the tools and techniques that are shaping the future of web applications.'
              : 'We are excited to announce a strategic partnership that will enhance our service offerings and expand our technological capabilities.',
            excerpt: contentType === 'blog'
              ? 'A comprehensive guide to modern web development practices and trending technologies.'
              : 'Strategic partnership announcement to enhance our technological capabilities.',
            content_type: contentType,
            category: contentType === 'blog' ? 'Technology' : 'Company News',
            featured_image: null,
            author: 'Sabiteck Team',
            author_role: 'Development Team',
            tags: ['technology', 'web development', 'javascript'],
            featured: true,
            published: true,
            views: 1250,
            like_count: 45,
            comment_count: 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            title: contentType === 'blog' ? 'Building Scalable APIs with Node.js' : 'Q4 Performance Review and Achievements',
            content: contentType === 'blog'
              ? 'Learn how to design and implement scalable APIs using Node.js and Express. This guide covers best practices for performance, security, and maintainability.'
              : 'Our Q4 performance review highlights significant achievements and growth across all departments.',
            excerpt: contentType === 'blog'
              ? 'Best practices for building high-performance APIs with Node.js and Express framework.'
              : 'Comprehensive review of Q4 achievements and performance metrics.',
            content_type: contentType,
            category: contentType === 'blog' ? 'Backend Development' : 'Company Updates',
            featured_image: null,
            author: 'Sarah Johnson',
            author_role: 'Senior Developer',
            tags: ['nodejs', 'api', 'backend'],
            featured: true,
            published: true,
            views: 890,
            like_count: 32,
            comment_count: 8,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 3,
            title: contentType === 'blog' ? 'React Hooks: A Complete Guide' : 'New Office Location Opening',
            content: contentType === 'blog'
              ? 'Master React Hooks with this comprehensive guide. From useState to custom hooks, learn how to write cleaner and more efficient React components.'
              : 'We are expanding our operations with a new office location to better serve our growing client base.',
            excerpt: contentType === 'blog'
              ? 'Complete guide to React Hooks and modern component development patterns.'
              : 'Expansion announcement for new office location to serve growing client base.',
            content_type: contentType,
            category: contentType === 'blog' ? 'Frontend Development' : 'Business News',
            featured_image: null,
            author: 'Michael Chen',
            author_role: 'Frontend Architect',
            tags: ['react', 'hooks', 'frontend'],
            featured: false,
            published: true,
            views: 1450,
            like_count: 67,
            comment_count: 23,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 4,
            title: contentType === 'blog' ? 'Database Optimization Strategies' : 'Client Success Story: Digital Transformation',
            content: contentType === 'blog'
              ? 'Optimize your database performance with proven strategies. Learn about indexing, query optimization, and database design best practices.'
              : 'Read about how we helped a major client achieve successful digital transformation with our innovative solutions.',
            excerpt: contentType === 'blog'
              ? 'Proven strategies for optimizing database performance and query efficiency.'
              : 'Success story showcasing digital transformation achievements with innovative solutions.',
            content_type: contentType,
            category: contentType === 'blog' ? 'Database' : 'Case Studies',
            featured_image: null,
            author: 'Alex Rodriguez',
            author_role: 'Database Engineer',
            tags: ['database', 'optimization', 'performance'],
            featured: false,
            published: true,
            views: 720,
            like_count: 28,
            comment_count: 15,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 259200000).toISOString()
          }
        ]
      }

      setPosts(finalContent)

      // Generate categories from the final content
      const categoryMap = new Map()
      finalContent.forEach(item => {
        if (item.category) {
          const count = categoryMap.get(item.category) || 0
          categoryMap.set(item.category, count + 1)
        }
      })

      const dynamicCategories = [
        { id: 'all', name: `All ${contentType === 'blog' ? 'Posts' : 'News'}`, count: finalContent.length },
        ...Array.from(categoryMap.entries()).map(([category, count]) => ({
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          count
        }))
      ]

      setCategories(dynamicCategories)
    } catch (error) {
      toast.error('Failed to load content')
      secureLog('error', 'Error loading content', { error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' ||
      (post.category && post.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory)

    // Parse tags if they're stored as JSON string
    const postTags = post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : []

    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (Array.isArray(postTags) && postTags.some(tag =>
                           tag.toLowerCase().includes(searchTerm.toLowerCase())
                         ))
    return matchesCategory && matchesSearch
  })

  const featuredPosts = posts.filter(post => post.featured).slice(0, 3)
  const popularPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
  const recentPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReadingTime = (content) => {
    const wordsPerMinute = 200
    const wordCount = content ? content.split(' ').length : 0
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!subscribeEmail) {
      toast.error('Please enter your email address')
      return
    }

    setSubscribing(true)
    try {
      await apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email: subscribeEmail,
          subscription_type: contentType === 'blog' ? 'blog' : 'news'
        })
      })
      toast.success('Successfully subscribed!')
      setSubscribeEmail('')
    } catch (error) {
      toast.error('Failed to subscribe: ' + error.message)
    } finally {
      setSubscribing(false)
    }
  }

  const openPost = (post) => {
    setSelectedPost(post)
    setShowPostModal(true)
    document.body.style.overflow = 'hidden'
  }

  const closePost = () => {
    setSelectedPost(null)
    setShowPostModal(false)
    document.body.style.overflow = 'unset'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Elite Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-6000"></div>
      </div>
      {/* Elite Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden z-10">
        {/* Elite Background Overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Elite Title with Premium Badge */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                  <Trophy className="w-16 h-16 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 mb-8">
              <Crown className="w-6 h-6 text-yellow-400 mr-3" />
              <span className="text-lg font-bold text-white uppercase tracking-wider">
                {contentType === 'blog' ? 'Elite Technology Blog' : 'Elite News & Updates'}
              </span>
              <Sparkles className="w-6 h-6 text-yellow-400 ml-3 animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-8">
              <div className="flex justify-center items-center gap-4 mb-4">
                <Star className="w-12 h-12 text-yellow-400 fill-current animate-pulse" />
                <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Elite
                </span>
                <Star className="w-12 h-12 text-yellow-400 fill-current animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                {contentType === 'blog' ? 'Insights & Innovation' : 'News & Updates'}
              </span>
            </h1>

            <div className="flex justify-center items-center gap-3 mb-6">
              <Diamond className="w-6 h-6 text-indigo-400" />
              <span className="text-2xl font-bold text-indigo-400">Premium Content Hub</span>
              <Diamond className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              {contentType === 'blog'
                ? 'Discover elite insights, expert analysis, and revolutionary solutions that define the future of technology.'
                : 'Stay ahead with exclusive announcements, elite developments, and industry-leading innovations.'
              }
            </p>

            {/* Elite Search Bar */}
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative flex items-center">
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <Search className="h-6 w-6 text-indigo-400" />
                  <Crown className="h-5 w-5 text-yellow-400 animate-pulse" />
                </div>
                <input
                  type="text"
                  placeholder="Search elite articles, insights, and premium content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-20 pr-32 py-6 text-lg bg-black/50 backdrop-blur-lg border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Search Elite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elite Category Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative px-8 py-4 rounded-2xl transition-all duration-500 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-2xl scale-105'
                    : 'bg-black/40 backdrop-blur-lg text-white border border-white/20 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span className="relative z-10 font-bold">{category.name}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-gray-300'
                  }`}>
                    {category.count}
                  </span>
                </div>
                {selectedCategory !== category.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="relative mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-16">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">Loading Elite Content...</p>
                <p className="text-gray-400 mt-2">Preparing premium articles for you</p>
              </div>
            ) : (
              <>
                {/* Featured Articles */}
                {selectedCategory === 'all' && featuredPosts.length > 0 && (
                  <section>
                    <div className="flex items-center justify-center mb-12">
                      <div className="flex items-center bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                        <Crown className="w-8 h-8 text-yellow-400 mr-4" />
                        <h2 className="text-3xl font-black bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">Elite Featured {contentType === 'blog' ? 'Articles' : 'News'}</h2>
                        <Trophy className="w-8 h-8 text-yellow-400 ml-4 animate-pulse" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {featuredPosts.map((post, index) => (
                        <div key={post.id} className="group relative overflow-hidden bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform hover:border-yellow-500/30">
                          {/* Elite Gradient Border */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-red-500/50 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <div className="relative">
                            <div className="aspect-video relative overflow-hidden">
                              {post.featured_image ? (
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                                  <div className="text-center">
                                    <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                                    <span className="text-white text-lg font-bold px-6">{post.title}</span>
                                  </div>
                                </div>
                              )}

                              {/* Elite Featured Badge */}
                              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg text-yellow-400 px-4 py-2 rounded-2xl text-sm font-bold border border-yellow-500/30 animate-pulse">
                                <Crown className="w-4 h-4 inline mr-2 fill-current" />
                                Elite Featured
                              </div>

                              {/* Elite Category Badge */}
                              {post.category && (
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-lg text-indigo-400 px-3 py-2 rounded-2xl text-sm font-bold border border-indigo-500/30">
                                  <Award className="w-3 h-3 inline mr-1" />
                                  {post.category}
                                </div>
                              )}
                            </div>

                            <div className="relative p-6">
                              <div className="flex items-center text-sm text-gray-400 mb-4">
                                <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-white/20 mr-4">
                                  <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                                  <span className="font-semibold">{formatDate(post.created_at)}</span>
                                </div>
                                <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-white/20">
                                  <Clock className="h-4 w-4 mr-2 text-green-400" />
                                  <span className="font-semibold">{getReadingTime(post.content)} min read</span>
                                </div>
                              </div>

                              <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                                {post.title}
                              </h3>

                              <p className="text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                                {post.excerpt || post.content?.substring(0, 150) + '...' || 'Elite content preview coming soon'}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white/20">
                                    {(post.author || 'ST').charAt(0)}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-bold text-white">{post.author || 'Elite Team'}</div>
                                    <div className="text-xs text-gray-400">Elite Contributor</div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => openPost(post)}
                                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                                >
                                  <span>Read Elite</span>
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>

                              {/* Elite Engagement Metrics */}
                              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                                <div className="flex items-center space-x-4 text-sm">
                                  <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-blue-500/30">
                                    <Eye className="w-4 h-4 mr-1 text-blue-400" />
                                    <span className="text-blue-400 font-semibold">{post.views || 0}</span>
                                  </div>
                                  <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-red-500/30">
                                    <Heart className="w-4 h-4 mr-1 text-red-400" />
                                    <span className="text-red-400 font-semibold">{post.like_count || 0}</span>
                                  </div>
                                  <div className="flex items-center bg-black/40 px-3 py-1 rounded-xl border border-green-500/30">
                                    <MessageCircle className="w-4 h-4 mr-1 text-green-400" />
                                    <span className="text-green-400 font-semibold">{post.comment_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Latest Articles */}
                <section>
                  <div className="flex items-center justify-center mb-12">
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                      <h2 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent text-center">
                        {selectedCategory === 'all' ? 'Elite Latest Articles' : `Elite ${categories.find(c => c.id === selectedCategory)?.name} Articles`}
                        <div className="text-lg font-semibold text-gray-400 mt-2 flex items-center justify-center">
                          <Target className="w-5 h-5 mr-2" />
                          {filteredPosts.length} Elite {filteredPosts.length === 1 ? 'Article' : 'Articles'}
                        </div>
                      </h2>
                    </div>

                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-lg text-indigo-400 px-6 py-3 rounded-2xl font-bold border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Elite Filters</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="w-32 h-32 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                          <BookOpen className="w-16 h-16 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">No Elite Articles Found</h3>
                        <p className="text-gray-300 max-w-md mx-auto">Refine your elite search criteria to discover premium content.</p>
                      </div>
                    ) : (
                      filteredPosts.map((post) => (
                        <div key={post.id} className="group overflow-hidden bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-indigo-500/30">
                          <div className="lg:flex">
                            <div className="lg:w-2/5">
                              <div className="aspect-video lg:aspect-square relative overflow-hidden">
                                {post.featured_image ? (
                                  <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                                    <div className="text-center">
                                      <Diamond className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                                      <span className="text-white font-bold text-center px-6">
                                        {post.title}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Elite Category Badge */}
                                {post.category && (
                                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-lg text-indigo-400 px-4 py-2 rounded-2xl text-sm font-bold border border-indigo-500/30">
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    {post.category}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="lg:w-3/5 p-8">
                              <div className="flex items-center text-sm text-slate-500 mb-4">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(post.created_at)}
                                <Clock className="h-4 w-4 ml-4 mr-2" />
                                {getReadingTime(post.content)} min read
                                {post.views && (
                                  <>
                                    <TrendingUp className="h-4 w-4 ml-4 mr-2" />
                                    {post.views.toLocaleString()} views
                                  </>
                                )}
                              </div>

                              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                                {post.title}
                              </h3>

                              <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed text-lg">
                                {post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : 'No description available')}
                              </p>

                              {/* Tags */}
                              {post.tags && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                  {(typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags).slice(0, 3).map((tag) => (
                                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors">
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(post.author || 'ST').charAt(0)}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-slate-900">{post.author || 'Sabiteck Team'}</div>
                                    {post.author_role && (
                                      <div className="text-xs text-slate-500">{post.author_role}</div>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  onClick={() => openPost(post)}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                >
                                  Read Article
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </div>

                              {/* Engagement Metrics */}
                              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500">
                                <span className="flex items-center hover:text-blue-600 transition-colors cursor-pointer">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {post.views || 0} views
                                </span>
                                <span className="flex items-center hover:text-red-600 transition-colors cursor-pointer">
                                  <Heart className="w-4 h-4 mr-1" />
                                  {post.like_count || 0} likes
                                </span>
                                <span className="flex items-center hover:text-green-600 transition-colors cursor-pointer">
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {post.comment_count || 0} comments
                                </span>
                                <span className="flex items-center hover:text-purple-600 transition-colors cursor-pointer">
                                  <Share2 className="w-4 h-4 mr-1" />
                                  Share
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Elite Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Elite Newsletter Signup */}
              <div className="overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-0 shadow-2xl rounded-3xl relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-purple-600/90"></div>
                <div className="relative p-8 text-white">
                  <div className="text-center mb-8">
                    <div className="relative group mb-6">
                      <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto border border-white/30">
                        <Crown className="w-10 h-10 text-yellow-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black mb-3">Elite Insider</h3>
                    <p className="text-white/90">
                      Join our exclusive circle and receive premium {contentType === 'blog' ? 'insights' : 'updates'} before anyone else.
                    </p>
                  </div>

                  <form onSubmit={handleSubscribe} className="space-y-6">
                    <input
                      placeholder="Enter your elite email"
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/70 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-lg"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2"
                      disabled={subscribing}
                    >
                      {subscribing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Joining Elite...</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5" />
                          <span>Join Elite Circle</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Elite Popular Articles */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl hover:border-white/20 transition-all duration-500">
                <div className="p-6 pb-4">
                  <div className="flex items-center text-white">
                    <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 mr-3">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">Elite Trending</h3>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <div key={post.id} className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-500/30" onClick={() => openPost(post)}>
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/20">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug mb-2">
                            {post.title}
                          </h4>
                          <div className="flex items-center bg-black/40 px-2 py-1 rounded-lg border border-orange-500/30">
                            <Eye className="h-3 w-3 mr-1 text-orange-400" />
                            <span className="text-xs text-orange-400 font-semibold">
                              {post.views ? post.views.toLocaleString() + ' views' : 'Elite new'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elite Recent Articles */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl hover:border-white/20 transition-all duration-500">
                <div className="p-6 pb-4">
                  <div className="flex items-center text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 mr-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">Elite Recent</h3>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="group p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500/30" onClick={() => openPost(post)}>
                        <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug mb-3">
                          {post.title}
                        </h4>
                        <div className="flex items-center bg-black/40 px-2 py-1 rounded-lg border border-blue-500/30">
                          <Calendar className="h-3 w-3 mr-1 text-blue-400" />
                          <span className="text-xs text-blue-400 font-semibold">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elite Categories */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl hover:border-white/20 transition-all duration-500">
                <div className="p-6 pb-4">
                  <div className="flex items-center text-white">
                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 mr-3">
                      <Filter className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Elite Categories</h3>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-3">
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <div key={category.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-purple-500/30">
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className="text-sm text-white hover:text-purple-400 transition-colors font-bold flex items-center"
                        >
                          <Target className="w-3 h-3 mr-2" />
                          {category.name}
                        </button>
                        <span className="text-xs bg-black/40 text-purple-400 px-3 py-1 rounded-xl border border-purple-500/30 font-bold group-hover:bg-purple-500/20 group-hover:border-purple-500/50 transition-all">
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Article Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-slate-900 line-clamp-1 mr-4">
                {selectedPost.title}
              </h2>
              <Button variant="ghost" onClick={closePost} className="flex-shrink-0 hover:bg-slate-100">
                <ExternalLink className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-8">
                {/* Article Meta */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b">
                  <div className="flex items-center space-x-6 text-sm text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(selectedPost.created_at)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {getReadingTime(selectedPost.content)} min read
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {selectedPost.author || 'Sabiteck Team'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {selectedPost.views || 0}
                    </span>
                    <span className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      {selectedPost.like_count || 0}
                    </span>
                  </div>
                </div>

                {/* Featured Image */}
                {selectedPost.featured_image && (
                  <div className="aspect-video mb-8 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={selectedPost.featured_image}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Excerpt */}
                {selectedPost.excerpt && (
                  <div className="bg-slate-50 rounded-xl p-6 mb-8 border-l-4 border-blue-500">
                    <p className="text-lg text-slate-700 leading-relaxed italic">
                      {selectedPost.excerpt}
                    </p>
                  </div>
                )}

                {/* Article Content */}
                <div className="prose prose-lg prose-slate max-w-none mb-8">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedPost.content) || 'No content available.' }} />
                </div>

                {/* Tags */}
                {selectedPost.tags && (
                  <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b">
                    {(typeof selectedPost.tags === 'string' ? JSON.parse(selectedPost.tags) : selectedPost.tags).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-slate-700 text-sm rounded-full border border-blue-100 hover:from-blue-100 hover:to-purple-100 transition-colors">
                        <Tag className="h-3 w-3 mr-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comments Section */}
                <CommentSection
                  contentId={selectedPost.id}
                  initialCommentCount={selectedPost.comment_count || 0}
                  initialLikeCount={selectedPost.like_count || 0}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Blog