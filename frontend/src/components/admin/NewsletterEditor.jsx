import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Send, Save, Eye, Image, Link, Palette, Users, Filter,
  Calendar, BarChart, Mail, FileText, Wand2, Upload, Edit,
  Sparkles, Crown, Zap, Target, Settings, Globe, Star,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Monitor,
  Smartphone, Tablet, Type, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, List, Hash,
  Code, Maximize2, Minimize2, Play, Pause, RotateCcw, Minus,
  BookOpen, Layers, Search, Plus, MoreVertical, Archive,
  Tag, FolderOpen, Bookmark, Heart, Share2, Move,
  RotateCw, ZoomIn, ZoomOut, Square, Circle, Triangle,
  MousePointer, Hand, Crop, Brush, Eraser, PaintBucket,
  FlipHorizontal, FlipVertical, Copy, Trash2, ArrowUp,
  ArrowDown, ArrowLeft, ArrowRight, Grid, Sliders,
  Paintbrush, ImagePlus, PenTool, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { Button } from '../ui/button'

const API_BASE = 'http://localhost:8002'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiRequest } from '../../utils/api'
import { sanitizeHTML, secureLog } from '../../utils/security'

const NewsletterEditor = () => {
  console.log('🚀 Elite NewsletterEditor component rendered')

  const [activeView, setActiveView] = useState('composer')
  const [campaigns, setCampaigns] = useState([])
  const [templates, setFileTexts] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [currentCampaign, setCurrentCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    template_id: '',
    priority: 'normal',
    sendTime: '',
    personalizations: {}
  })
  const [selectedFileText, setSelectedFileText] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [subscriberFilters, setSubscriberFilters] = useState({
    segment: 'all',
    tags: [],
    engagement: 'all',
    location: 'all',
    joinDate: 'all'
  })
  const [loading, setLoading] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState(null)
  const [emailForm, setEmailForm] = useState({ subject: '', content: '' })
  const [editForm, setEditForm] = useState({ email: '', name: '', active: false })
  const [editorMode, setEditorMode] = useState('visual')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiAssistant, setAiAssistant] = useState(false)
  const [scheduledSend, setScheduledSend] = useState(false)
  const [contentItems, setContentItems] = useState([])
  const [contentFilters, setContentFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  })
  const [selectedContent, setSelectedContent] = useState(null)
  const [contentView, setContentView] = useState('grid')

  // Enhanced Visual Editor States
  const [visualElements, setVisualElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [draggedElement, setDraggedElement] = useState(null)
  const [visualEditMode, setVisualEditMode] = useState('select') // select, draw, text, image
  const [showShapeToolbar, setShowShapeToolbar] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showLinkEditor, setShowLinkEditor] = useState(false)

  // Image Management States
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageLibrary, setImageLibrary] = useState([])
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Shape and Drawing States
  const [currentShape, setCurrentShape] = useState('rectangle')
  const [shapeColor, setShapeColor] = useState('#007bff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fillOpacity, setFillOpacity] = useState(0.3)

  // Canvas and Positioning
  const canvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Link Management State
  const [linkData, setLinkData] = useState({
    url: '',
    text: '',
    target: '_blank',
    style: 'button'
  })

  // Advanced Settings & Color Schemes
  const [showColorSchemes, setShowColorSchemes] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [colorScheme, setColorScheme] = useState('default')
  const [scheduledDateTime, setScheduledDateTime] = useState('')

  // Resize and Manipulation
  const [resizeMode, setResizeMode] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)

  // Text Editing States
  const [editingTextId, setEditingTextId] = useState(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    console.log('📅 useEffect triggered - calling loadData')
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading newsletter data...')

      // Load subscribers
      try {
        console.log('📧 Loading subscribers...')
        const subscribersResponse = await apiRequest('/api/admin/newsletter/subscribers');
        console.log('📧 Subscribers raw response:', subscribersResponse)
        if (subscribersResponse && subscribersResponse.success) {
          const subscriberData = subscribersResponse.data?.subscribers || subscribersResponse.data || [];
          setSubscribers(subscriberData);
          console.log('✅ Subscribers loaded:', subscriberData)
        } else {
          console.log('❌ Subscribers response not successful:', subscribersResponse)
          toast.error('Failed to load subscribers - invalid response')
        }
      } catch (error) {
        console.error('❌ Error loading subscribers:', error)
        toast.error('Failed to load subscribers')
      }

      // Load templates
      try {
        console.log('📄 Loading templates...')
        const templatesResponse = await apiRequest('/api/admin/newsletter/templates');
        console.log('📄 Templates raw response:', templatesResponse)
        if (templatesResponse && templatesResponse.success) {
          const templateData = templatesResponse.data?.templates || templatesResponse.data || [];
          setFileTexts(templateData);
          console.log('✅ Templates loaded:', templateData)
        } else {
          console.log('❌ Templates response not successful:', templatesResponse)
          toast.error('Failed to load templates - invalid response')
        }
      } catch (error) {
        console.error('❌ Error loading templates:', error)
        toast.error('Failed to load templates')
      }

      // Load campaigns
      try {
        console.log('📊 Loading campaigns...')
        const campaignsResponse = await apiRequest('/api/admin/newsletter/campaigns');
        console.log('📊 Campaigns raw response:', campaignsResponse)
        if (campaignsResponse && campaignsResponse.success) {
          const campaignData = campaignsResponse.data?.campaigns || campaignsResponse.data || [];
          setCampaigns(campaignData);
          console.log('✅ Campaigns loaded:', campaignData)
        } else {
          console.log('❌ Campaigns response not successful:', campaignsResponse)
          toast.error('Failed to load campaigns - invalid response')
        }
      } catch (error) {
        console.error('❌ Error loading campaigns:', error)
        toast.error('Failed to load campaigns')
      }

    } catch (error) {
      console.error('❌ General error loading newsletter data:', error)
      toast.error('Failed to load newsletter data')
    } finally {
      setLoading(false)
    }
  }

  const saveCampaign = async () => {
    if (!currentCampaign.name || !currentCampaign.subject || !currentCampaign.content) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      await apiRequest('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(currentCampaign)
      })

      toast.success('Campaign saved successfully!')
      loadData()
      setCurrentCampaign({ name: '', subject: '', content: '', template_id: null })
    } catch (error) {
      console.error('Campaign save error:', error)
      toast.error('Failed to save campaign')
    } finally {
      setLoading(false)
    }
  }

  const sendNewsletter = async () => {
    if (!currentCampaign.subject || !currentCampaign.content) {
      toast.error('Please fill in subject and content')
      return
    }

    const filteredSubscribers = filterSubscribers()
    if (filteredSubscribers.length === 0) {
      toast.error('No subscribers match the current filters')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      await apiRequest('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          subject: currentCampaign.subject,
          content: currentCampaign.content,
          filters: subscriberFilters
        })
      })
      
      toast.success(`Newsletter sent to ${filteredSubscribers.length} subscribers!`)
    } catch (error) {
      toast.error('Failed to send newsletter')
    } finally {
      setLoading(false)
    }
  }

  const filterSubscribers = () => {
    return subscribers.filter(sub => {
      if (subscriberFilters.segment !== 'all' && sub.segment !== subscriberFilters.segment) {
        return false
      }
      // Add more filtering logic here
      return sub.active
    })
  }

  const useFileText = (template) => {
    setCurrentCampaign({
      ...currentCampaign,
      subject: template.subject,
      content: template.content,
      template_id: template.id
    })
    setSelectedFileText(template)
    toast.success('FileText applied!')
  }

  const insertPlaceholder = (placeholder) => {
    const newContent = currentCampaign.content + `[${placeholder}]`
    setCurrentCampaign({ ...currentCampaign, content: newContent })
  }

  const handleEmailSubscriber = (subscriber) => {
    setSelectedSubscriber(subscriber)
    setEmailForm({ subject: '', content: '' })
    setShowEmailDialog(true)
  }

  const handleEditSubscriber = (subscriber) => {
    setSelectedSubscriber(subscriber)
    setEditForm({
      email: subscriber.email || '',
      name: subscriber.name || '',
      active: (subscriber.status === 'subscribed' && subscriber.active === 1) || false
    })
    setShowEditDialog(true)
  }

  const sendEmailToSubscriber = async () => {
    if (!emailForm.subject || !emailForm.content) {
      toast.error('Please fill in subject and content')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      await apiRequest(`/api/admin/newsletter/subscribers/${selectedSubscriber.id}/email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(emailForm)
      })
      
      toast.success('Email sent successfully!')
      setShowEmailDialog(false)
      setEmailForm({ subject: '', content: '' })
    } catch (error) {
      toast.error('Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const updateSubscriber = async () => {
    if (!editForm.email) {
      toast.error('Email is required')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')

      // Prepare data in the format expected by the backend
      const updateData = {
        email: editForm.email,
        name: editForm.name,
        status: editForm.active ? 'subscribed' : 'unsubscribed',
        active: editForm.active ? 1 : 0
      }

      await apiRequest(`/api/admin/newsletter/subscribers/${selectedSubscriber.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      })

      toast.success('Subscriber updated successfully!')
      setShowEditDialog(false)
      loadData() // Reload data
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update subscriber: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const exportSubscribers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/newsletter/subscribers/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'newsletter_subscribers.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Subscribers exported successfully!')
      } else {
        toast.error('Failed to export subscribers')
      }
    } catch (error) {
      toast.error('Failed to export subscribers')
    }
  }

  const handleImportCSV = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/newsletter/subscribers/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`Imported ${result.imported_count} subscribers`)
        if (result.errors && result.errors.length > 0) {
          console.warn('Import errors:', result.errors)
        }
        loadData() // Reload data
      } else {
        toast.error(result.error || 'Failed to import subscribers')
      }
    } catch (error) {
      toast.error('Failed to import subscribers')
    } finally {
      setLoading(false)
      event.target.value = '' // Clear file input
    }
  }

  // Enhanced Visual Editor Methods
  const insertImage = useCallback((imageUrl, position = { x: 100, y: 100 }) => {
    console.log('insertImage called with URL:', imageUrl)
    const newElement = {
      id: Date.now(),
      type: 'image',
      src: imageUrl,
      x: position.x,
      y: position.y,
      width: 200,
      height: 150,
      rotation: 0,
      opacity: 1,
      zIndex: visualElements.length
    }
    console.log('Creating new element:', newElement)
    setVisualElements([...visualElements, newElement])
    console.log('Visual elements after insert:', [...visualElements, newElement])
    toast.success('Image inserted successfully!')
  }, [visualElements])

  const insertShape = useCallback((shapeType, position = { x: 100, y: 100 }) => {
    const newElement = {
      id: Date.now(),
      type: 'shape',
      shape: shapeType,
      x: position.x,
      y: position.y,
      width: 150,
      height: 100,
      color: shapeColor,
      strokeWidth: strokeWidth,
      opacity: fillOpacity,
      rotation: 0,
      zIndex: visualElements.length
    }
    setVisualElements([...visualElements, newElement])
    setVisualEditMode('select')
    toast.success(`${shapeType} shape added!`)
  }, [visualElements, shapeColor, strokeWidth, fillOpacity])

  const insertLink = useCallback((text, url, style = 'button') => {
    const newElement = {
      id: Date.now(),
      type: 'link',
      text: text,
      url: url,
      style: style,
      x: 100,
      y: 100,
      width: 150,
      height: 40,
      color: '#007bff',
      backgroundColor: style === 'button' ? '#007bff' : 'transparent',
      textColor: style === 'button' ? '#ffffff' : '#007bff',
      fontSize: 16,
      zIndex: visualElements.length
    }
    setVisualElements([...visualElements, newElement])
    setShowLinkEditor(false)
    toast.success('Link inserted successfully!')
  }, [visualElements])

  const insertText = useCallback((text = 'Click to edit text', position = { x: 100, y: 100 }) => {
    const newElement = {
      id: Date.now(),
      type: 'text',
      text: text,
      x: position.x,
      y: position.y,
      width: 200,
      height: 40,
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      textColor: '#000000',
      backgroundColor: 'transparent',
      rotation: 0,
      opacity: 1,
      zIndex: visualElements.length
    }
    setVisualElements([...visualElements, newElement])
    toast.success('Text element added!')
  }, [visualElements])

  const updateElement = useCallback((elementId, updates) => {
    setVisualElements(elements =>
      elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
    )
  }, [])

  const deleteElement = useCallback((elementId) => {
    setVisualElements(elements => elements.filter(el => el.id !== elementId))
    setSelectedElement(null)
    toast.success('Element deleted!')
  }, [])

  const moveElement = useCallback((elementId, direction) => {
    setVisualElements(elements => {
      const element = elements.find(el => el.id === elementId)
      if (!element) return elements

      const step = 10
      const updates = {}

      switch (direction) {
        case 'up': updates.y = Math.max(0, element.y - step); break
        case 'down': updates.y = element.y + step; break
        case 'left': updates.x = Math.max(0, element.x - step); break
        case 'right': updates.x = element.x + step; break
      }

      return elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
    })
  }, [])

  const resizeElement = useCallback((elementId, newWidth, newHeight, newX, newY) => {
    setVisualElements(elements => {
      return elements.map(el => {
        if (el.id === elementId) {
          const updates = {
            width: Math.max(20, newWidth), // Minimum 20px width
            height: Math.max(20, newHeight), // Minimum 20px height
          }

          // Update position if provided (for corner resize handles)
          if (newX !== undefined) updates.x = Math.max(0, newX)
          if (newY !== undefined) updates.y = Math.max(0, newY)

          return { ...el, ...updates }
        }
        return el
      })
    })
  }, [])

  // Handle mouse events for resizing
  useEffect(() => {
    if (!resizeMode || !selectedElement || !resizeHandle) return

    const handleMouseMove = (e) => {
      const element = selectedElement
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left - element.x
      const mouseY = e.clientY - rect.top - element.y

      let newWidth = element.width
      let newHeight = element.height
      let newX = element.x
      let newY = element.y

      switch (resizeHandle) {
        case 'se': // Southeast (bottom-right)
          newWidth = mouseX
          newHeight = mouseY
          break
        case 'sw': // Southwest (bottom-left)
          newWidth = element.width - mouseX
          newHeight = mouseY
          newX = element.x + mouseX
          break
        case 'ne': // Northeast (top-right)
          newWidth = mouseX
          newHeight = element.height - mouseY
          newY = element.y + mouseY
          break
        case 'nw': // Northwest (top-left)
          newWidth = element.width - mouseX
          newHeight = element.height - mouseY
          newX = element.x + mouseX
          newY = element.y + mouseY
          break
        case 'e': // East (right)
          newWidth = mouseX
          break
        case 'w': // West (left)
          newWidth = element.width - mouseX
          newX = element.x + mouseX
          break
        case 's': // South (bottom)
          newHeight = mouseY
          break
        case 'n': // North (top)
          newHeight = element.height - mouseY
          newY = element.y + mouseY
          break
      }

      resizeElement(element.id, newWidth, newHeight, newX, newY)
    }

    const handleMouseUp = () => {
      setResizeMode(false)
      setResizeHandle(null)
      toast.success('Element resized!')
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizeMode, selectedElement, resizeHandle, resizeElement])

  const changeLayer = useCallback((elementId, direction) => {
    setVisualElements(elements => {
      const elementIndex = elements.findIndex(el => el.id === elementId)
      if (elementIndex === -1) return elements

      let newZIndex
      if (direction === 'front') {
        newZIndex = Math.max(...elements.map(el => el.zIndex)) + 1
      } else {
        newZIndex = Math.min(...elements.map(el => el.zIndex)) - 1
      }

      return elements.map(el =>
        el.id === elementId ? { ...el, zIndex: newZIndex } : el
      )
    })
    toast.success(`Moved to ${direction}!`)
  }, [])

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    // Show loading state
    toast.info('Uploading image...')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${API_BASE}/api/admin/newsletter/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Upload response:', result) // Debug log

      if (result.success) {
        const serverImageUrl = result.full_url || result.url || `${API_BASE}/uploads/newsletter/${result.filename}`

        if (!serverImageUrl) {
          console.error('No valid image URL in response:', result)
          toast.error('Invalid server response - no image URL')
          return
        }

        setUploadedImages([...uploadedImages, {
          id: Date.now(),
          url: serverImageUrl,
          name: file.name,
          serverUrl: serverImageUrl
        }])
        setCurrentImageUrl(serverImageUrl)
        console.log('Inserting image with URL:', serverImageUrl)
        insertImage(serverImageUrl)
        toast.success('Image uploaded successfully!')
      } else {
        console.error('Upload failed:', result)
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
    }
  }, [uploadedImages, insertImage])

  const generateVisualHTML = useCallback(() => {
    const sortedElements = [...visualElements].sort((a, b) => a.zIndex - b.zIndex)

    let html = '<div style="position: relative; width: 100%; min-height: 400px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">'

    sortedElements.forEach(element => {
      const baseStyle = `position: absolute; left: ${element.x}px; top: ${element.y}px; z-index: ${element.zIndex}; opacity: ${element.opacity || 1}; transform: rotate(${element.rotation || 0}deg);`

      switch (element.type) {
        case 'image':
          html += `<img src="${element.src}" style="${baseStyle} width: ${element.width}px; height: ${element.height}px; object-fit: cover; border-radius: 4px;" alt="Newsletter Image" />`
          break
        case 'shape':
          const shapeStyle = `${baseStyle} width: ${element.width}px; height: ${element.height}px; background-color: ${element.color}; border: ${element.strokeWidth}px solid ${element.color}; opacity: ${element.opacity};`
          if (element.shape === 'rectangle') {
            html += `<div style="${shapeStyle}"></div>`
          } else if (element.shape === 'circle') {
            html += `<div style="${shapeStyle} border-radius: 50%;"></div>`
          } else if (element.shape === 'triangle') {
            html += `<div style="${baseStyle} width: 0; height: 0; border-left: ${element.width/2}px solid transparent; border-right: ${element.width/2}px solid transparent; border-bottom: ${element.height}px solid ${element.color}; opacity: ${element.opacity};"></div>`
          }
          break
        case 'link':
          const linkStyle = element.style === 'button'
            ? `${baseStyle} display: inline-block; padding: 8px 16px; background-color: ${element.backgroundColor}; color: ${element.textColor}; text-decoration: none; border-radius: 4px; font-size: ${element.fontSize}px; border: none;`
            : `${baseStyle} color: ${element.textColor}; text-decoration: underline; font-size: ${element.fontSize}px;`
          html += `<a href="${element.url}" style="${linkStyle}" target="_blank">${element.text}</a>`
          break
        case 'text':
          const textStyle = `${baseStyle} width: ${element.width}px; height: ${element.height}px; font-size: ${element.fontSize}px; font-weight: ${element.fontWeight}; font-style: ${element.fontStyle}; text-align: ${element.textAlign}; color: ${element.textColor}; background-color: ${element.backgroundColor}; padding: 4px 8px; display: flex; align-items: center;`
          html += `<div style="${textStyle}">${element.text}</div>`
          break
      }
    })

    html += '</div>'
    return html
  }, [visualElements])

  const generatePreviewContent = useCallback(() => {
    const existingContent = currentCampaign.content || ''

    // Return just the existing content - visual elements are handled separately
    return existingContent || '<div style="text-align: center; color: #666; padding: 40px;"><h2>Start creating your newsletter</h2><p>Add content in the editor or use the Visual Editor to create stunning designs!</p></div>'
  }, [currentCampaign.content])

  const syncVisualToContent = useCallback(() => {
    if (visualElements.length === 0) {
      toast.error('No visual elements to sync! Add some images, shapes, or text first.')
      return
    }

    const visualHTML = generateVisualHTML()
    const existingContent = currentCampaign.content || ''

    // Replace or append visual content
    const updatedContent = existingContent.includes('<!-- VISUAL_EDITOR_CONTENT -->')
      ? existingContent.replace(/<!-- VISUAL_EDITOR_CONTENT -->[\s\S]*?<!-- \/VISUAL_EDITOR_CONTENT -->/, `<!-- VISUAL_EDITOR_CONTENT -->\n${visualHTML}\n<!-- /VISUAL_EDITOR_CONTENT -->`)
      : existingContent + `\n\n<!-- VISUAL_EDITOR_CONTENT -->\n${visualHTML}\n<!-- /VISUAL_EDITOR_CONTENT -->`

    setCurrentCampaign({ ...currentCampaign, content: updatedContent })

    toast.success(`🎉 ${visualElements.length} visual elements synced to newsletter! The preview now shows your visual design.`)
  }, [generateVisualHTML, currentCampaign, visualElements])

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        {/* Elite Preview Header */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Elite Preview Mode</h1>
                  <p className="text-gray-300">Multi-device newsletter preview</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Device Preview Toggle */}
                <div className="flex bg-black/50 rounded-xl border border-white/20 p-1">
                  {[
                    { id: 'desktop', icon: Monitor, label: 'Desktop', width: 'max-w-4xl' },
                    { id: 'tablet', icon: Tablet, label: 'Tablet', width: 'max-w-2xl' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile', width: 'max-w-sm' }
                  ].map((device) => (
                    <button
                      key={device.id}
                      onClick={() => setPreviewDevice(device.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${previewDevice === device.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <device.icon className="w-4 h-4 mr-2 inline" />
                      {device.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setPreviewMode(false)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Back to Editor
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center">
            <div className={`${
              previewDevice === 'desktop' ? 'max-w-4xl' :
              previewDevice === 'tablet' ? 'max-w-2xl' : 'max-w-sm'
            } w-full mx-auto transition-all duration-500`}>

              {/* Email Client Mockup */}
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Email Client Header */}
                <div className="bg-black/50 border-b border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-gray-300 text-sm font-semibold">Elite Email Client</div>
                    <div className="text-gray-400 text-sm">{previewDevice}</div>
                  </div>
                </div>

                {/* Email Header */}
                <div className="bg-black/40 border-b border-white/10 p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Subject:</span>
                      <span className="text-green-400 text-sm font-semibold">Priority: {currentCampaign.priority}</span>
                    </div>
                    <div className="text-white font-bold text-lg">{currentCampaign.subject || 'Your Professional Newsletter'}</div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>From: newsletter@sabiteck.com</span>
                      <span>•</span>
                      <span>To: {filterSubscribers().length} recipients</span>
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="p-6 bg-white text-gray-900 min-h-96">
                  {/* Visual Elements Section */}
                  {visualElements.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm text-gray-600 mb-3 font-semibold border-b pb-2">
                        ✨ Visual Elements ({visualElements.length})
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateVisualHTML()
                        }}
                      />
                    </div>
                  )}

                  {/* Regular Content */}
                  <div
                    className="prose max-w-none"
                    style={{ color: '#1f2937' }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(generatePreviewContent() || '<h1>Welcome to our Professional Newsletter</h1><p>Your content will appear here...</p>')
                    }}
                  />
                </div>

                {/* Email Footer */}
                <div className="mt-10 p-8 bg-gray-50 border-t-4 border-blue-500 text-center">
                  <div className="mb-5">
                    <h3 className="text-gray-800 text-lg font-semibold mb-2">Sabiteck Limited</h3>
                    <p className="text-gray-600 text-sm">Professional Newsletter • Bo, Sierra Leone</p>
                  </div>

                  <div className="inline-block bg-white p-4 rounded-lg shadow-sm mb-5">
                    <p className="text-gray-700 text-sm">
                      <strong>📧 Stay Connected:</strong><br />
                      Visit our website: <a href="https://sabiteck.com" className="text-blue-600 hover:underline no-underline">sabiteck.com</a><br />
                      Contact us: info@sabiteck.com
                    </p>
                  </div>

                  <div className="border-t border-gray-300 pt-5">
                    <p className="text-gray-500 text-xs mb-3">
                      <a href="#" className="text-blue-600 hover:underline mx-2">Unsubscribe</a> |
                      <a href="#" className="text-blue-600 hover:underline mx-2">Manage Preferences</a> |
                      <a href="#" className="text-blue-600 hover:underline mx-2">View Online</a>
                    </p>
                    <p className="text-gray-400 text-xs">
                      © {new Date().getFullYear()} Sabiteck Limited. All rights reserved.<br />
                      You received this email because you subscribed to our newsletter.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Analytics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">98.2%</div>
                  <div className="text-sm text-gray-300">Deliverability Score</div>
                </div>
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">24.5%</div>
                  <div className="text-sm text-gray-300">Expected Open Rate</div>
                </div>
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">8.5/10</div>
                  <div className="text-sm text-gray-300">Content Quality</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Elite Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                  <div className="relative p-2 md:p-3 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                    <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                    Elite Newsletter Studio
                  </h1>
                  <p className="text-gray-300 text-xs md:text-sm">Professional-grade email marketing platform</p>
                </div>
              </div>
            </div>

            {/* Elite Navigation */}
            <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'composer', label: 'Composer', icon: Edit, gradient: 'from-violet-500 to-purple-500' },
                { id: 'content', label: 'Content', icon: FileText, gradient: 'from-emerald-500 to-teal-500' },
                { id: 'campaigns', label: 'Campaigns', icon: Mail, gradient: 'from-blue-500 to-indigo-500' },
                { id: 'audience', label: 'Audience', icon: Users, gradient: 'from-green-500 to-emerald-500' },
                { id: 'templates', label: 'Templates', icon: Wand2, gradient: 'from-orange-500 to-red-500' },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp, gradient: 'from-pink-500 to-rose-500' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    group relative px-3 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 whitespace-nowrap
                    ${activeView === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-2xl shadow-${tab.gradient.split('-')[1]}-500/25`
                      : 'bg-black/30 backdrop-blur-lg text-gray-300 border border-white/20 hover:bg-black/40 hover:border-white/30'
                    }
                  `}
                >
                  <div className="flex items-center space-x-1 md:space-x-2 relative z-10">
                    <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm font-bold hidden sm:inline">{tab.label}</span>
                  </div>
                  {activeView === tab.id && (
                    <div className={`absolute -inset-1 bg-gradient-to-r ${tab.gradient} rounded-xl blur opacity-50 animate-pulse`}></div>
                  )}
                </button>
              ))}

              {/* Settings & Tools */}
              <div className="flex items-center space-x-2 lg:ml-4 lg:pl-4 lg:border-l border-white/20">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 bg-black/30 backdrop-blur-lg rounded-lg border border-white/20 hover:bg-black/40 transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
                <button
                  onClick={() => setAiAssistant(!aiAssistant)}
                  className={`p-2 rounded-lg border transition-all ${aiAssistant
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400'
                    : 'bg-black/30 backdrop-blur-lg border-white/20 hover:bg-black/40'
                  }`}
                  title="AI Writing Assistant"
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elite Composer Interface */}
      {activeView === 'composer' && (
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full">
            {/* Main Editor */}
            <div className="xl:col-span-3 space-y-6">
              {/* Campaign Settings Card */}
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl">
                      <Edit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Campaign Composer</h2>
                      <p className="text-gray-300">Create professional email campaigns</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full text-xs font-black">
                      ELITE
                    </span>
                    <div className="flex items-center text-green-400">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">Auto-Save Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Campaign Name</label>
                      <Input
                        value={currentCampaign.name}
                        onChange={(e) => setCurrentCampaign({...currentCampaign, name: e.target.value})}
                        placeholder="Professional Campaign Title"
                        className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Priority Level</label>
                      <select
                        value={currentCampaign.priority}
                        onChange={(e) => setCurrentCampaign({...currentCampaign, priority: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-purple-400"
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Subject Line</label>
                      <Input
                        value={currentCampaign.subject}
                        onChange={(e) => setCurrentCampaign({...currentCampaign, subject: e.target.value})}
                        placeholder="Compelling subject line..."
                        className="bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Send Schedule</label>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setScheduledSend(false)}
                            className={`px-4 py-3 rounded-xl font-semibold transition-all ${!scheduledSend
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-black/50 border border-white/20 text-gray-300'
                            }`}
                          >
                            Send Now
                          </button>
                          <button
                            onClick={() => setScheduledSend(true)}
                            className={`px-4 py-3 rounded-xl font-semibold transition-all ${scheduledSend
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                              : 'bg-black/50 border border-white/20 text-gray-300'
                            }`}
                          >
                            Schedule
                          </button>
                        </div>

                        {/* DateTime Picker when scheduling is enabled */}
                        {scheduledSend && (
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-300">Schedule Date & Time</label>
                            <input
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-blue-400 transition-all"
                            />
                            {scheduledDateTime && (
                              <div className="text-xs text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg">
                                📅 Scheduled for: {new Date(scheduledDateTime).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elite Editor Interface */}
                <div className="space-y-6">
                  {/* Editor Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex bg-black/50 rounded-xl border border-white/20 p-1">
                        <button
                          onClick={() => setEditorMode('visual')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${editorMode === 'visual'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          <Type className="w-4 h-4 mr-2 inline" />
                          Rich Text
                        </button>
                        <button
                          onClick={() => setEditorMode('enhanced')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${editorMode === 'enhanced'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          <Paintbrush className="w-4 h-4 mr-2 inline" />
                          Visual Editor
                        </button>
                        <button
                          onClick={() => setEditorMode('code')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${editorMode === 'code'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          <Code className="w-4 h-4 mr-2 inline" />
                          HTML
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Last saved: Just now</span>
                      </div>
                    </div>

                    {/* Preview Controls */}
                    <div className="flex items-center space-x-2">
                      <div className="flex bg-black/50 rounded-xl border border-white/20 p-1">
                        {[
                          { id: 'desktop', icon: Monitor, label: 'Desktop' },
                          { id: 'tablet', icon: Tablet, label: 'Tablet' },
                          { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                        ].map((device) => (
                          <button
                            key={device.id}
                            onClick={() => setPreviewDevice(device.id)}
                            className={`p-2 rounded-lg transition-all ${previewDevice === device.id
                              ? 'bg-white/20 text-white'
                              : 'text-gray-400 hover:text-white'
                            }`}
                            title={device.label}
                          >
                            <device.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={() => setPreviewMode(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  {/* Elite Advanced Toolbar */}
                  <div className="bg-gradient-to-r from-black/40 to-black/60 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
                    <div className="space-y-4">
                      {/* Toolbar Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                            <Wand2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold">Professional Editing Suite</h4>
                            <p className="text-gray-300 text-xs">Advanced formatting and content tools</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-black rounded-full text-xs font-black">
                            PRO
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center space-x-4">
                          {/* Text Formatting Group */}
                          <div className="bg-black/50 rounded-xl border border-white/20 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400 px-2">Text</span>
                              {[
                                { icon: Bold, label: 'Bold', shortcut: '⌘B', action: () => insertPlaceholder('<strong>') },
                                { icon: Italic, label: 'Italic', shortcut: '⌘I', action: () => insertPlaceholder('<em>') },
                                { icon: Underline, label: 'Underline', shortcut: '⌘U', action: () => insertPlaceholder('<u>') }
                              ].map((tool, index) => (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={tool.action}
                                    className="p-2.5 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded-lg transition-all transform hover:scale-105"
                                    title={tool.label}
                                  >
                                    <tool.icon className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {tool.label} ({tool.shortcut})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Layout Group */}
                          <div className="bg-black/50 rounded-xl border border-white/20 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400 px-2">Layout</span>
                              {[
                                { icon: AlignLeft, label: 'Align Left', action: () => insertPlaceholder('<div style="text-align: left;">') },
                                { icon: AlignCenter, label: 'Align Center', action: () => insertPlaceholder('<div style="text-align: center;">') },
                                { icon: AlignRight, label: 'Align Right', action: () => insertPlaceholder('<div style="text-align: right;">') }
                              ].map((tool, index) => (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={tool.action}
                                    className="p-2.5 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-all transform hover:scale-105"
                                    title={tool.label}
                                  >
                                    <tool.icon className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {tool.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Content Elements Group */}
                          <div className="bg-black/50 rounded-xl border border-white/20 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400 px-2">Elements</span>
                              {[
                                { icon: Image, label: 'Insert Image', color: 'from-pink-500/20 to-rose-500/20', action: editorMode === 'enhanced' ? () => setShowImageUploader(true) : () => insertPlaceholder('IMAGE_URL') },
                                { icon: Link, label: 'Insert Link', color: 'from-blue-500/20 to-cyan-500/20', action: editorMode === 'enhanced' ? () => setShowLinkEditor(true) : () => insertPlaceholder('LINK_URL') },
                                { icon: List, label: 'Insert List', color: 'from-orange-500/20 to-red-500/20' },
                                { icon: Hash, label: 'Insert Variable', color: 'from-purple-500/20 to-violet-500/20', action: () => insertPlaceholder('SUBSCRIBER_NAME') }
                              ].map((tool, index) => (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={tool.action}
                                    className={`p-2.5 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:${tool.color} rounded-lg transition-all transform hover:scale-105`}
                                    title={tool.label}
                                  >
                                    <tool.icon className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {tool.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Professional Templates */}
                          <div className="bg-black/50 rounded-xl border border-white/20 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400 px-2">Pro</span>
                              {[
                                { icon: Palette, label: 'Color Schemes', color: 'from-indigo-500/20 to-purple-500/20', action: () => setShowColorSchemes(true) },
                                { icon: Settings, label: 'Advanced Settings', color: 'from-gray-500/20 to-slate-500/20', action: () => setShowAdvancedSettings(true) }
                              ].map((tool, index) => (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={tool.action}
                                    className={`p-2.5 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:${tool.color} rounded-lg transition-all transform hover:scale-105`}
                                    title={tool.label}
                                  >
                                    <tool.icon className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {tool.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* AI Assistant & Status */}
                        <div className="flex items-center space-x-4">
                          {/* Undo/Redo */}
                          <div className="flex bg-black/50 rounded-lg border border-white/20">
                            <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-l transition-all" title="Undo (⌘Z)">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-r transition-all" title="Redo (⌘⇧Z)">
                              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                            </button>
                          </div>

                          {/* AI Assistant Status */}
                          {aiAssistant && (
                            <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl border border-purple-400/30 px-4 py-2.5">
                              <div className="relative">
                                <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                              </div>
                              <div>
                                <div className="text-purple-200 text-sm font-bold">AI Assistant</div>
                                <div className="text-purple-300 text-xs">Ready to help</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Visual Editing Toolbar */}
                  {editorMode === 'enhanced' && (
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl border border-cyan-400/30 p-6 shadow-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                              <Paintbrush className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold">Visual Editing Suite</h4>
                              <p className="text-gray-300 text-xs">Drag, drop, and design with precision</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-black rounded-full text-xs font-black">
                              ENHANCED
                            </span>
                            <button
                              onClick={syncVisualToContent}
                              className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                            >
                              Sync to Newsletter
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                          {/* Visual Edit Mode */}
                          <div className="bg-black/50 rounded-xl border border-cyan-400/30 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-cyan-300 px-2">Mode</span>
                              {[
                                { id: 'select', icon: MousePointer, label: 'Select' },
                                { id: 'draw', icon: PenTool, label: 'Draw Shapes' },
                                { id: 'image', icon: Image, label: 'Add Images' },
                                { id: 'text', icon: Type, label: 'Add Text' }
                              ].map((mode) => (
                                <button
                                  key={mode.id}
                                  onClick={() => setVisualEditMode(mode.id)}
                                  className={`p-2 rounded-lg transition-all ${visualEditMode === mode.id
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                                  }`}
                                  title={mode.label}
                                >
                                  <mode.icon className="w-4 h-4" />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Shape Tools */}
                          {visualEditMode === 'draw' && (
                            <div className="bg-black/50 rounded-xl border border-cyan-400/30 p-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-cyan-300 px-2">Shapes</span>
                                {[
                                  { shape: 'rectangle', icon: Square, label: 'Rectangle' },
                                  { shape: 'circle', icon: Circle, label: 'Circle' },
                                  { shape: 'triangle', icon: Triangle, label: 'Triangle' }
                                ].map((shape) => (
                                  <button
                                    key={shape.shape}
                                    onClick={() => insertShape(shape.shape)}
                                    className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-lg transition-all"
                                    title={shape.label}
                                  >
                                    <shape.icon className="w-4 h-4" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Text Formatting Controls */}
                          {selectedElement && selectedElement.type === 'text' && (
                            <div className="bg-black/50 rounded-xl border border-green-400/30 p-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-green-300 px-2">Text</span>
                                <button
                                  onClick={() => {
                                    setEditingTextId(selectedElement.id)
                                    setEditingText(selectedElement.text)
                                  }}
                                  className="p-2 text-gray-300 hover:text-white hover:bg-green-500/20 rounded-lg transition-all"
                                  title="Edit Text"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateElement(selectedElement.id, {
                                    fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                                  })}
                                  className={`p-2 rounded-lg transition-all ${
                                    selectedElement.fontWeight === 'bold'
                                      ? 'bg-green-500 text-white'
                                      : 'text-gray-300 hover:text-white hover:bg-green-500/20'
                                  }`}
                                  title="Bold"
                                >
                                  <Bold className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateElement(selectedElement.id, {
                                    fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic'
                                  })}
                                  className={`p-2 rounded-lg transition-all ${
                                    selectedElement.fontStyle === 'italic'
                                      ? 'bg-green-500 text-white'
                                      : 'text-gray-300 hover:text-white hover:bg-green-500/20'
                                  }`}
                                  title="Italic"
                                >
                                  <Italic className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                                  className={`p-2 rounded-lg transition-all ${
                                    selectedElement.textAlign === 'left'
                                      ? 'bg-green-500 text-white'
                                      : 'text-gray-300 hover:text-white hover:bg-green-500/20'
                                  }`}
                                  title="Align Left"
                                >
                                  <AlignLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                                  className={`p-2 rounded-lg transition-all ${
                                    selectedElement.textAlign === 'center'
                                      ? 'bg-green-500 text-white'
                                      : 'text-gray-300 hover:text-white hover:bg-green-500/20'
                                  }`}
                                  title="Align Center"
                                >
                                  <AlignCenter className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                                  className={`p-2 rounded-lg transition-all ${
                                    selectedElement.textAlign === 'right'
                                      ? 'bg-green-500 text-white'
                                      : 'text-gray-300 hover:text-white hover:bg-green-500/20'
                                  }`}
                                  title="Align Right"
                                >
                                  <AlignRight className="w-4 h-4" />
                                </button>
                                <input
                                  type="color"
                                  value={selectedElement.textColor}
                                  onChange={(e) => updateElement(selectedElement.id, { textColor: e.target.value })}
                                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                                  title="Text Color"
                                />
                                <select
                                  value={selectedElement.fontSize}
                                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                  className="px-2 py-1 bg-black/50 border border-white/20 text-white text-xs rounded cursor-pointer"
                                  title="Font Size"
                                >
                                  <option value="12">12px</option>
                                  <option value="14">14px</option>
                                  <option value="16">16px</option>
                                  <option value="18">18px</option>
                                  <option value="20">20px</option>
                                  <option value="24">24px</option>
                                  <option value="28">28px</option>
                                  <option value="32">32px</option>
                                  <option value="36">36px</option>
                                  <option value="48">48px</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Layer Controls */}
                          {selectedElement && (
                            <div className="bg-black/50 rounded-xl border border-cyan-400/30 p-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-cyan-300 px-2">Layer</span>
                                <button
                                  onClick={() => changeLayer(selectedElement.id, 'front')}
                                  className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-all"
                                  title="Bring to Front"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => changeLayer(selectedElement.id, 'back')}
                                  className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20 rounded-lg transition-all"
                                  title="Send to Back"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteElement(selectedElement.id)}
                                  className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                  title="Delete Element"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Position Controls */}
                          {selectedElement && (
                            <div className="bg-black/50 rounded-xl border border-cyan-400/30 p-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-cyan-300 px-2">Move</span>
                                <div className="grid grid-cols-3 gap-1">
                                  <div></div>
                                  <button
                                    onClick={() => moveElement(selectedElement.id, 'up')}
                                    className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <div></div>
                                  <button
                                    onClick={() => moveElement(selectedElement.id, 'left')}
                                    className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                                    title="Move Left"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <div className="w-5 h-5 bg-cyan-500/30 rounded"></div>
                                  <button
                                    onClick={() => moveElement(selectedElement.id, 'right')}
                                    className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                                    title="Move Right"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                  <div></div>
                                  <button
                                    onClick={() => moveElement(selectedElement.id, 'down')}
                                    className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <div></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="bg-black/50 rounded-xl border border-cyan-400/30 p-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-cyan-300 px-2">Quick</span>
                              <button
                                onClick={() => setShowImageUploader(true)}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-rose-500/20 rounded-lg transition-all"
                                title="Add Image"
                              >
                                <ImagePlus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowLinkEditor(true)}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-indigo-500/20 rounded-lg transition-all"
                                title="Add Link"
                              >
                                <Link className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => insertText('Your text here')}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-all"
                                title="Add Text"
                              >
                                <Type className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setVisualElements([])}
                                className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                title="Clear All"
                              >
                                <Eraser className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Element Count */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{visualElements.length} visual elements</span>
                          {selectedElement && (
                            <span className="text-cyan-300">
                              Selected: {selectedElement.type} #{selectedElement.id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Elite Content Editor */}
                  <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    {/* Editor Header */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Type className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">Elite Content Editor</h3>
                            <p className="text-gray-300 text-xs">Professional newsletter composition</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-300">
                            {currentCampaign.content.length} characters
                          </span>
                          <div className="flex items-center text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            <span className="text-xs">Live Preview</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Split View Container */}
                    <div className="flex" style={{height: 'calc(100vh - 350px)', minHeight: '600px'}}>
                      {/* Content Input Area */}
                      <div className="flex-1 relative">
                        {editorMode === 'enhanced' ? (
                          /* Enhanced Visual Canvas */
                          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-auto">
                            {/* Canvas Grid Background */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="w-full h-full bg-repeat bg-[length:20px_20px]"
                                   style={{
                                     backgroundImage: `radial-gradient(circle at 10px 10px, cyan 1px, transparent 1px)`
                                   }}>
                              </div>
                            </div>

                            {/* Visual Elements Canvas */}
                            <div className="relative p-4" style={{width: '1200px', height: '800px', minWidth: '100%'}} ref={canvasRef}>
                              {/* Canvas Info */}
                              <div className="absolute top-2 left-2 text-xs text-cyan-300 bg-black/50 px-2 py-1 rounded">
                                Canvas: {canvasSize.width} × {canvasSize.height}
                              </div>

                              {/* Render Visual Elements */}
                              {visualElements.map((element) => (
                                <div
                                  key={element.id}
                                  className={`absolute cursor-pointer transition-all hover:ring-2 hover:ring-cyan-400 ${
                                    selectedElement?.id === element.id ? 'ring-2 ring-cyan-400' : ''
                                  }`}
                                  style={{
                                    left: element.x,
                                    top: element.y,
                                    width: element.width,
                                    height: element.height,
                                    zIndex: element.zIndex,
                                    opacity: element.opacity || 1,
                                    transform: `rotate(${element.rotation || 0}deg)`
                                  }}
                                  onClick={() => setSelectedElement(element)}
                                >
                                  {element.type === 'image' && (
                                    <img
                                      src={element.src}
                                      alt="Newsletter Element"
                                      className="w-full h-full object-cover rounded border-2 border-transparent hover:border-cyan-400"
                                      draggable={false}
                                      onLoad={() => console.log('Image loaded successfully:', element.src)}
                                      onError={(e) => {
                                        console.error('Image failed to load:', element.src)
                                        e.target.style.backgroundColor = '#ef4444'
                                        e.target.style.color = 'white'
                                        e.target.style.display = 'flex'
                                        e.target.style.alignItems = 'center'
                                        e.target.style.justifyContent = 'center'
                                        e.target.innerHTML = '❌ Image failed to load'
                                      }}
                                    />
                                  )}
                                  {element.type === 'shape' && (
                                    <div
                                      className="w-full h-full border-2 border-transparent hover:border-cyan-400"
                                      style={{
                                        backgroundColor: element.color,
                                        borderRadius: element.shape === 'circle' ? '50%' : element.shape === 'triangle' ? '0' : '4px',
                                        opacity: element.opacity
                                      }}
                                    />
                                  )}
                                  {element.type === 'link' && (
                                    <div
                                      className={`w-full h-full flex items-center justify-center text-sm font-semibold rounded border-2 border-transparent hover:border-cyan-400 ${
                                        element.style === 'button' ? 'px-4 py-2' : ''
                                      }`}
                                      style={{
                                        backgroundColor: element.backgroundColor,
                                        color: element.textColor,
                                        fontSize: element.fontSize
                                      }}
                                    >
                                      {element.text}
                                    </div>
                                  )}
                                  {element.type === 'text' && (
                                    <div
                                      className={`w-full h-full flex items-center border-2 transition-all duration-300 group ${
                                        editingTextId === element.id
                                          ? 'border-cyan-400 bg-cyan-500/20 shadow-lg'
                                          : selectedElement?.id === element.id
                                          ? 'border-green-400 bg-green-500/10 shadow-md'
                                          : 'border-transparent hover:border-cyan-300 hover:bg-cyan-500/5'
                                      } cursor-text`}
                                      style={{
                                        fontSize: element.fontSize,
                                        fontWeight: element.fontWeight,
                                        fontStyle: element.fontStyle,
                                        textAlign: element.textAlign,
                                        color: element.textColor,
                                        backgroundColor: editingTextId === element.id ? 'rgba(6, 182, 212, 0.1)' : element.backgroundColor,
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        minHeight: '32px'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (selectedElement?.id === element.id && editingTextId !== element.id) {
                                          setEditingTextId(element.id)
                                          setEditingText(element.text)
                                        }
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation()
                                        setEditingTextId(element.id)
                                        setEditingText(element.text)
                                      }}
                                    >
                                      {/* Edit hint */}
                                      {selectedElement?.id === element.id && editingTextId !== element.id && (
                                        <div className="absolute -top-8 left-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                          Click to edit text
                                        </div>
                                      )}

                                      {editingTextId === element.id ? (
                                        <>
                                          {/* Floating Text Toolbar */}
                                          <div className="absolute -top-12 left-0 bg-black/90 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-2 flex items-center space-x-1 z-50 shadow-2xl">
                                            <button
                                              onClick={() => updateElement(element.id, {
                                                fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold'
                                              })}
                                              className={`p-1 rounded transition-all ${
                                                element.fontWeight === 'bold'
                                                  ? 'bg-cyan-500 text-white'
                                                  : 'text-gray-300 hover:text-white hover:bg-cyan-500/20'
                                              }`}
                                              title="Bold"
                                            >
                                              <Bold className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => updateElement(element.id, {
                                                fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic'
                                              })}
                                              className={`p-1 rounded transition-all ${
                                                element.fontStyle === 'italic'
                                                  ? 'bg-cyan-500 text-white'
                                                  : 'text-gray-300 hover:text-white hover:bg-cyan-500/20'
                                              }`}
                                              title="Italic"
                                            >
                                              <Italic className="w-3 h-3" />
                                            </button>
                                            <div className="w-px h-4 bg-gray-600 mx-1"></div>
                                            {[
                                              { align: 'left', icon: AlignLeft },
                                              { align: 'center', icon: AlignCenter },
                                              { align: 'right', icon: AlignRight }
                                            ].map((alignment) => (
                                              <button
                                                key={alignment.align}
                                                onClick={() => updateElement(element.id, {
                                                  textAlign: alignment.align
                                                })}
                                                className={`p-1 rounded transition-all ${
                                                  element.textAlign === alignment.align
                                                    ? 'bg-cyan-500 text-white'
                                                    : 'text-gray-300 hover:text-white hover:bg-cyan-500/20'
                                                }`}
                                                title={`Align ${alignment.align}`}
                                              >
                                                <alignment.icon className="w-3 h-3" />
                                              </button>
                                            ))}
                                            <div className="w-px h-4 bg-gray-600 mx-1"></div>
                                            <input
                                              type="range"
                                              min="12"
                                              max="48"
                                              value={element.fontSize || 16}
                                              onChange={(e) => updateElement(element.id, {
                                                fontSize: parseInt(e.target.value)
                                              })}
                                              className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                              title="Font Size"
                                            />
                                            <span className="text-xs text-cyan-300 min-w-[24px]">{element.fontSize || 16}</span>
                                          </div>

                                          <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            onBlur={(e) => {
                                              // Add a small delay to allow toolbar interactions
                                              setTimeout(() => {
                                                updateElement(element.id, { text: editingText })
                                                setEditingTextId(null)
                                              }, 150)
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                updateElement(element.id, { text: editingText })
                                                setEditingTextId(null)
                                              }
                                              if (e.key === 'Escape') {
                                                setEditingTextId(null)
                                              }
                                            }}
                                            className="w-full bg-transparent border-none outline-none resize-none selection:bg-cyan-400/30"
                                            style={{
                                              fontSize: 'inherit',
                                              fontWeight: 'inherit',
                                              fontStyle: 'inherit',
                                              textAlign: 'inherit',
                                              color: element.textColor,
                                              fontFamily: 'inherit',
                                              lineHeight: 'inherit',
                                              minHeight: '24px'
                                            }}
                                            autoFocus
                                            rows={1}
                                            onInput={(e) => {
                                              e.target.style.height = 'auto'
                                              e.target.style.height = e.target.scrollHeight + 'px'
                                            }}
                                            placeholder="Enter your text..."
                                          />
                                        </>
                                      ) : (
                                        <div className="w-full break-words">
                                          {element.text || 'Click to edit text'}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Enhanced Selection & Resize Handles */}
                                  {selectedElement?.id === element.id && (
                                    <>
                                      {/* Corner Resize Handles */}
                                      <div
                                        className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full cursor-nw-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('nw')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full cursor-ne-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('ne')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full cursor-sw-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('sw')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full cursor-se-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('se')
                                        }}
                                      ></div>

                                      {/* Edge Resize Handles */}
                                      <div
                                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-cyan-400 rounded cursor-n-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('n')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-cyan-400 rounded cursor-s-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('s')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-cyan-400 rounded cursor-w-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('w')
                                        }}
                                      ></div>
                                      <div
                                        className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-3 bg-cyan-400 rounded cursor-e-resize hover:bg-cyan-300 transition-colors"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          setResizeMode(true)
                                          setResizeHandle('e')
                                        }}
                                      ></div>

                                      {/* Element Info Display */}
                                      <div className="absolute -top-8 left-0 bg-cyan-400 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                                        {element.width}×{element.height}px
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}

                              {/* Drop Zone Indicators */}
                              {visualEditMode === 'image' && (
                                <div className="absolute inset-4 border-2 border-dashed border-cyan-400/50 rounded-lg flex items-center justify-center bg-cyan-500/10">
                                  <div className="text-center text-cyan-300">
                                    <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Click to add image or use toolbar</p>
                                  </div>
                                </div>
                              )}

                              {visualEditMode === 'text' && (
                                <div
                                  className="absolute inset-4 border-2 border-dashed border-green-400/50 rounded-lg flex items-center justify-center bg-green-500/10 cursor-crosshair"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const x = e.clientX - rect.left
                                    const y = e.clientY - rect.top
                                    insertText('Click to edit text', { x, y })
                                  }}
                                >
                                  <div className="text-center text-green-300">
                                    <Type className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Click anywhere to add text</p>
                                  </div>
                                </div>
                              )}

                              {/* Empty State */}
                              {visualElements.length === 0 && visualEditMode === 'select' && (
                                <div className="absolute inset-4 flex items-center justify-center">
                                  <div className="text-center text-gray-400">
                                    <Paintbrush className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Visual Editor Canvas</h3>
                                    <p className="text-sm mb-4">Use the toolbar above to add images, shapes, and links</p>
                                    <div className="text-xs text-gray-500">
                                      <p>• Switch to 'Draw Shapes' mode to add shapes</p>
                                      <p>• Use 'Add Images' to insert pictures</p>
                                      <p>• Click elements to select and move them</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Regular Text Editor */
                          <>
                            {/* Editor Background Pattern */}
                            <div className="absolute inset-0 opacity-5">
                              <div className="w-full h-full bg-repeat bg-[length:20px_20px]"
                                   style={{
                                     backgroundImage: `radial-gradient(circle at 10px 10px, white 1px, transparent 1px)`
                                   }}>
                              </div>
                            </div>

                            {/* Line Numbers */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-black/30 border-r border-white/10 flex flex-col text-gray-500 text-xs font-mono">
                              {Array.from({ length: 20 }, (_, i) => (
                                <div key={i + 1} className="h-6 flex items-center justify-center">
                                  {i + 1}
                                </div>
                              ))}
                            </div>

                            {/* Main Editor */}
                            <textarea
                              value={currentCampaign.content}
                              onChange={(e) => setCurrentCampaign({...currentCampaign, content: e.target.value})}
                              className="w-full h-full pl-20 pr-6 py-6 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none font-mono leading-6 relative z-10"
                              placeholder={editorMode === 'visual'
                                ? `✨ Start crafting your professional newsletter...

🎯 Pro Tips:
• Use compelling headlines to grab attention
• Keep paragraphs short and scannable
• Include clear call-to-action buttons
• Personalize with [SUBSCRIBER_NAME]
• Add value with exclusive content

Type here to begin your elite newsletter...`
                                : `<!-- Elite HTML Email Template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Newsletter</title>
</head>
<body>
    <!-- Your professional HTML content here -->

</body>
</html>`
                              }
                              style={{ fontSize: '14px', lineHeight: '24px' }}
                            />

                            {/* Floating Action Button */}
                            {aiAssistant && (
                              <div className="absolute bottom-4 right-4">
                                <button className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl hover:scale-110 transition-transform group">
                                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                  <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    AI Assist
                                  </div>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Live Preview Panel */}
                      <div className="w-1/2 border-l border-white/10 bg-black/20">
                        <div className="h-full flex flex-col">
                          {/* Preview Header */}
                          <div className="bg-black/30 border-b border-white/10 p-3">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-cyan-400" />
                              <span className="text-white font-semibold text-sm">Live Preview</span>
                              <div className="ml-auto flex space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-300">Real-time</span>
                              </div>
                            </div>
                          </div>

                          {/* Preview Content */}
                          <div className="flex-1 overflow-auto p-4">
                            <div className="bg-white rounded-lg shadow-lg min-h-full">
                              {/* Email Preview Container */}
                              <div className="p-6">
                                {currentCampaign.content || visualElements.length > 0 ? (
                                  <div>
                                    {/* Visual Elements Preview */}
                                    {editorMode === 'enhanced' && visualElements.length > 0 && (
                                      <div className="mb-6">
                                        <div className="text-sm text-gray-600 mb-2 font-semibold">
                                          ✨ Visual Elements ({visualElements.length})
                                        </div>
                                        <div
                                          dangerouslySetInnerHTML={{
                                            __html: generateVisualHTML()
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* Regular Content Preview */}
                                    <div
                                      className="prose prose-sm max-w-none text-gray-800"
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHTML(generatePreviewContent().replace(/\[SUBSCRIBER_NAME\]/g, 'John Doe'))
                                      }}
                                    />

                                    {/* Newsletter Footer Preview */}
                                    <div className="mt-8 p-6 bg-gray-50 border-t-4 border-blue-500 text-center text-sm">
                                      <div className="mb-4">
                                        <h4 className="text-gray-800 font-semibold mb-1">Sabiteck Limited</h4>
                                        <p className="text-gray-600 text-xs">Professional Newsletter • Bo, Sierra Leone</p>
                                      </div>

                                      <div className="inline-block bg-white p-3 rounded shadow-sm mb-4">
                                        <p className="text-gray-700 text-xs">
                                          <strong>📧 Stay Connected:</strong><br />
                                          Website: <a href="#" className="text-blue-600">sabiteck.com</a><br />
                                          Email: info@sabiteck.com
                                        </p>
                                      </div>

                                      <div className="border-t border-gray-300 pt-3">
                                        <p className="text-gray-500 text-xs mb-2">
                                          <a href="#" className="text-blue-600 mx-1">Unsubscribe</a> |
                                          <a href="#" className="text-blue-600 mx-1">Preferences</a> |
                                          <a href="#" className="text-blue-600 mx-1">Online</a>
                                        </p>
                                        <p className="text-gray-400" style={{fontSize: '10px'}}>
                                          © 2025 Sabiteck Limited. All rights reserved.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-12 text-gray-400">
                                    <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-semibold">Start creating your newsletter</p>
                                    <p className="text-sm">Add content in the editor or create visual elements!</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Preview Analytics */}
                          <div className="bg-black/30 border-t border-white/10 p-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="text-center">
                                <div className="text-green-400 font-bold">
                                  {Math.max(1, Math.ceil(currentCampaign.content.length / 100))}min
                                </div>
                                <div className="text-gray-400">Read Time</div>
                              </div>
                              <div className="text-center">
                                <div className="text-blue-400 font-bold">
                                  {currentCampaign.content.split(/\s+/).filter(word => word.length > 0).length}
                                </div>
                                <div className="text-gray-400">Words</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Editor Footer */}
                    <div className="bg-gradient-to-r from-black/30 to-black/50 border-t border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        {/* Quick Insert Buttons */}
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300 text-sm font-semibold">Quick Insert:</span>
                          {[
                            { label: 'Header', value: '<h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin-bottom: 16px;">Your Header</h1>', icon: Hash },
                            { label: 'Button', value: '<a href="#" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Call to Action</a>', icon: Target },
                            { label: 'Divider', value: '<hr style="border: none; height: 2px; background: linear-gradient(90deg, #e5e7eb, #9ca3af, #e5e7eb); margin: 32px 0;">', icon: Minus },
                            { label: 'Image', value: '<img src="[IMAGE_URL]" alt="Professional Image" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin: 16px 0;">', icon: Image }
                          ].map((item, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentCampaign({
                                ...currentCampaign,
                                content: currentCampaign.content + '\n\n' + item.value
                              })}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-xs text-white font-medium"
                            >
                              <item.icon className="w-3 h-3" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Editor Status */}
                        <div className="flex items-center space-x-4 text-xs text-gray-300">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Auto-saved</span>
                          </div>
                          <div>
                            Lines: {currentCampaign.content.split('\n').length}
                          </div>
                          <div>
                            Mode: <span className="text-purple-300 font-semibold">{editorMode}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={saveCampaign}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 py-3"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save Draft
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-white/10 font-semibold px-6"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-300">Recipients: <span className="font-bold text-white">{filterSubscribers().length}</span></div>
                        <div className="text-xs text-gray-400">Estimated reach: {Math.round(filterSubscribers().length * 0.85)}</div>
                      </div>
                      <Button
                        onClick={sendNewsletter}
                        disabled={loading || !currentCampaign.subject || !currentCampaign.content}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-8 py-3 shadow-2xl"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        {scheduledSend ? 'Schedule Send' : 'Send Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Elite Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-400" />
                  Campaign Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Expected Open Rate</span>
                    <span className="text-green-400 font-bold">24.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Subject Score</span>
                    <span className="text-yellow-400 font-bold">8.5/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Deliverability</span>
                    <span className="text-green-400 font-bold">98.2%</span>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiAssistant && (
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400 animate-pulse" />
                    AI Suggestions
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">💡 Try adding urgency to your subject line</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">📊 Include a clear call-to-action button</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">🎯 Personalize with subscriber names</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Elite Templates */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-orange-400" />
                  Elite Templates
                </h3>
                <div className="space-y-3">
                  {templates.slice(0, 3).map(template => (
                    <div key={template.id} className="bg-black/40 rounded-lg p-3 hover:bg-black/60 transition-all cursor-pointer">
                      <h4 className="font-semibold text-white text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{template.template_type}</p>
                      <Button
                        size="sm"
                        onClick={() => useFileText(template)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs px-3 py-1"
                      >
                        Apply Template
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Targeting */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-400" />
                  Elite Targeting
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Segment</label>
                    <select
                      value={subscriberFilters.segment}
                      onChange={(e) => setSubscriberFilters({...subscriberFilters, segment: e.target.value})}
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 text-white rounded-lg text-sm"
                    >
                      <option value="all">All Subscribers</option>
                      <option value="vip">VIP Clients</option>
                      <option value="active">High Engagement</option>
                      <option value="new">New Subscribers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Engagement Level</label>
                    <select
                      value={subscriberFilters.engagement}
                      onChange={(e) => setSubscriberFilters({...subscriberFilters, engagement: e.target.value})}
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 text-white rounded-lg text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="high">Premium Tier</option>
                      <option value="medium">Standard Tier</option>
                      <option value="low">Basic Tier</option>
                    </select>
                  </div>
                  <div className="pt-2 bg-green-500/10 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-200">Selected Audience:</span>
                      <span className="font-bold text-green-400">{filterSubscribers().length} recipients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elite Content Management Interface */}
      {activeView === 'content' && (
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Content Header */}
            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-75 animate-pulse"></div>
                    <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                      <BookOpen className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                      Elite Content Studio
                    </h1>
                    <p className="text-gray-300 text-lg">Professional content creation and management platform</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-full text-sm font-black">
                    CONTENT PRO
                  </span>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-6">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Content
                  </Button>
                </div>
              </div>

              {/* Content Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Content', value: '247', icon: FileText, color: 'emerald', trend: '+12%' },
                  { label: 'Published', value: '189', icon: CheckCircle2, color: 'green', trend: '+8%' },
                  { label: 'Draft', value: '43', icon: Edit, color: 'yellow', trend: '+5%' },
                  { label: 'Archived', value: '15', icon: Archive, color: 'gray', trend: '-2%' }
                ].map((stat, index) => (
                  <div key={index} className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-6 group hover:scale-105 transition-all duration-300">
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
            </div>

            {/* Content Management Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Main Content Area */}
              <div className="xl:col-span-3 space-y-6">
                {/* Content Filters & Search */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={contentFilters.search}
                          onChange={(e) => setContentFilters({...contentFilters, search: e.target.value})}
                          placeholder="Search content..."
                          className="pl-10 bg-black/50 border-white/20 text-white placeholder-gray-400 rounded-xl w-64"
                        />
                      </div>

                      {/* Filters */}
                      <div className="flex space-x-2">
                        <select
                          value={contentFilters.category}
                          onChange={(e) => setContentFilters({...contentFilters, category: e.target.value})}
                          className="px-4 py-2 bg-black/50 border border-white/20 text-white rounded-lg text-sm"
                        >
                          <option value="all">All Categories</option>
                          <option value="blog">Blog Posts</option>
                          <option value="newsletter">Newsletter</option>
                          <option value="social">Social Media</option>
                          <option value="marketing">Marketing</option>
                        </select>
                        <select
                          value={contentFilters.status}
                          onChange={(e) => setContentFilters({...contentFilters, status: e.target.value})}
                          className="px-4 py-2 bg-black/50 border border-white/20 text-white rounded-lg text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="review">Under Review</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <div className="flex bg-black/50 rounded-lg border border-white/20 p-1">
                        <button
                          onClick={() => setContentView('grid')}
                          className={`p-2 rounded transition-all ${contentView === 'grid'
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setContentView('list')}
                          className={`p-2 rounded transition-all ${contentView === 'list'
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Grid/List */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      <FolderOpen className="w-6 h-6 mr-3 text-emerald-400" />
                      Content Library
                    </h3>
                    <div className="text-gray-300 text-sm">
                      Showing {contentView === 'grid' ? 'grid' : 'list'} view
                    </div>
                  </div>

                  {contentView === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(9)].map((_, index) => (
                        <div key={index} className="group bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-emerald-400/50 transition-all duration-300 hover:scale-105">
                          {/* Content Thumbnail */}
                          <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute top-4 right-4">
                              <button className="p-2 bg-black/50 backdrop-blur-lg rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4 text-white" />
                              </button>
                            </div>
                            <div className="absolute bottom-4 left-4">
                              <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">
                                Blog Post
                              </span>
                            </div>
                          </div>

                          {/* Content Info */}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-green-400 text-xs font-semibold">Published</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400 text-xs">24</span>
                              </div>
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2 line-clamp-2">
                              {index === 0 ? 'Advanced Email Marketing Strategies for 2024' :
                               index === 1 ? 'Building Professional Newsletter Templates' :
                               index === 2 ? 'Content Creation Best Practices' :
                               `Professional Content Title ${index + 1}`}
                            </h4>
                            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                              Professional content description that provides insight into the article content and value proposition...
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>Dec {15 + index}, 2024</span>
                              </div>
                              <div className="flex space-x-2">
                                <button className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all">
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button className="p-1.5 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button className="p-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition-all">
                                  <Share2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-4">
                      {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-black/40 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:border-emerald-400/50 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-8 h-8 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-lg">
                                  Professional Content Title {index + 1}
                                </h4>
                                <p className="text-gray-300 text-sm">Professional content description...</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                  <span>Blog Post</span>
                                  <span>•</span>
                                  <span>Dec {15 + index}, 2024</span>
                                  <span>•</span>
                                  <span className="text-green-400">Published</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="p-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all">
                                <Edit className="w-4 h-4" />
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

              {/* Content Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-emerald-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'New Blog Post', icon: Plus, gradient: 'from-emerald-500 to-teal-500' },
                      { label: 'Import Content', icon: Upload, gradient: 'from-blue-500 to-indigo-500' },
                      { label: 'Content Templates', icon: Wand2, gradient: 'from-purple-500 to-pink-500' },
                      { label: 'AI Generator', icon: Sparkles, gradient: 'from-orange-500 to-red-500' }
                    ].map((action, index) => (
                      <button
                        key={index}
                        className={`w-full flex items-center space-x-3 p-3 bg-gradient-to-r ${action.gradient} rounded-xl text-white font-semibold hover:scale-105 transition-transform`}
                      >
                        <action.icon className="w-4 h-4" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Categories */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-emerald-400" />
                    Categories
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Blog Posts', count: 124, color: 'emerald' },
                      { name: 'Newsletters', count: 67, color: 'blue' },
                      { name: 'Social Media', count: 89, color: 'purple' },
                      { name: 'Marketing', count: 45, color: 'orange' },
                      { name: 'Tutorials', count: 23, color: 'pink' }
                    ].map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-all cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 bg-${category.color}-400 rounded-full`}></div>
                          <span className="text-white font-medium">{category.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">{category.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-emerald-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {[
                      { action: 'Published', item: 'Email Marketing Guide', time: '2 hours ago', color: 'green' },
                      { action: 'Updated', item: 'Newsletter Template', time: '4 hours ago', color: 'blue' },
                      { action: 'Created', item: 'Social Media Post', time: '6 hours ago', color: 'purple' },
                      { action: 'Archived', item: 'Old Blog Post', time: '1 day ago', color: 'gray' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg">
                        <div className={`w-2 h-2 bg-${activity.color}-400 rounded-full`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{activity.item}</p>
                          <p className="text-gray-400 text-xs">{activity.action} • {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Newsletter Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name</label>
                  <Input
                    value={currentCampaign.name}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, name: e.target.value})}
                    placeholder="Internal campaign name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <Input
                    value={currentCampaign.subject}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, subject: e.target.value})}
                    placeholder="Email subject line"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email Content</label>
                  <div className="border rounded-lg">
                    {/* Toolbar */}
                    <div className="flex items-center space-x-2 p-3 border-b bg-gray-50">
                      <Button size="sm" variant="outline" onClick={() => insertPlaceholder('LOGO_URL')}>
                        <Image className="h-4 w-4 mr-1" />
                        Logo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => insertPlaceholder('WEBSITE_URL')}>
                        <Link className="h-4 w-4 mr-1" />
                        Website
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => insertPlaceholder('UNSUBSCRIBE_URL')}>
                        <Mail className="h-4 w-4 mr-1" />
                        Unsubscribe
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPreviewMode(true)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                    
                    <textarea
                      value={currentCampaign.content}
                      onChange={(e) => setCurrentCampaign({...currentCampaign, content: e.target.value})}
                      className="w-full h-64 p-4 resize-none focus:outline-none"
                      placeholder="Enter your HTML email content here..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button onClick={saveCampaign} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={sendNewsletter} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Now ({filterSubscribers().length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.filter(campaign => campaign.status === 'draft').length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No draft campaigns</p>
                    </div>
                  ) : (
                    campaigns.filter(campaign => campaign.status === 'draft').map(campaign => (
                      <div key={campaign.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium text-sm">{campaign.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{campaign.subject}</p>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            setCurrentCampaign({
                              name: campaign.name,
                              subject: campaign.subject,
                              content: campaign.content,
                              template_id: campaign.template_id
                            })
                            toast.success('Campaign loaded!')
                          }}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FileTexts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email FileTexts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      <Wand2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No templates available</p>
                    </div>
                  ) : (
                    templates.map(template => (
                      <div key={template.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{template.template_type}</p>
                        <Button size="sm" variant="outline" onClick={() => useFileText(template)}>
                          <Wand2 className="h-3 w-3 mr-1" />
                          Use FileText
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscriber Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Segment</label>
                    <select
                      value={subscriberFilters.segment}
                      onChange={(e) => setSubscriberFilters({...subscriberFilters, segment: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Subscribers</option>
                      <option value="new">New Subscribers</option>
                      <option value="active">Active Users</option>
                      <option value="vip">VIP Clients</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Engagement</label>
                    <select
                      value={subscriberFilters.engagement}
                      onChange={(e) => setSubscriberFilters({...subscriberFilters, engagement: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="high">High Engagement</option>
                      <option value="medium">Medium Engagement</option>
                      <option value="low">Low Engagement</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Selected:</span>
                      <span className="font-medium">{filterSubscribers().length} subscribers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'audience' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Newsletter Subscribers ({subscribers.length})</CardTitle>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </label>
                <Button size="sm" variant="outline" onClick={exportSubscribers}>
                  Export List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Subscriber Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{subscribers.filter(s => s.active).length}</div>
                  <div className="text-sm text-blue-600">Active Subscribers</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{subscribers.filter(s => !s.active).length}</div>
                  <div className="text-sm text-gray-600">Unsubscribed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {subscribers.filter(s => {
                      const subDate = new Date(s.subscribed_at)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return subDate > weekAgo
                    }).length}
                  </div>
                  <div className="text-sm text-green-600">New This Week</div>
                </div>
              </div>

              {/* Subscribers List */}
              <div className="border rounded-lg overflow-x-auto">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700 min-w-[600px]">
                    <div>Email</div>
                    <div>Name</div>
                    <div>Status</div>
                    <div>Subscribed</div>
                    <div>Actions</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {subscribers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No subscribers yet</p>
                      <p className="text-sm">Subscribers will appear here when they sign up</p>
                    </div>
                  ) : (
                    subscribers.map((subscriber) => (
                      <div key={subscriber.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="grid grid-cols-5 gap-4 items-center text-sm min-w-[600px]">
                          <div className="font-medium truncate">{subscriber.email}</div>
                          <div className="truncate">{subscriber.name || 'N/A'}</div>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              subscriber.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subscriber.active ? 'Active' : 'Unsubscribed'}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {new Date(subscriber.subscribed_at).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEmailSubscriber(subscriber)}
                              title="Send Email"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditSubscriber(subscriber)}
                              title="Edit Subscriber"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Email FileTexts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.template_type}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => useFileText(template)}>
                      Use FileText
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                    <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Send className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Campaigns Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'sent').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Draft Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'draft').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">24.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign History */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No campaigns yet</p>
                    <p className="text-sm">Create your first campaign to see analytics here</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        {campaign.sent_at && (
                          <span>Sent: {new Date(campaign.sent_at).toLocaleDateString()}</span>
                        )}
                        {campaign.recipients_count && (
                          <span>Recipients: {campaign.recipients_count}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Send Email to {selectedSubscriber?.email}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Subject</label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Email subject"
                  className="text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Content</label>
                <textarea
                  value={emailForm.content}
                  onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  placeholder="Email content (HTML supported)"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={sendEmailToSubscriber} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Subscriber</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Full name (optional)"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    onChange={(e) => setEditForm({...editForm, active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Active subscription</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={updateSubscriber} disabled={loading}>
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Image Upload Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-400/30 p-8 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                  <ImagePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add Images</h3>
                  <p className="text-gray-300 text-sm">Upload or select images for your newsletter</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageUploader(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-cyan-400/30 rounded-xl p-8 text-center bg-cyan-500/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Click to upload an image</p>
                      <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Image Library */}
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Your Images</h4>
                  <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                    {uploadedImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-all"
                        onClick={() => {
                          insertImage(img.url)
                          setShowImageUploader(false)
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Insert</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowImageUploader(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Link Editor Modal */}
      {showLinkEditor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-blue-400/30 p-8 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Link className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Add Link</h3>
                  <p className="text-gray-300 text-sm">Create interactive links for your newsletter</p>
                </div>
              </div>
              <button
                onClick={() => setShowLinkEditor(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Link Text</label>
                <input
                  type="text"
                  value={linkData.text}
                  onChange={(e) => setLinkData({...linkData, text: e.target.value})}
                  placeholder="Click here to learn more"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">URL</label>
                <input
                  type="url"
                  value={linkData.url}
                  onChange={(e) => setLinkData({...linkData, url: e.target.value})}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLinkData({...linkData, style: 'button'})}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${linkData.style === 'button'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      : 'bg-black/50 border border-white/20 text-gray-300 hover:text-white'
                    }`}
                  >
                    Button Style
                  </button>
                  <button
                    onClick={() => setLinkData({...linkData, style: 'text'})}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${linkData.style === 'text'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      : 'bg-black/50 border border-white/20 text-gray-300 hover:text-white'
                    }`}
                  >
                    Text Link
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Target</label>
                <select
                  value={linkData.target}
                  onChange={(e) => setLinkData({...linkData, target: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-blue-400"
                >
                  <option value="_blank">New Tab (_blank)</option>
                  <option value="_self">Same Tab (_self)</option>
                </select>
              </div>

              {/* Link Preview */}
              {linkData.text && linkData.url && (
                <div className="border border-white/20 rounded-xl p-4 bg-black/30">
                  <p className="text-gray-300 text-sm mb-2">Preview:</p>
                  <div className="flex items-center justify-center">
                    {linkData.style === 'button' ? (
                      <div className="px-4 py-2 bg-blue-500 text-white rounded font-semibold">
                        {linkData.text}
                      </div>
                    ) : (
                      <span className="text-blue-400 underline">{linkData.text}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowLinkEditor(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (linkData.text && linkData.url) {
                      insertLink(linkData.text, linkData.url, linkData.style)
                      setLinkData({ url: '', text: '', target: '_blank', style: 'button' })
                    }
                  }}
                  disabled={!linkData.text || !linkData.url}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Schemes Modal */}
      {showColorSchemes && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-400/30 p-8 w-full max-w-3xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Color Schemes</h3>
                  <p className="text-gray-300 text-sm">Choose a professional color palette for your newsletter</p>
                </div>
              </div>
              <button
                onClick={() => setShowColorSchemes(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Professional Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa', id: 'blue' },
                  { name: 'Corporate Gray', primary: '#374151', secondary: '#6b7280', accent: '#9ca3af', id: 'gray' },
                  { name: 'Modern Purple', primary: '#7c3aed', secondary: '#a855f7', accent: '#c084fc', id: 'purple' },
                  { name: 'Elegant Green', primary: '#059669', secondary: '#10b981', accent: '#34d399', id: 'green' },
                  { name: 'Bold Orange', primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', id: 'orange' },
                  { name: 'Classic Red', primary: '#dc2626', secondary: '#ef4444', accent: '#f87171', id: 'red' }
                ].map((scheme) => (
                  <div
                    key={scheme.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      colorScheme === scheme.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/20 bg-black/30 hover:border-purple-400/50'
                    }`}
                    onClick={() => setColorScheme(scheme.id)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex space-x-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.primary }}></div>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.secondary }}></div>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.accent }}></div>
                      </div>
                      <span className="text-white font-semibold text-sm">{scheme.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Primary: {scheme.primary}<br/>
                      Secondary: {scheme.secondary}<br/>
                      Accent: {scheme.accent}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Color Picker */}
              <div className="border border-white/20 rounded-xl p-4 bg-black/30">
                <h4 className="text-white font-semibold mb-3">Custom Colors</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Primary</label>
                    <input type="color" className="w-full h-10 rounded border border-white/20" defaultValue="#1e40af" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Secondary</label>
                    <input type="color" className="w-full h-10 rounded border border-white/20" defaultValue="#3b82f6" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Accent</label>
                    <input type="color" className="w-full h-10 rounded border border-white/20" defaultValue="#60a5fa" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowColorSchemes(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowColorSchemes(false)
                    toast.success('Color scheme applied!')
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all"
                >
                  Apply Scheme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-gray-400/30 p-8 w-full max-w-4xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Advanced Settings</h3>
                  <p className="text-gray-300 text-sm">Configure advanced newsletter features and preferences</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Email Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-400" />
                  Email Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">From Name</label>
                    <input
                      type="text"
                      placeholder="Your Company Name"
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Reply-To Email</label>
                    <input
                      type="email"
                      placeholder="support@yourcompany.com"
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Editor Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Paintbrush className="w-5 h-5 mr-2 text-cyan-400" />
                  Visual Editor Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Canvas Size</label>
                    <select className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-cyan-400">
                      <option value="800x600">800×600 (Standard)</option>
                      <option value="1024x768">1024×768 (Large)</option>
                      <option value="600x800">600×800 (Mobile)</option>
                      <option value="custom">Custom Size</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Grid Snap</label>
                    <select className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-cyan-400">
                      <option value="5">5px Grid</option>
                      <option value="10">10px Grid</option>
                      <option value="20">20px Grid</option>
                      <option value="off">Grid Off</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Performance & Optimization
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                    <span className="text-gray-200">Auto-save every 30 seconds</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                    <span className="text-gray-200">Compress images automatically</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-200">Enable advanced animations</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
                    <span className="text-gray-200">Real-time collaboration</span>
                  </label>
                </div>
              </div>

              {/* Export Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-400" />
                  Export & Integration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Default Export Format</label>
                    <select className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-green-400">
                      <option value="html">HTML (Email Compatible)</option>
                      <option value="pdf">PDF Document</option>
                      <option value="image">PNG Image</option>
                      <option value="template">Reusable Template</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Integration</label>
                    <select className="w-full px-4 py-3 bg-black/50 border border-white/20 text-white rounded-xl focus:border-green-400">
                      <option value="none">No Integration</option>
                      <option value="mailchimp">Mailchimp</option>
                      <option value="constant-contact">Constant Contact</option>
                      <option value="sendgrid">SendGrid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
                <button
                  onClick={() => setShowAdvancedSettings(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAdvancedSettings(false)
                    toast.success('Advanced settings saved!')
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white rounded-lg font-semibold transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsletterEditor

