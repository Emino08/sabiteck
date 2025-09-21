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
        {/* Enhanced Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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

          <div className="container-responsive relative z-10 text-white">
            <div className="text-center max-w-5xl mx-auto">
              <ScrollReveal>
                <div className="inline-flex items-center px-6 py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-blue-400/20">
                  <Star className="h-4 w-4 mr-2" />
                  About Our Company
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Meet{' '}
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    {displayCompanyInfo.name}
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                  {displayCompanyInfo.tagline}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <p className="text-lg md:text-xl text-blue-200 mb-12 max-w-4xl mx-auto leading-relaxed">
                  {aboutContent?.description || displayCompanyInfo.description}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={500}>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                  <Button
                    size="lg"
                    className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group"
                    onClick={() => navigate('/contact')}
                  >
                    <Mail className="mr-3 h-6 w-6" />
                    Get In Touch
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm hover:scale-105 transition-all duration-300"
                    onClick={() => navigate('/portfolio')}
                  >
                    <Award className="mr-3 h-6 w-6" />
                    View Our Work
                  </Button>
                </div>
              </ScrollReveal>

              {/* Company highlights */}
              <ScrollReveal delay={600}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <MapPin className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                    <p className="font-bold text-white mb-2">Located in</p>
                    <p className="text-blue-200">{displayCompanyInfo.location}</p>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                    <p className="font-bold text-white mb-2">Established</p>
                    <p className="text-blue-200">{displayCompanyInfo.founded_year}</p>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <Users className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                    <p className="font-bold text-white mb-2">Expert Team</p>
                    <p className="text-blue-200">10+ Professionals</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Enhanced Statistics Section */}
        <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50 relative">
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
                 style={{
                   backgroundImage: `radial-gradient(circle at 20px 20px, #3B82F6 1px, transparent 1px)`
                 }}>
            </div>
          </div>
          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center mb-20">
                <div className="inline-flex items-center px-4 py-2 bg-green-600/10 rounded-full text-green-600 text-sm font-medium mb-6">
                  <Trophy className="h-4 w-4 mr-2" />
                  Our Achievements
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  Our Impact in Numbers
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  Our track record speaks for itself - delivering excellence in every project
                  across Sierra Leone and beyond.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processedStats.map((stat, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="group">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          {React.createElement(stat.icon, { className: "h-8 w-8 text-white" })}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-green-600 font-semibold">Since {displayCompanyInfo.founded_year}</div>
                        </div>
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">{formatData.number(stat.value)}+</div>
                      <div className="text-gray-700 font-medium text-lg mb-2">{stat.title}</div>
                      <div className="text-gray-500 text-sm">{stat.description}</div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Mission & Values Section */}
        <section className="section-padding bg-white relative overflow-hidden">
          <div className="container-responsive">
            <ScrollReveal>
              <div className="text-center mb-20">
                <div className="inline-flex items-center px-4 py-2 bg-purple-600/10 rounded-full text-purple-600 text-sm font-medium mb-6">
                  <Target className="h-4 w-4 mr-2" />
                  Our Mission & Values
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  What Drives Us Forward
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Our mission and core values guide every decision we make and every solution we create.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
              <ScrollReveal>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-6">
                      Our Mission
                    </h3>
                    <div className="prose prose-lg text-gray-700">
                      <p className="leading-relaxed mb-6 text-lg">
                        {companyMission?.content ||
                          "To empower businesses across Sierra Leone with innovative software solutions that drive growth, improve efficiency, and create exceptional user experiences. We believe technology should solve real problems and create meaningful value for our clients and their customers."
                        }
                      </p>
                      <p className="leading-relaxed text-gray-600">
                        Every project we take on is an opportunity to push the boundaries of what's possible and deliver something truly remarkable that transforms how businesses operate.
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <MapPin className="h-5 w-5 text-blue-600 mb-2" />
                        <div className="text-sm font-medium text-gray-700">Location</div>
                        <div className="text-gray-600">{displayCompanyInfo.location}</div>
                      </div>
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <Calendar className="h-5 w-5 text-blue-600 mb-2" />
                        <div className="text-sm font-medium text-gray-700">Founded</div>
                        <div className="text-gray-600">{displayCompanyInfo.founded_year}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8">Core Values</h3>
                  {processedValues.map((value, index) => (
                    <div key={index} className="group">
                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            {React.createElement(value.icon, { className: "h-7 w-7 text-white" })}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                              {value.title}
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                              {value.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
