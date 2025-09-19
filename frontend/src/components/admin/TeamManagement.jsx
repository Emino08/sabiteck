import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Save, X, User, Mail, Phone,
  Linkedin, Twitter, Globe, MapPin, Award, Briefcase
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [currentMember, setCurrentMember] = useState({
    name: '',
    position: '',
    department: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    photo_url: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
    skills: [],
    years_experience: '',
    education: '',
    certifications: [],
    active: true,
    featured: false,
    order_position: 0
  });

  const departments = [
    'Executive', 'Study Abroad', 'Business Intelligence', 'Technology',
    'Marketing', 'Operations', 'Customer Service', 'Finance', 'HR'
  ];

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/team');
      if (response.success) {
        setTeamMembers(response.data.team || response.data || []);
      } else {
        toast.error('Failed to load team members');
      }
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const saveTeamMember = async () => {
    if (!currentMember.name || !currentMember.position) {
      toast.error('Please fill in name and position');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingMember ? `/api/admin/team/${editingMember.id}` : '/api/admin/team';
      const method = editingMember ? 'PUT' : 'POST';

      const processedMember = {
        ...currentMember,
        skills: typeof currentMember.skills === 'string'
          ? currentMember.skills.split(',').map(s => s.trim()).filter(s => s)
          : currentMember.skills,
        certifications: typeof currentMember.certifications === 'string'
          ? currentMember.certifications.split('\n').filter(c => c.trim())
          : currentMember.certifications
      };

      const response = await apiRequest(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(processedMember)
      });

      if (response.success) {
        toast.success(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!');
        resetForm();
        loadTeamMembers();
        setShowEditor(false);
      } else {
        toast.error(response.message || 'Failed to save team member');
      }
    } catch (error) {
      toast.error('Failed to save team member');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeamMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await apiRequest(`/api/admin/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.success) {
        toast.success('Team member removed successfully!');
        loadTeamMembers();
      } else {
        toast.error('Failed to remove team member');
      }
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  const editTeamMember = (member) => {
    setEditingMember(member);
    setCurrentMember({
      ...member,
      skills: Array.isArray(member.skills) ? member.skills.join(', ') : (member.skills || ''),
      certifications: Array.isArray(member.certifications)
        ? member.certifications.join('\n')
        : (member.certifications || '')
    });
    setShowEditor(true);
  };

  const resetForm = () => {
    setEditingMember(null);
    setCurrentMember({
      name: '',
      position: '',
      department: '',
      bio: '',
      email: '',
      phone: '',
      location: '',
      photo_url: '',
      linkedin_url: '',
      twitter_url: '',
      website_url: '',
      skills: [],
      years_experience: '',
      education: '',
      certifications: [],
      active: true,
      featured: false,
      order_position: 0
    });
  };

  const toggleMemberStatus = async (memberId, field, value) => {
    try {
      const token = localStorage.getItem('admin_token');
      await apiRequest(`/api/admin/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value })
      });

      toast.success('Team member updated successfully!');
      loadTeamMembers();
    } catch (error) {
      toast.error('Failed to update team member');
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingMember ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <Button onClick={() => setShowEditor(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <Input
                      value={currentMember.name}
                      onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Position *</label>
                    <Input
                      value={currentMember.position}
                      onChange={(e) => setCurrentMember({...currentMember, position: e.target.value})}
                      placeholder="CEO & Founder"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select
                      value={currentMember.department}
                      onChange={(e) => setCurrentMember({...currentMember, department: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Years of Experience</label>
                    <Input
                      value={currentMember.years_experience}
                      onChange={(e) => setCurrentMember({...currentMember, years_experience: e.target.value})}
                      placeholder="5+ years"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={currentMember.bio}
                    onChange={(e) => setCurrentMember({...currentMember, bio: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={4}
                    placeholder="Brief professional biography..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Education</label>
                  <textarea
                    value={currentMember.education}
                    onChange={(e) => setCurrentMember({...currentMember, education: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={2}
                    placeholder="Educational background..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                  <Input
                    value={currentMember.skills}
                    onChange={(e) => setCurrentMember({...currentMember, skills: e.target.value})}
                    placeholder="React, Node.js, Project Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Certifications (one per line)</label>
                  <textarea
                    value={currentMember.certifications}
                    onChange={(e) => setCurrentMember({...currentMember, certifications: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    rows={3}
                    placeholder="AWS Certified&#10;PMP Certification"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={currentMember.email}
                      onChange={(e) => setCurrentMember({...currentMember, email: e.target.value})}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={currentMember.phone}
                      onChange={(e) => setCurrentMember({...currentMember, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={currentMember.location}
                    onChange={(e) => setCurrentMember({...currentMember, location: e.target.value})}
                    placeholder="New York, USA"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                    <Input
                      value={currentMember.linkedin_url}
                      onChange={(e) => setCurrentMember({...currentMember, linkedin_url: e.target.value})}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter URL</label>
                    <Input
                      value={currentMember.twitter_url}
                      onChange={(e) => setCurrentMember({...currentMember, twitter_url: e.target.value})}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website URL</label>
                    <Input
                      value={currentMember.website_url}
                      onChange={(e) => setCurrentMember({...currentMember, website_url: e.target.value})}
                      placeholder="https://website.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium mb-2">Photo URL</label>
                  <Input
                    value={currentMember.photo_url}
                    onChange={(e) => setCurrentMember({...currentMember, photo_url: e.target.value})}
                    placeholder="https://example.com/photo.jpg"
                  />
                  {currentMember.photo_url && (
                    <img
                      src={currentMember.photo_url}
                      alt="Preview"
                      className="mt-3 w-full h-48 object-cover rounded-lg"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={currentMember.active}
                    onChange={(e) => setCurrentMember({...currentMember, active: e.target.checked})}
                  />
                  <label htmlFor="active" className="text-sm">Active Member</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={currentMember.featured}
                    onChange={(e) => setCurrentMember({...currentMember, featured: e.target.checked})}
                  />
                  <label htmlFor="featured" className="text-sm">Featured on Homepage</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <Input
                    type="number"
                    value={currentMember.order_position}
                    onChange={(e) => setCurrentMember({...currentMember, order_position: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveTeamMember} disabled={loading} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (editingMember ? 'Update Member' : 'Add Member')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Management</h2>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search team members..."
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
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-blue-600 font-medium">{member.position}</p>
                  <p className="text-xs text-gray-500">{member.department}</p>
                </div>

                {member.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{member.bio}</p>
                )}

                <div className="space-y-2 mb-4">
                  {member.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{member.location}</span>
                    </div>
                  )}
                  {member.years_experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span>{member.years_experience} experience</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                    {member.featured && (
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
                    onClick={() => editTeamMember(member)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteTeamMember(member.id)}
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

      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No team members found</p>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
