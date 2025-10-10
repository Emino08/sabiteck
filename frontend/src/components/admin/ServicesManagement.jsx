import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Save, X, Eye, EyeOff,
  Image, Tag, Clock, CheckCircle, XCircle, Star, StarOff,
  Settings, Palette, TrendingUp, Award, Zap, Globe
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';
import { getErrorMessage, formatErrorMessage } from '../../utils/errorHandler';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'edit'
  const [editingService, setEditingService] = useState(null);
  const [currentService, setCurrentService] = useState({
    title: '',
    short_description: '',
    description: '',
    features: [],
    price: '',
    duration: '',
    category: '',
    image_url: '',
    icon: '',
    active: true,
    featured: false,
    order_position: 0
  });

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    draft: 0
  });

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/services/categories');
      if (response.success) {
        const categoriesData = response.data || [];
        setCategories(categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color || '#6366F1'
        })));
      }
    } catch (error) {
      console.error('Error loading service categories:', error);
      setCategories([]);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.success) {
        const servicesData = response.data || response.recent || [];
        setServices(servicesData);

        // Calculate stats
        const total = servicesData.length;
        const active = servicesData.filter(s => s.active).length;
        const featured = servicesData.filter(s => s.popular || s.featured).length;
        const draft = total - active;

        setStats({ total, active, featured, draft });
      } else {
        toast.error(response.message || response.error || 'Failed to load services');
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error(formatErrorMessage(error, 'Failed to load services'));
    } finally {
      setLoading(false);
    }
  };

  const saveService = async () => {
    if (!currentService.title || !currentService.short_description) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      const processedService = {
        ...currentService,
        features: typeof currentService.features === 'string'
          ? currentService.features.split('\n').filter(f => f.trim())
          : currentService.features
      };

      const response = await apiRequest(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedService)
      });

      if (response.success) {
        toast.success(editingService ? 'Service updated successfully!' : 'Service created successfully!');
        resetForm();
        loadServices();
        setShowModal(false);
      } else {
        toast.error(response.message || response.error || 'Failed to save service');
      }
    } catch (error) {
      toast.error(formatErrorMessage(error, 'Failed to save service'));
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    const serviceName = service ? service.title : 'this service';

    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 max-w-md">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Delete Service</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete <strong className="text-gray-900">{serviceName}</strong>?</p>
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
                const response = await apiRequest(`/api/admin/services/${serviceId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.success) {
                  toast.success('Service deleted successfully!');
                  loadServices();
                } else {
                  toast.error(response.message || response.error || 'Failed to delete service');
                }
              } catch (error) {
                toast.error(formatErrorMessage(error, 'Failed to delete service'));
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

  const editService = (service) => {
    setEditingService(service);
    setCurrentService({
      ...service,
      features: Array.isArray(service.features)
        ? service.features.join('\n')
        : (service.features || '')
    });
    setModalType('edit');
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalType('add');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setCurrentService({
      title: '',
      short_description: '',
      description: '',
      features: [],
      price: '',
      duration: '',
      category: '',
      image_url: '',
      icon: '',
      active: true,
      featured: false,
      order_position: 0
    });
    setShowModal(false);
    setModalType('');
  };

  const toggleServiceStatus = async (serviceId, field, value) => {
    try {
      const token = localStorage.getItem('auth_token');
      await apiRequest(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });

      toast.success('Service updated successfully!');
      loadServices();
    } catch (error) {
      toast.error(formatErrorMessage(error, 'Failed to update service'));
    }
  };

  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-8">
      {/* Premium Header Section */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden shadow-2xl">
        <CardContent className="p-8 relative">
          <div className="absolute top-4 right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-indigo-500/20 rounded-full blur-lg"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                  🚀 Services Management
                </h1>
                <p className="text-blue-200 text-lg opacity-90">
                  Create, manage, and optimize your professional services portfolio
                </p>
              </div>
              <Button
                onClick={openAddModal}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Service
              </Button>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/30 rounded-lg">
                    <Globe className="h-6 w-6 text-blue-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-blue-200 text-sm">Total Services</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.active}</div>
                    <div className="text-green-200 text-sm">Active Services</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/30 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.featured}</div>
                    <div className="text-yellow-200 text-sm">Featured Services</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/30 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-200" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.draft}</div>
                    <div className="text-red-200 text-sm">Inactive Services</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Search and Controls */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="🔍 Search services, categories, features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50 focus:from-blue-50 focus:to-indigo-50 rounded-xl shadow-inner"
              />
            </div>

            <div className="flex space-x-3">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105"
                  style={{
                    backgroundColor: cat.color + '20',
                    color: cat.color,
                    border: `1px solid ${cat.color}40`
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="flex justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="text-gray-600 text-lg">Loading premium services...</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service, index) => {
            const categoryColor = categories.find(cat => cat.name === service.category)?.color || '#6366F1';
            const gradientClass = [
              'from-blue-500 to-indigo-600',
              'from-purple-500 to-pink-600',
              'from-green-500 to-teal-600',
              'from-orange-500 to-red-600',
              'from-teal-500 to-cyan-600',
              'from-pink-500 to-rose-600'
            ][index % 6];

            return (
              <Card
                key={service.id}
                className="group border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-2 group-hover:scale-105 transition-transform duration-300">
                            {service.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm border border-white/30"
                            >
                              {service.category || 'General'}
                            </span>
                            {(service.popular || service.featured) && (
                              <Star className="h-4 w-4 text-yellow-300 fill-current animate-pulse" />
                            )}
                          </div>
                        </div>
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-16 h-16 object-cover rounded-xl ml-4 border-2 border-white/30 shadow-lg"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-white/90">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{service.pricing || 'Contact for pricing'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{service.timeline || service.duration || 'Flexible'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {service.short_description}
                    </p>

                    {/* Features Preview */}
                    {service.features && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Features</div>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(service.features) ? service.features : JSON.parse(service.features || '[]'))
                            .slice(0, 3).map((feature, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status and Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleServiceStatus(service.id, 'active', !service.active)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                            service.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {service.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          <span>{service.active ? 'Active' : 'Inactive'}</span>
                        </button>

                        <button
                          onClick={() => toggleServiceStatus(service.id, 'popular', !(service.popular || service.featured))}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                            (service.popular || service.featured)
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {(service.popular || service.featured) ? <Star className="h-3 w-3 fill-current" /> : <StarOff className="h-3 w-3" />}
                          <span>Featured</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                      <Button
                        size="sm"
                        onClick={() => editService(service)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Service
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteService(service.id)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredServices.length === 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-6">
              <Settings className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Services Found</h3>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              {searchTerm
                ? `No services match "${searchTerm}". Try adjusting your search terms.`
                : "Start building your services portfolio by creating your first professional service."
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openAddModal}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Service
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Premium Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-in fade-in duration-300">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-white/20 animate-in slide-in-from-bottom-10 duration-500">

              {/* Premium Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold">
                      {modalType === 'edit' ? '✨ Edit Service' : '🚀 Create New Service'}
                    </h3>
                    <p className="text-blue-100 text-lg">
                      {modalType === 'edit'
                        ? 'Update your service details and enhance your offering'
                        : 'Build a professional service that showcases your expertise'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-300 backdrop-blur-sm"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                        <CardTitle className="text-xl text-gray-800 flex items-center space-x-2">
                          <Settings className="h-5 w-5 text-blue-600" />
                          <span>Service Details</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Title *</label>
                          <Input
                            value={currentService.title}
                            onChange={(e) => setCurrentService({...currentService, title: e.target.value})}
                            placeholder="Service title"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <select
                              value={currentService.category}
                              onChange={(e) => setCurrentService({...currentService, category: e.target.value})}
                              className="w-full px-3 py-2 border border-input rounded-md"
                            >
                              <option value="">Select category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Price</label>
                            <Input
                              value={currentService.price}
                              onChange={(e) => setCurrentService({...currentService, price: e.target.value})}
                              placeholder="e.g., $299 or Free"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Short Description *</label>
                          <textarea
                            value={currentService.short_description}
                            onChange={(e) => setCurrentService({...currentService, short_description: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md"
                            rows={3}
                            placeholder="Brief description for service cards"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Full Description</label>
                          <textarea
                            value={currentService.description}
                            onChange={(e) => setCurrentService({...currentService, description: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md"
                            rows={6}
                            placeholder="Detailed service description"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Features (one per line)</label>
                          <textarea
                            value={currentService.features}
                            onChange={(e) => setCurrentService({...currentService, features: e.target.value})}
                            className="w-full px-3 py-2 border border-input rounded-md"
                            rows={5}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="active"
                            checked={currentService.active}
                            onChange={(e) => setCurrentService({...currentService, active: e.target.checked})}
                          />
                          <label htmlFor="active" className="text-sm">Active</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="featured"
                            checked={currentService.featured}
                            onChange={(e) => setCurrentService({...currentService, featured: e.target.checked})}
                          />
                          <label htmlFor="featured" className="text-sm">Featured</label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Duration</label>
                          <Input
                            value={currentService.duration}
                            onChange={(e) => setCurrentService({...currentService, duration: e.target.value})}
                            placeholder="e.g., 2-4 weeks"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Order Position</label>
                          <Input
                            type="number"
                            value={currentService.order_position}
                            onChange={(e) => setCurrentService({...currentService, order_position: parseInt(e.target.value) || 0})}
                            placeholder="0"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Media</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Image URL</label>
                          <Input
                            value={currentService.image_url}
                            onChange={(e) => setCurrentService({...currentService, image_url: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                          />
                          {currentService.image_url && (
                            <img
                              src={currentService.image_url}
                              alt="Preview"
                              className="mt-2 w-full h-32 object-cover rounded"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Icon</label>
                          <Input
                            value={currentService.icon}
                            onChange={(e) => setCurrentService({...currentService, icon: e.target.value})}
                            placeholder="Icon name or URL"
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
                  <Button onClick={saveService} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
