import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Save, X, User, Mail, Phone, Star,
  Linkedin, Twitter, Globe, MapPin, Award, Briefcase, Users,
  Eye, EyeOff, Filter, TrendingUp, Building, Calendar,
  GraduationCap, Zap, Heart, CheckCircle, AlertCircle, Upload, Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiRequest } from '../../utils/api';
import { toast } from 'sonner';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0, departments: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
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
      console.log('API Response:', response); // Debug log
      
      if (response.success) {
        const members = response.data || [];
        console.log('Raw members from API:', members); // Debug log
        
        // Map fields for consistency
        const mappedMembers = members.map(member => {
          const mapped = {
            ...member,
            photo_url: member.photo_url || member.avatar || '',
            phone: member.phone || '',
            location: member.location || '',
            department: member.department || '',
            // Extract social links from JSON if they exist
            linkedin_url: member.social_links?.linkedin || member.linkedin_url || '',
            twitter_url: member.social_links?.twitter || member.twitter_url || '',
            website_url: member.social_links?.website || member.website_url || '',
            // Ensure skills is always an array
            skills: Array.isArray(member.skills) ? member.skills : (member.skills ? member.skills.split(',').map(s => s.trim()) : []),
            // Ensure other fields exist
            years_experience: member.years_experience || '',
            education: member.education || '',
            certifications: Array.isArray(member.certifications) ? member.certifications : [],
            active: member.active !== undefined ? Boolean(member.active) : true,
            featured: member.featured !== undefined ? Boolean(member.featured) : false,
            order_position: member.order_position || member.sort_order || 0
          };
          console.log('Mapped member:', mapped); // Debug log
          return mapped;
        });
        
        setTeamMembers(mappedMembers);
        updateStats(mappedMembers);
      } else {
        console.error('API returned unsuccessful response:', response);
        // Set fallback data with enhanced sample team
        const fallbackData = [
          {
            id: 1,
            name: '👨‍💼 Alpha Ousman Barrie',
            position: 'CEO & Founder',
            department: 'Executive',
            bio: 'Visionary leader driving innovation in education technology with 15+ years of experience in transforming how students access global opportunities.',
            email: 'alpha@sabiteck.com',
            phone: '+232 78 618435',
            location: '🇸🇱 Sierra Leone',
            photo_url: '/api/placeholder/150/150',
            linkedin_url: 'https://linkedin.com/in/alpha-barrie',
            skills: ['Leadership', 'Strategy', 'EdTech Innovation'],
            years_experience: '15',
            active: true,
            featured: true,
            order_position: 1
          },
          {
            id: 2,
            name: '👩‍💻 Sarah Johnson',
            position: 'Head of Study Abroad',
            department: 'Study Abroad',
            bio: 'Expert in international education with a passion for helping students achieve their global academic dreams and cultural exchange.',
            email: 'sarah@sabiteck.com',
            phone: '+44 20 7946 0958',
            location: '🇬🇧 London, UK',
            photo_url: '/api/placeholder/150/150',
            skills: ['Education Consulting', 'Student Support', 'Cultural Affairs'],
            years_experience: '10',
            active: true,
            featured: true,
            order_position: 2
          },
          {
            id: 3,
            name: '🧑‍💻 Mohamed Kamara',
            position: 'Lead Developer',
            department: 'Technology',
            bio: 'Full-stack developer specializing in modern web technologies and educational platform development.',
            email: 'mohamed@sabiteck.com',
            phone: '+232 76 123456',
            location: '🇸🇱 Freetown, Sierra Leone',
            skills: ['React', 'Node.js', 'Database Design'],
            years_experience: '8',
            active: true,
            featured: false,
            order_position: 3
          }
        ];
        setTeamMembers(fallbackData);
        updateStats(fallbackData);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (members) => {
    const total = members.length;
    const active = members.filter(m => m.active).length;
    const featured = members.filter(m => m.featured).length;
    const uniqueDepartments = new Set(members.map(m => m.department).filter(d => d));
    setStats({ total, active, featured, departments: uniqueDepartments.size });
  };

  const saveTeamMember = async () => {
    if (!currentMember.name || !currentMember.position) {
      toast.error('Please fill in name and position');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editingMember ? `/api/admin/team/${editingMember.id}` : '/api/admin/team';
      const method = editingMember ? 'PUT' : 'POST';

      // Process skills properly to avoid double encoding
      let processedSkills = [];
      
      if (typeof currentMember.skills === 'string') {
        const trimmed = currentMember.skills.trim();
        
        if (!trimmed) {
          processedSkills = [];
        } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          // It looks like JSON, try to parse it
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              // Clean each skill - remove extra quotes or brackets
              processedSkills = parsed
                .map(s => {
                  if (typeof s === 'string') {
                    // Remove any wrapping quotes or brackets
                    return s.replace(/^[\["\s]+|[\]"\s]+$/g, '').trim();
                  }
                  return String(s).trim();
                })
                .filter(s => s.length > 0);
            } else {
              processedSkills = [];
            }
          } catch (e) {
            // If parsing fails, treat as comma-separated
            processedSkills = trimmed
              .replace(/[\[\]"]/g, '') // Remove brackets and quotes
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
        } else {
          // Treat as comma-separated string
          processedSkills = trimmed
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        }
      } else if (Array.isArray(currentMember.skills)) {
        // Already an array - clean each item
        processedSkills = currentMember.skills
          .map(s => {
            if (typeof s === 'string') {
              // Remove any wrapping quotes or brackets
              return s.replace(/^[\["\s]+|[\]"\s]+$/g, '').trim();
            }
            return String(s).trim();
          })
          .filter(s => s.length > 0);
      }

      console.log('Original skills:', currentMember.skills);
      console.log('Processed skills:', processedSkills);

      const processedMember = {
        ...currentMember,
        skills: processedSkills,  // Send as clean array
        certifications: typeof currentMember.certifications === 'string'
          ? currentMember.certifications.split('\n').filter(c => c.trim())
          : currentMember.certifications
      };

      console.log('Sending to API:', processedMember);

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(processedMember)
      });

      await loadTeamMembers();
      resetForm();
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to save team member:', error);
      // For demo, update local state
      if (editingMember) {
        setTeamMembers(prev => prev.map(member =>
          member.id === editingMember.id ? { ...member, ...currentMember } : member
        ));
      } else {
        const newMember = {
          id: Date.now(),
          ...currentMember,
          created_at: new Date().toISOString()
        };
        setTeamMembers(prev => [newMember, ...prev]);
      }
      resetForm();
      setShowEditor(false);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeamMember = async (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    const memberName = member ? member.name : 'this team member';

    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 max-w-md">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Remove Team Member</h3>
            <p className="text-sm text-gray-600">Are you sure you want to remove <strong className="text-gray-900">{memberName}</strong>?</p>
            <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await apiRequest(`/api/admin/team/${memberId}`, {
                  method: 'DELETE'
                });
                toast.success('Team member removed successfully');
                await loadTeamMembers();
              } catch (error) {
                console.error('Failed to remove team member:', error);
                toast.error('Failed to remove team member');
                // For demo, remove from local state
                setTeamMembers(prev => prev.filter(member => member.id !== memberId));
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    });
  };

  const editTeamMember = (member) => {
    setEditingMember(member);
    setCurrentMember({
      ...member,
      // Ensure all fields are properly set
      name: member.name || '',
      position: member.position || '',
      department: member.department || '',
      bio: member.bio || '',
      email: member.email || '',
      phone: member.phone || '',
      location: member.location || '',
      photo_url: member.photo_url || member.avatar || '',
      linkedin_url: member.linkedin_url || '',
      twitter_url: member.twitter_url || '',
      website_url: member.website_url || '',
      years_experience: member.years_experience || '',
      education: member.education || '',
      active: member.active !== undefined ? member.active : true,
      featured: member.featured !== undefined ? member.featured : false,
      order_position: member.order_position || member.sort_order || 0,
      // Convert arrays to comma-separated strings for text inputs
      skills: Array.isArray(member.skills) ? member.skills.join(', ') : (member.skills || ''),
      certifications: Array.isArray(member.certifications)
        ? member.certifications.join('\n')
        : (member.certifications || '')
    });
    setPhotoPreview(null); // Reset photo preview
    setShowEditor(true);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or WebP images only.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB. Please upload a smaller image.');
      return;
    }

    // Validate image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      if (img.width > 2000 || img.height > 2000) {
        toast.error('Image dimensions too large. Maximum size is 2000x2000px. Recommended: 800x800px for best quality.');
        URL.revokeObjectURL(img.src);
        return;
      }

      // Show preview
      setPhotoPreview(img.src);

      // Upload photo
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('photo', file);

        // Use direct endpoint URL for photo upload
        const response = await fetch('http://localhost:8002/team-upload-photo.php', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setCurrentMember({ ...currentMember, photo_url: data.data.url });
          toast.success('Photo uploaded successfully!');
        } else {
          toast.error(data.error || 'Failed to upload photo');
          setPhotoPreview(null);
        }
      } catch (error) {
        console.error('Photo upload error:', error);
        toast.error('Failed to upload photo. Please try again.');
        setPhotoPreview(null);
      } finally {
        setUploadingPhoto(false);
      }
    };
  };

  const resetForm = () => {
    setEditingMember(null);
    setPhotoPreview(null);
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
      await apiRequest(`/api/admin/team/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      await loadTeamMembers();
    } catch (error) {
      console.error('Failed to update team member:', error);
      // For demo, update local state
      setTeamMembers(prev => prev.map(member =>
        member.id === memberId ? { ...member, [field]: value } : member
      ));
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && member.active) ||
                         (filterStatus === 'inactive' && !member.active) ||
                         (filterStatus === 'featured' && member.featured);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentIcon = (department) => {
    switch (department) {
      case 'Executive': return Building;
      case 'Technology': return Zap;
      case 'Study Abroad': return GraduationCap;
      case 'Marketing': return TrendingUp;
      default: return Briefcase;
    }
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-8 space-y-8">
          {/* Editor Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                  </h2>
                  <p className="text-indigo-100 text-lg">
                    {editingMember ? 'Update member information and profile' : 'Create a new team member profile'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowEditor(false)}
                className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl backdrop-blur-sm"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Enhanced Editor Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center text-2xl">
                    <User className="h-6 w-6 mr-3" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        👤 Full Name *
                      </label>
                      <Input
                        value={currentMember.name}
                        onChange={(e) => setCurrentMember({...currentMember, name: e.target.value})}
                        placeholder="John Doe"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        💼 Position *
                      </label>
                      <Input
                        value={currentMember.position}
                        onChange={(e) => setCurrentMember({...currentMember, position: e.target.value})}
                        placeholder="CEO & Founder"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        🏢 Department
                      </label>
                      <select
                        value={currentMember.department}
                        onChange={(e) => setCurrentMember({...currentMember, department: e.target.value})}
                        className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">Select department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        ⏱️ Years of Experience
                      </label>
                      <Input
                        value={currentMember.years_experience}
                        onChange={(e) => setCurrentMember({...currentMember, years_experience: e.target.value})}
                        placeholder="5+ years"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      📝 Professional Bio
                    </label>
                    <textarea
                      value={currentMember.bio}
                      onChange={(e) => setCurrentMember({...currentMember, bio: e.target.value})}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none"
                      rows={4}
                      placeholder="Brief professional biography showcasing expertise and achievements..."
                    />
                    <p className="text-sm text-gray-500">
                      {currentMember.bio?.length || 0} characters • Make it engaging and informative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      🎯 Skills (comma-separated)
                    </label>
                    <Input
                      value={currentMember.skills}
                      onChange={(e) => setCurrentMember({...currentMember, skills: e.target.value})}
                      placeholder="React, Node.js, Project Management"
                      className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center text-2xl">
                    <Mail className="h-6 w-6 mr-3" />
                    Contact & Social Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        📧 Email
                      </label>
                      <Input
                        type="email"
                        value={currentMember.email}
                        onChange={(e) => setCurrentMember({...currentMember, email: e.target.value})}
                        placeholder="john@company.com"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        📱 Phone
                      </label>
                      <Input
                        value={currentMember.phone}
                        onChange={(e) => setCurrentMember({...currentMember, phone: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      🌍 Location
                    </label>
                    <Input
                      value={currentMember.location}
                      onChange={(e) => setCurrentMember({...currentMember, location: e.target.value})}
                      placeholder="New York, USA"
                      className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        💼 LinkedIn URL
                      </label>
                      <Input
                        value={currentMember.linkedin_url}
                        onChange={(e) => setCurrentMember({...currentMember, linkedin_url: e.target.value})}
                        placeholder="https://linkedin.com/in/..."
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        🐦 Twitter URL
                      </label>
                      <Input
                        value={currentMember.twitter_url}
                        onChange={(e) => setCurrentMember({...currentMember, twitter_url: e.target.value})}
                        placeholder="https://twitter.com/..."
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        🌐 Website URL
                      </label>
                      <Input
                        value={currentMember.website_url}
                        onChange={(e) => setCurrentMember({...currentMember, website_url: e.target.value})}
                        placeholder="https://website.com"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Photo Preview Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center text-2xl">
                    📸 Profile Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Photo Upload Button */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Upload Photo
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                          disabled={uploadingPhoto}
                        />
                        <label
                          htmlFor="photo-upload"
                          className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${
                            uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingPhoto ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                              <span className="text-sm text-gray-600">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-600">Click to upload photo</span>
                            </>
                          )}
                        </label>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                        <div className="font-semibold mb-1">📋 Photo Requirements:</div>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Max size: <strong>5MB</strong></li>
                          <li>Max dimensions: <strong>2000x2000px</strong></li>
                          <li>Recommended: <strong>800x800px</strong></li>
                          <li>Formats: JPG, PNG, WebP</li>
                        </ul>
                      </div>
                    </div>

                    {/* Photo URL Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Or enter photo URL
                      </label>
                      <Input
                        value={currentMember.photo_url}
                        onChange={(e) => setCurrentMember({...currentMember, photo_url: e.target.value})}
                        placeholder="https://example.com/photo.jpg"
                        className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Photo Preview */}
                    {(photoPreview || currentMember.photo_url) ? (
                      <div className="relative">
                        <img
                          src={
                            photoPreview ||
                            (currentMember.photo_url.startsWith('http')
                              ? currentMember.photo_url
                              : `http://localhost:8002${currentMember.photo_url}`)
                          }
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-xl shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-48 bg-gray-200 rounded-xl items-center justify-center">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No photo uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-2xl">
                  <CardTitle className="flex items-center text-2xl">
                    ⚙️ Member Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="active"
                        checked={currentMember.active}
                        onChange={(e) => setCurrentMember({...currentMember, active: e.target.checked})}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="active" className="text-lg font-semibold text-gray-700 cursor-pointer">
                        ✅ Active Team Member
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-8">
                      {currentMember.active ? 'Member is visible on the website' : 'Member is hidden from public view'}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={currentMember.featured}
                        onChange={(e) => setCurrentMember({...currentMember, featured: e.target.checked})}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <label htmlFor="featured" className="text-lg font-semibold text-gray-700 cursor-pointer">
                        ⭐ Featured on Homepage
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-8">
                      {currentMember.featured ? 'Member appears in featured team section' : 'Member appears in regular team listing'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      📊 Display Order
                    </label>
                    <Input
                      type="number"
                      value={currentMember.order_position}
                      onChange={(e) => setCurrentMember({...currentMember, order_position: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      className="border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 transition-all"
                    />
                    <p className="text-sm text-gray-500">Lower numbers appear first</p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                onClick={saveTeamMember}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Saving...' : (editingMember ? 'Update Team Member' : 'Add Team Member')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-8 space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Team Management Center</h2>
                <p className="text-indigo-100 text-lg">Manage your talented team members and showcase your organization</p>
              </div>
            </div>
            <Button
              onClick={() => setShowEditor(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm uppercase tracking-wide">Total Members</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-2xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 font-medium text-sm uppercase tracking-wide">Active Members</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.active}</p>
                </div>
                <div className="bg-emerald-500 p-3 rounded-2xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 font-medium text-sm uppercase tracking-wide">Featured Members</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{stats.featured}</p>
                </div>
                <div className="bg-amber-500 p-3 rounded-2xl">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium text-sm uppercase tracking-wide">Departments</p>
                  <p className="text-3xl font-bold text-purple-700 mt-1">{stats.departments}</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-2xl">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-gray-200 rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="featured">Featured Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredMembers.map((member) => {
              const DepartmentIcon = getDepartmentIcon(member.department);

              return (
                <Card key={member.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Member Header */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
                      <div className="absolute top-4 right-4 flex gap-2">
                        {member.active && (
                          <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {member.featured && (
                          <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <div className="text-center">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url.startsWith('http') ? member.photo_url : `http://localhost:8002${member.photo_url}`}
                            alt={member.name}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/20 shadow-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center border-4 border-white/20">
                            <User className="h-10 w-10 text-white/60" />
                          </div>
                        )}

                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <p className="text-indigo-100 font-medium mb-2">{member.position}</p>

                        {member.department && (
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <DepartmentIcon className="h-4 w-4" />
                            <span className="text-sm text-indigo-200">{member.department}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="p-6 space-y-4">
                      {member.bio && (
                        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{member.bio}</p>
                      )}

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {member.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-3 text-blue-500" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-3 text-emerald-500" />
                            <span>{member.location}</span>
                          </div>
                        )}
                        {member.years_experience && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 mr-3 text-purple-500" />
                            <span>{member.years_experience} years experience</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(member.skills) ? member.skills : member.skills.split(',')).slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                                {skill.trim()}
                              </Badge>
                            ))}
                            {member.skills.length > 3 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                +{member.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="flex items-center gap-3 pt-2">
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                             className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {member.twitter_url && (
                          <a href={member.twitter_url} target="_blank" rel="noopener noreferrer"
                             className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors">
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {member.website_url && (
                          <a href={member.website_url} target="_blank" rel="noopener noreferrer"
                             className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Button
                          size="sm"
                          onClick={() => editTeamMember(member)}
                          className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 rounded-xl"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => toggleMemberStatus(member.id, 'active', !member.active)}
                          className={`flex-1 border-0 rounded-xl ${
                            member.active
                              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {member.active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {member.active ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteTeamMember(member.id)}
                          className="bg-red-50 text-red-700 hover:bg-red-100 border-0 rounded-xl px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMembers.length === 0 && (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-xl">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No team members found</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Start building your team by adding your first team member.'}
              </p>
              {!searchTerm && filterDepartment === 'all' && filterStatus === 'all' && (
                <Button
                  onClick={() => setShowEditor(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;

