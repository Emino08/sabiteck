import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Save, Eye, Image, Link, Video, FileText, Tag, Calendar,
  Edit, Trash2, Plus, Search, Filter, Grid, List, Globe, Megaphone,
  Crown, Sparkles, Zap, Target, Settings, Star, TrendingUp, Clock,
  CheckCircle2, AlertCircle, Monitor, Smartphone, Tablet, Type,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Hash, Code, Maximize2, Minimize2, RotateCcw, Layers, BookOpen,
  MoreVertical, Archive, FolderOpen, Heart, Share2, Wand2, Users
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiRequest } from '../../utils/api'

const ContentEditor = () => {
  const [contentType, setContentType] = useState('all')
  const [content, setContent] = useState([])
  const [currentContent, setCurrentContent] = useState({
    // Core content fields
    title: '',
    content_type: 'blog',
    category: '',
    content: '',
    excerpt: '',

    // Media and presentation
    featured_image: '',
    gallery: '',

    // Metadata and SEO
    author: '',
    meta_description: '',
    meta_title: '',

    // Publishing and classification
    published: true,
    featured: false,
    tags: '',

    // Additional fields
    slug: '',
    views: 0,
    comment_count: 0,
    like_count: 0
  })
  const [editingContent, setEditingContent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'add' or 'edit'

  const [categories, setCategories] = useState([])
  const [contentTypes, setContentTypes] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiAssistant, setAiAssistant] = useState(false)
  const [editorMode, setEditorMode] = useState('visual') // 'visual' or 'code'
  const [previewMode, setPreviewMode] = useState(false)

  // Sonnet Modal states
  const [sonnetModal, setSonnetModal] = useState({
    show: false,
    type: '', // 'confirm', 'input', 'media'
    title: '',
    message: '',
    placeholder: '',
    inputValue: '',
    onConfirm: null,
    onCancel: null
  })

  useEffect(() => {
    loadContent()
    loadCategories()
    loadContentTypes()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/blog/categories')
      if (response.success) {
        // Convert the numbered object keys to array
        const categoriesArray = Object.values(response).filter(item => item && item.id && item.name)
        setCategories(categoriesArray.map(cat => cat.name))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    }
  }

  const loadContentTypes = async () => {
    try {
      const response = await apiRequest('/api/content/types')
      if (response.success) {
        // Convert the numbered object keys to array
        const typesArray = Object.values(response).filter(item => item && item.id && item.name)
        setContentTypes(typesArray.map(type => ({
          value: type.type || type.name.toLowerCase().replace(/\s+/g, '-'),
          label: type.name,
          icon: FileText
        })))
      }
    } catch (error) {
      console.error('Error loading content types:', error)
      setContentTypes([])
    }
  }

  const loadContent = async () => {
    try {
      const response = await apiRequest('/api/admin/content');
      console.log('Content API Response:', response);
      if (response.success) {
        // The API returns recent content in response.recent
        const contentData = response.recent || response.data?.recent || response.data?.content || response.data || [];
        console.log('Setting content data:', contentData);
        setContent(contentData);
      } else {
        toast.error(response.message || 'Failed to load content');
      }
    } catch (error) {
      console.error('Content loading error:', error);
      toast.error('Failed to load content')
    }
  }

  // Sonnet Modal Helper Functions
  const showConfirmModal = (title, message, onConfirm, onCancel = null) => {
    setSonnetModal({
      show: true,
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel: onCancel || (() => setSonnetModal(prev => ({ ...prev, show: false }))),
      placeholder: '',
      inputValue: ''
    })
  }

  const showInputModal = (title, placeholder, onConfirm, defaultValue = '', onCancel = null) => {
    setSonnetModal({
      show: true,
      type: 'input',
      title,
      message: '',
      placeholder,
      inputValue: defaultValue,
      onConfirm,
      onCancel: onCancel || (() => setSonnetModal(prev => ({ ...prev, show: false }))),
    })
  }

  const showMediaModal = (mediaType, onConfirm, onCancel = null) => {
    setSonnetModal({
      show: true,
      type: 'media',
      title: `Insert ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`,
      message: '',
      placeholder: `Enter ${mediaType} URL...`,
      inputValue: '',
      mediaType,
      onConfirm,
      onCancel: onCancel || (() => setSonnetModal(prev => ({ ...prev, show: false }))),
    })
  }

  const closeSonnetModal = () => {
    setSonnetModal({
      show: false,
      type: '',
      title: '',
      message: '',
      placeholder: '',
      inputValue: '',
      onConfirm: null,
      onCancel: null
    })
  }

  const saveContent = async () => {
    if (!currentContent.title || !currentContent.content) {
      toast.error('Please fill in title and content')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = editingContent ? `/api/admin/content/${editingContent.id}` : '/api/admin/content'
      const method = editingContent ? 'PUT' : 'POST'
      
      // Process tags
      const processedContent = {
        ...currentContent,
        tags: typeof currentContent.tags === 'string' 
          ? currentContent.tags.split(',').map(tag => tag.trim()) 
          : currentContent.tags
      }
      
      await apiRequest(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedContent)
      })
      
      toast.success(editingContent ? 'Content updated successfully!' : 'Content created successfully!')
      resetForm()
      loadContent()
      setShowModal(false)
    } catch (error) {
      toast.error('Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  const deleteContent = (contentId) => {
    showConfirmModal(
      '🗑️ Delete Content',
      'Are you sure you want to permanently delete this content? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('auth_token')
          await apiRequest(`/api/admin/content/${contentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })

          toast.success('Content deleted successfully!')
          loadContent()
          closeSonnetModal()
        } catch (error) {
          toast.error('Failed to delete content')
        }
      }
    )
  }

  const editContent = (contentItem) => {
    console.log('Editing content item:', contentItem); // Debug log
    setEditingContent(contentItem)

    // Handle tags properly - can be JSON string, array, or null
    let tagsValue = '';
    if (contentItem.tags) {
      if (Array.isArray(contentItem.tags)) {
        tagsValue = contentItem.tags.join(', ');
      } else if (typeof contentItem.tags === 'string') {
        try {
          // Try to parse as JSON first
          const parsedTags = JSON.parse(contentItem.tags);
          if (Array.isArray(parsedTags)) {
            tagsValue = parsedTags.join(', ');
          } else {
            tagsValue = contentItem.tags === 'null' ? '' : contentItem.tags;
          }
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          tagsValue = contentItem.tags === 'null' ? '' : contentItem.tags;
        }
      }
    }

    setCurrentContent({
      // Core content fields
      title: contentItem.title || '',
      content_type: contentItem.content_type || 'blog',
      category: contentItem.category || '',
      content: contentItem.content || '',
      excerpt: contentItem.excerpt || '',

      // Media and presentation
      featured_image: contentItem.featured_image || '',

      // Metadata and SEO
      author: contentItem.author || '',
      meta_description: contentItem.meta_description || '',
      meta_title: contentItem.meta_title || '',

      // Publishing and classification
      published: Boolean(contentItem.published),
      featured: Boolean(contentItem.featured),
      tags: tagsValue,

      // Additional fields that might be missing
      slug: contentItem.slug || '',
      gallery: contentItem.gallery || '',
      views: contentItem.views || 0,
      comment_count: contentItem.comment_count || 0,
      like_count: contentItem.like_count || 0
    })
    setModalType('edit')
    setShowModal(true)
  }

  const openAddModal = () => {
    setModalType('add')
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingContent(null)
    setCurrentContent({
      // Core content fields
      title: '',
      content_type: 'blog',
      category: '',
      content: '',
      excerpt: '',

      // Media and presentation
      featured_image: '',
      gallery: '',

      // Metadata and SEO
      author: '',
      meta_description: '',
      meta_title: '',

      // Publishing and classification
      published: true,
      featured: false,
      tags: '',

      // Additional fields
      slug: '',
      views: 0,
      comment_count: 0,
      like_count: 0
    })
    setShowModal(false)
    setModalType('')
  }

  const insertMedia = (type) => {
    if (type === 'link') {
      // For links, we need URL first, then link text
      showMediaModal(type, (url) => {
        if (!url) return

        // After URL is provided, ask for link text
        showInputModal(
          '🔗 Link Text',
          'Enter the display text for this link...',
          (linkText) => {
            const mediaHtml = `<a href="${url}" target="_blank">${linkText || url}</a>`
            setCurrentContent({
              ...currentContent,
              content: currentContent.content + '\n\n' + mediaHtml
            })
            closeSonnetModal()
          },
          url // default to URL as link text
        )
      })
    } else {
      // For images and videos, just need URL
      showMediaModal(type, (url) => {
        if (!url) return

        let mediaHtml = ''
        switch(type) {
          case 'image':
            mediaHtml = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`
            break
          case 'video':
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              const videoId = url.includes('youtu.be') ? url.split('/').pop() : url.split('v=')[1]?.split('&')[0]
              mediaHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
            } else {
              mediaHtml = `<video controls style="max-width: 100%;"><source src="${url}" type="video/mp4"></video>`
            }
            break
        }

        setCurrentContent({
          ...currentContent,
          content: currentContent.content + '\n\n' + mediaHtml
        })
        closeSonnetModal()
      })
    }
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = contentType === 'all' || item.content_type === contentType
    return matchesSearch && matchesType
  })

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Elite Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                  <div className="relative p-3 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                    Elite Content Studio
                  </h1>
                  <p className="text-gray-300 text-sm">Professional content creation & management platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Elite Tools */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 bg-black/30 backdrop-blur-lg rounded-lg border border-white/20 hover:bg-black/40 transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setAiAssistant(!aiAssistant)}
                  className={`p-2 rounded-lg border transition-all ${aiAssistant
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400'
                    : 'bg-black/30 backdrop-blur-lg border-white/20 hover:bg-black/40'
                  }`}
                  title="AI Writing Assistant"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              {/* Create Button */}
              <Button
                onClick={openAddModal}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 shadow-2xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Elite Content
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Elite Content Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Content', value: content.length || '0', icon: FileText, color: 'indigo', trend: '+12%' },
              { label: 'Published', value: content.filter(c => c.published).length || '0', icon: CheckCircle2, color: 'green', trend: '+8%' },
              { label: 'Drafts', value: content.filter(c => !c.published).length || '0', icon: Edit, color: 'yellow', trend: '+3%' },
              { label: 'Total Views', value: '12.4K', icon: Eye, color: 'purple', trend: '+15%' }
            ].map((stat, index) => (
              <div key={index} className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 group hover:scale-105 transition-all duration-300 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-${stat.color}-400 font-semibold text-sm`}>{stat.trend}</span>
                </div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Elite Filters & Controls */}
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                {/* Elite Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search elite content..."
                    className="pl-10 bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl w-80"
                  />
                </div>

                {/* Advanced Filters */}
                <div className="flex space-x-2">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="px-4 py-2 bg-black/50 border border-white/20 text-white rounded-lg"
                  >
                    <option value="all">All Types</option>
                    {contentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-4">
                {/* AI Assistant Status */}
                {aiAssistant && (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-lg border border-purple-400/30 px-4 py-2">
                    <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                    <span className="text-purple-200 text-sm font-semibold">AI Active</span>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex bg-black/50 rounded-lg border border-white/20 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all ${viewMode === 'grid'
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-300 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${viewMode === 'list'
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-300 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Elite Content Display */}
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <FolderOpen className="w-6 h-6 mr-3 text-indigo-400" />
                Elite Content Library
              </h3>
              <div className="text-gray-300 text-sm">
                {filteredContent.length} professional articles
              </div>
            </div>

            {filteredContent.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                  <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                    <FileText className="w-16 h-16 text-indigo-400 mx-auto" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mt-6 mb-3">
                  {searchTerm ? 'No Elite Content Found' : 'Start Your Elite Journey'}
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  {searchTerm ? 'Try adjusting your search terms or filters to find content.' : 'Create your first piece of professional content and establish your elite presence.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={openAddModal}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-8 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Elite Content
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* Elite Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map((item) => (
                  <div key={item.id} className="group bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-indigo-400/50 transition-all duration-300 hover:scale-105 shadow-xl">
                    {/* Content Thumbnail */}
                    <div className="h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative overflow-hidden">
                      {item.featured_image ? (
                        <img
                          src={item.featured_image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-16 h-16 text-indigo-400/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editContent(item)}
                            className="p-2 bg-black/50 backdrop-blur-lg rounded-lg border border-white/20 hover:bg-indigo-500 transition-all"
                          >
                            <Edit className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => deleteContent(item.id)}
                            className="p-2 bg-black/50 backdrop-blur-lg rounded-lg border border-white/20 hover:bg-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Content Type Badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold">
                          {contentTypes.find(t => t.value === item.content_type)?.label || item.content_type}
                        </span>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${item.published ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                          <span className={`text-xs font-semibold ${item.published ? 'text-green-400' : 'text-yellow-400'}`}>
                            {item.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 text-xs">{item.views || '0'}</span>
                        </div>
                      </div>

                      <h4 className="text-white font-bold text-lg mb-2 line-clamp-2">
                        {item.title}
                      </h4>

                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {item.excerpt || item.content?.substring(0, 120) + '...' || 'Professional content with no description'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 text-xs">24</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags !== 'null' && item.tags !== '' && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(Array.isArray(item.tags) ? item.tags :
                            (() => {
                              try {
                                return JSON.parse(item.tags || '[]') || [];
                              } catch (e) {
                                return item.tags ? item.tags.split(',').map(t => t.trim()) : [];
                              }
                            })()
                          ).slice(0, 3).map((tag, index) => (
                            <span key={`${tag}-${index}`} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Elite List View */
              <div className="space-y-4">
                {filteredContent.map((item) => (
                  <div key={item.id} className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:border-indigo-400/50 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          {item.featured_image ? (
                            <img src={item.featured_image} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <FileText className="w-8 h-8 text-indigo-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-bold text-lg truncate">{item.title}</h4>
                            <span className="px-2 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold flex-shrink-0">
                              {contentTypes.find(t => t.value === item.content_type)?.label || item.content_type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                              item.published ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                            }`}>
                              {item.published ? 'Live' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                            {item.excerpt || item.content?.substring(0, 150) + '...' || 'Professional content description...'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            {item.author && <span>By {item.author}</span>}
                            {item.category && <span>in {item.category}</span>}
                            <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                            <span className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{item.views || '0'} views</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => editContent(item)}
                          className="p-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteContent(item.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-500/20 hover:bg-gray-500 text-gray-400 hover:text-white rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Elite Content Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto border border-white/10">
              {/* Elite Modal Header */}
              <div className="flex justify-between items-center p-8 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 animate-pulse"></div>
                    <div className="relative p-3 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                      <Edit className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {modalType === 'edit' ? 'Edit Elite Content' : 'Create Elite Content'}
                    </h3>
                    <p className="text-gray-300">Professional content creation studio</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-400 to-purple-400 text-black rounded-full text-xs font-black">
                    ELITE EDITOR
                  </span>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 bg-black/30 backdrop-blur-lg rounded-lg border border-white/20 hover:bg-red-500 transition-all text-white"
                  >
                    <span className="text-xl font-bold">×</span>
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Elite Main Editor */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                      <div className="space-y-6">
                        {/* Elite Title Input */}
                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Elite Content Title *</label>
                          <Input
                            value={currentContent.title}
                            onChange={(e) => setCurrentContent({...currentContent, title: e.target.value})}
                            placeholder="Enter your professional content title..."
                            className="text-lg bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl py-4"
                          />
                        </div>

                        {/* Elite Content Type & Category */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white mb-3">Content Type</label>
                            <select
                              value={currentContent.content_type}
                              onChange={(e) => setCurrentContent({...currentContent, content_type: e.target.value})}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-indigo-400 transition-all"
                            >
                              {contentTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white mb-3">Professional Category</label>
                            <select
                              value={currentContent.category}
                              onChange={(e) => setCurrentContent({...currentContent, category: e.target.value})}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-indigo-400 transition-all"
                            >
                              <option value="">Select elite category</option>
                              {Array.isArray(categories) ? categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              )) : []}
                            </select>
                          </div>
                        </div>

                        {/* Elite Excerpt */}
                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Professional Excerpt</label>
                          <textarea
                            value={currentContent.excerpt || ''}
                            onChange={(e) => setCurrentContent({...currentContent, excerpt: e.target.value})}
                            className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-indigo-400 transition-all resize-none"
                            rows={4}
                            placeholder="Craft a compelling professional summary that captures your content's value..."
                          />
                        </div>

                        {/* Elite Content Editor */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-bold text-white">Elite Content Editor *</label>
                            <div className="flex space-x-2">
                              {[
                                { label: 'Image', icon: Image, action: () => insertMedia('image'), color: 'from-pink-500 to-rose-500' },
                                { label: 'Video', icon: Video, action: () => insertMedia('video'), color: 'from-red-500 to-orange-500' },
                                { label: 'Link', icon: Link, action: () => insertMedia('link'), color: 'from-blue-500 to-cyan-500' }
                              ].map((item, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={item.action}
                                  className={`flex items-center px-3 py-2 bg-gradient-to-r ${item.color} text-white rounded-lg font-semibold text-xs hover:scale-105 transition-transform`}
                                >
                                  <item.icon className="w-4 h-4 mr-1" />
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            value={currentContent.content || ''}
                            onChange={(e) => setCurrentContent({...currentContent, content: e.target.value})}
                            className="w-full px-4 py-4 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl font-mono text-sm focus:border-indigo-400 transition-all resize-none"
                            rows={18}
                            placeholder="Create your professional content here. Use HTML for advanced formatting and styling..."
                          />

                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-gray-400">
                              💡 Pro Tip: Use HTML tags for rich formatting. Insert media using the buttons above.
                            </p>
                            <div className="text-xs text-gray-400">
                              {currentContent.content?.length || 0} characters
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Elite Sidebar */}
                  <div className="space-y-6">
                    {/* Elite Publishing Options */}
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-green-400" />
                        Publishing Control
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="published"
                            checked={currentContent.published}
                            onChange={(e) => setCurrentContent({...currentContent, published: e.target.checked})}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-400"
                          />
                          <label htmlFor="published" className="text-white font-semibold">Publish to Elite Network</label>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Elite Author</label>
                          <Input
                            value={currentContent.author}
                            onChange={(e) => setCurrentContent({...currentContent, author: e.target.value})}
                            placeholder="Professional author name"
                            className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Elite Featured Image */}
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Image className="w-5 h-5 mr-2 text-purple-400" />
                        Featured Visual
                      </h4>
                      <div>
                        <Input
                          value={currentContent.featured_image}
                          onChange={(e) => setCurrentContent({...currentContent, featured_image: e.target.value})}
                          placeholder="Professional image URL"
                          className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                        />
                        {currentContent.featured_image && (
                          <div className="mt-4">
                            <img
                              src={currentContent.featured_image}
                              alt="Elite Preview"
                              className="w-full h-40 object-cover rounded-xl border border-white/10"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Elite Tags & SEO */}
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-blue-400" />
                        SEO & Classification
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Professional Tags</label>
                          <Input
                            value={currentContent.tags}
                            onChange={(e) => setCurrentContent({...currentContent, tags: e.target.value})}
                            placeholder="elite, professional, premium"
                            className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                          />
                          <p className="text-xs text-gray-400 mt-2">Separate elite tags with commas</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Meta Description</label>
                          <textarea
                            value={currentContent.meta_description || ''}
                            onChange={(e) => setCurrentContent({...currentContent, meta_description: e.target.value})}
                            className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl text-sm focus:border-indigo-400 transition-all resize-none"
                            rows={4}
                            placeholder="Professional SEO description for search engines..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Meta Title</label>
                          <Input
                            value={currentContent.meta_title || ''}
                            onChange={(e) => setCurrentContent({...currentContent, meta_title: e.target.value})}
                            placeholder="Professional SEO title"
                            className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Gallery URLs</label>
                          <textarea
                            value={currentContent.gallery || ''}
                            onChange={(e) => setCurrentContent({...currentContent, gallery: e.target.value})}
                            className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl text-sm focus:border-indigo-400 transition-all resize-none"
                            rows={3}
                            placeholder="Comma-separated gallery image URLs..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-white mb-3">Custom Slug</label>
                          <Input
                            value={currentContent.slug || ''}
                            onChange={(e) => setCurrentContent({...currentContent, slug: e.target.value})}
                            placeholder="custom-url-slug (auto-generated if empty)"
                            className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                          />
                        </div>

                        <div className="flex space-x-6">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="published"
                              checked={currentContent.published || false}
                              onChange={(e) => setCurrentContent({...currentContent, published: e.target.checked})}
                              className="w-5 h-5 bg-black/50 border-white/20 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="published" className="text-sm font-bold text-white">
                              Published
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="featured"
                              checked={currentContent.featured || false}
                              onChange={(e) => setCurrentContent({...currentContent, featured: e.target.checked})}
                              className="w-5 h-5 bg-black/50 border-white/20 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="featured" className="text-sm font-bold text-white">
                              Featured Content
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elite Actions */}
                <div className="flex justify-between items-center pt-8 border-t border-white/10 mt-8">
                  <div className="flex items-center space-x-4">
                    {aiAssistant && (
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-lg border border-purple-400/30 px-4 py-2">
                        <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                        <span className="text-purple-200 text-sm font-semibold">AI Assistance Ready</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={resetForm}
                      className="bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-red-500 font-semibold px-8 py-3"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveContent}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-8 py-3 shadow-2xl"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {loading ? 'Publishing...' : (editingContent ? 'Update Elite Content' : 'Publish Elite Content')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Sonnet Modal */}
      {sonnetModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] px-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full mx-auto shadow-2xl">

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {sonnetModal.title}
              </h3>
              {sonnetModal.message && (
                <p className="text-gray-300 mt-3 leading-relaxed">
                  {sonnetModal.message}
                </p>
              )}
            </div>

            {/* Input Field for input/media modals */}
            {(sonnetModal.type === 'input' || sonnetModal.type === 'media') && (
              <div className="mb-6">
                <Input
                  value={sonnetModal.inputValue}
                  onChange={(e) => setSonnetModal(prev => ({...prev, inputValue: e.target.value}))}
                  placeholder={sonnetModal.placeholder}
                  className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl text-lg py-4"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sonnetModal.onConfirm?.(sonnetModal.inputValue)
                    }
                  }}
                />
                {sonnetModal.type === 'media' && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    <Globe className="w-3 h-3 mr-1" />
                    Enter a valid URL (e.g., https://example.com/image.jpg)
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={() => sonnetModal.onCancel?.()}
                className="flex-1 bg-black/30 backdrop-blur-lg border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50 font-semibold py-3 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (sonnetModal.type === 'confirm') {
                    sonnetModal.onConfirm?.()
                  } else {
                    sonnetModal.onConfirm?.(sonnetModal.inputValue)
                  }
                }}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 shadow-xl transition-all"
              >
                {sonnetModal.type === 'confirm'
                  ? 'Confirm'
                  : sonnetModal.type === 'media'
                    ? 'Insert'
                    : 'Save'
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentEditor