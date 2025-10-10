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

  return (
    <div className="bg-gradient-to-b from-slate-50 via-blue-50 to-white min-h-screen pt-24">
      <SEO
        title="Our Team - Sabiteck"
        description="Meet the talented and dedicated team behind Sabiteck. Our experts are passionate about helping you achieve your goals."
        keywords="team, experts, Sabiteck team, professionals"
      />

      {/* Hero Header Section */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full backdrop-blur-sm mb-6 animate-bounce">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">Exceptional Team</span>
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 leading-relaxed mb-8">
              The passionate innovators and talented professionals driving our mission to transform education and create opportunities worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-lg">
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span>Diverse Expertise</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                <Heart className="h-5 w-5 text-red-300" />
                <span>Passionate Dedication</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-green-300" />
                <span>Proven Excellence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 md:h-24" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248, 250, 252)"/>
          </svg>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Department Filter with Enhanced Design */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <div className="inline-flex flex-wrap gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 w-full max-w-full sm:max-w-max overflow-x-auto">
            {uiDepartments.map(dept => {
              const isActive = selectedDepartment === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{dept.name}</span>
                    <span className="sm:hidden">{dept.name.split(' ')[0]}</span>
                    <Badge className={`ml-1 sm:ml-2 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                      {dept.count}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-flex">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading our amazing team...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <X className="h-8 w-8 text-red-600" />
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
                <Card 
                  key={member.id} 
                  className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group border-0 transform hover:-translate-y-2"
                >
                  <CardContent className="p-0">
                    {/* Photo Section with Gradient Overlay */}
                    <div className="relative h-72 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
                      {fullPhotoUrl ? (
                        <>
                          <img
                            src={fullPhotoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : null}
                      <div 
                        className={`${fullPhotoUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100`}
                      >
                        <div className="text-center">
                          <div className="bg-white/80 p-8 rounded-full mb-4 inline-block">
                            <User className="h-16 w-16 text-indigo-600" />
                          </div>
                          <p className="text-sm text-gray-500">No photo available</p>
                        </div>
                      </div>

                      {/* Featured Badge */}
                      {member.featured && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg px-3 py-1.5">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            Featured
                          </Badge>
                        </div>
                      )}

                      {/* Department Badge */}
                      {member.department && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-0 shadow-md px-3 py-1.5">
                            <Building className="h-3 w-3 mr-1" />
                            {member.department}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* Name and Position */}
                      <div className="text-center border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-purple-600 font-semibold text-sm">{member.position}</p>
                      </div>

                      {/* Bio */}
                      {member.bio && (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                          {member.bio}
                        </p>
                      )}

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {member.email && (
                          <div className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors">
                            <div className="bg-purple-50 p-2 rounded-lg mr-3">
                              <Mail className="h-4 w-4 text-purple-600" />
                            </div>
                            <a href={`mailto:${member.email}`} className="truncate hover:underline">
                              {member.email}
                            </a>
                          </div>
                        )}
                        {member.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="bg-green-50 p-2 rounded-lg mr-3">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <span>{member.location}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="bg-blue-50 p-2 rounded-lg mr-3">
                              <Phone className="h-4 w-4 text-blue-600" />
                            </div>
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.years_experience && (
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="bg-orange-50 p-2 rounded-lg mr-3">
                              <Briefcase className="h-4 w-4 text-orange-600" />
                            </div>
                            <span>{member.years_experience} years experience</span>
                          </div>
                        )}
                      </div>

                      {/* Skills - Enhanced Display */}
                      {skills.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Skills & Expertise</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {skills.slice(0, 5).map((skill, index) => {
                              const style = getSkillStyle(skill);
                              const SkillIcon = style.icon;
                              
                              return (
                                <div
                                  key={index}
                                  className={`group relative ${style.bg} ${style.border} border rounded-lg px-3 py-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <SkillIcon className={`h-3.5 w-3.5 ${style.text}`} />
                                    <span className={`text-xs font-semibold ${style.text}`}>
                                      {skill}
                                    </span>
                                  </div>
                                  {/* Hover effect - gradient background */}
                                  <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300`}></div>
                                </div>
                              );
                            })}
                            {skills.length > 5 && (
                              <div className="bg-gradient-to-r from-gray-100 to-slate-100 border border-gray-300 rounded-lg px-3 py-2 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer group">
                                <div className="flex items-center gap-1.5">
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                                  <span className="text-xs font-bold text-gray-700">
                                    +{skills.length - 5} more
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* All skills tooltip on hover - show remaining skills */}
                          {skills.length > 5 && (
                            <div className="mt-2 text-xs text-gray-500 italic">
                              Hover to see: {skills.slice(5).join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="flex justify-center items-center gap-3 pt-4 border-t border-gray-100">
                        {(social.linkedin || member.linkedin_url) && (
                          <a 
                            href={social.linkedin || member.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {(social.twitter || member.twitter_url) && (
                          <a 
                            href={social.twitter || member.twitter_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-3 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {(social.website || member.website_url) && (
                          <a 
                            href={social.website || member.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`} 
                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                          >
                            <Mail className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-12 max-w-lg mx-auto">
              <div className="bg-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">No Team Members Found</h2>
              <p className="text-gray-600 text-lg">
                We couldn't find any team members for this department. Please try selecting a different department or check back later.
              </p>
            </div>
          </div>
        )}

        {/* Core Values Section */}
        {filteredTeam.length > 0 && (
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The principles that guide our team and drive our success
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group transform hover:-translate-y-2">
                    <CardContent className="p-8 text-center">
                      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-10 w-10 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Team;
