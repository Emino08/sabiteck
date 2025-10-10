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
  ArrowDown, ArrowLeft, ArrowRight, Grid, Sliders
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiRequest } from '../../utils/api'
import { sanitizeHTML, secureLog } from '../../utils/security'

const EnhancedNewsletterEditor = () => {
  console.log('🚀 Enhanced Elite NewsletterEditor component rendered')

  // Enhanced state management
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

  // Visual editor states
  const [visualElements, setVisualElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [draggedElement, setDraggedElement] = useState(null)
  const [editorMode, setEditorMode] = useState('visual')
  const [visualEditMode, setVisualEditMode] = useState('select') // select, draw, text, image
  const [showShapeToolbar, setShowShapeToolbar] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showLinkEditor, setShowLinkEditor] = useState(false)

  // Image management states
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageLibrary, setImageLibrary] = useState([])
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Shape and drawing states
  const [currentShape, setCurrentShape] = useState('rectangle')
  const [shapeColor, setShapeColor] = useState('#007bff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fillOpacity, setFillOpacity] = useState(0.3)

  // Canvas and positioning
  const canvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Other existing states
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiAssistant, setAiAssistant] = useState(false)

  // Link management state
  const [linkData, setLinkData] = useState({
    url: '',
    text: '',
    target: '_blank',
    style: 'button'
  })

  useEffect(() => {
    console.log('📅 Enhanced useEffect triggered - calling loadData')
    loadData()
    loadImageLibrary()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading enhanced newsletter data...')

      // Load subscribers
      try {
        const subscribersResponse = await apiRequest('/api/admin/newsletter/subscribers');
        if (subscribersResponse && subscribersResponse.success) {
          const subscriberData = subscribersResponse.data?.subscribers || subscribersResponse.data || [];
          setSubscribers(subscriberData);
        }
      } catch (error) {
        console.error('❌ Error loading subscribers:', error)
        toast.error('Failed to load subscribers')
      }

      // Load templates
      try {
        const templatesResponse = await apiRequest('/api/admin/newsletter/templates');
        if (templatesResponse && templatesResponse.success) {
          const templateData = templatesResponse.data?.templates || templatesResponse.data || [];
          setFileTexts(templateData);
        }
      } catch (error) {
        console.error('❌ Error loading templates:', error)
        toast.error('Failed to load templates')
      }

    } catch (error) {
      console.error('❌ Error in loadData:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadImageLibrary = async () => {
    // Load pre-built image library
    const defaultImages = [
      { id: 1, url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400', name: 'Business Meeting' },
      { id: 2, url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400', name: 'Technology' },
      { id: 3, url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400', name: 'Newsletter Design' },
      { id: 4, url: 'https://images.unsplash.com/photo-1496128858413-b36217c2ce36?w=400', name: 'Workspace' },
      { id: 5, url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400', name: 'Digital Marketing' }
    ]
    setImageLibrary(defaultImages)
  }

  // Enhanced image insertion with drag and drop capabilities
  const insertImage = useCallback((imageUrl, position = { x: 100, y: 100 }) => {
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
      zIndex: visualElements.length,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    }

    setVisualElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)

    // Insert HTML representation in content
    const imageHtml = `<img src="${imageUrl}" alt="Newsletter Image" style="width: ${newElement.width}px; height: ${newElement.height}px; border-radius: ${newElement.style.borderRadius}; box-shadow: ${newElement.style.boxShadow};" />`
    setCurrentCampaign(prev => ({
      ...prev,
      content: prev.content + imageHtml
    }))

    toast.success('Image inserted successfully!')
  }, [visualElements])

  // Enhanced link insertion
  const insertLink = useCallback(() => {
    if (!linkData.url || !linkData.text) {
      toast.error('Please provide both URL and text for the link')
      return
    }

    const linkHtml = linkData.style === 'button'
      ? `<a href="${linkData.url}" target="${linkData.target}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px 0;">${linkData.text}</a>`
      : `<a href="${linkData.url}" target="${linkData.target}" style="color: #007bff; text-decoration: underline;">${linkData.text}</a>`

    setCurrentCampaign(prev => ({
      ...prev,
      content: prev.content + linkHtml
    }))

    setLinkData({ url: '', text: '', target: '_blank', style: 'button' })
    setShowLinkEditor(false)
    toast.success('Link inserted successfully!')
  }, [linkData])

  // Shape insertion functionality
  const insertShape = useCallback((shapeType) => {
    const newElement = {
      id: Date.now(),
      type: 'shape',
      shapeType,
      x: 150,
      y: 150,
      width: 120,
      height: 120,
      rotation: 0,
      fillColor: shapeColor,
      strokeColor: '#333',
      strokeWidth,
      opacity: fillOpacity,
      zIndex: visualElements.length
    }

    setVisualElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)
    toast.success(`${shapeType} shape added!`)
  }, [shapeColor, strokeWidth, fillOpacity, visualElements])

  // Element manipulation functions
  const moveElement = useCallback((elementId, direction) => {
    setVisualElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const step = 10
        switch (direction) {
          case 'up': return { ...el, y: el.y - step }
          case 'down': return { ...el, y: el.y + step }
          case 'left': return { ...el, x: el.x - step }
          case 'right': return { ...el, x: el.x + step }
          default: return el
        }
      }
      return el
    }))
  }, [])

  const moveToFront = useCallback((elementId) => {
    setVisualElements(prev => {
      const maxZ = Math.max(...prev.map(el => el.zIndex))
      return prev.map(el =>
        el.id === elementId ? { ...el, zIndex: maxZ + 1 } : el
      )
    })
    toast.success('Element moved to front')
  }, [])

  const moveToBack = useCallback((elementId) => {
    setVisualElements(prev => {
      const minZ = Math.min(...prev.map(el => el.zIndex))
      return prev.map(el =>
        el.id === elementId ? { ...el, zIndex: minZ - 1 } : el
      )
    })
    toast.success('Element moved to back')
  }, [])

  const duplicateElement = useCallback((elementId) => {
    const element = visualElements.find(el => el.id === elementId)
    if (element) {
      const newElement = {
        ...element,
        id: Date.now(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: visualElements.length
      }
      setVisualElements(prev => [...prev, newElement])
      toast.success('Element duplicated')
    }
  }, [visualElements])

  const deleteElement = useCallback((elementId) => {
    setVisualElements(prev => prev.filter(el => el.id !== elementId))
    if (selectedElement === elementId) {
      setSelectedElement(null)
    }
    toast.success('Element deleted')
  }, [selectedElement])

  // File upload handling
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target.result
        setUploadedImages(prev => [...prev, {
          id: Date.now(),
          url: imageUrl,
          name: file.name
        }])
        insertImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }, [insertImage])

  // Advanced text formatting
  const insertFormattedText = useCallback((tag, content = '') => {
    const selection = window.getSelection()
    const text = selection.toString() || content || 'Sample text'

    let formattedHtml = ''
    switch (tag) {
      case 'heading1':
        formattedHtml = `<h1 style="color: #333; font-size: 32px; font-weight: bold; margin: 20px 0;">${text}</h1>`
        break
      case 'heading2':
        formattedHtml = `<h2 style="color: #555; font-size: 24px; font-weight: 600; margin: 16px 0;">${text}</h2>`
        break
      case 'paragraph':
        formattedHtml = `<p style="color: #666; font-size: 16px; line-height: 1.6; margin: 12px 0;">${text}</p>`
        break
      case 'callout':
        formattedHtml = `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center; font-weight: 600;">${text}</div>`
        break
      case 'quote':
        formattedHtml = `<blockquote style="border-left: 4px solid #007bff; padding-left: 20px; margin: 16px 0; font-style: italic; color: #555;">${text}</blockquote>`
        break
      default:
        formattedHtml = `<${tag}>${text}</${tag}>`
    }

    setCurrentCampaign(prev => ({
      ...prev,
      content: prev.content + formattedHtml
    }))
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Enhanced Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl"></div>
        <div className="relative container mx-auto px-6 py-6">
          {/* Elite Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">
                  Elite Newsletter Studio
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full text-sm font-black">
                    ENHANCED
                  </span>
                </h1>
                <p className="text-gray-300 text-lg">The Ultimate Professional Newsletter Editor</p>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Tabs */}
          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'composer', label: 'Visual Composer', icon: Edit, gradient: 'from-violet-500 to-purple-500' },
              { id: 'content', label: 'Content Library', icon: FileText, gradient: 'from-emerald-500 to-teal-500' },
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
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-2xl`
                    : 'bg-black/30 backdrop-blur-lg text-gray-300 border border-white/20 hover:bg-black/40'
                  }
                `}
              >
                <div className="flex items-center space-x-1 md:space-x-2 relative z-10">
                  <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-xs md:text-sm font-bold hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Visual Composer */}
      {activeView === 'composer' && (
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-full">
            {/* Enhanced Left Sidebar - Tools */}
            <div className="xl:col-span-1 space-y-6">
              {/* Visual Mode Selector */}
              <Card className="bg-black/30 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Edit Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 'select', label: 'Select & Move', icon: MousePointer },
                    { id: 'text', label: 'Add Text', icon: Type },
                    { id: 'image', label: 'Add Image', icon: Image },
                    { id: 'shape', label: 'Draw Shapes', icon: Square },
                    { id: 'link', label: 'Insert Link', icon: Link }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setVisualEditMode(mode.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        visualEditMode === mode.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-black/50 text-gray-300 hover:bg-black/70'
                      }`}
                    >
                      <mode.icon className="w-4 h-4" />
                      <span className="font-medium">{mode.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Shape Tools */}
              {visualEditMode === 'shape' && (
                <Card className="bg-black/30 backdrop-blur-xl border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                      <Square className="w-5 h-5 mr-2" />
                      Shape Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: 'rectangle', icon: Square, label: 'Rectangle' },
                        { type: 'circle', icon: Circle, label: 'Circle' },
                        { type: 'triangle', icon: Triangle, label: 'Triangle' }
                      ].map(shape => (
                        <button
                          key={shape.type}
                          onClick={() => insertShape(shape.type)}
                          className="flex flex-col items-center space-y-2 p-3 bg-black/50 rounded-lg hover:bg-black/70 transition-all"
                          title={shape.label}
                        >
                          <shape.icon className="w-6 h-6 text-gray-300" />
                          <span className="text-xs text-gray-400">{shape.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Fill Color</label>
                        <input
                          type="color"
                          value={shapeColor}
                          onChange={(e) => setShapeColor(e.target.value)}
                          className="w-full h-10 rounded-lg border border-white/20"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Stroke Width</label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={strokeWidth}
                          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{strokeWidth}px</span>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={fillOpacity}
                          onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round(fillOpacity * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Image Library */}
              {visualEditMode === 'image' && (
                <Card className="bg-black/30 backdrop-blur-xl border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                      <Image className="w-5 h-5 mr-2" />
                      Image Library
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload New Image */}
                    <div>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all cursor-pointer text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-300">Upload Image</span>
                        </div>
                      </label>
                    </div>

                    {/* Stock Images */}
                    <div className="grid grid-cols-2 gap-2">
                      {imageLibrary.map(img => (
                        <div
                          key={img.id}
                          className="relative group cursor-pointer"
                          onClick={() => insertImage(img.url)}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/70 rounded px-1 py-0.5 truncate">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Uploaded Images */}
                    {uploadedImages.length > 0 && (
                      <>
                        <div className="text-sm text-gray-300 font-medium">Your Uploads</div>
                        <div className="grid grid-cols-2 gap-2">
                          {uploadedImages.map(img => (
                            <div
                              key={img.id}
                              className="relative group cursor-pointer"
                              onClick={() => insertImage(img.url)}
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Element Properties */}
              {selectedElement && (
                <Card className="bg-black/30 backdrop-blur-xl border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Element Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Movement Controls */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Position</label>
                      <div className="grid grid-cols-3 gap-1">
                        <div></div>
                        <button
                          onClick={() => moveElement(selectedElement, 'up')}
                          className="p-2 bg-black/50 rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowUp className="w-4 h-4 text-gray-300 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={() => moveElement(selectedElement, 'left')}
                          className="p-2 bg-black/50 rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowLeft className="w-4 h-4 text-gray-300 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={() => moveElement(selectedElement, 'right')}
                          className="p-2 bg-black/50 rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-300 mx-auto" />
                        </button>
                        <div></div>
                        <button
                          onClick={() => moveElement(selectedElement, 'down')}
                          className="p-2 bg-black/50 rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowDown className="w-4 h-4 text-gray-300 mx-auto" />
                        </button>
                        <div></div>
                      </div>
                    </div>

                    {/* Layer Controls */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Layer Order</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => moveToFront(selectedElement)}
                          className="flex-1 px-3 py-2 bg-black/50 text-gray-300 text-xs rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowUp className="w-3 h-3 inline mr-1" />
                          Front
                        </button>
                        <button
                          onClick={() => moveToBack(selectedElement)}
                          className="flex-1 px-3 py-2 bg-black/50 text-gray-300 text-xs rounded hover:bg-black/70 transition-all"
                        >
                          <ArrowDown className="w-3 h-3 inline mr-1" />
                          Back
                        </button>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Actions</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => duplicateElement(selectedElement)}
                          className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-all"
                        >
                          <Copy className="w-3 h-3 inline mr-1" />
                          Copy
                        </button>
                        <button
                          onClick={() => deleteElement(selectedElement)}
                          className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 text-xs rounded hover:bg-red-500/30 transition-all"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enhanced Main Editor */}
            <div className="xl:col-span-3 space-y-6">
              {/* Campaign Settings */}
              <Card className="bg-black/30 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Enhanced Campaign Composer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campaign Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Campaign Name</label>
                      <Input
                        value={currentCampaign.name}
                        onChange={(e) => setCurrentCampaign({...currentCampaign, name: e.target.value})}
                        placeholder="Professional Campaign Title"
                        className="bg-black/50 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">Subject Line</label>
                      <Input
                        value={currentCampaign.subject}
                        onChange={(e) => setCurrentCampaign({...currentCampaign, subject: e.target.value})}
                        placeholder="Compelling subject line..."
                        className="bg-black/50 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  {/* Enhanced Formatting Toolbar */}
                  <div className="bg-black/50 rounded-xl border border-white/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Text Formatting */}
                      <div className="flex items-center space-x-1 border-r border-white/20 pr-3">
                        <span className="text-xs text-gray-400">Format</span>
                        {[
                          { label: 'H1', action: () => insertFormattedText('heading1') },
                          { label: 'H2', action: () => insertFormattedText('heading2') },
                          { label: 'P', action: () => insertFormattedText('paragraph') },
                          { label: 'Quote', action: () => insertFormattedText('quote') },
                          { label: 'CTA', action: () => insertFormattedText('callout') }
                        ].map((tool, index) => (
                          <button
                            key={index}
                            onClick={tool.action}
                            className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all"
                          >
                            {tool.label}
                          </button>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setShowLinkEditor(true)}
                          className="p-2 text-gray-300 hover:text-white hover:bg-blue-500/20 rounded transition-all"
                          title="Insert Link"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVisualEditMode('image')}
                          className="p-2 text-gray-300 hover:text-white hover:bg-green-500/20 rounded transition-all"
                          title="Insert Image"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVisualEditMode('shape')}
                          className="p-2 text-gray-300 hover:text-white hover:bg-purple-500/20 rounded transition-all"
                          title="Add Shape"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Editor Area */}
                  <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex h-96">
                      {/* Visual Editor Canvas */}
                      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-white">
                        <canvas
                          ref={canvasRef}
                          width={canvasSize.width}
                          height={canvasSize.height}
                          className="w-full h-full cursor-crosshair"
                          style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
                            backgroundSize: '20px 20px'
                          }}
                        />

                        {/* Visual Elements Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {visualElements.map(element => (
                            <div
                              key={element.id}
                              className={`absolute pointer-events-auto cursor-move ${
                                selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              style={{
                                left: element.x,
                                top: element.y,
                                width: element.width,
                                height: element.height,
                                transform: `rotate(${element.rotation}deg)`,
                                opacity: element.opacity,
                                zIndex: element.zIndex
                              }}
                              onClick={() => setSelectedElement(element.id)}
                            >
                              {element.type === 'image' && (
                                <img
                                  src={element.src}
                                  alt="Newsletter element"
                                  className="w-full h-full object-cover"
                                  style={element.style}
                                />
                              )}
                              {element.type === 'shape' && (
                                <div
                                  className="w-full h-full"
                                  style={{
                                    backgroundColor: element.fillColor,
                                    border: `${element.strokeWidth}px solid ${element.strokeColor}`,
                                    borderRadius: element.shapeType === 'circle' ? '50%' :
                                                element.shapeType === 'triangle' ? '0' : '8px',
                                    opacity: element.opacity
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Code Editor */}
                      <div className="w-1/2 border-l border-white/10">
                        <div className="bg-black/30 border-b border-white/10 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">HTML Content</span>
                            <span className="text-xs text-gray-300">{currentCampaign.content.length} chars</span>
                          </div>
                        </div>
                        <textarea
                          value={currentCampaign.content}
                          onChange={(e) => setCurrentCampaign({...currentCampaign, content: e.target.value})}
                          className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                          placeholder="Your enhanced HTML content will appear here..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => setPreviewMode(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" className="border-white/20 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                    </div>

                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                      <Send className="w-4 h-4 mr-2" />
                      Send Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Link Editor Modal */}
      {showLinkEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">URL</label>
                <Input
                  value={linkData.url}
                  onChange={(e) => setLinkData({...linkData, url: e.target.value})}
                  placeholder="https://example.com"
                  className="bg-black/50 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Link Text</label>
                <Input
                  value={linkData.text}
                  onChange={(e) => setLinkData({...linkData, text: e.target.value})}
                  placeholder="Click here"
                  className="bg-black/50 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Style</label>
                <select
                  value={linkData.style}
                  onChange={(e) => setLinkData({...linkData, style: e.target.value})}
                  className="w-full px-3 py-2 bg-black/50 border border-white/20 text-white rounded-lg"
                >
                  <option value="button">Button</option>
                  <option value="text">Text Link</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={linkData.target === '_blank'}
                  onChange={(e) => setLinkData({...linkData, target: e.target.checked ? '_blank' : '_self'})}
                  className="rounded"
                />
                <label className="text-sm text-gray-200">Open in new tab</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkEditor(false)}
                  className="border-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={insertLink}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Insert Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-100 border-b px-4 md:px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Newsletter Preview</h3>
              <Button
                onClick={() => setPreviewMode(false)}
                variant="outline"
              >
                Close Preview
              </Button>
            </div>
            <div className="p-4 md:p-6 overflow-auto h-full">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(currentCampaign.content.replace(/\[SUBSCRIBER_NAME\]/g, 'John Doe'))
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Other existing views (audience, campaigns, etc.) can be included here */}
      {activeView !== 'composer' && (
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-white mb-4">Enhanced Feature Coming Soon</h2>
            <p className="text-gray-300">This section is being enhanced with advanced features.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedNewsletterEditor