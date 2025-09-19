import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Pin, Star, Bell, ExternalLink, Download,
  Filter, Search, ChevronDown, AlertCircle, Info, CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const announcementTypes = [
    'general', 'urgent', 'maintenance', 'feature', 'event',
    'policy', 'deadline', 'celebration', 'warning', 'update'
  ];

  const priorities = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!announcement.is_active) return false;

    const now = new Date();
    const startDate = announcement.start_date ? new Date(announcement.start_date) : null;
    const endDate = announcement.end_date ? new Date(announcement.end_date) : null;

    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;

    const matchesSearch = announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || announcement.type === selectedType;
    const matchesPriority = !selectedPriority || announcement.priority === selectedPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    // Pinned announcements first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    // Then by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by date
    return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
  });

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Info className="h-4 w-4 text-blue-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Announcements</h1>
          <p className="text-xl text-gray-600">Stay updated with our latest news and important information</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">All Types</option>
                  {announcementTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {sortedAnnouncements.map((announcement) => (
            <Card key={announcement.id} className={`hover:shadow-lg transition-shadow ${announcement.is_pinned ? 'ring-2 ring-blue-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    {getPriorityIcon(announcement.priority)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{announcement.title}</h2>
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-blue-600" title="Pinned" />
                        )}
                        {announcement.is_featured && (
                          <Star className="h-4 w-4 text-yellow-600" title="Featured" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs bg-${getPriorityColor(announcement.priority)}-100 text-${getPriorityColor(announcement.priority)}-800`}>
                          {announcement.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </span>
                        {announcement.target_audience !== 'all' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            For: {announcement.target_audience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {announcement.summary && (
                  <div className="mb-4">
                    <p className="text-gray-700 font-medium">{announcement.summary}</p>
                  </div>
                )}

                <div className="prose max-w-none mb-4">
                  <div
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {announcement.action_button_text && announcement.action_button_url && (
                    <Button asChild>
                      <a href={announcement.action_button_url} target="_blank" rel="noopener noreferrer">
                        {announcement.action_button_text}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}

                  {announcement.external_link && (
                    <Button variant="outline" asChild>
                      <a href={announcement.external_link} target="_blank" rel="noopener noreferrer">
                        Learn More
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}

                  {announcement.attachment_url && (
                    <Button variant="outline" asChild>
                      <a href={announcement.attachment_url} target="_blank" rel="noopener noreferrer">
                        Download Attachment
                        <Download className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    {announcement.author && (
                      <span>By: {announcement.author}</span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(announcement.start_date || announcement.created_at)}
                    </span>
                  </div>

                  {announcement.end_date && (
                    <span className="flex items-center text-orange-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Valid until: {formatDate(announcement.end_date)}
                    </span>
                  )}
                </div>

                {announcement.tags && announcement.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(Array.isArray(announcement.tags) ? announcement.tags : announcement.tags.split(',')).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedType || selectedPriority
                ? 'Try adjusting your search or filter criteria'
                : 'Check back later for updates'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
