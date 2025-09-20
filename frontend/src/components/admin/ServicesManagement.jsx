import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Save, X, Eye, EyeOff,
  Image, Tag, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';

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

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiRequest('/api/services/categories');
      if (response.success) {
        const categoriesData = response.categories || [];
        setCategories(categoriesData.map(cat => cat.name || cat));
      }
    } catch (error) {
      console.error('Error loading service categories:', error);
      setCategories([]);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/services');
      if (response.success) {
        // Use 'data' for full services list, fallback to 'recent' for dashboard
        setServices(response.data || response.recent || []);
      } else {
        toast.error('Failed to load services');
      }
    } catch (error) {
      toast.error('Failed to load services');
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
        toast.error(response.message || 'Failed to save service');
      }
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

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
        toast.error('Failed to delete service');
      }
    } catch (error) {
      toast.error('Failed to delete service');
    }
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
      toast.error('Failed to update service');
    }
  };

  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Services Management</h2>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{service.category}</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{service.short_description}</p>
                  </div>
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-16 h-16 object-cover rounded ml-4"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <span>{service.price || 'Contact for pricing'}</span>
                  <span>{service.duration || 'Flexible'}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleServiceStatus(service.id, 'active', !service.active)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                        service.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {service.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{service.active ? 'Active' : 'Inactive'}</span>
                    </button>
                    {service.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editService(service)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteService(service.id)}
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

      {!loading && filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No services found</p>
        </div>
      )}

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'edit' ? 'Edit Service' : 'Add New Service'}
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
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Service Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                                <option key={cat} value={cat}>{cat}</option>
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
