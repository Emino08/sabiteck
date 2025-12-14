import React, { useState, useEffect, useMemo } from 'react';
import { Users, Award, Globe, Clock, Heart, Target, Lightbulb, Shield, Github, Linkedin, Twitter, Mail, MapPin, Calendar, Code, Coffee, Zap, X, FileText, Send, Upload, ChevronRight, Star, Building, Briefcase, GraduationCap, Phone, User, TrendingUp, Sparkles, Laptop, Palette, Database, Cloud, Smartphone, Layout, Terminal, BookOpen, Wrench, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { apiRequest } from '../../utils/api';
import SEO from '../SEO/SEOHead';

const Team = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Skill icon and color mapping for enhanced visual display
  const skillStyles = {
    // Technical Skills
    'react': { icon: Code, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'javascript': { icon: Code, gradient: 'from-yellow-400 to-yellow-600', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'typescript': { icon: Code, gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'node.js': { icon: Terminal, gradient: 'from-green-500 to-green-700', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'nodejs': { icon: Terminal, gradient: 'from-green-500 to-green-700', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'python': { icon: Code, gradient: 'from-blue-400 to-yellow-400', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'java': { icon: Coffee, gradient: 'from-red-500 to-orange-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'php': { icon: Code, gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    
    // Databases
    'database': { icon: Database, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'mongodb': { icon: Database, gradient: 'from-green-600 to-green-800', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'mysql': { icon: Database, gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'postgresql': { icon: Database, gradient: 'from-blue-600 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    
    // Design
    'design': { icon: Palette, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'ui/ux': { icon: Layout, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'figma': { icon: Palette, gradient: 'from-purple-400 to-pink-400', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    
    // Cloud & DevOps
    'cloud': { icon: Cloud, gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    'aws': { icon: Cloud, gradient: 'from-orange-500 to-yellow-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'docker': { icon: Cloud, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    
    // Leadership & Soft Skills
    'leadership': { icon: Users, gradient: 'from-purple-600 to-indigo-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'mentorship': { icon: BookOpen, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'strategy': { icon: Target, gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'management': { icon: Briefcase, gradient: 'from-slate-600 to-gray-600', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    
    // Mobile
    'mobile': { icon: Smartphone, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    'ios': { icon: Smartphone, gradient: 'from-gray-700 to-gray-900', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    'android': { icon: Smartphone, gradient: 'from-green-500 to-lime-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    
    // Default
    'default': { icon: Zap, gradient: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  };

  // Function to get skill style
  const getSkillStyle = (skill) => {
    const skillLower = skill.toLowerCase().trim();
    
    // Check for exact matches or partial matches
    for (const [key, value] of Object.entries(skillStyles)) {
      if (skillLower.includes(key) || key.includes(skillLower)) {
        return value;
      }
    }
    
    return skillStyles.default;
  };

  const departmentColors = {
    leadership: { bg: 'bg-gradient-to-br from-purple-500 to-purple-700', icon: '👑', accent: 'text-purple-600' },
    engineering: { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', icon: '⚡', accent: 'text-blue-600' },
    design: { bg: 'bg-gradient-to-br from-pink-500 to-pink-700', icon: '🎨', accent: 'text-pink-600' },
    marketing: { bg: 'bg-gradient-to-br from-green-500 to-green-700', icon: '📢', accent: 'text-green-600' },
    operations: { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', icon: '⚙️', accent: 'text-orange-600' },
    sales: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', icon: '💼', accent: 'text-indigo-600' },
    management: { bg: 'bg-gradient-to-br from-red-500 to-red-700', icon: '🏆', accent: 'text-red-600' },
    all: { bg: 'bg-gradient-to-br from-gray-500 to-gray-700', icon: '🌟', accent: 'text-gray-600' }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const teamResp = await apiRequest('/api/team');
        if (!mounted) return;

        if (teamResp.success && Array.isArray(teamResp.data)) {
          setTeamMembers(teamResp.data);
        } else {
          setError('Failed to load team members.');
        }
      } catch (e) {
        if (!mounted) return;
        setError('An error occurred while fetching team data.');
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const uiDepartments = useMemo(() => {
    if (!teamMembers.length) return [];
    const depts = teamMembers.map(m => m.department).filter(Boolean);
    const uniqueDepts = [...new Set(depts)];
    const total = teamMembers.length;
    return [{ id: 'all', name: 'All Team', count: total }, ...uniqueDepts.map(d => ({ id: d, name: d, count: teamMembers.filter(m => m.department === d).length }))];
  }, [teamMembers]);

  const filteredTeam = selectedDepartment === 'all'
    ? teamMembers
    : teamMembers.filter(member => member.department === selectedDepartment);

  const getDepartmentStyle = (dept) => {
    const slug = (dept || '').toLowerCase();
    if (slug.includes('exec')) return departmentColors.leadership;
    if (slug.includes('tech')) return departmentColors.engineering;
    if (slug.includes('design')) return departmentColors.design;
    if (slug.includes('market')) return departmentColors.marketing;
    if (slug.includes('operat')) return departmentColors.operations;
    return departmentColors.all;
  };

  const values = [
    {
      icon: Heart,
      title: 'Client-Centric',
      description: 'We put our clients first, always. Your success is our success, and we go above and beyond to ensure your project exceeds expectations.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'We focus on delivering measurable outcomes. Every line of code we write serves a purpose and contributes to your business goals.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We stay ahead of the curve with cutting-edge technologies and creative solutions to complex problems.'
    },
    {
      icon: Shield,
      title: 'Reliability',
      description: 'Count on us for consistent, high-quality delivery. We meet deadlines and maintain the highest standards of professionalism.'
    }
  ];

  // Team stats
  const stats = [
    { label: 'Team Members', value: `${teamMembers.length}+` },
    { label: 'Countries', value: '5+' },
    { label: 'Years Experience', value: '15+' },
    { label: 'Projects Delivered', value: '150+' }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Our Team - Sabiteck"
        description="Meet the talented and dedicated team behind Sabiteck. Our experts are passionate about helping you achieve your goals."
        keywords="team, experts, Sabiteck team, professionals"
      />

      {/* Enhanced Hero Section - Matching Portfolio Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat bg-[length:60px_60px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
               }}>
          </div>
        </div>

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white py-12 md:py-20">
          <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-400/20">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Meet Our Team
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            The Brilliant Minds
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Behind Our Success
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
            Meet the passionate innovators, creative thinkers, and dedicated professionals
            who bring exceptional talent and expertise to every project we undertake.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
              onClick={() => window.location.href = '/contact'}
            >
              <Mail className="mr-3 h-6 w-6" />
              Join Our Team
              <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
              onClick={() => window.location.href = '/contact'}
            >
              <Send className="mr-3 h-6 w-6" />
              Get In Touch
            </button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-blue-200 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department Filter Section - Matching Portfolio Style */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 20px 20px, #3B82F6 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-600/10 rounded-full text-purple-600 text-sm font-medium mb-6">
              <Building className="h-4 w-4 mr-2" />
              Our Departments
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Organized Excellence
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Our diverse teams bring together expertise across multiple disciplines
              to deliver comprehensive solutions.
            </p>
          </div>

          {/* Department Filter Buttons */}
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-100">
              {uiDepartments.map(dept => {
                const isActive = selectedDepartment === dept.id;
                const style = getDepartmentStyle(dept.id);
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden ${
                      isActive
                        ? 'text-white shadow-xl'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{dept.name}</span>
                      <Badge className={`text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {dept.count}
                      </Badge>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-400"></div>
                <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-400" />
              </div>
              <p className="mt-6 text-blue-100 text-lg font-medium">Loading our amazing team...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 max-w-md mx-auto">
                <div className="bg-red-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">{error}</h2>
                <p className="text-red-600">Please try again later or contact support.</p>
              </div>
            </div>
          ) : filteredTeam.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTeam.map((member) => {
              const photoUrl = member.photo_url || member.avatar;
              const fullPhotoUrl = photoUrl && (photoUrl.startsWith('http') ? photoUrl : `http://localhost:8002${photoUrl}`);
              const social = member.social_links || {};
              
              // Parse and clean skills - handle various formats
              let skills = [];
              if (Array.isArray(member.skills)) {
                // Already an array - clean each skill
                skills = member.skills.map(s => {
                  if (typeof s === 'string') {
                    // Remove any wrapping quotes or brackets
                    return s.replace(/^[\["\s]+|[\]"\s]+$/g, '').trim();
                  }
                  return String(s).trim();
                }).filter(s => s.length > 0);
              } else if (typeof member.skills === 'string') {
                // String - could be JSON or comma-separated
                const trimmed = member.skills.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                      skills = parsed.map(s => String(s).replace(/^[\["\s]+|[\]"\s]+$/g, '').trim()).filter(s => s.length > 0);
                    }
                  } catch (e) {
                    // If JSON parse fails, treat as comma-separated
                    skills = trimmed.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(s => s.length > 0);
                  }
                } else {
                  // Comma-separated string
                  skills = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
                }
              }

              return (
                <div 
                  key={member.id} 
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Photo Section with Gradient Overlay */}
                  <div className="relative h-80 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                    {fullPhotoUrl ? (
                      <>
                        <img
                          src={fullPhotoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                      </>
                    ) : null}
                    <div 
                      className={`${fullPhotoUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100`}
                    >
                      <div className="text-center">
                        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-full mb-4 inline-block shadow-xl">
                          <User className="h-20 w-20 text-blue-600" />
                        </div>
                        <p className="text-gray-500 font-medium">No photo available</p>
                      </div>
                    </div>

                    {/* Featured Badge */}
                    {member.featured && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm">
                          <Star className="h-4 w-4 fill-white" />
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Department Badge */}
                    {member.department && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-semibold text-sm border border-gray-200">
                          <Building className="h-4 w-4 text-blue-600" />
                          {member.department}
                        </div>
                      </div>
                    )}

                    {/* Name & Position Overlay - Appears on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">
                        {member.name}
                      </h3>
                      <p className="text-blue-200 font-semibold text-sm drop-shadow-lg flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {member.position}
                      </p>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    {/* Bio */}
                    {member.bio && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {member.bio}
                      </p>
                    )}

                    {/* Skills Section */}
                    {skills.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Zap className="h-4 w-4 text-purple-600" />
                          <span>Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 4).map((skill, idx) => {
                            const skillStyle = getSkillStyle(skill);
                            const SkillIcon = skillStyle.icon;
                            return (
                              <div
                                key={idx}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${skillStyle.bg} ${skillStyle.text} ${skillStyle.border} border transition-all hover:scale-105`}
                              >
                                <SkillIcon className="h-3 w-3" />
                                {skill}
                              </div>
                            );
                          })}
                          {skills.length > 4 && (
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                              +{skills.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      {member.email && (
                        <a 
                          href={`mailto:${member.email}`} 
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors group/link p-2 rounded-lg hover:bg-blue-50"
                        >
                          <div className="bg-blue-100 p-2 rounded-lg group-hover/link:bg-blue-600 transition-colors">
                            <Mail className="h-4 w-4 text-blue-600 group-hover/link:text-white" />
                          </div>
                          <span className="truncate font-medium">{member.email}</span>
                        </a>
                      )}
                      {member.location && (
                        <div className="flex items-center gap-3 text-sm text-gray-600 p-2">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">{member.location}</span>
                        </div>
                      )}
                      {member.phone && (
                        <a 
                          href={`tel:${member.phone}`} 
                          className="flex items-center gap-3 text-sm text-gray-600 hover:text-purple-600 transition-colors group/link p-2 rounded-lg hover:bg-purple-50"
                        >
                          <div className="bg-purple-100 p-2 rounded-lg group-hover/link:bg-purple-600 transition-colors">
                            <Phone className="h-4 w-4 text-purple-600 group-hover/link:text-white" />
                          </div>
                          <span className="font-medium">{member.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Social Links */}
                    {(social.linkedin || social.twitter || social.github || member.linkedin_url || member.twitter_url || member.website_url) && (
                      <div className="flex justify-center gap-2 pt-4 border-t border-gray-100">
                        {(social.linkedin || member.linkedin_url) && (
                          <a
                            href={social.linkedin || member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {(social.twitter || member.twitter_url) && (
                          <a
                            href={social.twitter || member.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {(social.github || member.website_url) && (
                          <a
                            href={social.github || member.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-900 transition-all duration-300 transform hover:scale-110"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 max-w-lg mx-auto text-center border border-blue-100 shadow-xl">
                <div className="bg-white p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">No Team Members Found</h2>
                <p className="text-gray-600 text-lg">
                  We couldn't find any team members for this department. Please try selecting a different department or check back later.
                </p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Our Core Values Section - Matching Portfolio Style */}
      {filteredTeam.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-repeat bg-[length:50px_50px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 2px)`
                 }}>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6 border border-blue-400/20">
                <Heart className="h-4 w-4 mr-2" />
                Our Core Values
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                What Drives Us Forward
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                The principles that guide our team and drive our success in every project we undertake
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div 
                    key={index} 
                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">{value.title}</h3>
                    <p className="text-blue-100 leading-relaxed text-center">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 20px 20px, #3B82F6 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Want to Join Our Team?
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            We're always looking for talented individuals who share our passion for excellence and innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Mail className="h-6 w-6" />
              Contact Us
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              onClick={() => window.location.href = '/careers'}
              className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Briefcase className="h-6 w-6" />
              View Careers
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Team;
