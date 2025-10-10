import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Pin, Star, Bell, ExternalLink, Download,
  Filter, Search, ChevronDown, AlertCircle, Info, CheckCircle,
  TrendingUp, Users, Megaphone, Zap, Shield, Globe, Target, Award,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

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

  const typeIcons = {
    general: Info,
    urgent: AlertCircle,
    maintenance: Shield,
    feature: Star,
    event: Calendar,
    policy: Globe,
    deadline: Clock,
    celebration: Award,
    warning: AlertCircle,
    update: TrendingUp
  };

  const typeColors = {
    general: 'blue',
    urgent: 'red',
    maintenance: 'orange',
    feature: 'purple',
    event: 'green',
    policy: 'indigo',
    deadline: 'yellow',
    celebration: 'pink',
    warning: 'red',
    update: 'blue'
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      let announcements = [];

      if (data.success && data.data && data.data.length > 0) {
        announcements = data.data;
      } else {
        // Sample announcements when no data from API
        announcements = [
          {
            id: 1,
            title: 'System Maintenance Scheduled',
            content: 'We will be performing scheduled maintenance on our systems this weekend. During this time, some services may be temporarily unavailable. We apologize for any inconvenience.',
            type: 'maintenance',
            priority: 'high',
            is_active: true,
            is_pinned: true,
            author: 'IT Team',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            action_url: null,
            action_text: null,
            attachments: null
          },
          {
            id: 2,
            title: 'New Feature Release: Enhanced Dashboard',
            content: 'We are excited to announce the release of our enhanced dashboard with improved analytics, better performance, and a more intuitive user interface.',
            type: 'feature',
            priority: 'medium',
            is_active: true,
            is_pinned: false,
            author: 'Product Team',
            start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end_date: null,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            action_url: 'https://docs.sabiteck.com/dashboard',
            action_text: 'View Documentation',
            attachments: null
          },
          {
            id: 3,
            title: 'Security Update Required',
            content: 'Important security update available. Please update your passwords and enable two-factor authentication for enhanced account security.',
            type: 'warning',
            priority: 'critical',
            is_active: true,
            is_pinned: true,
            author: 'Security Team',
            start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            action_url: '/change-password',
            action_text: 'Update Password',
            attachments: null
          },
          {
            id: 4,
            title: 'Company Holiday Schedule',
            content: 'Please note our upcoming holiday schedule. The office will be closed on the following dates, and support will be limited during these periods.',
            type: 'general',
            priority: 'low',
            is_active: true,
            is_pinned: false,
            author: 'HR Department',
            start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            action_url: null,
            action_text: null,
            attachments: 'holiday-schedule.pdf'
          },
          {
            id: 5,
            title: 'Team Building Event',
            content: 'Join us for our quarterly team building event! It will be a great opportunity to connect with colleagues and participate in fun activities.',
            type: 'event',
            priority: 'medium',
            is_active: true,
            is_pinned: false,
            author: 'Events Team',
            start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            action_url: 'https://events.sabiteck.com/team-building',
            action_text: 'Register Now',
            attachments: null
          }
        ];
      }

      setAnnouncements(announcements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      // Fallback to sample data on error
      setAnnouncements([
        {
          id: 1,
          title: 'Welcome to Sabiteck Announcements',
          content: 'Stay tuned for important updates and announcements from our team.',
          type: 'general',
          priority: 'medium',
          is_active: true,
          is_pinned: false,
          author: 'Sabiteck Team',
          start_date: new Date().toISOString(),
          end_date: null,
          created_at: new Date().toISOString(),
          action_url: null,
          action_text: null,
          attachments: null
        }
      ]);
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

  const getAnnouncementStats = () => {
    const stats = {
      total: filteredAnnouncements.length,
      pinned: filteredAnnouncements.filter(a => a.is_pinned).length,
      critical: filteredAnnouncements.filter(a => a.priority === 'critical').length,
      urgent: filteredAnnouncements.filter(a => a.type === 'urgent').length
    };
    return stats;
  };

  const copyAnnouncementLink = async (announcement) => {
    try {
      // Generate the announcement link based on the ID or slug
      const baseUrl = window.location.origin;
      const announcementUrl = `${baseUrl}/announcements/${announcement.slug || announcement.id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(announcementUrl);

      toast.success('✨ Announcement link copied to clipboard!', {
        description: announcementUrl,
        duration: 3000
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      const baseUrl = window.location.origin;
      const announcementUrl = `${baseUrl}/announcements/${announcement.slug || announcement.id}`;

      textArea.value = announcementUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      toast.success('✨ Announcement link copied to clipboard!', {
        description: announcementUrl,
        duration: 3000
      });
    }
  };

  const stats = getAnnouncementStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-24">
        <div className="pt-8 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="ml-4 text-lg text-slate-600">Loading announcements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-24">
      {/* Elite Hero Section */}
      <section className="relative pt-8 pb-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/20 to-black/40"></div>

        {/* Animated Background Patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Elite Title with Gradient */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Megaphone className="w-5 h-5 text-blue-300 mr-2" />
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">
                Company Announcements
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Stay
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Informed
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed">
              Get the latest updates, important notices, and company news delivered with clarity and purpose.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6 text-blue-300" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-white/70">Total</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Pin className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.pinned}</div>
                <div className="text-sm text-white/70">Pinned</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="w-6 h-6 text-red-300" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.critical}</div>
                <div className="text-sm text-white/70">Critical</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-orange-300" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.urgent}</div>
                <div className="text-sm text-white/70">Urgent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Elite Search and Filters */}
        <Card className="mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Premium Search Bar */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-lg bg-white/50 border-slate-200 focus:bg-white focus:border-blue-300"
                  />
                </div>
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-6 py-3 transition-all duration-300 ${
                  showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
                }`}
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Announcement Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Priority Level</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Priorities</option>
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedType('');
                        setSelectedPriority('');
                        setSearchTerm('');
                      }}
                      className="w-full py-3"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements List */}
        <div className="space-y-6">
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Announcements Found</h3>
              <p className="text-slate-500 text-lg">Try adjusting your search criteria or check back later for updates.</p>
            </div>
          ) : (
            sortedAnnouncements.map((announcement) => {
              const TypeIcon = typeIcons[announcement.type] || Info;
              const typeColor = typeColors[announcement.type] || 'blue';
              const priorityColor = getPriorityColor(announcement.priority);

              return (
                <Card key={announcement.id} className="group overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                  {/* Priority and Pinned Indicators */}
                  <div className="relative">
                    {announcement.is_pinned && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    )}
                    {announcement.priority === 'critical' && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
                    )}
                  </div>

                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start space-x-4">
                        {/* Type Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-r from-${typeColor}-500 to-${typeColor}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                          {/* Title and Badges */}
                          <div className="flex items-start justify-between mb-3">
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                              {announcement.title}
                            </h2>
                            <div className="flex items-center space-x-2 ml-4">
                              {announcement.is_pinned && (
                                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                                  <Pin className="w-3 h-3 mr-1" />
                                  Pinned
                                </div>
                              )}
                              <div className={`bg-gradient-to-r from-${priorityColor}-100 to-${priorityColor}-200 text-${priorityColor}-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center`}>
                                {getPriorityIcon(announcement.priority)}
                                <span className="ml-1 capitalize">{announcement.priority}</span>
                              </div>
                            </div>
                          </div>

                          {/* Type Badge */}
                          <div className="flex items-center space-x-4 mb-4">
                            <span className={`inline-flex items-center px-3 py-1 bg-${typeColor}-50 text-${typeColor}-700 text-sm rounded-full border border-${typeColor}-200`}>
                              <span className="capitalize">{announcement.type}</span>
                            </span>
                          </div>

                          {/* Content */}
                          <div className="prose prose-slate max-w-none mb-6">
                            <p className="text-slate-600 text-lg leading-relaxed">
                              {announcement.content}
                            </p>
                          </div>

                          {/* Meta Information */}
                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-6">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Published {formatDate(announcement.created_at || announcement.start_date)}</span>
                            </div>
                            {announcement.end_date && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>Valid until {formatDate(announcement.end_date)}</span>
                              </div>
                            )}
                            {announcement.author && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <span>By {announcement.author}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
                            {/* Copy Link Button - Always visible */}
                            <Button
                              variant="outline"
                              onClick={() => copyAnnouncementLink(announcement)}
                              className="border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>

                            {announcement.action_url && (
                              <Button
                                variant="default"
                                onClick={() => window.open(announcement.action_url, '_blank')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                              >
                                {announcement.action_text || 'Learn More'}
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                            {announcement.attachments && (
                              <Button
                                variant="outline"
                                onClick={() => window.open(announcement.attachments, '_blank')}
                                className="border-slate-300 hover:bg-slate-50"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Load More or Pagination */}
        {sortedAnnouncements.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-slate-500 mb-6">
              Showing {sortedAnnouncements.length} of {announcements.length} announcements
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;