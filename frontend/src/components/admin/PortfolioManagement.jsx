import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Save, X, Eye, EyeOff,
  Image, Tag, Calendar, ExternalLink, Github, Globe,
  CheckCircle, XCircle, Star, Award
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import { getErrorMessage, formatErrorMessage } from '../../utils/errorHandler';

const PortfolioManagement = () => {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentItem, setCurrentItem] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    client_name: '',
    project_type: '',
    technologies: [],
    features: [],
    images: [],
    live_url: '',
    github_url: '',
    demo_url: '',
    case_study_url: '',
    start_date: '',
    end_date: '',
    status: 'completed',
    featured: false,
    show_in_portfolio: true,
    testimonial: '',
    testimonial_author: '',
    results_achieved: [],
    challenges_solved: [],
    order_position: 0
  });

  const [categories, setCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([
    'Web Application', 'Mobile App', 'Desktop Software', 'E-commerce',
    'CMS/Blog', 'API/Backend', 'Landing Page', 'Portfolio Website',
    'SaaS Platform', 'Enterprise Solution'
  ]);
  const [statusOptions, setStatusOptions] = useState([
    'planning', 'in-progress', 'testing', 'completed', 'on-hold', 'cancelled'
  ]);

  useEffect(() => {
    loadPortfolioItems();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/portfolio/categories');
      if (response.success) {
        const categoriesData = response.data || response.categories || [];
        setCategories(categoriesData.map(cat => cat.name || cat));
      }
    } catch (error) {
      console.error('Error loading portfolio categories:', error);
      setCategories([]);
    }
  };

  const loadPortfolioItems = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/portfolio');
      if (response.success) {
        // Use 'data' for full portfolio list, fallback to 'recent' for dashboard
        setPortfolioItems(response.data || response.recent || []);
      } else {
        toast.error(response.message || response.error || 'Failed to load portfolio items');
      }
    } catch (error) {
      toast.error(formatErrorMessage(error, 'Failed to load portfolio items'));
    } finally {
      setLoading(false);
    }
  };

  const savePortfolioItem = async () => {
    if (!currentItem.title || !currentItem.description) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingItem ? `/api/admin/portfolio/${editingItem.id}` : '/api/admin/portfolio';
      const method = editingItem ? 'PUT' : 'POST';

      const processedItem = {
        ...currentItem,
        technologies: typeof currentItem.technologies === 'string'
          ? currentItem.technologies.split(',').map(t => t.trim()).filter(t => t)
          : currentItem.technologies,
        features: typeof currentItem.features === 'string'
          ? currentItem.features.split('\n').filter(f => f.trim())
          : currentItem.features,
        images: typeof currentItem.images === 'string'
          ? currentItem.images.split('\n').filter(i => i.trim())
          : currentItem.images,
        results_achieved: typeof currentItem.results_achieved === 'string'
          ? currentItem.results_achieved.split('\n').filter(r => r.trim())
          : currentItem.results_achieved,
        challenges_solved: typeof currentItem.challenges_solved === 'string'
          ? currentItem.challenges_solved.split('\n').filter(c => c.trim())
          : currentItem.challenges_solved
      };

      const response = await apiRequest(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedItem)
      });

      if (response.success) {
        toast.success(editingItem ? 'Portfolio item updated successfully!' : 'Portfolio item created successfully!');
        resetForm();
        loadPortfolioItems();
        setShowEditor(false);
      } else {
        toast.error(response.message || response.error || 'Failed to save portfolio item');
      }
    } catch (error) {
      toast.error(formatErrorMessage(error, 'Failed to save portfolio item'));
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolioItem = async (itemId) => {
    const item = portfolioItems.find(p => p.id === itemId);
    const itemTitle = item ? item.title : 'this portfolio item';

    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 max-w-md">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Delete Portfolio Item</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete <strong className="text-gray-900">{itemTitle}</strong>?</p>
            <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                const token = localStorage.getItem('auth_token');
                const response = await apiRequest(`/api/admin/portfolio/${itemId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.success) {
                  toast.success('Portfolio item deleted successfully!');
                  loadPortfolioItems();
                } else {
                  toast.error(response.message || response.error || 'Failed to delete portfolio item');
                }
              } catch (error) {
                toast.error(formatErrorMessage(error, 'Failed to delete portfolio item'));
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    });
  };

  const editPortfolioItem = (item) => {
    setEditingItem(item);
    setCurrentItem({
      ...item,
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : (item.technologies || ''),
      features: Array.isArray(item.features) ? item.features.join('\n') : (item.features || ''),
      images: Array.isArray(item.images) ? item.images.join('\n') : (item.images || ''),
      results_achieved: Array.isArray(item.results_achieved) ? item.results_achieved.join('\n') : (item.results_achieved || ''),
      challenges_solved: Array.isArray(item.challenges_solved) ? item.challenges_solved.join('\n') : (item.challenges_solved || '')
    });
    setShowEditor(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setCurrentItem({
      title: '',
      description: '',
      short_description: '',
      category: '',
      client_name: '',
      project_type: '',
      technologies: [],
      features: [],
      images: [],
      live_url: '',
      github_url: '',
      demo_url: '',
      case_study_url: '',
      start_date: '',
      end_date: '',
      status: 'completed',
      featured: false,
      show_in_portfolio: true,
      testimonial: '',
      testimonial_author: '',
      results_achieved: [],
      challenges_solved: [],
      order_position: 0
    });
  };

  const toggleItemStatus = async (itemId, field, value) => {
    try {
      const token = localStorage.getItem('auth_token');
      await apiRequest(`/api/admin/portfolio/${itemId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });

      toast.success('Portfolio item updated successfully!');
      loadPortfolioItems();
    } catch (error) {
      toast.error(formatErrorMessage(error, 'Failed to update portfolio item'));
    }
  };

  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 space-y-8">
        {/* Premium Header Section */}
        <Card className="border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden shadow-2xl">
          <CardContent className="p-8 relative">
            {/* Floating geometric shapes */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-indigo-500/20 rounded-lg rotate-45 blur-lg"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                    {editingItem ? 'Edit Portfolio Item' : 'Create New Portfolio Item'}
                  </h1>
                  <p className="text-blue-100 text-lg opacity-90">
                    {editingItem ? 'Update your project details and showcase your work' : 'Add a new project to showcase your expertise'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowEditor(false)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 bg-gradient-to-br from-white to-blue-50/50">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Project Title *
                  </label>
                  <Input
                    value={currentItem.title}
                    onChange={(e) => setCurrentItem({...currentItem, title: e.target.value})}
                    placeholder="Amazing Web Application"
                    className="border-2 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-blue-600" />
                      Category
                    </label>
                    <select
                      value={currentItem.category}
                      onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white/80 backdrop-blur-sm transition-all"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                      <Globe className="h-4 w-4 mr-1 text-blue-600" />
                      Project Type
                    </label>
                    <select
                      value={currentItem.project_type}
                      onChange={(e) => setCurrentItem({...currentItem, project_type: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white/80 backdrop-blur-sm transition-all"
                    >
                      <option value="">Select type</option>
                      {projectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Client Name</label>
                  <Input
                    value={currentItem.client_name}
                    onChange={(e) => setCurrentItem({...currentItem, client_name: e.target.value})}
                    placeholder="Client or Company Name"
                    className="border-2 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Short Description</label>
                  <textarea
                    value={currentItem.short_description}
                    onChange={(e) => setCurrentItem({...currentItem, short_description: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={2}
                    placeholder="Brief description for portfolio cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Full Description *</label>
                  <textarea
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={6}
                    placeholder="Detailed project description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Technologies Used (comma-separated)</label>
                  <Input
                    value={currentItem.technologies}
                    onChange={(e) => setCurrentItem({...currentItem, technologies: e.target.value})}
                    placeholder="React, Node.js, MongoDB, AWS"
                    className="border-2 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Key Features (one per line)</label>
                  <textarea
                    value={currentItem.features}
                    onChange={(e) => setCurrentItem({...currentItem, features: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={4}
                    placeholder="User authentication&#10;Real-time notifications&#10;Mobile responsive"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Results Achieved (one per line)</label>
                  <textarea
                    value={currentItem.results_achieved}
                    onChange={(e) => setCurrentItem({...currentItem, results_achieved: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={3}
                    placeholder="50% increase in user engagement&#10;Reduced processing time by 80%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Challenges Solved (one per line)</label>
                  <textarea
                    value={currentItem.challenges_solved}
                    onChange={(e) => setCurrentItem({...currentItem, challenges_solved: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={3}
                    placeholder="Complex data integration&#10;Performance optimization"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Project Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-green-50/50">
                <div>
                  <label className="block text-sm font-medium mb-2">Live URL</label>
                  <Input
                    value={currentItem.live_url}
                    onChange={(e) => setCurrentItem({...currentItem, live_url: e.target.value})}
                    placeholder="https://example.com"
                    className="border-2 border-green-200 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub URL</label>
                  <Input
                    value={currentItem.github_url}
                    onChange={(e) => setCurrentItem({...currentItem, github_url: e.target.value})}
                    placeholder="https://github.com/username/repo"
                    className="border-2 border-green-200 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Demo URL</label>
                  <Input
                    value={currentItem.demo_url}
                    onChange={(e) => setCurrentItem({...currentItem, demo_url: e.target.value})}
                    placeholder="https://demo.example.com"
                    className="border-2 border-green-200 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Case Study URL</label>
                  <Input
                    value={currentItem.case_study_url}
                    onChange={(e) => setCurrentItem({...currentItem, case_study_url: e.target.value})}
                    placeholder="https://blog.example.com/case-study"
                    className="border-2 border-green-200 focus:border-green-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Client Testimonial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-purple-50/50">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Testimonial</label>
                  <textarea
                    value={currentItem.testimonial}
                    onChange={(e) => setCurrentItem({...currentItem, testimonial: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-purple-200 focus:border-purple-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={3}
                    placeholder="What the client said about the project..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Testimonial Author</label>
                  <Input
                    value={currentItem.testimonial_author}
                    onChange={(e) => setCurrentItem({...currentItem, testimonial_author: e.target.value})}
                    placeholder="John Doe, CEO at Company"
                    className="border-2 border-purple-200 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-orange-50/50">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={currentItem.start_date}
                    onChange={(e) => setCurrentItem({...currentItem, start_date: e.target.value})}
                    className="border-2 border-orange-200 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={currentItem.end_date}
                    onChange={(e) => setCurrentItem({...currentItem, end_date: e.target.value})}
                    className="border-2 border-orange-200 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={currentItem.status}
                    onChange={(e) => setCurrentItem({...currentItem, status: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-orange-200 focus:border-orange-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Project Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-indigo-50/50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_in_portfolio"
                    checked={currentItem.show_in_portfolio}
                    onChange={(e) => setCurrentItem({...currentItem, show_in_portfolio: e.target.checked})}
                    className="rounded border-indigo-300 text-indigo-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                  <label htmlFor="show_in_portfolio" className="text-sm font-medium">Show in Portfolio</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={currentItem.featured}
                    onChange={(e) => setCurrentItem({...currentItem, featured: e.target.checked})}
                    className="rounded border-indigo-300 text-indigo-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">Featured Project</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={currentItem.order_position}
                    onChange={(e) => setCurrentItem({...currentItem, order_position: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="border-2 border-indigo-200 focus:border-indigo-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Project Images
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-white to-cyan-50/50">
                <div>
                  <label className="block text-sm font-medium mb-2">Image URLs (one per line)</label>
                  <textarea
                    value={currentItem.images}
                    onChange={(e) => setCurrentItem({...currentItem, images: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-cyan-200 focus:border-cyan-500 rounded-md bg-white/80 backdrop-blur-sm transition-all"
                    rows={5}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={savePortfolioItem}
              disabled={loading}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                editingItem ? 'Update Project' : 'Create Project'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 space-y-8">
      {/* Premium Header Section */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden shadow-2xl">
        <CardContent className="p-8 relative">
          {/* Floating geometric shapes */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-indigo-500/20 rounded-lg rotate-45 blur-lg"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                  Portfolio Management
                </h1>
                <p className="text-blue-100 text-lg opacity-90">
                  Manage your portfolio projects, showcase your expertise, and track your work
                </p>
              </div>
              <Button
                onClick={() => setShowEditor(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Search and Filter Section */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search projects by title, description, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 border-2 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm rounded-lg transition-all"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border-2 border-blue-200 focus:border-blue-500 rounded-lg bg-white/80 backdrop-blur-sm transition-all min-w-[160px]"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="font-medium">{filteredItems.length}</span>
                <span>projects found</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden">
              <CardContent className="p-0">
                {/* Project Header with Gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                    {item.featured && (
                      <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-blue-100 text-sm opacity-90">{item.category}</p>
                  <p className="text-blue-200 font-medium text-sm">{item.client_name}</p>
                </div>

                <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {item.short_description || item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-2 rounded-full text-xs font-semibold ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'testing' ? 'bg-purple-100 text-purple-800' :
                    item.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'planning' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                  </span>
                  <button
                    onClick={() => toggleItemStatus(item.id, 'show_in_portfolio', !item.show_in_portfolio)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                      item.show_in_portfolio
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {item.show_in_portfolio ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{item.show_in_portfolio ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>

                {/* Project Links */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {item.live_url && (
                    <a
                      href={item.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors group-hover:scale-110 transform transition-transform"
                      title="View Live Site"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </a>
                  )}
                  {item.github_url && (
                    <a
                      href={item.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group-hover:scale-110 transform transition-transform"
                      title="View Source Code"
                    >
                      <Github className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                  {item.demo_url && (
                    <a
                      href={item.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors group-hover:scale-110 transform transition-transform"
                      title="View Demo"
                    >
                      <Globe className="h-4 w-4 text-green-600" />
                    </a>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    onClick={() => editPortfolioItem(item)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePortfolioItem(item.id)}
                    className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all transform hover:scale-[1.02]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h3>
              <p className="text-gray-500 mb-6">No portfolio items match your current search criteria</p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioManagement;