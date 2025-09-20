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
  const [projectTypes, setProjectTypes] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    loadPortfolioItems();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/portfolio/categories');
      if (response.success) {
        const categoriesData = response.categories || [];
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
        toast.error('Failed to load portfolio items');
      }
    } catch (error) {
      toast.error('Failed to load portfolio items');
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
        toast.error(response.message || 'Failed to save portfolio item');
      }
    } catch (error) {
      toast.error('Failed to save portfolio item');
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolioItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

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
        toast.error('Failed to delete portfolio item');
      }
    } catch (error) {
      toast.error('Failed to delete portfolio item');
    }
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
      toast.error('Failed to update portfolio item');
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
          </h2>
          <Button onClick={() => setShowEditor(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title *</label>
                  <Input
                    value={currentItem.title}
                    onChange={(e) => setCurrentItem({...currentItem, title: e.target.value})}
                    placeholder="Amazing Web Application"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={currentItem.category}
                      onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Type</label>
                    <select
                      value={currentItem.project_type}
                      onChange={(e) => setCurrentItem({...currentItem, project_type: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Short Description</label>
                  <textarea
                    value={currentItem.short_description}
                    onChange={(e) => setCurrentItem({...currentItem, short_description: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={2}
                    placeholder="Brief description for portfolio cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Full Description *</label>
                  <textarea
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Key Features (one per line)</label>
                  <textarea
                    value={currentItem.features}
                    onChange={(e) => setCurrentItem({...currentItem, features: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={4}
                    placeholder="User authentication&#10;Real-time notifications&#10;Mobile responsive"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Results Achieved (one per line)</label>
                  <textarea
                    value={currentItem.results_achieved}
                    onChange={(e) => setCurrentItem({...currentItem, results_achieved: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={3}
                    placeholder="50% increase in user engagement&#10;Reduced processing time by 80%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Challenges Solved (one per line)</label>
                  <textarea
                    value={currentItem.challenges_solved}
                    onChange={(e) => setCurrentItem({...currentItem, challenges_solved: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={3}
                    placeholder="Complex data integration&#10;Performance optimization"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Live URL</label>
                  <Input
                    value={currentItem.live_url}
                    onChange={(e) => setCurrentItem({...currentItem, live_url: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub URL</label>
                  <Input
                    value={currentItem.github_url}
                    onChange={(e) => setCurrentItem({...currentItem, github_url: e.target.value})}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Demo URL</label>
                  <Input
                    value={currentItem.demo_url}
                    onChange={(e) => setCurrentItem({...currentItem, demo_url: e.target.value})}
                    placeholder="https://demo.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Case Study URL</label>
                  <Input
                    value={currentItem.case_study_url}
                    onChange={(e) => setCurrentItem({...currentItem, case_study_url: e.target.value})}
                    placeholder="https://blog.example.com/case-study"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testimonial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Testimonial</label>
                  <textarea
                    value={currentItem.testimonial}
                    onChange={(e) => setCurrentItem({...currentItem, testimonial: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
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
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={currentItem.start_date}
                    onChange={(e) => setCurrentItem({...currentItem, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={currentItem.end_date}
                    onChange={(e) => setCurrentItem({...currentItem, end_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={currentItem.status}
                    onChange={(e) => setCurrentItem({...currentItem, status: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
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

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_in_portfolio"
                    checked={currentItem.show_in_portfolio}
                    onChange={(e) => setCurrentItem({...currentItem, show_in_portfolio: e.target.checked})}
                  />
                  <label htmlFor="show_in_portfolio" className="text-sm">Show in Portfolio</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={currentItem.featured}
                    onChange={(e) => setCurrentItem({...currentItem, featured: e.target.checked})}
                  />
                  <label htmlFor="featured" className="text-sm">Featured Project</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={currentItem.order_position}
                    onChange={(e) => setCurrentItem({...currentItem, order_position: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URLs (one per line)</label>
                  <textarea
                    value={currentItem.images}
                    onChange={(e) => setCurrentItem({...currentItem, images: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={5}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={savePortfolioItem} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (editingItem ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Portfolio Management</h2>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{item.category}</p>
                    <p className="text-sm text-blue-600 mb-2">{item.client_name}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{item.short_description || item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                  </span>
                  {item.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    {item.live_url && (
                      <a href={item.live_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                      </a>
                    )}
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => toggleItemStatus(item.id, 'show_in_portfolio', !item.show_in_portfolio)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      item.show_in_portfolio 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.show_in_portfolio ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{item.show_in_portfolio ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editPortfolioItem(item)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePortfolioItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No portfolio items found</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioManagement;
