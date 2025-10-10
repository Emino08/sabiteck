import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Github, Calendar, Users, Code, Database, Smartphone, Globe, Star, Trophy, Target, Heart, Lightbulb, Play, Award, Clock, Mail, Phone, CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { DataRenderer, useAsyncData } from '@/components/ui/data-display'
import { SkeletonGrid, ErrorMessage } from '@/components/ui/loading'
import ApiService from '../../services/api'

const Portfolio = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleStartProject = () => {
    navigate('/contact')
  }

  const handleScheduleConsultation = () => {
    navigate('/contact', { state: { service: 'consultation' } })
  }

  // Fallback categories
  const fallbackCategories = [
    { id: 'all', name: 'All Projects', icon: Globe },
    { id: 'web', name: 'Web Apps', icon: Code },
    { id: 'mobile', name: 'Mobile Apps', icon: Smartphone },
    { id: 'enterprise', name: 'Enterprise', icon: Database }
  ]

  // Fallback projects (existing hardcoded list)
  const fallbackProjects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      category: 'web',
      description: 'Full-stack e-commerce solution with React, Node.js, and Stripe integration. Features include inventory management, order processing, and analytics dashboard.',
      image: '/api/placeholder/600/400',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Redux'],
      liveUrl: 'https://demo-ecommerce.sabiteck.com',
      githubUrl: 'https://github.com/sabiteck/ecommerce-platform',
      clientType: 'Startup',
      duration: '4 months',
      teamSize: 5,
      featured: true
    },
    {
      id: 2,
      title: 'FinTech Mobile App',
      category: 'mobile',
      description: 'Cross-platform mobile banking application with biometric authentication, real-time transactions, and investment tracking.',
      image: '/api/placeholder/600/400',
      technologies: ['React Native', 'TypeScript', 'Firebase', 'Plaid API'],
      liveUrl: 'https://apps.apple.com/fintech-app',
      githubUrl: null,
      clientType: 'Financial Services',
      duration: '8 months',
      teamSize: 8,
      featured: true
    },
    {
      id: 3,
      title: 'Healthcare Management System',
      category: 'enterprise',
      description: 'HIPAA-compliant patient management system with appointment scheduling, medical records, and telemedicine capabilities.',
      image: '/api/placeholder/600/400',
      technologies: ['Vue.js', 'Laravel', 'PostgreSQL', 'Docker', 'AWS'],
      liveUrl: 'https://healthcare-demo.sabiteck.com',
      githubUrl: null,
      clientType: 'Healthcare',
      duration: '12 months',
      teamSize: 12,
      featured: true
    },
    {
      id: 4,
      title: 'Social Media Dashboard',
      category: 'web',
      description: 'Analytics dashboard for social media management with automated posting, engagement tracking, and performance insights.',
      image: '/api/placeholder/600/400',
      technologies: ['Angular', 'Python', 'Redis', 'Chart.js', 'Twitter API'],
      liveUrl: 'https://social-dashboard.sabiteck.com',
      githubUrl: 'https://github.com/sabiteck/social-dashboard',
      clientType: 'Marketing Agency',
      duration: '3 months',
      teamSize: 4,
      featured: false
    },
    {
      id: 5,
      title: 'Learning Management System',
      category: 'web',
      description: 'Online education platform with video streaming, interactive quizzes, progress tracking, and certification management.',
      image: '/api/placeholder/600/400',
      technologies: ['Next.js', 'Express', 'MySQL', 'Video.js', 'Stripe'],
      liveUrl: 'https://lms-demo.sabiteck.com',
      githubUrl: null,
      clientType: 'Education',
      duration: '6 months',
      teamSize: 6,
      featured: false
    },
    {
      id: 6,
      title: 'IoT Fleet Management',
      category: 'enterprise',
      description: 'Real-time fleet tracking and management system with GPS monitoring, maintenance scheduling, and driver behavior analysis.',
      image: '/api/placeholder/600/400',
      technologies: ['React', 'Python', 'InfluxDB', 'MQTT', 'Mapbox'],
      liveUrl: 'https://fleet-demo.sabiteck.com',
      githubUrl: null,
      clientType: 'Logistics',
      duration: '10 months',
      teamSize: 10,
      featured: false
    },
    {
      id: 7,
      title: 'Fitness Tracking App',
      category: 'mobile',
      description: 'Native iOS and Android fitness app with workout tracking, nutrition logging, and social features for fitness enthusiasts.',
      image: '/api/placeholder/600/400',
      technologies: ['Swift', 'Kotlin', 'Firebase', 'HealthKit', 'Google Fit'],
      liveUrl: 'https://fitness-app.sabiteck.com',
      githubUrl: null,
      clientType: 'Health & Fitness',
      duration: '5 months',
      teamSize: 6,
      featured: false
    },
    {
      id: 8,
      title: 'Real Estate Platform',
      category: 'web',
      description: 'Property listing and management platform with virtual tours, mortgage calculator, and CRM integration.',
      image: '/api/placeholder/600/400',
      technologies: ['React', 'Django', 'PostgreSQL', 'Mapbox', 'Stripe'],
      liveUrl: 'https://realestate-demo.sabiteck.com',
      githubUrl: 'https://github.com/sabiteck/realestate-platform',
      clientType: 'Real Estate',
      duration: '7 months',
      teamSize: 8,
      featured: false
    }
  ]

  // Fetch from backend
  const { data: projectData, loading: projectsLoading, error: projectsError } = useAsyncData(() => ApiService.getPortfolioProjects())
  const { data: featuredData } = useAsyncData(() => ApiService.getFeaturedProjects())
  const { data: categoriesData } = useAsyncData(() => ApiService.getPortfolioCategories())

  // Helpers
  const slugify = (val) => (val == null ? '' : String(val).toLowerCase().replace(/[^a-z0-9]+/g, '').trim())
  const toArray = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed } catch {}
      return val.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  const iconMap = { web: Code, code: Code, website: Code, mobile: Smartphone, app: Smartphone, smartphone: Smartphone, enterprise: Database, database: Database, db: Database, globe: Globe, all: Globe }
  const resolveIcon = (icon) => {
    if (!icon) return Code
    if (typeof icon === 'function' || typeof icon === 'object') return icon
    const key = slugify(icon)
    return iconMap[key] || Code
  }

  // Normalize categories
  const normalizedCategories = Array.isArray(categoriesData)
    ? categoriesData.map((c, idx) => {
        const id = slugify(c.slug || c.key || c.value || c.id || `cat-${idx}`) || `cat-${idx}`
        return { id, name: c.name || c.title || c.label || 'Category', icon: resolveIcon(c.icon || c.icon_name || c.key || c.slug || id) }
      })
    : []

  const categories = normalizedCategories.length ? [{ id: 'all', name: 'All Projects', icon: Globe }, ...normalizedCategories] : fallbackCategories

  // Normalize projects
  const normalizedProjects = Array.isArray(projectData)
    ? projectData.map((p, idx) => {
        const cat = slugify(p.category || p.category_slug || p.type || 'web') || 'web'
        return {
          id: p.id || p.slug || `project-${idx}`,
          title: p.title || p.name || 'Untitled Project',
          category: cat,
          description: p.description || p.summary || '',
          image: p.image || p.image_url || p.thumbnail || null,
          technologies: toArray(p.technologies),
          liveUrl: p.live_url || p.url || p.link || null,
          githubUrl: p.github_url || p.repo_url || null,
          clientType: p.client_type || p.client || 'Client',
          duration: p.duration || 'N/A',
          teamSize: p.team_size || p.team || 0,
          featured: Boolean(p.featured)
        }
      })
    : []

  const projects = normalizedProjects.length ? normalizedProjects : fallbackProjects

  const normalizedFeatured = Array.isArray(featuredData)
    ? featuredData.map((p, idx) => {
        const cat = slugify(p.category || p.category_slug || p.type || 'web') || 'web'
        return {
          id: p.id || p.slug || `featured-${idx}`,
          title: p.title || p.name || 'Untitled Project',
          category: cat,
          description: p.description || p.summary || '',
          image: p.image || p.image_url || p.thumbnail || null,
          technologies: toArray(p.technologies),
          liveUrl: p.live_url || p.url || p.link || null,
          githubUrl: p.github_url || p.repo_url || null,
          clientType: p.client_type || p.client || 'Client',
          duration: p.duration || 'N/A',
          teamSize: p.team_size || p.team || 0,
          featured: true
        }
      })
    : []

  const featuredProjects = normalizedFeatured.length ? normalizedFeatured : projects.filter(p => p.featured)

  const filteredProjects = selectedCategory === 'all'
    ? projects 
    : projects.filter(project => project.category === selectedCategory)

  const stats = [
    { label: 'Projects Completed', value: '150+' },
    { label: 'Happy Clients', value: '85+' },
    { label: 'Countries Served', value: '15+' },
    { label: 'Technologies Used', value: '50+' }
  ]

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
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
          <ScrollReveal>
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-400/20">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Our Work Portfolio
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
              Showcasing Our
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Digital Masterpieces
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
              Explore our successful projects and see how we've helped businesses
              transform their ideas into powerful digital solutions across various industries.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
              <button
                className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
                onClick={handleStartProject}
              >
                <Lightbulb className="mr-3 h-6 w-6" />
                Start Your Project
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center"
                onClick={handleScheduleConsultation}
              >
                <Play className="mr-3 h-6 w-6" />
                View Live Demos
              </button>
            </div>
          </ScrollReveal>

          {/* Enhanced Stats */}
          <ScrollReveal delay={500}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Enhanced Featured Projects */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 20px 20px, #3B82F6 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-purple-600/10 rounded-full text-purple-600 text-sm font-medium mb-6">
                <Star className="h-4 w-4 mr-2" />
                Featured Work
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Our Best Projects
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Highlighted work that showcases our expertise across different industries
                and cutting-edge technologies.
              </p>
            </div>
          </ScrollReveal>

          <DataRenderer
            data={featuredProjects}
            loading={projectsLoading}
            error={projectsError}
            emptyMessage="No featured projects available yet."
            loadingComponent={<SkeletonGrid items={3} columns={3} />}
            errorComponent={<ErrorMessage title="Unable to load featured projects" />}
          >
            {(list) => (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {list.map((project, index) => {
                  const gradients = [
                    'from-blue-500 to-purple-600',
                    'from-purple-500 to-pink-600',
                    'from-green-500 to-blue-600',
                    'from-orange-500 to-red-600',
                    'from-indigo-500 to-purple-600',
                    'from-teal-500 to-blue-600'
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <ScrollReveal key={project.id || index} delay={index * 100}>
                      <div className="group cursor-pointer">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                          {/* Project Image/Preview */}
                          <div className="aspect-video bg-gray-200 relative overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-90 transition-opacity flex items-center justify-center`}>
                              <div className="text-center text-white">
                                <h3 className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">{project.title}</h3>
                                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                                  <Award className="h-4 w-4 mr-1" />
                                  Featured
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Project Info */}
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {project.title}
                              </h3>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {project.clientType}
                              </span>
                            </div>

                            <p className="text-gray-600 mb-6 leading-relaxed">
                              {project.description}
                            </p>

                            {/* Technologies */}
                            {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-6">
                                {project.technologies.slice(0, 4).map((tech, techIndex) => (
                                  <span key={`${project.id}-tech-${techIndex}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors">
                                    {tech}
                                  </span>
                                ))}
                                {project.technologies.length > 4 && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                    +{project.technologies.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Project Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-gray-900">{project.duration}</div>
                                <div className="text-xs text-gray-500">Duration</div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                <div className="text-sm font-medium text-gray-900">{project.teamSize} people</div>
                                <div className="text-xs text-gray-500">Team Size</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              {project.liveUrl && (
                                <button
                                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-lg"
                                  onClick={() => window.open(project.liveUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Live Demo
                                </button>
                              )}
                              {project.githubUrl && (
                                <button
                                  className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                  onClick={() => window.open(project.githubUrl, '_blank')}
                                >
                                  <Github className="h-4 w-4 mr-2" />
                                  View Code
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </DataRenderer>
        </div>
      </section>

      {/* Enhanced All Projects */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-green-600/10 rounded-full text-green-600 text-sm font-medium mb-6">
                <Code className="h-4 w-4 mr-2" />
                Complete Portfolio
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Browse All Projects
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                Explore our complete portfolio organized by category and technology.
                Each project represents our commitment to excellence and innovation.
              </p>

              {/* Enhanced Category Filter */}
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category, index) => {
                  const isActive = selectedCategory === category.id
                  const gradients = [
                    'from-blue-500 to-blue-600',
                    'from-purple-500 to-purple-600',
                    'from-green-500 to-green-600',
                    'from-orange-500 to-orange-600'
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(slugify(category.id))}
                      className={`flex items-center px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-r ${gradient} text-white shadow-lg scale-105`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {React.createElement(category.icon, { className: 'h-5 w-5 mr-3' })}
                      {category.name}
                      <span className={`ml-3 px-2 py-1 rounded-full text-sm ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {selectedCategory === category.id ? filteredProjects.length : projects.filter(p => category.id === 'all' || p.category === category.id).length}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>

          <DataRenderer
            data={filteredProjects}
            loading={projectsLoading}
            error={projectsError}
            emptyMessage="No projects match this category."
            loadingComponent={<SkeletonGrid items={6} columns={3} />}
            errorComponent={<ErrorMessage title="Unable to load projects" />}
          >
            {(list) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {list.map((project, index) => {
                  const gradients = [
                    'from-blue-500 to-purple-600',
                    'from-green-500 to-teal-600',
                    'from-orange-500 to-red-600',
                    'from-purple-500 to-pink-600',
                    'from-indigo-500 to-blue-600',
                    'from-teal-500 to-green-600'
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <ScrollReveal key={project.id || index} delay={index * 50}>
                      <div className="group cursor-pointer">
                        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full">
                          {/* Project Image */}
                          <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-70 group-hover:opacity-80 transition-opacity flex items-center justify-center`}>
                              <div className="text-center text-white">
                                <h3 className="text-xl font-bold mb-2 group-hover:scale-110 transition-transform">{project.title}</h3>
                                {project.featured && (
                                  <div className="inline-flex items-center px-2 py-1 bg-yellow-500 rounded-full text-xs font-medium">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Project Info */}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {project.title}
                              </h3>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                                {project.clientType}
                              </span>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                              {project.description}
                            </p>

                            {/* Technologies */}
                            {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {project.technologies.slice(0, 3).map((tech, techIndex) => (
                                  <span key={`${project.id}-t-${techIndex}`} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                    {tech}
                                  </span>
                                ))}
                                {project.technologies.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                    +{project.technologies.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Project Meta */}
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {project.duration}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {project.teamSize} people
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {project.liveUrl && (
                                <button
                                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                  onClick={() => window.open(project.liveUrl, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Demo
                                </button>
                              )}
                              {project.githubUrl && (
                                <button
                                  className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:border-blue-600 hover:text-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                  onClick={() => window.open(project.githubUrl, '_blank')}
                                >
                                  <Github className="h-3 w-3 mr-1" />
                                  Code
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </DataRenderer>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <div className="inline-flex items-center px-6 py-3 bg-green-600/20 rounded-full text-green-200 text-sm font-medium mb-8">
              <CheckCircle className="h-4 w-4 mr-2" />
              Ready to Build Something Amazing?
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Let's Create Your Next
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Digital Success Story
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
              Join our growing list of satisfied clients. Let's discuss your ideas
              and create something amazing together that drives real results.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button
                className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
                onClick={handleStartProject}
              >
                <Zap className="mr-3 h-6 w-6" />
                Start Your Project
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                onClick={handleScheduleConsultation}
              >
                <Phone className="mr-3 h-6 w-6" />
                Free Consultation
              </button>
            </div>

            {/* Process highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Free Discovery Call</h3>
                <p className="text-blue-200">Discuss your vision and requirements</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Custom Proposal</h3>
                <p className="text-blue-200">Tailored solution for your needs</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Project Delivery</h3>
                <p className="text-blue-200">On-time, high-quality results</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

export default Portfolio