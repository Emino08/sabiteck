import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  Eye,
  EyeOff,
  Megaphone
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'edit'
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'normal',
    is_active: true,
    expires_at: ''
  });

  const announcementTypes = [
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'urgent', label: 'Urgent', color: 'red' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
    { value: 'update', label: 'Update', color: 'green' },
    { value: 'event', label: 'Event', color: 'purple' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const announcements = (data.data || data.announcements || []).map(announcement => ({
          ...announcement,
          is_active: announcement.active !== undefined ? announcement.active : announcement.is_active
        }));
        setAnnouncements(announcements);
      } else {
        console.error('Failed to fetch announcements');
        // Set dummy data for now
        setAnnouncements([
          {
            id: 1,
            title: 'Welcome to Our New Website!',
            content: 'We are excited to launch our new website with enhanced features and better user experience.',
            type: 'general',
            priority: 'normal',
            is_active: true,
            created_at: '2024-01-15',
            expires_at: '2024-12-31'
          },
          {
            id: 2,
            title: 'System Maintenance Scheduled',
            content: 'Please note that we will be performing scheduled maintenance on our systems this weekend.',
            type: 'maintenance',
            priority: 'high',
            is_active: true,
            created_at: '2024-01-10',
            expires_at: '2024-02-01'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Set dummy data as fallback
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const url = editingAnnouncement
        ? `${API_BASE_URL}/api/admin/announcements/${editingAnnouncement.id}`
        : `${API_BASE_URL}/api/admin/announcements`;

      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAnnouncements();
        resetForm();
        setShowModal(false);
      } else {
        console.error('Failed to save announcement');
        // For demo purposes, add to local state
        if (editingAnnouncement) {
          setAnnouncements(prev => prev.map(ann =>
            ann.id === editingAnnouncement.id ? { ...ann, ...formData } : ann
          ));
        } else {
          const newAnnouncement = {
            id: Date.now(),
            ...formData,
            created_at: new Date().toISOString().split('T')[0]
          };
          setAnnouncements(prev => [newAnnouncement, ...prev]);
        }
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      is_active: announcement.is_active,
      expires_at: announcement.expires_at || ''
    });
    setEditingAnnouncement(announcement);
    setModalType('edit');
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalType('add');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      } else {
        console.error('Failed to delete announcement');
        // For demo purposes, remove from local state
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      // For demo purposes, remove from local state
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    }
  };

  const toggleVisibility = async (id, isActive) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === id ? { ...ann, is_active: !isActive } : ann
        ));
      } else {
        console.error('Failed to toggle announcement visibility');
        // For demo purposes, update local state
        setAnnouncements(prev => prev.map(ann => 
          ann.id === id ? { ...ann, is_active: !isActive } : ann
        ));
      }
    } catch (error) {
      console.error('Error toggling announcement visibility:', error);
      // For demo purposes, update local state
      setAnnouncements(prev => prev.map(ann => 
        ann.id === id ? { ...ann, is_active: !isActive } : ann
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'normal',
      is_active: true,
      expires_at: ''
    });
    setEditingAnnouncement(null);
    setShowModal(false);
    setModalType('');
  };

  const getTypeColor = (type) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig?.color || 'blue';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'gray';
      case 'normal': return 'blue';
      case 'high': return 'yellow';
      case 'critical': return 'red';
      default: return 'blue';
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcement Management</h2>
          <p className="text-gray-600">Manage public announcements and notifications</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-500 mb-4">Create your first announcement to get started.</p>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <Badge variant="outline" className={`text-${getTypeColor(announcement.type)}-600 border-${getTypeColor(announcement.type)}-200`}>
                        {announcementTypes.find(t => t.value === announcement.type)?.label}
                      </Badge>
                      <Badge variant="outline" className={`text-${getPriorityColor(announcement.priority)}-600 border-${getPriorityColor(announcement.priority)}-200`}>
                        {announcement.priority}
                      </Badge>
                      {announcement.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                      {announcement.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(announcement.id, announcement.is_active)}
                      className="flex items-center gap-1"
                    >
                      {announcement.is_active ? (
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
                      onClick={() => handleEdit(announcement)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'edit' ? 'Edit Announcement' : 'Create New Announcement'}
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Announcement title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {announcementTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires On (Optional)
                      </label>
                      <Input
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Announcement content"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;
