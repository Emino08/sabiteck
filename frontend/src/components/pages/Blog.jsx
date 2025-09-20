import React, { useState, useEffect } from 'react'
import { Search, Calendar, User, Tag, Clock, ArrowRight, TrendingUp, Eye, Heart, MessageCircle, Share2, BookOpen, Filter, Star, ChevronDown, ExternalLink, Bell } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Elite Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/20 to-black/40"></div>

        {/* Animated Background Patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Elite Title with Gradient */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <BookOpen className="w-5 h-5 text-blue-300 mr-2" />
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">
                {contentType === 'blog' ? 'Technology Blog' : 'News & Updates'}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {contentType === 'blog' ? 'Insights &' : 'Latest'}
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                {contentType === 'blog' ? 'Innovation' : 'Updates'}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed">
              {contentType === 'blog'
                ? 'Discover cutting-edge insights, expert analysis, and innovative solutions that shape the future of technology.'
                : 'Stay ahead with our latest announcements, company developments, and industry-leading innovations.'
              }
            </p>

            {/* Premium Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                <div className="flex items-center">
                  <Search className="absolute left-6 text-slate-400 h-6 w-6" />
                  <Input
                    type="text"
                    placeholder="Search articles, insights, and more..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-14 pr-6 py-6 text-lg bg-transparent border-none focus:ring-0 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Elite Category Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative px-6 py-3 rounded-full transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-white text-slate-900 shadow-xl scale-105'
                    : 'bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 hover:scale-105'
                }`}
              >
                <span className="relative z-10 font-medium">{category.name}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedCategory === category.id
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-white/20 text-white/70'
                }`}>
                  {category.count}
                </span>
                {selectedCategory !== category.id && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="relative mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-16">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="ml-4 text-lg text-slate-600">Loading premium content...</p>
              </div>
            ) : (
              <>
                {/* Featured Articles */}
                {selectedCategory === 'all' && featuredPosts.length > 0 && (
                  <section>
                    <div className="flex items-center mb-8">
                      <Star className="w-6 h-6 text-yellow-500 mr-3" />
                      <h2 className="text-3xl font-bold text-slate-900">Featured {contentType === 'blog' ? 'Articles' : 'News'}</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {featuredPosts.map((post, index) => (
                        <Card key={post.id} className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                          {/* Premium Gradient Border */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          <div className="relative">
                            <div className="aspect-video relative overflow-hidden">
                              {post.featured_image ? (
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                                  <span className="text-white text-lg font-semibold text-center px-6">{post.title}</span>
                                </div>
                              )}

                              {/* Featured Badge */}
                              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                <Star className="w-4 h-4 inline mr-1" />
                                Featured
                              </div>

                              {/* Category Badge */}
                              {post.category && (
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {post.category}
                                </div>
                              )}
                            </div>

                            <CardContent className="p-6">
                              <div className="flex items-center text-sm text-slate-500 mb-4">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(post.created_at)}
                                <Clock className="h-4 w-4 ml-4 mr-2" />
                                {getReadingTime(post.content)} min read
                              </div>

                              <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {post.title}
                              </h3>

                              <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                {post.excerpt || post.content?.substring(0, 150) + '...' || 'No description available'}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    {(post.author || 'ST').charAt(0)}
                                  </div>
                                  <span className="ml-3 text-sm font-medium text-slate-700">{post.author || 'Sabiteck Team'}</span>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPost(post)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  Read More
                                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </div>

                              {/* Engagement Metrics */}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center space-x-4 text-sm text-slate-500">
                                  <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {post.views || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <Heart className="w-4 h-4 mr-1" />
                                    {post.like_count || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    {post.comment_count || 0}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Latest Articles */}
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">
                      {selectedCategory === 'all' ? 'Latest Articles' : `${categories.find(c => c.id === selectedCategory)?.name} Articles`}
                      <span className="text-lg font-normal text-slate-500 ml-3">
                        ({filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'})
                      </span>
                    </h2>

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Articles Found</h3>
                        <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                      </div>
                    ) : (
                      filteredPosts.map((post) => (
                        <Card key={post.id} className="group overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="lg:flex">
                            <div className="lg:w-2/5">
                              <div className="aspect-video lg:aspect-square relative overflow-hidden">
                                {post.featured_image ? (
                                  <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-blue-600 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-medium text-center px-6">
                                      {post.title}
                                    </span>
                                  </div>
                                )}

                                {/* Category Badge */}
                                {post.category && (
                                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
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
                        </Card>
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
              {/* Premium Newsletter Signup */}
              <Card className="overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
                <CardContent className="relative p-6 text-white">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Stay Informed</h3>
                    <p className="text-white/90 text-sm">
                      Get exclusive insights and {contentType === 'blog' ? 'tech articles' : 'updates'} delivered to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
                      required
                    />
                    <Button
                      type="submit"
                      className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold"
                      disabled={subscribing}
                    >
                      {subscribing ? 'Subscribing...' : 'Subscribe Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Popular Articles */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                    Trending Now
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <div key={post.id} className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openPost(post)}>
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {post.title}
                          </h4>
                          <div className="flex items-center mt-2 text-xs text-slate-500">
                            <Eye className="h-3 w-3 mr-1" />
                            {post.views ? post.views.toLocaleString() + ' views' : 'New article'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Articles */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="group p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openPost(post)}>
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug mb-2">
                          {post.title}
                        </h4>
                        <div className="text-xs text-slate-500">
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-slate-900">
                    <Filter className="w-5 h-5 mr-2 text-purple-500" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <div key={category.id} className="flex items-center justify-between group">
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium"
                        >
                          {category.name}
                        </button>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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