import React, { useState, useEffect } from 'react';
import {
  Save, Edit, X, Image, Target, Users, Award, Calendar,
  TrendingUp, Globe, Heart, Lightbulb, Shield, Star, Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Modal from '../ui/modal';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';

const AboutManagement = () => {
  const [aboutData, setAboutData] = useState({
    company_overview: '',
    mission_statement: '',
    vision_statement: '',
    core_values: [],
    founding_year: '',
    company_stats: {
      clients_served: '',
      success_rate: '',
      years_experience: '',
      team_members: '',
      countries_served: '',
      awards_won: ''
    },
    achievements: [],
    company_history: [],
    leadership_message: 'At Sabiteck, we believe technology and creativity are the twin engines of progress. Since our founding, our mission has been clear — to build digital solutions that empower people, tell powerful stories, and drive meaningful change. Every project we take on is more than just work; it\'s a chance to inspire innovation, spark creativity, and leave a lasting impact.\n\nAs we continue to grow, our promise remains the same: to deliver excellence, embrace innovation, and put people at the heart of everything we do.\n\n— The Sabiteck Leadership Team',
    company_culture: '',
    certifications: [],
    partnerships: [],
    office_locations: [],
    hero_image: '',
    about_images: []
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [modalData, setModalData] = useState({});
  const [newValue, setNewValue] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [newHistoryEntry, setNewHistoryEntry] = useState({ year: '', event: '' });
  const [newCertification, setNewCertification] = useState('');
  const [newPartnership, setNewPartnership] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const sections = [
    { id: 'overview', label: 'Company Overview', icon: Globe },
    { id: 'mission', label: 'Mission & Vision', icon: Target },
    { id: 'values', label: 'Core Values', icon: Heart },
    { id: 'stats', label: 'Company Stats', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'history', label: 'Company History', icon: Calendar },
    { id: 'culture', label: 'Culture & Message', icon: Users },
    { id: 'certifications', label: 'Certifications', icon: Shield },
    { id: 'partnerships', label: 'Partnerships', icon: Star },
    { id: 'locations', label: 'Office Locations', icon: Globe },
    { id: 'media', label: 'Images & Media', icon: Image }
  ];

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/about');
      console.log('Load About Response:', response);

      if (response.success && response.data) {
        // Map API response to component state
        const data = response.data;

        setAboutData({
          company_overview: data.company_overview || '',
          mission_statement: data.mission_statement || '',
          vision_statement: data.vision_statement || '',
          core_values: data.core_values || [],
          founding_year: data.founding_year || '',
          company_stats: data.company_stats || {
            clients_served: '',
            success_rate: '',
            years_experience: '',
            team_members: '',
            countries_served: '',
            awards_won: ''
          },
          achievements: data.achievements || [],
          company_history: data.company_history || [],
          leadership_message: data.leadership_message || '',
          company_culture: data.company_culture || '',
          certifications: data.certifications || [],
          partnerships: data.partnerships || [],
          office_locations: data.office_locations || [],
          hero_image: data.hero_image || '',
          about_images: data.about_images || []
        });
        // Don't show success toast on load, it's annoying
      } else {
        console.error('Load failed:', response);
        toast.error(response.error || 'Failed to load about data');
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load about data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const saveAboutData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('/api/admin/about', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(aboutData)
      });

      if (response.success) {
        toast.success('About page updated successfully!');
        setIsModalOpen(false);
        await loadAboutData();
      } else {
        toast.error(response.message || 'Failed to update about page');
      }
    } catch (error) {
      toast.error('Failed to update about page: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const openSectionModal = (section) => {
    setEditingSection(section);

    // Pre-populate modal data based on section
    if (section === 'overview') {
      setModalData({
        company_overview: aboutData.company_overview,
        founding_year: aboutData.founding_year,
        leadership_message: aboutData.leadership_message
      });
    } else if (section === 'mission') {
      setModalData({
        mission_statement: aboutData.mission_statement,
        vision_statement: aboutData.vision_statement
      });
    } else if (section === 'values') {
      setModalData({
        core_values: aboutData.core_values
      });
    } else if (section === 'stats') {
      setModalData({
        company_stats: { ...aboutData.company_stats }
      });
    } else if (section === 'culture') {
      setModalData({
        company_culture: aboutData.company_culture
      });
    } else if (section === 'media') {
      setModalData({
        hero_image: aboutData.hero_image
      });
    }

    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    setLoading(true);
    try {
      const updatedData = { ...aboutData, ...modalData };
      setAboutData(updatedData);

      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('/api/admin/about', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });

      if (response.success) {
        toast.success('Updated successfully!');
        setIsModalOpen(false);
        setEditingSection(null);
        setModalData({});
        await loadAboutData();
      } else {
        toast.error(response.message || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setAboutData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setAboutData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const addArrayItem = async (field, item) => {
    if (!item.trim()) {
      toast.error('Please enter a value');
      return;
    }

    const updatedArray = [...(aboutData[field] || []), item];
    const updatedData = { ...aboutData, [field]: updatedArray };
    setAboutData(updatedData);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('/api/admin/about', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });

      if (response.success) {
        toast.success('Added successfully!');
      } else {
        toast.error(response.message || 'Failed to add item');
        // Rollback on failure
        setAboutData(aboutData);
      }
    } catch (error) {
      toast.error('Failed to add item: ' + (error.message || 'Unknown error'));
      // Rollback on failure
      setAboutData(aboutData);
    }
  };

  const removeArrayItem = async (field, index) => {
    const updatedArray = aboutData[field].filter((_, i) => i !== index);
    const updatedData = { ...aboutData, [field]: updatedArray };
    const previousData = { ...aboutData };
    setAboutData(updatedData);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest('/api/admin/about', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });

      if (response.success) {
        toast.success('Removed successfully!');
      } else {
        toast.error(response.message || 'Failed to remove item');
        // Rollback on failure
        setAboutData(previousData);
      }
    } catch (error) {
      toast.error('Failed to remove item: ' + (error.message || 'Unknown error'));
      // Rollback on failure
      setAboutData(previousData);
    }
  };

  const renderOverviewSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🏢 Company Overview</CardTitle>
              <p className="text-blue-100 mt-1">Tell your company's unique story</p>
            </div>
          </div>
          <Button
            onClick={() => openSectionModal('overview')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Company Description - Display Only */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              📝
            </div>
            Company Description
          </label>
          <div className="relative bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {aboutData.company_overview || 'No description added yet. Click Edit to add one.'}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {aboutData.company_overview?.length || 0}/1000 characters
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
            Make it compelling - this is often the first thing people read about your company
          </p>
        </div>

        {/* Founding Year */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              🗓️
            </div>
            Founding Year
          </label>
          <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
            <p className="text-2xl font-bold text-gray-800">
              {aboutData.founding_year || 'Not set'}
            </p>
          </div>
        </div>

        {/* Leadership Message */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              💼
            </div>
            Leadership Message
          </label>
          <div className="relative bg-gray-50 p-6 rounded-2xl border-2 border-gray-200">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {aboutData.leadership_message || 'No leadership message added yet. Click Edit to add one.'}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {aboutData.leadership_message?.length || 0}/500 characters
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Users className="h-4 w-4 mr-1 text-emerald-500" />
            Add a personal touch from your leadership team
          </p>
        </div>

        {/* Success Indicator */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-green-800">Great Progress!</h4>
              <p className="text-green-700 text-sm">Your company overview is taking shape beautifully.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMissionSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🎯 Mission & Vision</CardTitle>
              <p className="text-purple-100 mt-1">Define your purpose and future aspirations</p>
            </div>
          </div>
          <Button
            onClick={() => openSectionModal('mission')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Mission Statement */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              🚀
            </div>
            Mission Statement
          </label>
          <div className="relative bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl border-2 border-gray-200">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {aboutData.mission_statement || 'No mission statement added yet. Click Edit to add one.'}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {aboutData.mission_statement?.length || 0}/500 characters
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Target className="h-4 w-4 mr-1 text-purple-500" />
            Focus on your core purpose and the impact you make
          </p>
        </div>

        {/* Vision Statement */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
              🔮
            </div>
            Vision Statement
          </label>
          <div className="relative bg-gradient-to-br from-white to-pink-50/30 p-6 rounded-2xl border-2 border-gray-200">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {aboutData.vision_statement || 'No vision statement added yet. Click Edit to add one.'}
            </p>
            <div className="mt-4 text-sm text-gray-400">
              {aboutData.vision_statement?.length || 0}/500 characters
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Star className="h-4 w-4 mr-1 text-pink-500" />
            Paint a picture of your ideal future state
          </p>
        </div>

        {/* Inspiration Card */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-purple-800 mb-2">💡 Pro Tip</h4>
              <p className="text-purple-700 text-sm leading-relaxed">
                <strong>Mission</strong> is your "why" - what drives you every day. <strong>Vision</strong> is your "where" - the future you're building towards.
                Make them inspiring yet specific to your company's unique journey.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderValuesSection = () => {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">💎 Core Values</CardTitle>
                <p className="text-emerald-100 mt-1">Define what matters most to your company</p>
              </div>
            </div>
            <Button
              onClick={() => openSectionModal('values')}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Add New Value */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <h4 className="font-black text-emerald-800 mb-4 flex items-center">
              <div className="w-6 h-6 bg-emerald-200 rounded-lg flex items-center justify-center mr-2">
                ➕
              </div>
              Add New Value
            </h4>
            <div className="flex space-x-4">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter a core value (e.g., Innovation, Integrity, Excellence)..."
                className="flex-1 px-4 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-lg font-medium"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('core_values', newValue);
                    setNewValue('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  addArrayItem('core_values', newValue);
                  setNewValue('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-bold text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2">
                    ➕
                  </div>
                  Add Value
                </div>
              </Button>
            </div>
          </div>

          {/* Values List */}
          <div className="space-y-4">
            <h4 className="font-black text-gray-800 text-lg flex items-center">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                📋
              </div>
              Your Core Values ({(aboutData.core_values || []).length})
            </h4>

            {(aboutData.core_values || []).length > 0 ? (
              <div className="grid gap-4">
                {(aboutData.core_values || []).map((value, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <span className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {value}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('core_values', index)}
                        className="p-3 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-300 rounded-xl"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-600 mb-2">No values added yet</h4>
                <p className="text-gray-500">Add your first core value above to get started</p>
              </div>
            )}
          </div>

          {/* Values Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-black text-blue-800 mb-2">💡 Value Examples</h4>
                <p className="text-blue-700 text-sm leading-relaxed mb-2">
                  Great core values are memorable, actionable, and authentic. Consider values like:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-blue-600">• Innovation & Creativity</span>
                  <span className="text-blue-600">• Customer Success</span>
                  <span className="text-blue-600">• Integrity & Transparency</span>
                  <span className="text-blue-600">• Quality Excellence</span>
                  <span className="text-blue-600">• Team Collaboration</span>
                  <span className="text-blue-600">• Continuous Learning</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatsSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">📊 Company Statistics</CardTitle>
              <p className="text-orange-100 mt-1">Showcase your impressive numbers and achievements</p>
            </div>
          </div>
          <Button
            onClick={() => openSectionModal('stats')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Clients Served */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                👥
              </div>
              Clients Served
            </label>
            <Input
              value={aboutData.company_stats?.clients_served || ''}
              onChange={(e) => updateNestedField('company_stats', 'clients_served', e.target.value)}
              placeholder="500+"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-blue-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Total satisfied clients</p>
          </div>

          {/* Success Rate */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                ✅
              </div>
              Success Rate
            </label>
            <Input
              value={aboutData.company_stats?.success_rate || ''}
              onChange={(e) => updateNestedField('company_stats', 'success_rate', e.target.value)}
              placeholder="95%"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-green-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Project completion rate</p>
          </div>

          {/* Years of Experience */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                📅
              </div>
              Years of Experience
            </label>
            <Input
              value={aboutData.company_stats?.years_experience || ''}
              onChange={(e) => updateNestedField('company_stats', 'years_experience', e.target.value)}
              placeholder="10+"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-purple-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Years in business</p>
          </div>

          {/* Team Members */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                👫
              </div>
              Team Members
            </label>
            <Input
              value={aboutData.company_stats?.team_members || ''}
              onChange={(e) => updateNestedField('company_stats', 'team_members', e.target.value)}
              placeholder="50+"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-indigo-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Expert professionals</p>
          </div>

          {/* Countries Served */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                🌍
              </div>
              Countries Served
            </label>
            <Input
              value={aboutData.company_stats?.countries_served || ''}
              onChange={(e) => updateNestedField('company_stats', 'countries_served', e.target.value)}
              placeholder="15+"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-cyan-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Global reach</p>
          </div>

          {/* Awards Won */}
          <div className="group">
            <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                🏆
              </div>
              Awards Won
            </label>
            <Input
              value={aboutData.company_stats?.awards_won || ''}
              onChange={(e) => updateNestedField('company_stats', 'awards_won', e.target.value)}
              placeholder="5+"
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 text-2xl font-bold text-center group-hover:shadow-lg bg-gradient-to-br from-white to-yellow-50/30"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">Recognition received</p>
          </div>
        </div>

        {/* Quick Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveAboutData}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl font-black text-lg shadow-xl hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Statistics
              </>
            )}
          </Button>
        </div>

        {/* Stats Preview */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
          <div className="text-center">
            <h4 className="font-black text-orange-800 text-xl mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center mr-3">
                👀
              </div>
              Preview Your Impact
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-orange-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.clients_served || '0'}
                </div>
                <div className="text-sm text-orange-700 font-semibold">Happy Clients</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-orange-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.success_rate || '0%'}
                </div>
                <div className="text-sm text-orange-700 font-semibold">Success Rate</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-orange-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.years_experience || '0'}+
                </div>
                <div className="text-sm text-orange-700 font-semibold">Years Experience</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-red-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.team_members || '0'}+
                </div>
                <div className="text-sm text-red-700 font-semibold">Team Members</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-red-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.countries_served || '0'}+
                </div>
                <div className="text-sm text-red-700 font-semibold">Countries Served</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-black text-red-600 mb-1 animate-pulse">
                  {aboutData.company_stats?.awards_won || '0'}+
                </div>
                <div className="text-sm text-red-700 font-semibold">Awards Won</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t-2 border-orange-200">
              <p className="text-orange-600 text-sm font-bold flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                These numbers tell your success story - Don't forget to save!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCultureSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🎨 Company Culture</CardTitle>
              <p className="text-indigo-100 mt-1">Share what makes your workplace special</p>
            </div>
          </div>
          <Button
            onClick={() => openSectionModal('culture')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              🏢
            </div>
            Company Culture Description
          </label>
          <div className="relative">
            <textarea
              value={aboutData.company_culture}
              onChange={(e) => updateField('company_culture', e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none text-lg font-medium group-hover:shadow-lg bg-gradient-to-br from-white to-indigo-50/30"
              rows={8}
              placeholder="Describe your company culture, work environment, and values in action. What's it like to work at your company? What makes your team special?"
            />
            <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              {aboutData.company_culture?.length || 0}/1000
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Heart className="h-4 w-4 mr-1 text-indigo-500" />
            Help potential employees and clients understand your work environment
          </p>
        </div>

        {/* Culture Inspiration */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-indigo-800 mb-2">💡 Culture Elements to Consider</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-700">
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Remote-first or office culture</div>
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Learning & development focus</div>
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Work-life balance approach</div>
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Team collaboration style</div>
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Innovation & creativity</div>
                <div className="flex items-center"><Star className="h-3 w-3 mr-2" />Diversity & inclusion</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMediaSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Image className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🎨 Images & Media</CardTitle>
              <p className="text-pink-100 mt-1">Visual elements that represent your brand</p>
            </div>
          </div>
          <Button
            onClick={() => openSectionModal('media')}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
              🖼️
            </div>
            Hero Image URL
          </label>
          <Input
            value={aboutData.hero_image}
            onChange={(e) => updateField('hero_image', e.target.value)}
            placeholder="https://example.com/hero-image.jpg"
            className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg font-medium group-hover:shadow-lg"
          />
          <p className="text-sm text-gray-600 mt-2 flex items-center">
            <Globe className="h-4 w-4 mr-1 text-pink-500" />
            Enter a public URL for your hero image
          </p>

          {/* Image Preview */}
          {aboutData.hero_image && (
            <div className="mt-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                  👀
                </div>
                Image Preview
              </h4>
              <div className="relative group">
                <img
                  src={aboutData.hero_image}
                  alt="Hero Preview"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border-2 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="hidden w-full h-64 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-600 font-bold">Failed to load image</p>
                    <p className="text-red-500 text-sm">Please check the URL and try again</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!aboutData.hero_image && (
            <div className="mt-6 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No image added yet</h4>
              <p className="text-gray-500">Add an image URL above to see the preview</p>
            </div>
          )}
        </div>

        {/* Media Guidelines */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-pink-800 mb-2">📸 Image Guidelines</h4>
              <div className="text-sm text-pink-700 space-y-1">
                <p><strong>Recommended size:</strong> 1920x1080 pixels (16:9 aspect ratio)</p>
                <p><strong>Format:</strong> JPG or PNG for best compatibility</p>
                <p><strong>Size limit:</strong> Keep under 2MB for fast loading</p>
                <p><strong>Content:</strong> Professional images that represent your company well</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSection = () => {
    switch(activeSection) {
      case 'overview': return renderOverviewSection();
      case 'mission': return renderMissionSection();
      case 'values': return renderValuesSection();
      case 'stats': return renderStatsSection();
      case 'achievements': return renderAchievementsSection();
      case 'history': return renderHistorySection();
      case 'culture': return renderCultureSection();
      case 'certifications': return renderCertificationsSection();
      case 'partnerships': return renderPartnershipsSection();
      case 'locations': return renderLocationsSection();
      case 'media': return renderMediaSection();
      default: return renderOverviewSection();
    }
  };

  // Achievements Section
  const renderAchievementsSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🏆 Achievements & Awards</CardTitle>
              <p className="text-yellow-100 mt-1">Showcase your company's milestones and recognitions</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Add New Achievement */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
          <h4 className="font-black text-yellow-800 mb-4 flex items-center">
            <div className="w-6 h-6 bg-yellow-200 rounded-lg flex items-center justify-center mr-2">
              ➕
            </div>
            Add New Achievement
          </h4>
          <div className="flex space-x-4">
            <Input
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              placeholder="Enter achievement (e.g., Best Tech Company 2024)..."
              className="flex-1 px-4 py-3 border-2 border-yellow-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 text-lg font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('achievements', newAchievement);
                  setNewAchievement('');
                }
              }}
            />
            <Button
              onClick={() => {
                addArrayItem('achievements', newAchievement);
                setNewAchievement('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl font-bold text-white shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-4">
          <h4 className="font-black text-gray-800 text-lg flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              🎖️
            </div>
            Your Achievements ({(aboutData.achievements || []).length})
          </h4>

          {(aboutData.achievements || []).length > 0 ? (
            <div className="grid gap-4">
              {(aboutData.achievements || []).map((achievement, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-yellow-50 border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-yellow-300 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        <Award className="h-6 w-6" />
                      </div>
                      <span className="text-lg font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">
                        {achievement}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeArrayItem('achievements', index)}
                      className="p-3 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-300 rounded-xl"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No achievements added yet</h4>
              <p className="text-gray-500">Add your first achievement above to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderHistorySection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-gray-800 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">📅 Company History</CardTitle>
              <p className="text-slate-200 mt-1">Document your company's journey and milestones</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Add New History Entry */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
          <h4 className="font-black text-slate-800 mb-4 flex items-center">
            <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center mr-2">
              ➕
            </div>
            Add New History Entry
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              value={newHistoryEntry.year}
              onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, year: e.target.value })}
              placeholder="Year (e.g., 2020)"
              className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-500 focus:ring-4 focus:ring-slate-100 transition-all duration-300 text-lg font-medium"
            />
            <Input
              value={newHistoryEntry.event}
              onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, event: e.target.value })}
              placeholder="Event description..."
              className="md:col-span-2 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-500 focus:ring-4 focus:ring-slate-100 transition-all duration-300 text-lg font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newHistoryEntry.year && newHistoryEntry.event) {
                  addArrayItem('company_history', newHistoryEntry);
                  setNewHistoryEntry({ year: '', event: '' });
                }
              }}
            />
          </div>
          <Button
            onClick={() => {
              if (newHistoryEntry.year && newHistoryEntry.event) {
                addArrayItem('company_history', newHistoryEntry);
                setNewHistoryEntry({ year: '', event: '' });
              }
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 rounded-xl font-bold text-white shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add History Entry
          </Button>
        </div>

        {/* History Timeline */}
        <div className="space-y-4">
          <h4 className="font-black text-gray-800 text-lg flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              📖
            </div>
            Company Timeline ({(aboutData.company_history || []).length} entries)
          </h4>

          {(aboutData.company_history || []).length > 0 ? (
            <div className="relative space-y-6">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-gray-300 to-slate-300"></div>

              {(aboutData.company_history || []).map((entry, index) => (
                <div key={index} className="relative flex items-start space-x-6 group">
                  {/* Timeline Dot */}
                  <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {entry.year || index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-600 mb-2">{entry.year}</div>
                        <p className="text-lg font-semibold text-gray-800">{entry.event}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('company_history', index)}
                        className="p-2 hover:bg-red-50 hover:border-red-300 transition-all duration-300 rounded-lg"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No history entries yet</h4>
              <p className="text-gray-500">Add your first milestone above to build your timeline</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderCertificationsSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🛡️ Certifications</CardTitle>
              <p className="text-green-100 mt-1">Display your company's credentials and certifications</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Add New Certification */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <h4 className="font-black text-green-800 mb-4 flex items-center">
            <div className="w-6 h-6 bg-green-200 rounded-lg flex items-center justify-center mr-2">
              ➕
            </div>
            Add New Certification
          </h4>
          <div className="flex space-x-4">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="Enter certification (e.g., ISO 9001:2015)..."
              className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-lg font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('certifications', newCertification);
                  setNewCertification('');
                }
              }}
            />
            <Button
              onClick={() => {
                addArrayItem('certifications', newCertification);
                setNewCertification('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </div>

        {/* Certifications Grid */}
        <div className="space-y-4">
          <h4 className="font-black text-gray-800 text-lg flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              📜
            </div>
            Your Certifications ({(aboutData.certifications || []).length})
          </h4>

          {(aboutData.certifications || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(aboutData.certifications || []).map((cert, index) => (
                <div key={index} className="group">
                  <div className="relative p-6 bg-gradient-to-br from-white to-green-50 border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-green-300 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0">
                          <Shield className="h-5 w-5" />
                        </div>
                        <span className="text-base font-bold text-gray-800 group-hover:text-green-600 transition-colors leading-relaxed">
                          {cert}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('certifications', index)}
                        className="p-2 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-300 rounded-lg flex-shrink-0 ml-2"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No certifications added yet</h4>
              <p className="text-gray-500">Add your first certification above to showcase your credentials</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPartnershipsSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">⭐ Partnerships</CardTitle>
              <p className="text-blue-100 mt-1">Showcase your strategic partners and collaborations</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Add New Partnership */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h4 className="font-black text-blue-800 mb-4 flex items-center">
            <div className="w-6 h-6 bg-blue-200 rounded-lg flex items-center justify-center mr-2">
              ➕
            </div>
            Add New Partnership
          </h4>
          <div className="flex space-x-4">
            <Input
              value={newPartnership}
              onChange={(e) => setNewPartnership(e.target.value)}
              placeholder="Enter partner name (e.g., Microsoft, Google)..."
              className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('partnerships', newPartnership);
                  setNewPartnership('');
                }
              }}
            />
            <Button
              onClick={() => {
                addArrayItem('partnerships', newPartnership);
                setNewPartnership('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </div>

        {/* Partnerships Grid */}
        <div className="space-y-4">
          <h4 className="font-black text-gray-800 text-lg flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              🤝
            </div>
            Your Partners ({(aboutData.partnerships || []).length})
          </h4>

          {(aboutData.partnerships || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(aboutData.partnerships || []).map((partner, index) => (
                <div key={index} className="group">
                  <div className="relative p-6 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-7 w-7" />
                      </div>
                      <span className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {partner}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeArrayItem('partnerships', index)}
                      className="absolute top-2 right-2 p-2 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No partnerships added yet</h4>
              <p className="text-gray-500">Add your first partner above to showcase your network</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderLocationsSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">🌍 Office Locations</CardTitle>
              <p className="text-cyan-100 mt-1">Display your global presence and office locations</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Add New Location */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200">
          <h4 className="font-black text-cyan-800 mb-4 flex items-center">
            <div className="w-6 h-6 bg-cyan-200 rounded-lg flex items-center justify-center mr-2">
              ➕
            </div>
            Add New Office Location
          </h4>
          <div className="flex space-x-4">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location (e.g., New York, USA)..."
              className="flex-1 px-4 py-3 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all duration-300 text-lg font-medium"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('office_locations', newLocation);
                  setNewLocation('');
                }
              }}
            />
            <Button
              onClick={() => {
                addArrayItem('office_locations', newLocation);
                setNewLocation('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="space-y-4">
          <h4 className="font-black text-gray-800 text-lg flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              📍
            </div>
            Our Offices ({(aboutData.office_locations || []).length})
          </h4>

          {(aboutData.office_locations || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(aboutData.office_locations || []).map((location, index) => (
                <div key={index} className="group">
                  <div className="relative p-6 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-cyan-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-bold text-gray-800 group-hover:text-cyan-600 transition-colors block">
                          {location}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeArrayItem('office_locations', index)}
                      className="absolute top-2 right-2 p-2 hover:bg-red-50 hover:border-red-300 hover:scale-105 transition-all duration-300 rounded-lg opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-bold text-gray-600 mb-2">No office locations added yet</h4>
              <p className="text-gray-500">Add your first office location above to showcase your presence</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderEditModal = () => {
    if (!editingSection) return null;

    const sectionConfig = {
      overview: {
        title: 'Company Overview',
        icon: '🏢',
        gradient: 'from-blue-600 via-indigo-600 to-purple-600',
        fields: [
          { name: 'company_overview', label: 'Company Description', type: 'textarea', rows: 7, icon: '📝' },
          { name: 'founding_year', label: 'Founding Year', type: 'text', icon: '🗓️' },
          { name: 'leadership_message', label: 'Leadership Message', type: 'textarea', rows: 5, icon: '💼' }
        ]
      },
      mission: {
        title: 'Mission & Vision',
        icon: '🎯',
        gradient: 'from-purple-600 via-pink-600 to-rose-600',
        fields: [
          { name: 'mission_statement', label: 'Mission Statement', type: 'textarea', rows: 6, icon: '🚀' },
          { name: 'vision_statement', label: 'Vision Statement', type: 'textarea', rows: 6, icon: '🔮' }
        ]
      },
      values: {
        title: 'Core Values',
        icon: '💎',
        gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
        fields: [
          { name: 'core_values', label: 'Core Values', type: 'array', icon: '❤️' }
        ]
      },
      stats: {
        title: 'Company Statistics',
        icon: '📊',
        gradient: 'from-orange-600 via-red-600 to-pink-600',
        fields: [
          { name: 'company_stats.clients_served', label: 'Clients Served', type: 'text', icon: '👥' },
          { name: 'company_stats.success_rate', label: 'Success Rate', type: 'text', icon: '✅' },
          { name: 'company_stats.years_experience', label: 'Years of Experience', type: 'text', icon: '📅' },
          { name: 'company_stats.team_members', label: 'Team Members', type: 'text', icon: '👫' },
          { name: 'company_stats.countries_served', label: 'Countries Served', type: 'text', icon: '🌍' },
          { name: 'company_stats.awards_won', label: 'Awards Won', type: 'text', icon: '🏆' }
        ]
      },
      culture: {
        title: 'Company Culture',
        icon: '🎨',
        gradient: 'from-indigo-600 via-purple-600 to-pink-600',
        fields: [
          { name: 'company_culture', label: 'Company Culture Description', type: 'textarea', rows: 8, icon: '🏢' }
        ]
      },
      media: {
        title: 'Images & Media',
        icon: '🖼️',
        gradient: 'from-pink-600 via-rose-600 to-red-600',
        fields: [
          { name: 'hero_image', label: 'Hero Image URL', type: 'text', icon: '🎨' }
        ]
      }
    };

    const currentSection = sectionConfig[editingSection];

    const getFieldValue = (fieldName) => {
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        return modalData[parts[0]]?.[parts[1]] || '';
      }
      return modalData[fieldName] || '';
    };

    const setFieldValue = (fieldName, value) => {
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        setModalData({
          ...modalData,
          [parts[0]]: {
            ...modalData[parts[0]],
            [parts[1]]: value
          }
        });
      } else {
        setModalData({ ...modalData, [fieldName]: value });
      }
    };

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isModalOpen ? 'bg-black/50 backdrop-blur-sm' : 'pointer-events-none'}`}>
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl transform transition-all duration-500 ${
            isModalOpen
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-8'
          }`}
          style={{
            animation: isModalOpen ? 'float 3s ease-in-out infinite' : 'none'
          }}
        >
          {/* Floating Modal Header */}
          <div className={`relative bg-gradient-to-r ${currentSection.gradient} rounded-t-3xl p-8 overflow-hidden`}>
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent animate-pulse"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <span className="text-3xl">{currentSection.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {currentSection.title}
                  </h2>
                  <p className="text-white/80 text-sm mt-1 font-medium">
                    Edit all fields in this section
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSection(null);
                  setModalData({});
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-90 group"
              >
                <X className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {currentSection.fields.map((field, index) => (
              <div key={field.name} className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                  <span className="text-lg mr-2">{field.icon}</span>
                  {field.label}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={getFieldValue(field.name)}
                    onChange={(e) => setFieldValue(field.name, e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 resize-none text-base font-medium hover:shadow-lg bg-gradient-to-br from-white to-blue-50/30"
                    rows={field.rows || 5}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    autoFocus={index === 0}
                  />
                ) : field.type === 'array' ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                      {(getFieldValue(field.name) || []).map((value, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg mb-2 border border-gray-200">
                          <span className="text-gray-700 font-medium">{value}</span>
                          <button
                            onClick={() => {
                              const newValues = [...getFieldValue(field.name)];
                              newValues.splice(idx, 1);
                              setFieldValue(field.name, newValues);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {(getFieldValue(field.name) || []).length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-2">No items added yet</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl"
                        placeholder={`Add new ${field.label.toLowerCase()}...`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newValue.trim()) {
                            setFieldValue(field.name, [...(getFieldValue(field.name) || []), newValue]);
                            setNewValue('');
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newValue.trim()) {
                            setFieldValue(field.name, [...(getFieldValue(field.name) || []), newValue]);
                            setNewValue('');
                          }
                        }}
                        className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={getFieldValue(field.name)}
                    onChange={(e) => setFieldValue(field.name, e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium hover:shadow-lg"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    autoFocus={index === 0}
                  />
                )}

                {field.type !== 'array' && (
                  <div className="flex items-center justify-end px-2">
                    <span className="text-xs text-gray-500">
                      {getFieldValue(field.name)?.length || 0} characters
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Floating Action Buttons */}
          <div className="p-6 bg-gray-50 rounded-b-3xl border-t-2 border-gray-100">
            <div className="flex items-center justify-between space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSection(null);
                  setModalData({});
                }}
                disabled={loading}
                className="flex-1 py-6 rounded-2xl border-2 hover:bg-gray-100 transition-all duration-300 font-bold text-base group"
              >
                <X className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                Cancel
              </Button>
              <Button
                onClick={handleModalSave}
                disabled={loading}
                className={`flex-1 py-6 rounded-2xl bg-gradient-to-r ${currentSection.gradient} hover:opacity-90 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Floating Dots Decoration */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb, #7c3aed);
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
      {/* Professional Header Section */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20"></div>

            <div className="relative p-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-2xl shadow-2xl">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                      LIVE
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">
                      ✨ About Page Management
                    </h1>
                    <p className="text-blue-200 text-lg font-medium">
                      Craft your company's story and showcase your achievements
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
                      <div className="w-6 h-1 bg-blue-400/60 rounded-full"></div>
                      <div className="w-3 h-1 bg-blue-400/40 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Button
                    onClick={saveAboutData}
                    disabled={loading}
                    className="group bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 hover:from-emerald-600 hover:via-green-700 hover:to-emerald-700 px-8 py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 border-2 border-white/20"
                  >
                    <div className="flex items-center">
                      {loading ? (
                        <>
                          <div className="animate-spin h-6 w-6 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 group-hover:rotate-12 transition-transform duration-300">
                            <Save className="h-4 w-4 text-white" />
                          </div>
                          Save Changes
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Enhanced Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <h3 className="text-lg font-black flex items-center">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <Edit className="h-3 w-3 text-white" />
                  </div>
                  📝 Sections
                </h3>
                <p className="text-indigo-100 text-sm mt-1">Manage your content</p>
              </div>

              {/* Enhanced Navigation */}
              <nav className="p-6 space-y-3">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`group w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'hover:bg-gray-50 hover:scale-102 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-white/20 shadow-lg'
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        <Icon className={`h-5 w-5 transition-all duration-300 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-600 group-hover:text-blue-600'
                        } group-hover:scale-110`} />
                      </div>
                      <div className="flex-1">
                        <span className={`font-semibold text-sm transition-colors duration-300 ${
                          isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>
                          {section.label}
                        </span>
                        {isActive && (
                          <div className="w-full h-0.5 bg-white/30 rounded-full mt-1 animate-pulse"></div>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Progress Indicator */}
              <div className="px-6 pb-6">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">COMPLETION</span>
                    <span className="text-xs font-black text-blue-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                         style={{width: '75%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Keep going! Your story is taking shape.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Content Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute inset-0"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Your Content...</h3>
                    <p className="text-gray-600">Please wait while we fetch your about page data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {renderSection()}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {renderEditModal()}
    </div>
  );
};

export default AboutManagement;
