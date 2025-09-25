import React from 'react'
import {
  Users, Award, Globe, Clock, Target, Heart, Lightbulb,
  Shield, ArrowRight, Star, MapPin, Mail,
  Phone, Calendar, Briefcase, Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { DataRenderer, useAsyncData, formatData } from '@/components/ui/data-display'
import { SkeletonGrid, ErrorMessage } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import SEOHead from '../SEO/SEOHead'
import ApiService from '../../services/api'

const About = () => {
  const navigate = useNavigate()

  // Enhanced data fetching with better error handling
  const {
    data: aboutContent
  } = useAsyncData(() => ApiService.getAboutPageContent())

  const {
    data: companyInfo
  } = useAsyncData(() => ApiService.getCompanyInfo())

  const {
    data: teamMembers,
    loading: teamLoading,
    error: teamError
  } = useAsyncData(() => ApiService.getTeamMembers())

  const {
    data: companyStats
  } = useAsyncData(() => ApiService.getCompanyStats())

  const {
    data: companyMission
  } = useAsyncData(() => ApiService.getCompanyMission())

  const {
    data: companyValues
  } = useAsyncData(() => ApiService.getCompanyValues())

  // Fallback data for when backend is not available
  const fallbackStats = [
    {
      title: 'Years Experience',
      value: 5,
      icon: Clock,
      description: 'Since 2020',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Projects Completed',
      value: 50,
      icon: Award,
      description: 'Successfully delivered',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Happy Clients',
      value: 30,
      icon: Users,
      description: 'Across Sierra Leone',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Team Members',
      value: 10,
      icon: Globe,
      description: 'Expert professionals',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const fallbackValues = [
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We stay ahead of technology trends to deliver cutting-edge solutions that drive business growth.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Quality Focused',
      description: 'We maintain the highest standards in code quality, security, and user experience across all projects.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'Client Success',
      description: 'Your success is our success. We are committed to delivering results that exceed expectations.',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'Goal Oriented',
      description: 'We focus on achieving measurable outcomes that align with your business objectives.',
      color: 'from-blue-500 to-indigo-500'
    }
  ]

  // Map for resolving icon names from API to lucide-react components
  const iconMap = {
    lightbulb: Lightbulb,
    shield: Shield,
    heart: Heart,
    target: Target,
    users: Users,
    award: Award,
    globe: Globe,
    clock: Clock,
    star: Star,
    mapPin: MapPin,
    mail: Mail,
    phone: Phone,
    calendar: Calendar,
    briefcase: Briefcase
  }

  const resolveIcon = (icon) => {
    if (!icon) return Lightbulb
    // If it's already a component (function), return as is
    if (typeof icon === 'function' || typeof icon === 'object') return icon
    // If it's a string, map it to a component
    const key = String(icon).trim()
    // Try exact, lowercase, and camelCase variants
    return iconMap[key] || iconMap[key.toLowerCase()] || iconMap[key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')] || Lightbulb
  }

  // Prepare company values with safe icons
  const rawValues = (Array.isArray(companyValues) && companyValues.length) ? companyValues : fallbackValues
  const processedValues = rawValues.map(v => ({
    ...v,
    icon: resolveIcon(v.icon)
  }))

  // Process company stats
  const processedStats = companyStats ? [
    {
      title: 'Years Experience',
      value: companyStats.years_experience || 5,
      icon: Clock,
      description: `Since ${new Date().getFullYear() - (companyStats.years_experience || 5)}`,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Projects Completed',
      value: companyStats.projects_completed || 50,
      icon: Award,
      description: 'Successfully delivered',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Happy Clients',
      value: companyStats.happy_clients || 30,
      icon: Users,
      description: 'Across Sierra Leone',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Team Members',
      value: companyStats.team_members || 10,
      icon: Globe,
      description: 'Expert professionals',
      color: 'from-orange-500 to-orange-600'
    }
  ] : fallbackStats

  // Process team members data
  const processedTeamMembers = teamMembers && Array.isArray(teamMembers) ? teamMembers.map(member => ({
    ...member,
    image: member.profile_image || member.image,
    bio: member.bio || member.description,
    role: member.position || member.role || member.title,
    social_links: member.social_links || {}
  })) : []

  // Default company info
  const defaultCompanyInfo = {
    name: 'Sabiteck Limited',
    tagline: 'Your Premier Tech Partner in Sierra Leone',
    description: 'We are a passionate team of developers, designers, and strategists dedicated to building software that makes a difference. Founded in 2020, we have helped dozens of companies transform their ideas into successful digital products.',
    founded_year: 2020,
    location: 'Bo, Sierra Leone',
    address: '6 Hancil Road, Bo, Sierra Leone',
    email: 'info@sabiteck.com',
    phone: '+232 78 618 435'
  }

  // Merge API values over defaults to avoid missing fields showing empty
  const displayCompanyInfo = { ...defaultCompanyInfo, ...(companyInfo || {}) }

  return (
    <>
      <SEOHead
        title="About Sabiteck Limited - Premier Technology Solutions in Sierra Leone"
        description="Learn about Sabiteck Limited, Sierra Leone's leading technology company. Meet our expert team and discover our mission to transform businesses through innovative software solutions."
        keywords="about Sabiteck, Sierra Leone tech company, software development team, technology solutions Bo, Emmanuel Koroma CEO"
      />

      <div className="min-h-screen pt-20 bg-white">
        {/* Ultra-Modern Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
          {/* Enhanced Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-repeat bg-[length:120px_120px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 60px 60px, rgba(147, 197, 253, 0.3) 2px, transparent 2px), radial-gradient(circle at 20px 80px, rgba(196, 181, 253, 0.2) 1px, transparent 1px)`
                 }}>
            </div>
          </div>

          {/* Premium Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '6s'}}></div>

            {/* Geometric Floating Elements */}
            <div className="absolute top-40 right-40 w-8 h-8 bg-blue-400/30 rotate-45 animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
            <div className="absolute bottom-40 left-40 w-6 h-6 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
            <div className="absolute top-60 left-1/4 w-4 h-4 bg-cyan-400/30 rotate-12 animate-bounce" style={{animationDelay: '3s', animationDuration: '5s'}}></div>
          </div>

          <div className="container-responsive relative z-10 text-white">
            <div className="text-center max-w-5xl mx-auto">
              <ScrollReveal>
                <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-lg rounded-full text-blue-200 text-sm font-bold mb-12 border border-blue-400/30 shadow-2xl hover:scale-105 transition-all duration-500">
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center mr-3">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  ✨ Discover Our Journey
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight">
                  <span className="block text-white mb-4">Meet</span>
                  <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                    {displayCompanyInfo.name}
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="relative mb-10">
                  <p className="text-2xl md:text-3xl text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text mb-8 leading-relaxed font-semibold">
                    {displayCompanyInfo.tagline}
                  </p>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-12 border border-white/20 shadow-2xl">
                  <p className="text-lg md:text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed font-medium">
                    {aboutContent?.description || displayCompanyInfo.description}
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={500}>
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-white via-blue-50 to-white text-blue-900 hover:from-blue-50 hover:via-white hover:to-blue-50 px-12 py-6 rounded-3xl font-black text-xl shadow-2xl hover:shadow-cyan-500/25 hover:scale-110 transition-all duration-500 border-2 border-white/20"
                    onClick={() => navigate('/contact')}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-300">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      Let's Connect
                      <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="group border-3 border-white/40 text-white hover:bg-white/20 px-12 py-6 rounded-3xl font-black text-xl backdrop-blur-lg hover:scale-110 transition-all duration-500 hover:border-cyan-400/50"
                    onClick={() => navigate('/portfolio')}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-300">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      Our Portfolio
                    </div>
                  </Button>
                </div>
              </ScrollReveal>

              {/* Enhanced Company highlights */}
              <ScrollReveal delay={600}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  <div className="group text-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/30 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 transition-all duration-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <p className="font-black text-white mb-3 text-lg">📍 Located in</p>
                    <p className="text-cyan-200 text-xl font-semibold">{displayCompanyInfo.location}</p>
                    <div className="mt-4 w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mx-auto"></div>
                  </div>
                  <div className="group text-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/30 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <p className="font-black text-white mb-3 text-lg">🎯 Established</p>
                    <p className="text-purple-200 text-xl font-semibold">{displayCompanyInfo.founded_year}</p>
                    <div className="mt-4 w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"></div>
                  </div>
                  <div className="group text-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/30 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <p className="font-black text-white mb-3 text-lg">👥 Expert Team</p>
                    <p className="text-emerald-200 text-xl font-semibold">10+ Professionals</p>
                    <div className="mt-4 w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mx-auto"></div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Revolutionary Statistics Section */}
        <section className="section-padding bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
          {/* Premium Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-repeat bg-[length:80px_80px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 40px 40px, #3B82F6 2px, transparent 2px), radial-gradient(circle at 20px 60px, #8B5CF6 1px, transparent 1px)`
                 }}>
            </div>
          </div>

          {/* Floating Geometric Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-40 left-40 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-md animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center mb-24">
                <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600/15 via-green-600/15 to-teal-600/15 backdrop-blur-lg rounded-full text-emerald-700 text-lg font-black mb-8 border border-emerald-400/30 shadow-lg hover:scale-105 transition-all duration-500">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mr-4">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  🏆 Our Achievements
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
                  <span className="block">Our Impact in</span>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Numbers
                  </span>
                </h2>
                <div className="relative">
                  <p className="text-xl md:text-2xl text-gray-700 max-w-5xl mx-auto leading-relaxed font-semibold">
                    Our track record speaks for itself - delivering excellence in every project
                    across Sierra Leone and beyond with measurable results.
                  </p>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processedStats.map((stat, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="group relative">
                    {/* Premium Card Design */}
                    <div className="relative bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/60 hover:border-white/80 shadow-2xl hover:shadow-3xl hover:-translate-y-4 transition-all duration-500 overflow-hidden">
                      {/* Animated Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-all duration-500 rounded-3xl`}></div>

                      {/* Card Content */}
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className={`relative w-18 h-18 bg-gradient-to-br ${stat.color} rounded-3xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl`}>
                            {React.createElement(stat.icon, { className: "h-10 w-10 text-white" })}
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-emerald-600 font-black bg-emerald-100 px-3 py-1 rounded-full">
                              Since {displayCompanyInfo.founded_year}
                            </div>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="text-center mb-6">
                          <div className="text-5xl font-black text-gray-900 mb-3 group-hover:scale-110 transition-transform duration-300">
                            {formatData.number(stat.value)}
                            <span className="text-2xl text-blue-600">+</span>
                          </div>
                          <div className={`text-lg font-black text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${stat.color.replace('from-', 'from-').replace(' to-', ' to-')} group-hover:bg-clip-text transition-all duration-300`}>
                            {stat.title}
                          </div>
                          <div className="text-gray-600 text-sm font-semibold">{stat.description}</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div className={`bg-gradient-to-r ${stat.color} h-2 rounded-full group-hover:animate-pulse transition-all duration-1000`}
                               style={{width: `${Math.min((stat.value / Math.max(...processedStats.map(s => s.value))) * 100, 100)}%`}}></div>
                        </div>

                        {/* Achievement Badge */}
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-bold rounded-full border border-gray-200 group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-700 group-hover:border-blue-200 transition-all duration-300">
                            <Trophy className="w-3 h-3 mr-2" />
                            Excellence Achieved
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Revolutionary Mission & Values Section */}
        <section className="section-padding bg-gradient-to-br from-white via-slate-50 to-gray-100 relative overflow-hidden">
          {/* Premium Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full blur-2xl"></div>
          </div>

          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center mb-24">
                <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-blue-600/15 backdrop-blur-lg rounded-full text-purple-700 text-lg font-black mb-8 border border-purple-400/30 shadow-lg hover:scale-105 transition-all duration-500">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  🎯 Our Mission & Values
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
                  <span className="block">What Drives Us</span>
                  <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Forward
                  </span>
                </h2>
                <div className="relative">
                  <p className="text-xl md:text-2xl text-gray-700 max-w-5xl mx-auto leading-relaxed font-semibold">
                    Our mission and core values are the foundation of everything we do - guiding every decision,
                    every solution, and every relationship we build.
                  </p>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24">
              <ScrollReveal>
                {/* Enhanced Mission Card */}
                <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-4xl p-12 overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white/50">
                  {/* Animated Background Elements */}
                  <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>

                  <div className="relative z-10">
                    {/* Enhanced Icon */}
                    <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-12 transition-all duration-300">
                      <Target className="h-10 w-10 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-bounce">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Enhanced Title */}
                    <h3 className="text-4xl font-black text-gray-900 mb-8 flex items-center">
                      🚀 Our Mission
                    </h3>

                    {/* Enhanced Content */}
                    <div className="space-y-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                        <p className="leading-relaxed text-lg font-semibold text-gray-800">
                          {companyMission?.content ||
                            "To empower businesses across Sierra Leone with innovative software solutions that drive growth, improve efficiency, and create exceptional user experiences."
                          }
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                        <p className="leading-relaxed text-gray-700 font-medium">
                          Every project we take on is an opportunity to push the boundaries of what's possible and deliver something truly remarkable that transforms how businesses operate.
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Info Cards */}
                    <div className="mt-10 grid grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/50 hover:scale-105 transition-all duration-300 shadow-lg">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-black text-gray-800 mb-1">📍 Location</div>
                        <div className="text-blue-700 font-bold">{displayCompanyInfo.location}</div>
                      </div>
                      <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/50 hover:scale-105 transition-all duration-300 shadow-lg">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-sm font-black text-gray-800 mb-1">🗓️ Founded</div>
                        <div className="text-purple-700 font-bold">{displayCompanyInfo.founded_year}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                {/* Enhanced Values Section */}
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <h3 className="text-4xl font-black text-gray-900 mb-4 flex items-center justify-center lg:justify-start">
                      💎 Core Values
                    </h3>
                    <p className="text-lg text-gray-600 font-medium max-w-lg">
                      These fundamental principles shape who we are and guide everything we do.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {processedValues.map((value, index) => (
                      <div key={index} className="group">
                        <div className="relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl p-8 border-2 border-gray-100 hover:border-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                          {/* Hover Background Effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-all duration-500 rounded-3xl`}></div>

                          <div className="relative z-10 flex items-start space-x-6">
                            {/* Enhanced Icon */}
                            <div className="flex-shrink-0 relative">
                              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${value.color} flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl`}>
                                {React.createElement(value.icon, { className: "h-8 w-8 text-white" })}
                              </div>
                              {/* Status Indicator */}
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </div>
                            </div>

                            {/* Enhanced Content */}
                            <div className="flex-1">
                              <div className="flex items-center mb-4">
                                <h4 className={`text-2xl font-black text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${value.color.replace('from-', 'from-').replace(' to-', ' to-')} group-hover:bg-clip-text transition-all duration-300`}>
                                  {value.title}
                                </h4>
                                <div className="ml-4 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
                                  Core Value
                                </div>
                              </div>

                              <p className="text-gray-700 leading-relaxed text-lg font-medium mb-4">
                                {value.description}
                              </p>

                              {/* Value Strength Indicator */}
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-bold text-gray-600">Impact:</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div className={`bg-gradient-to-r ${value.color} h-2 rounded-full group-hover:animate-pulse transition-all duration-1000`}
                                       style={{width: '85%'}}></div>
                                </div>
                                <div className="text-sm font-black text-emerald-600">High</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Enhanced Team Section */}
        <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-repeat bg-[length:50px_50px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 25px 25px, #6B46C1 1px, transparent 1px)`
                 }}>
            </div>
          </div>
          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center mb-20">
                <div className="inline-flex items-center px-4 py-2 bg-indigo-600/10 rounded-full text-indigo-600 text-sm font-medium mb-6">
                  <Users className="h-4 w-4 mr-2" />
                  Our Team
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Meet Our Expert Team
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  Our diverse team of talented professionals brings together expertise from various backgrounds
                  to deliver exceptional results for our clients.
                </p>
              </div>
            </ScrollReveal>

            <DataRenderer
              data={processedTeamMembers}
              loading={teamLoading}
              error={teamError}
              emptyMessage="Team information will be available soon"
              loadingComponent={<SkeletonGrid items={8} columns={4} />}
              errorComponent={<ErrorMessage title="Unable to load team members" />}
            >
              {(team) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {team.map((member, index) => (
                    <ScrollReveal key={member.id || index} delay={index * 100}>
                      <div className="group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center h-full">
                          <div className="relative mb-6">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-24 h-24 rounded-2xl mx-auto object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3b82f6&color=ffffff&size=96`
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-2xl mx-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl group-hover:scale-105 transition-transform duration-300">
                                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
                          </div>

                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-blue-600 font-semibold text-lg mb-1">{member.role}</p>
                          {member.department && (
                            <p className="text-gray-500 text-sm mb-4">{member.department}</p>
                          )}

                          <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            {formatData.truncate(member.bio, 100)}
                          </p>

                          {member.skills && Array.isArray(member.skills) && (
                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                              {member.skills.slice(0, 3).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-center space-x-3">
                            {member.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-3 hover:bg-blue-100 hover:scale-110 rounded-2xl transition-all duration-300"
                                onClick={() => window.location.href = `mailto:${member.email}`}
                              >
                                <Mail className="h-5 w-5 text-blue-600" />
                              </Button>
                            )}
                            {member.social_links?.linkedin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-3 hover:bg-blue-100 hover:scale-110 rounded-2xl transition-all duration-300"
                                onClick={() => window.open(member.social_links.linkedin, '_blank')}
                              >
                                <Briefcase className="h-5 w-5 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </DataRenderer>

            {/* Team CTA */}
            <ScrollReveal delay={600}>
              <div className="mt-20 text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-4">Want to Join Our Team?</h3>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                      We're always looking for talented individuals who share our passion for technology and innovation.
                    </p>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                      onClick={() => navigate('/contact')}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      View Open Positions
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="section-padding bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-repeat bg-[length:80px_80px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 40px 40px, white 2px, transparent 2px)`
                 }}>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>

          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center px-6 py-3 bg-green-600/20 rounded-full text-green-200 text-sm font-medium mb-8">
                  <Heart className="h-4 w-4 mr-2" />
                  Let's Work Together
                </div>
                <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                  Ready to Transform Your
                  <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Business with Us?
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
                  Let's discuss how our experienced team can help you achieve your technology goals.
                  Contact us today for a free consultation and see how we can transform your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                  <Button
                    size="lg"
                    className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group"
                    onClick={() => navigate('/contact')}
                  >
                    <Heart className="mr-3 h-6 w-6" />
                    Start Your Project
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm hover:scale-105 transition-all duration-300"
                    onClick={() => navigate('/services')}
                  >
                    <Globe className="mr-3 h-6 w-6" />
                    View Our Services
                  </Button>
                </div>

                {/* Enhanced contact info cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-blue-300" />
                    </div>
                    <p className="font-bold text-white mb-2">Email Us</p>
                    <p className="text-blue-200">{displayCompanyInfo.email}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-blue-300 hover:text-white hover:bg-white/10"
                      onClick={() => window.location.href = `mailto:${displayCompanyInfo.email}`}
                    >
                      Send Message
                    </Button>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-6 w-6 text-blue-300" />
                    </div>
                    <p className="font-bold text-white mb-2">Call Us</p>
                    <p className="text-blue-200">{displayCompanyInfo.phone}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-blue-300 hover:text-white hover:bg-white/10"
                      onClick={() => window.location.href = `tel:${displayCompanyInfo.phone}`}
                    >
                      Call Now
                    </Button>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-6 w-6 text-blue-300" />
                    </div>
                    <p className="font-bold text-white mb-2">Visit Us</p>
                    <p className="text-blue-200">{displayCompanyInfo.address}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-blue-300 hover:text-white hover:bg-white/10"
                      onClick={() => navigate('/contact')}
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </>
  )
}

export default About
