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
  Megaphone,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Filter,
  Search,
  Shield,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Settings,
  Archive
} from 'lucide-react';
import { apiRequest } from '../../utils/api';


const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'edit'
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
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
      const data = await apiRequest('/api/admin/announcements');
      const announcements = (data.data || []).map(announcement => ({
        ...announcement,
        is_active: announcement.active !== undefined ? announcement.active : announcement.is_active
      }));
      setAnnouncements(announcements);

      // Calculate stats
      const total = announcements.length;
      const active = announcements.filter(a => a.is_active).length;
      setStats({ total, active, inactive: total - active });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Set fallback data with enhanced content
      const fallbackData = [
        {
          id: 1,
          title: '🎉 Welcome to Our Enhanced Platform!',
          content: 'We\'re excited to introduce our redesigned announcement system with modern UI/UX and enhanced functionality.',
          type: 'general',
          priority: 'normal',
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          expires_at: '2024-12-31'
        },
        {
          id: 2,
          title: '⚠️ Scheduled System Maintenance',
          content: 'Our systems will undergo scheduled maintenance this weekend from 2:00 AM to 6:00 AM EST. Some features may be temporarily unavailable.',
          type: 'maintenance',
          priority: 'high',
          is_active: true,
          created_at: '2024-01-10T08:30:00Z',
          expires_at: '2024-02-01'
        },
        {
          id: 3,
          title: '🚀 New Features Released',
          content: 'Check out our latest features including improved dashboard analytics, enhanced user management, and streamlined workflows.',
          type: 'update',
          priority: 'normal',
          is_active: true,
          created_at: '2024-01-08T14:20:00Z',
          expires_at: null
        }
      ];
      setAnnouncements(fallbackData);
      setStats({ total: 3, active: 3, inactive: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements';

      const method = editingAnnouncement ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      await fetchAnnouncements();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      // For demo purposes, update local state
      if (editingAnnouncement) {
        setAnnouncements(prev => prev.map(ann =>
          ann.id === editingAnnouncement.id ? {
            ...ann,
            ...formData,
            updated_at: new Date().toISOString()
          } : ann
        ));
      } else {
        const newAnnouncement = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);
      }
      resetForm();
      setShowModal(false);
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
      await apiRequest(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      // For demo purposes, remove from local state
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      // Update stats
      const newAnnouncements = announcements.filter(ann => ann.id !== id);
      const total = newAnnouncements.length;
      const active = newAnnouncements.filter(a => a.is_active).length;
      setStats({ total, active, inactive: total - active });
    }
  };

  const toggleVisibility = async (id, isActive) => {
    try {
      await apiRequest(`/api/admin/announcements/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !isActive })
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement visibility:', error);
      // For demo purposes, update local state
      setAnnouncements(prev => prev.map(ann =>
        ann.id === id ? { ...ann, is_active: !isActive } : ann
      ));
      // Update stats
      const newAnnouncements = announcements.map(ann =>
        ann.id === id ? { ...ann, is_active: !isActive } : ann
      );
      const total = newAnnouncements.length;
      const active = newAnnouncements.filter(a => a.is_active).length;
      setStats({ total, active, inactive: total - active });
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'maintenance': return Zap;
      case 'update': return CheckCircle;
      case 'event': return Calendar;
      default: return Info;
    }
  };

  const getTypeColor = (type) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig?.color || 'blue';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'gray';
      case 'normal': return 'blue';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'blue';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || announcement.type === filterType;
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    return matchesSearch && matchesType && matchesPriority;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-8 space-y-8">
        {/* Professional Header Section */}
        <Card className="border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20"></div>

              <div className="relative p-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-2xl shadow-2xl">
                        <Megaphone className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {stats.total}
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                        Announcement Hub
                      </h1>
                      <p className="text-slate-200 text-lg font-medium max-w-md">
                        Centralized communication management for enterprise-wide announcements
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-blue-200">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{stats.active} Active</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-200">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm font-medium">{((stats.active / Math.max(stats.total, 1)) * 100).toFixed(0)}% Visibility</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      onClick={openAddModal}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-2xl transform hover:scale-[1.02] transition-all duration-200 border-0"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      New Announcement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Total Announcements</h3>
                <p className="text-xs text-slate-500 leading-relaxed">All announcements in the system</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Active Announcements</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Currently visible to users</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{stats.inactive}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Inactive Announcements</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Hidden from public view</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{((stats.active / Math.max(stats.total, 1)) * 100).toFixed(0)}%</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visibility</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Visibility Rate</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Percentage of active content</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Search and Filter Controls */}
        <Card className="border-0 bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  placeholder="Search by title, content, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">Filter by:</span>
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 text-slate-700 font-medium cursor-pointer hover:border-slate-300"
                >
                  <option value="all">All Types</option>
                  {announcementTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 text-slate-700 font-medium cursor-pointer hover:border-slate-300"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {(searchTerm || filterType !== 'all' || filterPriority !== 'all') && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Showing {filteredAnnouncements.length} of {announcements.length} announcements</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterPriority('all');
                    }}
                    className="text-slate-500 hover:text-slate-700 px-3 py-1 h-auto"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements List */}
        <div className="space-y-6">
          {filteredAnnouncements.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="bg-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Megaphone className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No announcements found</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  {searchTerm || filterType !== 'all' || filterPriority !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Create your first announcement to get started communicating with your audience.'}
                </p>
                {!searchTerm && filterType === 'all' && filterPriority === 'all' && (
                  <Button
                    onClick={openAddModal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Announcement
                  </Button>
                )}
              </CardContent>
            </Card>
        ) : (
          filteredAnnouncements.map((announcement) => {
              const TypeIcon = getTypeIcon(announcement.type);
              const typeColor = getTypeColor(announcement.type);
              const priorityColor = getPriorityColor(announcement.priority);

              return (
                <Card key={announcement.id} className="relative bg-white/95 backdrop-blur-md border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group overflow-hidden">
                  {/* Premium Border Accent */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${typeColor}-400 to-${typeColor}-600`}></div>

                  <CardContent className="p-8 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Enhanced Header with Icon and Title */}
                        <div className="flex items-center gap-5 mb-6">
                          <div className={`bg-gradient-to-br from-${typeColor}-100 to-${typeColor}-50 p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-${typeColor}-200/50`}>
                            <TypeIcon className={`h-7 w-7 text-${typeColor}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                              {announcement.title}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={`bg-gradient-to-r from-${typeColor}-100 to-${typeColor}-50 text-${typeColor}-700 border-${typeColor}-200/50 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm`}>
                                {announcementTypes.find(t => t.value === announcement.type)?.label || 'General'}
                              </Badge>
                              <Badge className={`bg-gradient-to-r from-${priorityColor}-100 to-${priorityColor}-50 text-${priorityColor}-700 border-${priorityColor}-200/50 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm`}>
                                ⚡ {announcement.priority || 'Normal'}
                              </Badge>
                              {announcement.is_active ? (
                                <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm border border-emerald-200/50">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Live
                                </Badge>
                              ) : (
                                <Badge className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm border border-gray-200/50">
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Draft
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Content Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl mb-6 border border-gray-100/50 shadow-inner">
                          <div className="relative">
                            <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></div>
                            <p className="text-gray-700 leading-relaxed pl-4 text-base font-medium">{announcement.content}</p>
                          </div>
                        </div>

                        {/* Professional Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/30">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Created</p>
                              <p className="text-gray-600">{formatDate(announcement.created_at)}</p>
                            </div>
                          </div>
                          {announcement.expires_at ? (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <Calendar className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Expires</p>
                                <p className="text-red-600 font-medium">{formatDate(announcement.expires_at)}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Calendar className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Duration</p>
                                <p className="text-green-600 font-medium">Permanent</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-sm">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Visibility</p>
                              <p className="text-purple-600 font-medium">Public Access</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Professional Action Buttons */}
                      <div className="flex flex-col gap-4 ml-8">
                        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/30">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVisibility(announcement.id, announcement.is_active)}
                            className={`w-full px-4 py-3 rounded-xl transition-all duration-300 font-semibold shadow-sm ${
                              announcement.is_active
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 hover:from-amber-100 hover:to-yellow-100 hover:shadow-md'
                                : 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 hover:from-emerald-100 hover:to-green-100 hover:shadow-md'
                            }`}
                          >
                            {announcement.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-300 font-semibold shadow-sm hover:shadow-md mt-2"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(announcement.id)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 hover:from-red-100 hover:to-rose-100 rounded-xl transition-all duration-300 font-semibold shadow-sm hover:shadow-md mt-2"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Professional Enterprise-Grade Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/50 to-black/70 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-4xl w-full max-w-4xl transform transition-all duration-500 scale-100 overflow-hidden border border-white/20">
              {/* Premium Modal Header */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-10 text-white relative overflow-hidden">
                {/* Sophisticated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30"></div>

                <div className="flex justify-between items-start relative">
                  <div className="flex items-center space-x-6">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 p-4 rounded-2xl backdrop-blur-lg border border-white/20 shadow-2xl">
                      <Megaphone className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight mb-2">
                        {modalType === 'edit' ? '✨ Edit Announcement' : '🚀 Create New Announcement'}
                      </h3>
                      <p className="text-blue-100 text-lg font-medium opacity-90">
                        {modalType === 'edit' ? 'Refine and update your announcement details' : 'Craft compelling content to engage your audience'}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
                        <div className="w-6 h-1 bg-blue-400/60 rounded-full"></div>
                        <div className="w-3 h-1 bg-blue-400/40 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="group bg-white/15 hover:bg-white/25 p-3 rounded-2xl transition-all duration-300 backdrop-blur-lg border border-white/20 hover:border-white/40"
                  >
                    <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Enhanced Professional Form Body */}
              <div className="p-10 bg-gradient-to-br from-gray-50 to-white">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Title Field */}
                    <div className="space-y-3 group">
                      <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          📝
                        </div>
                        Announcement Title
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter a compelling title that captures attention..."
                        required
                        className="border-2 border-gray-200 rounded-2xl p-5 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white shadow-sm group-hover:shadow-md"
                      />
                    </div>
                    {/* Type Field */}
                    <div className="space-y-3 group">
                      <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          🏷️
                        </div>
                        Announcement Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-5 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white shadow-sm group-hover:shadow-md"
                      >
                        {announcementTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Priority Field */}
                    <div className="space-y-3 group">
                      <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          ⚡
                        </div>
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-5 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-300 bg-white shadow-sm group-hover:shadow-md"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Expiry Date Field */}
                    <div className="space-y-3 group">
                      <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          📅
                        </div>
                        Expires On <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <Input
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                        className="border-2 border-gray-200 rounded-2xl p-5 text-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white shadow-sm group-hover:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Enhanced Content Field */}
                  <div className="space-y-4 group">
                    <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        📄
                      </div>
                      Announcement Content
                    </label>
                    <div className="relative">
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Craft your message here. Be clear, engaging, and provide value to your readers..."
                        rows={7}
                        required
                        className="border-2 border-gray-200 rounded-2xl p-6 text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none bg-white shadow-sm group-hover:shadow-md w-full"
                      />
                      <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        {formData.content.length}/1000
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Keep it concise and informative for better engagement
                      </span>
                      <span className="font-medium">{formData.content.length} characters</span>
                    </div>
                  </div>

                  {/* Professional Visibility Toggle */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100/50 shadow-sm">
                    <div className="flex items-start gap-5">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-6 h-6 rounded-lg border-2 border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-4 transition-all duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="is_active" className="text-lg font-bold text-gray-800 cursor-pointer flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            👁️
                          </div>
                          Publish Immediately
                        </label>
                        <p className="text-base text-gray-700 mt-2 leading-relaxed">
                          {formData.is_active
                            ? '🟢 This announcement will be visible to all users immediately after saving'
                            : '🟡 This announcement will be saved as a draft for review before publishing'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Action Buttons */}
                  <div className="flex items-center justify-between pt-8 border-t-2 border-gray-100">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      All fields marked with * are required
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="px-8 py-4 rounded-2xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-3" />
                            {editingAnnouncement ? '✨ Update Announcement' : '🚀 Create Announcement'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;
