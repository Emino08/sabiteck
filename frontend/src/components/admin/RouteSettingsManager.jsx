import React, { useState, useEffect } from 'react';
import { useRouteSettings } from '../../contexts/RouteSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import Modal from '../ui/modal';
import ConfirmModal from '../ui/confirm-modal';
import {
  Save,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Navigation,
  ArrowUpDown
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const RouteSettingsManager = () => {
  const { fetchRouteSettings: refreshGlobalRoutes } = useRouteSettings();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deletingRoute, setDeletingRoute] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    route_name: '',
    display_name: '',
    description: '',
    is_visible: true,
    display_order: 0
  });

  useEffect(() => {
    fetchRouteSettings();
  }, []);

  const fetchRouteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/routes/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRoutes(data.routes || []);
        } else {
          setError(data.error || 'Failed to fetch route settings');
        }
      } else {
        setError('Failed to fetch route settings from server');
        // For demo purposes, show some dummy data
        setRoutes([
          { route_name: 'home', display_name: 'Home', description: 'Main landing page', is_visible: true, display_order: 1 },
          { route_name: 'about', display_name: 'About Us', description: 'Company information', is_visible: true, display_order: 2 },
          { route_name: 'services', display_name: 'Services', description: 'Our services', is_visible: true, display_order: 3 },
          { route_name: 'portfolio', display_name: 'Portfolio', description: 'Our work', is_visible: true, display_order: 4 },
          { route_name: 'team', display_name: 'Team', description: 'Our team', is_visible: true, display_order: 5 },
          { route_name: 'jobs', display_name: 'Jobs', description: 'Career opportunities', is_visible: true, display_order: 6 },
          { route_name: 'scholarships', display_name: 'Scholarships', description: 'Educational funding', is_visible: true, display_order: 7 },
          { route_name: 'announcements', display_name: 'Announcements', description: 'Latest news', is_visible: true, display_order: 8 },
          { route_name: 'contact', display_name: 'Contact', description: 'Get in touch', is_visible: true, display_order: 9 }
        ]);
      }
    } catch (err) {
      console.error('Error fetching route settings:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteVisibility = async (routeName, currentVisibility) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/admin/route-settings/${routeName}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_visible: !currentVisibility })
      });

      if (response.ok) {
        setRoutes(prev => prev.map(route =>
          route.route_name === routeName
            ? { ...route, is_visible: !currentVisibility }
            : route
        ));
        setSuccess('Route visibility updated successfully');
        setTimeout(() => setSuccess(null), 3000);

        // Refresh the global route settings context
        refreshGlobalRoutes();
      } else {
        setError('Failed to update route visibility');
        // For demo purposes, update local state
        setRoutes(prev => prev.map(route =>
          route.route_name === routeName
            ? { ...route, is_visible: !currentVisibility }
            : route
        ));

        // Refresh to ensure consistency with database
        refreshGlobalRoutes();
      }
    } catch (err) {
      console.error('Error updating route visibility:', err);
      setError('Failed to update route visibility');
    } finally {
      setSaving(false);
    }
  };

  const saveAllRoutes = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/route-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ routes })
      });

      if (response.ok) {
        setSuccess('All route settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save route settings');
      }
    } catch (err) {
      console.error('Error saving route settings:', err);
      setError('Failed to save route settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (route) => {
    setFormData({
      route_name: route.route_name,
      display_name: route.display_name,
      description: route.description,
      is_visible: route.is_visible,
      display_order: route.display_order || 0
    });
    setEditingRoute(route.route_name);
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      if (editingRoute) {
        // Update existing route
        const response = await fetch(`${API_BASE_URL}/api/admin/route-settings/${editingRoute}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          setRoutes(prev => prev.map(route =>
            route.route_name === editingRoute ? { ...formData } : route
          ));
          setSuccess('Route updated successfully');
        } else {
          setError('Failed to update route');
          // For demo purposes, update local state
          setRoutes(prev => prev.map(route =>
            route.route_name === editingRoute ? { ...formData } : route
          ));
        }
      } else {
        // Create new route
        const response = await fetch(`${API_BASE_URL}/api/admin/route-settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await fetchRouteSettings();
          setSuccess('Route created successfully');
        } else {
          setError('Failed to create route');
          // For demo purposes, add to local state
          setRoutes(prev => [...prev, { ...formData }]);
        }
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving route:', err);
      setError('Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (route) => {
    setDeletingRoute(route);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoute) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE_URL}/api/admin/route-settings/${deletingRoute.route_name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setRoutes(prev => prev.filter(route => route.route_name !== deletingRoute.route_name));
        setSuccess('Route deleted successfully');
      } else {
        setError('Failed to delete route');
        // For demo purposes, remove from local state
        setRoutes(prev => prev.filter(route => route.route_name !== deletingRoute.route_name));
      }
      setTimeout(() => setSuccess(null), 3000);
      setShowDeleteModal(false);
      setDeletingRoute(null);
    } catch (err) {
      console.error('Error deleting route:', err);
      setError('Failed to delete route');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      route_name: '',
      display_name: '',
      description: '',
      is_visible: true,
      display_order: (routes.length + 1) || 1
    });
    setEditingRoute(null);
    setShowEditModal(false);
    setShowAddModal(false);
  };

  const moveRoute = (routeName, direction) => {
    const routeIndex = routes.findIndex(r => r.route_name === routeName);
    if (routeIndex === -1) return;

    const newRoutes = [...routes];
    const targetIndex = direction === 'up' ? routeIndex - 1 : routeIndex + 1;

    if (targetIndex < 0 || targetIndex >= routes.length) return;

    // Swap the routes
    [newRoutes[routeIndex], newRoutes[targetIndex]] = [newRoutes[targetIndex], newRoutes[routeIndex]];

    // Update display orders
    newRoutes.forEach((route, index) => {
      route.display_order = index + 1;
    });

    setRoutes(newRoutes);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading route settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Navigation Route Management</h2>
          <p className="text-gray-600">
            Control which pages are visible in the navigation and manage their order
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Route
          </Button>
          <Button
            onClick={saveAllRoutes}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
          <Button variant="outline" onClick={fetchRouteSettings}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}


      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Current Navigation Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routes configured</h3>
              <p className="text-gray-500 mb-4">Add your first navigation route to get started.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {routes
                .sort((a, b) => a.display_order - b.display_order)
                .map((route, index) => (
                  <div
                    key={route.route_name}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveRoute(route.route_name, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-gray-900">
                          {route.display_order}
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-900">{route.display_name}</h3>
                          <p className="text-sm text-gray-500">/{route.route_name}</p>
                          {route.description && (
                            <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={route.is_visible ? "default" : "secondary"}>
                        {route.is_visible ? 'Visible' : 'Hidden'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRouteVisibility(route.route_name, route.is_visible)}
                        disabled={saving}
                        className="flex items-center gap-1"
                      >
                        {route.is_visible ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(route)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(route)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How Navigation Management Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• <strong>Route Name:</strong> The URL path for the page (e.g., "about" for /about)</p>
          <p>• <strong>Display Name:</strong> The text shown in the navigation menu</p>
          <p>• <strong>Display Order:</strong> Controls the order of items in the navigation (lower numbers appear first)</p>
          <p>• <strong>Visibility:</strong> Toggle whether the route appears in the public navigation</p>
          <p>• Changes are applied immediately when you toggle visibility or save routes</p>
        </CardContent>
      </Card>

      {/* Add Route Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Route"
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Name
              </label>
              <Input
                value={formData.route_name}
                onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
                placeholder="e.g., about, services, contact"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="About Us"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this page"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_visible_add"
                checked={formData.is_visible}
                onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_visible_add" className="text-sm font-medium text-gray-700">
                Visible in navigation
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Route Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Route"
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Name
              </label>
              <Input
                value={formData.route_name}
                onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
                placeholder="e.g., about, services, contact"
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="About Us"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this page"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_visible_edit"
                checked={formData.is_visible}
                onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_visible_edit" className="text-sm font-medium text-gray-700">
                Visible in navigation
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Updating...' : 'Update Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Route"
        message={`Are you sure you want to delete the route "${deletingRoute?.display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={saving}
      />
    </div>
  );
};

export default RouteSettingsManager;
