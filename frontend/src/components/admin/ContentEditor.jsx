import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Save, Eye, Image, Link, Video, FileText, Tag, Calendar,
  Edit, Trash2, Plus, Search, Filter, Grid, List, Globe, Megaphone
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiRequest } from '../../utils/api'

const ContentEditor = () => {
  const [contentType, setContentType] = useState('all')
  const [content, setContent] = useState([])
  const [currentContent, setCurrentContent] = useState({
    title: '',
    content_type: 'blog',
    category: '',
    content: '',
    excerpt: '',
    featured_image: '',
    author: '',
    tags: [],
    meta_description: '',
    published: true
  })
  const [editingContent, setEditingContent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'add' or 'edit'

  const [categories, setCategories] = useState([])
  const [contentTypes, setContentTypes] = useState([])

  useEffect(() => {
    loadContent()
    loadCategories()
    loadContentTypes()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/blog/categories')
      if (response.success) {
        const categoriesData = response.categories || []
        setCategories(categoriesData.map(cat => cat.name || cat))
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
        const typesData = response.content_types || []
        setContentTypes(typesData.map(type => ({
          value: type.slug || type.name.toLowerCase(),
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

  const saveContent = async () => {
    if (!currentContent.title || !currentContent.content) {
      toast.error('Please fill in title and content')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
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

  const deleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      const token = localStorage.getItem('admin_token')
      await apiRequest(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      toast.success('Content deleted successfully!')
      loadContent()
    } catch (error) {
      toast.error('Failed to delete content')
    }
  }

  const editContent = (contentItem) => {
    setEditingContent(contentItem)
    setCurrentContent({
      title: contentItem.title || '',
      content_type: contentItem.content_type || 'blog',
      category: contentItem.category || '',
      content: contentItem.content || '',
      excerpt: contentItem.excerpt || '',
      featured_image: contentItem.featured_image || '',
      author: contentItem.author || '',
      meta_description: contentItem.meta_description || '',
      published: Boolean(contentItem.published),
      tags: Array.isArray(contentItem.tags) ? contentItem.tags.join(', ') : (contentItem.tags || '')
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
      title: '',
      content_type: 'blog',
      category: '',
      content: '',
      excerpt: '',
      featured_image: '',
      author: '',
      tags: [],
      meta_description: '',
      published: true
    })
    setShowModal(false)
    setModalType('')
  }

  const insertMedia = (type) => {
    let mediaHtml = ''
    const url = prompt(`Enter ${type} URL:`)
    if (!url) return

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
      case 'link':
        const linkText = prompt('Enter link text:')
        mediaHtml = `<a href="${url}" target="_blank">${linkText || url}</a>`
        break
    }

    setCurrentContent({
      ...currentContent,
      content: currentContent.content + '\n\n' + mediaHtml
    })
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = contentType === 'all' || item.content_type === contentType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search content..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md"
            >
              <option value="all">All Types</option>
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="grid gap-6">
        {filteredContent.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No content found matching your search.' : 'No content available. Create your first piece of content!'}
              </p>
            </CardContent>
          </Card>
        ) : Array.isArray(filteredContent) ? (
          filteredContent.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.content_type === 'blog' ? 'bg-blue-100 text-blue-800' :
                        item.content_type === 'news' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contentTypes.find(t => t.value === item.content_type)?.label || item.content_type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.published ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {item.excerpt || item.content?.substring(0, 200) + '...' || 'No description'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {item.author && <span>By {item.author}</span>}
                      {item.category && <span>in {item.category}</span>}
                      <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                      {item.views && <span>{item.views} views</span>}
                    </div>
                    
                    {item.tags && item.tags !== 'null' && item.tags !== '' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(item.tags) ? item.tags :
                          (() => {
                            try {
                              return JSON.parse(item.tags || '[]') || [];
                            } catch (e) {
                              return item.tags ? item.tags.split(',').map(t => t.trim()) : [];
                            }
                          })()
                        ).map((tag, index) => (
                          <span key={`${tag}-${index}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editContent(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteContent(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {item.featured_image && (
                  <div className="mt-4">
                    <img 
                      src={item.featured_image} 
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Error loading content. Please refresh the page.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'edit' ? 'Edit Content' : 'Create New Content'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Editor */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Title *</label>
                          <Input
                            value={currentContent.title}
                            onChange={(e) => setCurrentContent({...currentContent, title: e.target.value})}
                            placeholder="Enter content title"
                            className="text-lg"
                          />
                        </div>

                        {/* Content Type & Category */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Content Type</label>
                            <select
                              value={currentContent.content_type}
                              onChange={(e) => setCurrentContent({...currentContent, content_type: e.target.value})}
                              className="w-full px-3 py-2 border border-input rounded-md"
                            >
                              {contentTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <select
                              value={currentContent.category}
                              onChange={(e) => setCurrentContent({...currentContent, category: e.target.value})}
                              className="w-full px-3 py-2 border border-input rounded-md"
                            >
                              <option value="">Select category</option>
                              {Array.isArray(categories) ? categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              )) : []}
                            </select>
                          </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Excerpt</label>
                          <textarea
                            value={currentContent.excerpt || ''}
                            onChange={(e) => setCurrentContent({...currentContent, excerpt: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md"
                            rows={3}
                            placeholder="Brief description of the content"
                          />
                        </div>

                        {/* Content Editor */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Content *</label>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => insertMedia('image')}
                              >
                                <Image className="h-4 w-4 mr-1" />
                                Image
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => insertMedia('video')}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Video
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => insertMedia('link')}
                              >
                                <Link className="h-4 w-4 mr-1" />
                                Link
                              </Button>
                            </div>
                          </div>

                          <textarea
                            value={currentContent.content || ''}
                            onChange={(e) => setCurrentContent({...currentContent, content: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md font-mono text-sm"
                            rows={15}
                            placeholder="Enter your content here. You can use HTML tags for formatting."
                          />

                          <p className="text-xs text-gray-500 mt-1">
                            Tip: Use HTML for rich formatting. Images, videos, and links can be inserted using the buttons above.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Publishing Options */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Publishing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="published"
                            checked={currentContent.published}
                            onChange={(e) => setCurrentContent({...currentContent, published: e.target.checked})}
                            className="rounded"
                          />
                          <label htmlFor="published" className="text-sm">Published</label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Author</label>
                          <Input
                            value={currentContent.author}
                            onChange={(e) => setCurrentContent({...currentContent, author: e.target.value})}
                            placeholder="Author name"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Featured Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Input
                            value={currentContent.featured_image}
                            onChange={(e) => setCurrentContent({...currentContent, featured_image: e.target.value})}
                            placeholder="Image URL"
                          />
                          {currentContent.featured_image && (
                            <div className="mt-3">
                              <img
                                src={currentContent.featured_image}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags & SEO */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags & SEO</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Tags</label>
                          <Input
                            value={currentContent.tags}
                            onChange={(e) => setCurrentContent({...currentContent, tags: e.target.value})}
                            placeholder="tag1, tag2, tag3"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Meta Description</label>
                          <textarea
                            value={currentContent.meta_description || ''}
                            onChange={(e) => setCurrentContent({...currentContent, meta_description: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md text-sm"
                            rows={3}
                            placeholder="SEO meta description"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <Button onClick={resetForm} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={saveContent} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : (editingContent ? 'Update' : 'Create')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentEditor