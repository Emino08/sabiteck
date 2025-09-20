import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import Modal from '../ui/modal';
import ConfirmModal from '../ui/confirm-modal';
import {
  Save,
  RefreshCw,
  Settings,
  Globe,
  Mail,
  Shield,
  BarChart3,
  Palette,
  Building,
  Search,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const SettingsManager = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [deletingSetting, setDeleteSetting] = useState(null);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    label: '',
    type: 'text',
    description: ''
  });

  const categories = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'site', label: 'Site Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social_media', label: 'Social Media', icon: Globe }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings || {});
        } else {
          setError(data.error || 'Failed to fetch settings');
        }
      } else {
        setError('Failed to fetch settings from server');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category]?.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      ) || []
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Settings saved successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to save settings');
        }
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Modal handlers
  const handleEditSetting = (setting) => {
    setEditingSetting({ ...setting, category: activeCategory });
    setShowEditModal(true);
  };

  const handleAddSetting = () => {
    setNewSetting({
      key: '',
      value: '',
      label: '',
      type: 'text',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleDeleteSetting = (setting) => {
    setDeleteSetting({ ...setting, category: activeCategory });
    setShowDeleteModal(true);
  };

  const handleSaveEditedSetting = async () => {
    if (!editingSetting) return;

    try {
      setSaving(true);
      setError(null);

      // Save the edited setting to the backend
      const settingsToSave = {
        [editingSetting.category]: [editingSetting]
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          handleSettingChange(editingSetting.category, editingSetting.key, editingSetting.value);
          setShowEditModal(false);
          setEditingSetting(null);

          setSuccess('Setting updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to update setting');
        }
      } else {
        setError('Failed to update setting');
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNewSetting = async () => {
    if (!newSetting.key || !newSetting.label) {
      setError('Key and label are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Add the new setting to the backend
      const settingsToSave = {
        [activeCategory]: [newSetting]
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          const currentCategorySettings = settings[activeCategory] || [];
          const updatedSettings = [...currentCategorySettings, newSetting];

          setSettings(prev => ({
            ...prev,
            [activeCategory]: updatedSettings
          }));

          setShowAddModal(false);
          setNewSetting({
            key: '',
            value: '',
            label: '',
            type: 'text',
            description: ''
          });

          setSuccess('Setting added successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to add setting');
        }
      } else {
        setError('Failed to add setting');
      }
    } catch (err) {
      console.error('Error adding setting:', err);
      setError('Failed to add setting');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSetting) return;

    try {
      setSaving(true);
      setError(null);

      // For delete, we need to implement a delete endpoint or use a special method
      // For now, we'll filter out the setting and save the remaining ones
      const currentCategorySettings = settings[deletingSetting.category] || [];
      const remainingSettings = currentCategorySettings.filter(
        setting => setting.key !== deletingSetting.key
      );

      const settingsToSave = {
        [deletingSetting.category]: remainingSettings
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setSettings(prev => ({
            ...prev,
            [deletingSetting.category]: remainingSettings
          }));

          setShowDeleteModal(false);
          setDeleteSetting(null);

          setSuccess('Setting deleted successfully!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || 'Failed to delete setting');
        }
      } else {
        setError('Failed to delete setting');
      }
    } catch (err) {
      console.error('Error deleting setting:', err);
      setError('Failed to delete setting');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting, category) => {
    const isPassword = setting.type === 'password' || setting.key.toLowerCase().includes('password');
    const inputType = isPassword && !showPasswords ? 'password' :
                     setting.type === 'email' ? 'email' :
                     setting.type === 'number' ? 'number' : 'text';

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={setting.value === 'true' || setting.value === '1' || setting.value === true}
              onCheckedChange={(checked) =>
                handleSettingChange(category, setting.key, checked ? 'true' : 'false')
              }
            />
            <span className="text-sm text-gray-600">
              {setting.value === 'true' || setting.value === '1' || setting.value === true ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            value={setting.value || ''}
            onChange={(e) => handleSettingChange(category, setting.key, e.target.value)}
            placeholder={setting.description || setting.label}
            rows={3}
            className="w-full"
          />
        );

      default:
        return (
          <div className="relative">
            <Input
              type={inputType}
              value={setting.value || ''}
              onChange={(e) => handleSettingChange(category, setting.key, e.target.value)}
              placeholder={setting.description || setting.label}
              className="w-full"
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        );
    }
  };

  const getFilteredSettings = (categorySettings) => {
    if (!searchTerm) return categorySettings || [];

    return (categorySettings || []).filter(setting =>
      setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (setting.description && setting.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Input
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button
            onClick={handleAddSetting}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Setting
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
          <Button variant="outline" onClick={fetchSettings}>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const categorySettings = settings[category.id] || [];
                  const hasSettings = categorySettings.length > 0;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeCategory === category.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : hasSettings
                          ? 'hover:bg-gray-50 text-gray-700'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasSettings}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{category.label}</span>
                      {hasSettings && (
                        <Badge variant="secondary" className="text-xs">
                          {categorySettings.length}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const category = categories.find(c => c.id === activeCategory);
                  const Icon = category?.icon || Settings;
                  return <Icon className="h-5 w-5" />;
                })()}
                {categories.find(c => c.id === activeCategory)?.label || 'Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const categorySettings = getFilteredSettings(settings[activeCategory]);

                if (categorySettings.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No matching settings' : 'No settings available'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm
                          ? 'Try adjusting your search terms.'
                          : 'This category has no configurable settings.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {categorySettings.map((setting, index) => (
                      <div key={setting.key || index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            {setting.label}
                          </label>
                          <div className="flex items-center gap-2">
                            {setting.updated_at && (
                              <span className="text-xs text-gray-500">
                                Updated: {new Date(setting.updated_at).toLocaleDateString()}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSetting(setting)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSetting(setting)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {renderSettingInput(setting, activeCategory)}

                        {setting.description && (
                          <p className="text-xs text-gray-500">{setting.description}</p>
                        )}

                        {index < categorySettings.length - 1 && (
                          <hr className="border-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Setting Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Setting"
        size="md"
      >
        <div className="p-6 space-y-4">
          {editingSetting && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key
                </label>
                <Input
                  value={editingSetting.key}
                  onChange={(e) => setEditingSetting({ ...editingSetting, key: e.target.value })}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </label>
                <Input
                  value={editingSetting.label}
                  onChange={(e) => setEditingSetting({ ...editingSetting, label: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                {editingSetting.type === 'boolean' ? (
                  <Switch
                    checked={editingSetting.value === 'true' || editingSetting.value === '1' || editingSetting.value === true}
                    onCheckedChange={(checked) =>
                      setEditingSetting({ ...editingSetting, value: checked ? 'true' : 'false' })
                    }
                  />
                ) : editingSetting.type === 'textarea' ? (
                  <Textarea
                    value={editingSetting.value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={editingSetting.type === 'password' ? 'password' :
                          editingSetting.type === 'email' ? 'email' :
                          editingSetting.type === 'number' ? 'number' : 'text'}
                    value={editingSetting.value}
                    onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editingSetting.description || ''}
                  onChange={(e) => setEditingSetting({ ...editingSetting, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditedSetting} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Add Setting Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Setting"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key
            </label>
            <Input
              value={newSetting.key}
              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
              placeholder="setting_key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <Input
              value={newSetting.label}
              onChange={(e) => setNewSetting({ ...newSetting, label: e.target.value })}
              placeholder="Setting Label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={newSetting.type}
              onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="textarea">Textarea</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            {newSetting.type === 'boolean' ? (
              <Switch
                checked={newSetting.value === 'true'}
                onCheckedChange={(checked) =>
                  setNewSetting({ ...newSetting, value: checked ? 'true' : 'false' })
                }
              />
            ) : newSetting.type === 'textarea' ? (
              <Textarea
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                rows={3}
              />
            ) : (
              <Input
                type={newSetting.type === 'password' ? 'password' :
                      newSetting.type === 'email' ? 'email' :
                      newSetting.type === 'number' ? 'number' : 'text'}
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={newSetting.description}
              onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
              rows={2}
              placeholder="Description of this setting"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewSetting} disabled={saving}>
              {saving ? 'Adding...' : 'Add Setting'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Setting"
        message={`Are you sure you want to delete the setting "${deletingSetting?.label}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SettingsManager;