import React, { useState, useEffect } from 'react'
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
  Tag, FolderOpen, Bookmark, Heart, Share2
} from 'lucide-react'
import { Button } from '../ui/button'
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
      active: subscriber.status === 'active' || false
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
      await apiRequest(`/api/admin/newsletter/subscribers/${selectedSubscriber.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      })
      
      toast.success('Subscriber updated successfully!')
      setShowEditDialog(false)
      loadData() // Reload data
    } catch (error) {
      toast.error('Failed to update subscriber')
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
                  <div
                    className="prose max-w-none"
                    style={{ color: '#1f2937' }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(currentCampaign.content || '<h1>Welcome to our Professional Newsletter</h1><p>Your content will appear here...</p>')
                    }}
                  />
                </div>

                {/* Email Footer */}
                <div className="bg-gray-100 border-t p-4 text-center text-sm text-gray-600">
                  <p>Professional Newsletter • Sabiteck Limited • Bo, Sierra Leone</p>
                  <p className="mt-2">
                    <a href="#" className="text-blue-600 hover:underline">Unsubscribe</a> |
                    <a href="#" className="text-blue-600 hover:underline ml-2">Manage Preferences</a>
                  </p>
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
                  <div className="relative p-3 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                    Elite Newsletter Studio
                  </h1>
                  <p className="text-gray-300 text-sm">Professional-grade email marketing platform</p>
                </div>
              </div>
            </div>

            {/* Elite Navigation */}
            <div className="flex items-center space-x-2">
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
                    group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105
                    ${activeView === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-2xl shadow-${tab.gradient.split('-')[1]}-500/25`
                      : 'bg-black/30 backdrop-blur-lg text-gray-300 border border-white/20 hover:bg-black/40 hover:border-white/30'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2 relative z-10">
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm font-bold">{tab.label}</span>
                  </div>
                  {activeView === tab.id && (
                    <div className={`absolute -inset-1 bg-gradient-to-r ${tab.gradient} rounded-xl blur opacity-50 animate-pulse`}></div>
                  )}
                </button>
              ))}

              {/* Settings & Tools */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
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
                          Visual
                        </button>
                        <button
                          onClick={() => setEditorMode('code')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${editorMode === 'code'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
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
                                { icon: Image, label: 'Insert Image', color: 'from-pink-500/20 to-rose-500/20', action: () => insertPlaceholder('IMAGE_URL') },
                                { icon: Link, label: 'Insert Link', color: 'from-blue-500/20 to-cyan-500/20', action: () => insertPlaceholder('LINK_URL') },
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
                                { icon: Palette, label: 'Color Schemes', color: 'from-indigo-500/20 to-purple-500/20' },
                                { icon: Settings, label: 'Advanced Settings', color: 'from-gray-500/20 to-slate-500/20' }
                              ].map((tool, index) => (
                                <div key={index} className="relative group">
                                  <button
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
                    <div className="flex h-96">
                      {/* Content Input Area */}
                      <div className="flex-1 relative">
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
                                {currentCampaign.content ? (
                                  <div
                                    className="prose prose-sm max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHTML(currentCampaign.content.replace(/\[SUBSCRIBER_NAME\]/g, 'John Doe'))
                                    }}
                                  />
                                ) : (
                                  <div className="text-center py-12 text-gray-400">
                                    <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-semibold">Start typing to see preview</p>
                                    <p className="text-sm">Your content will appear here in real-time</p>
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
            <div className="flex items-center justify-between">
              <CardTitle>Newsletter Subscribers ({subscribers.length})</CardTitle>
              <div className="flex space-x-2">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <div className="border rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
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
                        <div className="grid grid-cols-5 gap-4 items-center text-sm">
                          <div className="font-medium">{subscriber.email}</div>
                          <div>{subscriber.name || 'N/A'}</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Send Email to {selectedSubscriber?.email}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={emailForm.content}
                  onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
    </div>
  )
}

export default NewsletterEditor

