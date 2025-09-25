import React, { useState, useEffect } from 'react';
import {
  Save, Edit, X, Image, Target, Users, Award, Calendar,
  TrendingUp, Globe, Heart, Lightbulb, Shield, Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
    leadership_message: '',
    company_culture: '',
    certifications: [],
    partnerships: [],
    office_locations: [],
    hero_image: '',
    about_images: []
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
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
      if (response.success) {
        // Map API response to component state
        const apiData = response.company_info || {};
        const stats = response.stats || {};

        setAboutData({
          ...aboutData,
          company_overview: response.about_content?.content || '',
          mission_statement: apiData.mission || '',
          vision_statement: apiData.vision || '',
          core_values: apiData.values || [],
          founding_year: apiData.founded || '',
          company_stats: {
            clients_served: stats.clients_served || '',
            success_rate: '95%', // Default values
            years_experience: stats.years_experience || '',
            team_members: stats.team_members || '',
            countries_served: stats.countries_reached || '',
            awards_won: '10+' // Default value
          },
          leadership_message: apiData.description || '',
          hero_image: response.about_content?.featured_image || ''
        });
      } else {
        toast.error('Failed to load about data');
      }
    } catch (error) {
      toast.error('Failed to load about data');
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
      } else {
        toast.error(response.message || 'Failed to update about page');
      }
    } catch (error) {
      toast.error('Failed to update about page');
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

  const addArrayItem = (field, item) => {
    if (!item.trim()) return;
    setAboutData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };

  const removeArrayItem = (field, index) => {
    setAboutData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const renderOverviewSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">🏢 Company Overview</CardTitle>
            <p className="text-blue-100 mt-1">Tell your company's unique story</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Company Description */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              📝
            </div>
            Company Description
          </label>
          <div className="relative">
            <textarea
              value={aboutData.company_overview}
              onChange={(e) => updateField('company_overview', e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 resize-none text-lg font-medium group-hover:shadow-lg"
              rows={7}
              placeholder="Describe your company, its purpose, and what makes it unique. What's your story?"
            />
            <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              {aboutData.company_overview?.length || 0}/1000
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
          <Input
            type="number"
            value={aboutData.founding_year}
            onChange={(e) => updateField('founding_year', e.target.value)}
            className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-lg font-semibold group-hover:shadow-lg"
            placeholder="2020"
          />
        </div>

        {/* Leadership Message */}
        <div className="group">
          <label className="block text-lg font-black text-gray-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              💼
            </div>
            Leadership Message
          </label>
          <div className="relative">
            <textarea
              value={aboutData.leadership_message}
              onChange={(e) => updateField('leadership_message', e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 resize-none text-lg font-medium group-hover:shadow-lg"
              rows={5}
              placeholder="A personal message from your CEO or leadership team..."
            />
            <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              {aboutData.leadership_message?.length || 0}/500
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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">🎯 Mission & Vision</CardTitle>
            <p className="text-purple-100 mt-1">Define your purpose and future aspirations</p>
          </div>
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
          <div className="relative">
            <textarea
              value={aboutData.mission_statement}
              onChange={(e) => updateField('mission_statement', e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 resize-none text-lg font-medium group-hover:shadow-lg bg-gradient-to-br from-white to-purple-50/30"
              rows={6}
              placeholder="What your company does and why it exists. What problems do you solve? What value do you create?"
            />
            <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              {aboutData.mission_statement?.length || 0}/500
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
          <div className="relative">
            <textarea
              value={aboutData.vision_statement}
              onChange={(e) => updateField('vision_statement', e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 resize-none text-lg font-medium group-hover:shadow-lg bg-gradient-to-br from-white to-pink-50/30"
              rows={6}
              placeholder="Your company's future aspirations and goals. Where do you see yourself in 5-10 years?"
            />
            <div className="absolute bottom-4 right-6 text-sm text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              {aboutData.vision_statement?.length || 0}/500
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
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">💎 Core Values</CardTitle>
              <p className="text-emerald-100 mt-1">Define what matters most to your company</p>
            </div>
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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">📊 Company Statistics</CardTitle>
            <p className="text-orange-100 mt-1">Showcase your impressive numbers and achievements</p>
          </div>
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
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 mb-1">
                  {aboutData.company_stats?.clients_served || '0'}
                </div>
                <div className="text-sm text-orange-700">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 mb-1">
                  {aboutData.company_stats?.success_rate || '0%'}
                </div>
                <div className="text-sm text-orange-700">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 mb-1">
                  {aboutData.company_stats?.years_experience || '0'}+
                </div>
                <div className="text-sm text-orange-700">Years Experience</div>
              </div>
            </div>
            <p className="text-orange-600 text-sm mt-4">These numbers tell your success story</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCultureSection = () => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">🎨 Company Culture</CardTitle>
            <p className="text-indigo-100 mt-1">Share what makes your workplace special</p>
          </div>
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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Image className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black">🎨 Images & Media</CardTitle>
            <p className="text-pink-100 mt-1">Visual elements that represent your brand</p>
          </div>
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

  // Missing render functions - adding placeholders
  const renderAchievementsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Achievements & Awards</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Achievements section coming soon...</p>
      </CardContent>
    </Card>
  );

  const renderHistorySection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company History</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Company history section coming soon...</p>
      </CardContent>
    </Card>
  );

  const renderCertificationsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Certifications section coming soon...</p>
      </CardContent>
    </Card>
  );

  const renderPartnershipsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Partnerships</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Partnerships section coming soon...</p>
      </CardContent>
    </Card>
  );

  const renderLocationsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Office Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Office locations section coming soon...</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 space-y-8">
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
            <div className="space-y-6">
              {renderSection()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutManagement;
