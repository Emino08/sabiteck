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
    <Card>
      <CardHeader>
        <CardTitle>Company Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Description</label>
          <textarea
            value={aboutData.company_overview}
            onChange={(e) => updateField('company_overview', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md"
            rows={6}
            placeholder="Describe your company, its purpose, and what makes it unique..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Founding Year</label>
          <Input
            type="number"
            value={aboutData.founding_year}
            onChange={(e) => updateField('founding_year', e.target.value)}
            placeholder="2020"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Leadership Message</label>
          <textarea
            value={aboutData.leadership_message}
            onChange={(e) => updateField('leadership_message', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md"
            rows={4}
            placeholder="Message from CEO or leadership team..."
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderMissionSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mission & Vision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mission Statement</label>
          <textarea
            value={aboutData.mission_statement}
            onChange={(e) => updateField('mission_statement', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md"
            rows={4}
            placeholder="What your company does and why it exists..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Vision Statement</label>
          <textarea
            value={aboutData.vision_statement}
            onChange={(e) => updateField('vision_statement', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md"
            rows={4}
            placeholder="Your company's future aspirations and goals..."
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderValuesSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Core Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Add a core value..."
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
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {(aboutData.core_values || []).map((value, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <span>{value}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeArrayItem('core_values', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStatsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Clients Served</label>
            <Input
              value={aboutData.company_stats?.clients_served || ''}
              onChange={(e) => updateNestedField('company_stats', 'clients_served', e.target.value)}
              placeholder="500+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Success Rate</label>
            <Input
              value={aboutData.company_stats?.success_rate || ''}
              onChange={(e) => updateNestedField('company_stats', 'success_rate', e.target.value)}
              placeholder="95%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Years of Experience</label>
            <Input
              value={aboutData.company_stats?.years_experience || ''}
              onChange={(e) => updateNestedField('company_stats', 'years_experience', e.target.value)}
              placeholder="10+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Team Members</label>
            <Input
              value={aboutData.company_stats?.team_members || ''}
              onChange={(e) => updateNestedField('company_stats', 'team_members', e.target.value)}
              placeholder="50+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Countries Served</label>
            <Input
              value={aboutData.company_stats?.countries_served || ''}
              onChange={(e) => updateNestedField('company_stats', 'countries_served', e.target.value)}
              placeholder="15+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Awards Won</label>
            <Input
              value={aboutData.company_stats?.awards_won || ''}
              onChange={(e) => updateNestedField('company_stats', 'awards_won', e.target.value)}
              placeholder="5+"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCultureSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Culture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Culture Description</label>
          <textarea
            value={aboutData.company_culture}
            onChange={(e) => updateField('company_culture', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md"
            rows={6}
            placeholder="Describe your company culture, work environment, and values in action..."
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderMediaSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Images & Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Hero Image URL</label>
          <Input
            value={aboutData.hero_image}
            onChange={(e) => updateField('hero_image', e.target.value)}
            placeholder="https://example.com/hero-image.jpg"
          />
          {aboutData.hero_image && (
            <img
              src={aboutData.hero_image}
              alt="Hero Preview"
              className="mt-2 w-full h-48 object-cover rounded"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">About Page Management</h2>
        <Button onClick={saveAboutData} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutManagement;
