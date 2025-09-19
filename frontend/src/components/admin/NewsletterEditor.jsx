import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Send, Save, Eye, Image, Link, Palette, Users, Filter,
  Calendar, BarChart, Mail, FileText, Wand2, Upload, Edit
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiRequest } from '../../utils/api'
import { sanitizeHTML, secureLog } from '../../utils/security'

const NewsletterEditor = () => {
  console.log('🚀 NewsletterEditor component rendered')

  const [activeView, setActiveView] = useState('campaigns')
  const [campaigns, setCampaigns] = useState([])
  const [templates, setFileTexts] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [currentCampaign, setCurrentCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    template_id: ''
  })
  const [selectedFileText, setSelectedFileText] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [subscriberFilters, setSubscriberFilters] = useState({
    segment: 'all',
    tags: [],
    engagement: 'all'
  })
  const [loading, setLoading] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState(null)
  const [emailForm, setEmailForm] = useState({ subject: '', content: '' })
  const [editForm, setEditForm] = useState({ email: '', name: '', active: false })

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
      const token = localStorage.getItem('admin_token')
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
      const token = localStorage.getItem('admin_token')
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
      const token = localStorage.getItem('admin_token')
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
      const token = localStorage.getItem('admin_token')
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
      const token = localStorage.getItem('admin_token')
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
      const token = localStorage.getItem('admin_token')
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Newsletter Preview</h2>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            Back to Editor
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <strong>Subject:</strong> {currentCampaign.subject}
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentCampaign.content) }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Newsletter Management</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setActiveView('campaigns')} variant={activeView === 'campaigns' ? 'default' : 'outline'}>
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </Button>
          <Button onClick={() => setActiveView('subscribers')} variant={activeView === 'subscribers' ? 'default' : 'outline'}>
            <Users className="h-4 w-4 mr-2" />
            Subscribers
          </Button>
          <Button onClick={() => setActiveView('templates')} variant={activeView === 'templates' ? 'default' : 'outline'}>
            <FileText className="h-4 w-4 mr-2" />
            FileTexts
          </Button>
          <Button onClick={() => setActiveView('analytics')} variant={activeView === 'analytics' ? 'default' : 'outline'}>
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

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

      {activeView === 'subscribers' && (
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

