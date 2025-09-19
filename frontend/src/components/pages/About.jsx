import React from 'react'
import {
  Users, Award, Globe, Clock, Target, Heart, Lightbulb,
  Shield, ArrowRight, Star, MapPin, Mail,
  Phone, Calendar, Briefcase
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

      <div className="min-h-screen pt-16 bg-white">
        {/* Enhanced Hero Section */}
        <section className="relative section-padding bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="container-responsive relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <ScrollReveal>
                <h1 className="text-responsive-xl font-bold text-gray-900 mb-6 leading-tight">
                  About{' '}
                  <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {displayCompanyInfo.name}
                  </span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <p className="text-responsive-md text-gray-600 mb-8 leading-relaxed">
                  {displayCompanyInfo.tagline}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  {aboutContent?.description || displayCompanyInfo.description}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={600}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-colored hover-lift transition-smooth group"
                    onClick={() => navigate('/contact')}
                  >
                    Get In Touch
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth"
                    onClick={() => navigate('/portfolio')}
                  >
                    View Our Work
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Enhanced Statistics Section */}
        <section className="section-padding bg-white">
          <div className="container-responsive">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">
                  Our Impact in Numbers
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Our track record speaks for itself - delivering excellence in every project across Sierra Leone
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processedStats.map((stat, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <Card
                    variant="elevated"
                    className="text-center group hover:shadow-2xl transition-smooth animate-fade-in"
                  >
                    <CardHeader>
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        {React.createElement(stat.icon, { className: "h-8 w-8 text-white" })}
                      </div>
                      <CardTitle className="text-3xl font-bold text-gray-900">
                        {formatData.number(stat.value)}+
                      </CardTitle>
                      <p className="text-gray-600 font-medium">{stat.title}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">{stat.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Mission & Values Section */}
        <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container-responsive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <ScrollReveal>
                <div>
                  <h2 className="text-responsive-lg font-bold text-gray-900 mb-6">
                    Our Mission
                  </h2>
                  <div className="prose prose-lg text-gray-600">
                    <p className="leading-relaxed mb-6">
                      {companyMission?.content ||
                        "To empower businesses across Sierra Leone with innovative software solutions that drive growth, improve efficiency, and create exceptional user experiences. We believe technology should solve real problems and create meaningful value for our clients and their customers."
                      }
                    </p>
                    <p className="leading-relaxed">
                      Every project we take on is an opportunity to push the boundaries of what's possible and deliver something truly remarkable that transforms how businesses operate.
                    </p>
                  </div>

                  <div className="mt-8 flex items-center space-x-6">
                    {displayCompanyInfo.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-600">{displayCompanyInfo.location}</span>
                      </div>
                    )}
                    {displayCompanyInfo.founded_year && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-600">Est. {displayCompanyInfo.founded_year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="space-y-6">
                  {processedValues.map((value, index) => (
                    <Card
                      key={index}
                      variant="glass"
                      className="group hover-lift transition-smooth animate-fade-in"
                    >
                      <CardHeader>
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            {React.createElement(value.icon, { className: "h-6 w-6 text-white" })}
                          </div>
                          <div>
                            <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                              {value.title}
                            </CardTitle>
                            <CardDescription className="mt-2 leading-relaxed">
                              {value.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Enhanced Team Section */}
        <section className="section-padding bg-white">
          <div className="container-responsive">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">
                  Meet Our Expert Team
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our diverse team of talented professionals brings together expertise from various backgrounds to deliver exceptional results for our clients.
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
                      <Card
                        variant="elevated"
                        className="group text-center hover:shadow-2xl transition-smooth animate-fade-in h-full"
                      >
                        <CardHeader>
                          <div className="relative mb-4">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=3b82f6&color=ffffff&size=96`
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </CardTitle>
                          <p className="text-blue-600 font-medium">{member.role}</p>
                          {member.department && (
                            <p className="text-sm text-gray-500">{member.department}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            {formatData.truncate(member.bio, 100)}
                          </p>
                          {member.skills && Array.isArray(member.skills) && (
                            <div className="flex flex-wrap gap-1 justify-center mb-4">
                              {member.skills.slice(0, 3).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
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
                                className="p-2 hover:bg-blue-100 rounded-full"
                                onClick={() => window.location.href = `mailto:${member.email}`}
                              >
                                <Mail className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {member.social_links?.linkedin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 hover:bg-blue-100 rounded-full"
                                onClick={() => window.open(member.social_links.linkedin, '_blank')}
                              >
                                <Briefcase className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </DataRenderer>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="section-padding bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container-responsive relative z-10">
            <ScrollReveal>
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-responsive-lg font-bold mb-6">
                  Ready to Work with Our Team?
                </h2>
                <p className="text-xl mb-8 opacity-90 leading-relaxed">
                  Let's discuss how our experienced team can help you achieve your technology goals.
                  Contact us today for a free consultation and see how we can transform your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-indigo-700 hover:bg-white/90 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth group shadow-xl ring-1 ring-white/50 backdrop-blur"
                    onClick={() => navigate('/contact')}
                  >
                    Start Your Project
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-blue-900 hover:bg-blue-900 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth"
                    onClick={() => navigate('/services')}
                  >
                    View Our Services
                  </Button>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-90">
                  <div className="text-center">
                    <Mail className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-medium">Email Us</p>
                    <p className="text-sm">{displayCompanyInfo.email}</p>
                  </div>
                  <div className="text-center">
                    <Phone className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-medium">Call Us</p>
                    <p className="text-sm">{displayCompanyInfo.phone}</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-medium">Visit Us</p>
                    <p className="text-sm">{displayCompanyInfo.address}</p>
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
