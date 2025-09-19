import React, { useState, useEffect } from 'react'
import { Search, Calendar, User, Tag, Clock, ArrowRight, TrendingUp } from 'lucide-react'
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
      setPosts(filteredContent)
      
      // Generate categories from the actual content
      const categoryMap = new Map()
      filteredContent.forEach(item => {
        if (item.category) {
          const count = categoryMap.get(item.category) || 0
          categoryMap.set(item.category, count + 1)
        }
      })
      
      const dynamicCategories = [
        { id: 'all', name: `All ${contentType === 'blog' ? 'Posts' : 'News'}`, count: filteredContent.length },
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

  const featuredPosts = posts.filter(post => post.featured).slice(0, 2)
  const popularPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
  }

  const closePost = () => {
    setSelectedPost(null)
    setShowPostModal(false)
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {contentType === 'blog' ? 'Sabiteck Tech Blog' : 'Sabiteck News'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {contentType === 'blog' 
                ? 'Insights, tutorials, and best practices from our development team. Stay updated with the latest trends in software development.'
                : 'Latest news and updates from Sabiteck. Stay informed about our company developments and industry announcements.'
              }
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center"
              >
                {category.name}
                <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading {contentType === 'blog' ? 'articles' : 'news'}...</p>
              </div>
            ) : (
              <>
                {/* Featured Posts */}
                {selectedCategory === 'all' && featuredPosts.length > 0 && (
                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured {contentType === 'blog' ? 'Articles' : 'News'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {featuredPosts.map((post) => (
                        <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video bg-gray-200 relative">
                            {post.featured_image ? (
                              <img 
                                src={post.featured_image} 
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-blue-600/80 flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">{post.title}</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Featured
                            </div>
                          </div>
                          <CardContent className="p-6">
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(post.created_at)}
                              <Clock className="h-4 w-4 ml-4 mr-2" />
                              {Math.ceil((post.content?.length || 0) / 200)} min read
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {post.excerpt || post.content?.substring(0, 150) + '...' || 'No description available'}
                            </p>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-sm text-gray-600">{post.author || 'Sabiteck Team'}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => openPost(post)}>
                                Read More
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                            
                            {/* Comment and Like Section for Featured Posts */}
                            <CommentSection 
                              contentId={post.id}
                              initialCommentCount={post.comment_count || 0}
                              initialLikeCount={post.like_count || 0}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* All Posts */}
                <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">
                    {selectedCategory === 'all' ? 'Latest Articles' : `${categories.find(c => c.id === selectedCategory)?.name} Articles`}
                    <span className="text-lg font-normal text-gray-500 ml-2">
                      ({filteredPosts.length} articles)
                    </span>
                  </h2>

                  <div className="space-y-8">
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No {contentType === 'blog' ? 'articles' : 'news'} found.</p>
                      </div>
                    ) : (
                      filteredPosts.map((post) => (
                        <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="md:flex">
                            <div className="md:w-1/3">
                              <div className="aspect-video md:aspect-square bg-gray-200 relative">
                                {post.featured_image ? (
                                  <img 
                                    src={post.featured_image} 
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-blue-600/60 flex items-center justify-center">
                                    <span className="text-white font-medium text-center px-4">
                                      {post.title}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="md:w-2/3 p-6">
                              <div className="flex items-center text-sm text-gray-500 mb-3">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(post.created_at)}
                                <Clock className="h-4 w-4 ml-4 mr-2" />
                                {Math.ceil((post.content?.length || 0) / 200)} min read
                                {post.views && (
                                  <>
                                    <TrendingUp className="h-4 w-4 ml-4 mr-2" />
                                    {post.views.toLocaleString()} views
                                  </>
                                )}
                              </div>
                              
                              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {post.title}
                              </h3>
                              
                              <p className="text-gray-600 mb-4 line-clamp-3">
                                {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : 'No description available')}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags && (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags).map((tag) => (
                                  <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">{post.author || 'Sabiteck Team'}</span>
                                  </div>
                                  {post.author_role && (
                                    <div className="text-xs text-gray-500">{post.author_role}</div>
                                  )}
                                </div>
                                <Button onClick={() => openPost(post)}>
                                  Read Article
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>

                              {/* Comment and Like Section */}
                              <CommentSection 
                                contentId={post.id}
                                initialCommentCount={post.comment_count || 0}
                                initialLikeCount={post.like_count || 0}
                              />
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Newsletter Signup */}
              <Card>
                <CardHeader>
                  <CardTitle>Stay Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Get the latest {contentType === 'blog' ? 'articles' : 'news'} and insights delivered to your inbox.
                  </p>
                  <form onSubmit={handleSubscribe} className="space-y-3">
                    <Input 
                      placeholder="Your email address" 
                      type="email" 
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full" disabled={subscribing}>
                      {subscribing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Popular Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <div key={post.id} className="flex items-start space-x-3">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {post.views ? post.views.toLocaleString() + ' views' : 'New article'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          className="text-sm text-gray-600 hover:text-primary transition-colors"
                        >
                          {category.name}
                        </button>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
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

      {/* Article Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                {selectedPost.title}
              </h2>
              <Button variant="ghost" onClick={closePost}>
                ×
              </Button>
            </div>
            
            <div className="p-6">
              {/* Article Header */}
              <div className="mb-6">
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(selectedPost.created_at)}
                  <Clock className="h-4 w-4 ml-4 mr-2" />
                  {Math.ceil((selectedPost.content?.length || 0) / 200)} min read
                  <User className="h-4 w-4 ml-4 mr-2" />
                  {selectedPost.author || 'Sabiteck Team'}
                </div>
                
                {selectedPost.featured_image && (
                  <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                    <img 
                      src={selectedPost.featured_image} 
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {selectedPost.excerpt && (
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {selectedPost.excerpt}
                  </p>
                )}
              </div>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedPost.content) || 'No content available.' }} />
              </div>

              {/* Tags */}
              {selectedPost.tags && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {(typeof selectedPost.tags === 'string' ? JSON.parse(selectedPost.tags) : selectedPost.tags).map((tag) => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      <Tag className="h-3 w-3 mr-1" />
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
      )}
    </div>
  )
}

export default Blog