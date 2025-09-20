import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Github, Calendar, Users, Code, Database, Smartphone, Globe } from 'lucide-react'
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
      liveUrl: 'https://demo-ecommerce.devco.com',
      githubUrl: 'https://github.com/devco/ecommerce-platform',
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
      liveUrl: 'https://healthcare-demo.devco.com',
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
      liveUrl: 'https://social-dashboard.devco.com',
      githubUrl: 'https://github.com/devco/social-dashboard',
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
      liveUrl: 'https://lms-demo.devco.com',
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
      liveUrl: 'https://fleet-demo.devco.com',
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
      liveUrl: 'https://fitness-app.devco.com',
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
      liveUrl: 'https://realestate-demo.devco.com',
      githubUrl: 'https://github.com/devco/realestate-platform',
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
    <div className="min-h-screen pt-32">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle animate-delay-300"></div>
          <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle animate-delay-600"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal animation="fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 gradient-text">
              Our Portfolio
            </h1>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore our successful projects and see how we've helped businesses 
              transform their ideas into powerful digital solutions.
            </p>
          </ScrollReveal>
          
          {/* Stats */}
          <ScrollReveal animation="fade-up" delay={400}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center hover-scale transition-smooth cursor-pointer group animate-scale-in"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className="text-3xl font-bold text-primary mb-2 group-hover:text-blue-600 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 group-hover:text-gray-800 transition-colors">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Projects
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Highlighted work that showcases our expertise across different industries and technologies.
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
                {list.map((project, index) => (
                  <ScrollReveal key={project.id || index} animation="scale-in" delay={index * 200}>
                    <Card className="overflow-hidden hover-lift hover-glow transition-smooth cursor-pointer group">
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-blue-600/80 flex items-center justify-center group-hover:from-primary/90 group-hover:to-blue-600/90 transition-all gradient-shift">
                          <span className="text-white text-lg font-semibold group-hover:scale-110 transition-transform">
                            {project.title}
                          </span>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between group-hover:text-primary transition-colors">
                          {project.title}
                          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded group-hover:bg-primary/20 transition-colors">
                            {project.clientType}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4 group-hover:text-gray-800 transition-colors">{project.description}</p>
                        {Array.isArray(project.technologies) && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.technologies.slice(0, 3).map((tech, techIndex) => (
                              <span key={`${project.id}-tech-${techIndex}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover-scale transition-smooth cursor-pointer">
                                {tech}
                              </span>
                            ))}
                            {project.technologies.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover-scale transition-smooth cursor-pointer">
                                +{project.technologies.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center group-hover:text-gray-800 transition-colors">
                            <Calendar className="h-4 w-4 mr-2" />
                            {project.duration}
                          </div>
                          <div className="flex items-center group-hover:text-gray-800 transition-colors">
                            <Users className="h-4 w-4 mr-2" />
                            {project.teamSize} people
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {project.liveUrl && (
                            <Button size="sm" className="flex-1 hover-glow" onClick={() => window.open(project.liveUrl, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Live Demo
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(project.githubUrl, '_blank')}>
                              <Github className="h-4 w-4 mr-2" />
                              Code
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

      {/* All Projects */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                All Projects
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Browse through our complete portfolio organized by category.
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category, index) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(slugify(category.id))}
                    className={`flex items-center hover-scale transition-bounce animate-scale-in ${selectedCategory === category.id ? 'hover-glow' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {React.createElement(category.icon, { className: 'h-4 w-4 mr-2 transition-transform group-hover:scale-110' })}
                    {category.name}
                  </Button>
                ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((project, index) => (
                  <ScrollReveal key={project.id || index} animation="scale-in" delay={index * 100}>
                    <Card className="overflow-hidden hover-lift hover-glow transition-smooth cursor-pointer group">
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-blue-600/60 flex items-center justify-center group-hover:from-primary/80 group-hover:to-blue-600/80 transition-all gradient-shift">
                          <span className="text-white font-medium group-hover:scale-110 transition-transform">{project.title}</span>
                        </div>
                        {project.featured && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded animate-bounce-subtle">
                            Featured
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.title}</CardTitle>
                        <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{project.clientType}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 group-hover:text-gray-800 transition-colors">
                          {project.description}
                        </p>
                        {Array.isArray(project.technologies) && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {project.technologies.slice(0, 3).map((tech, techIndex) => (
                              <span key={`${project.id}-t-${techIndex}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover-scale transition-smooth cursor-pointer">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-3 group-hover:text-gray-700 transition-colors">
                          <span>{project.duration}</span>
                          <span>{project.teamSize} people</span>
                        </div>
                        <div className="flex gap-2">
                          {project.liveUrl && (
                            <Button size="sm" variant="outline" className="flex-1 text-xs hover-glow" onClick={() => window.open(project.liveUrl, '_blank')}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Demo
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => window.open(project.githubUrl, '_blank')}>
                              <Github className="h-3 w-3 mr-1" />
                              Code
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

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-3 animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal animation="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
              Ready to Start Your Project?
            </h2>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Let's discuss your ideas and create something amazing together. 
              Contact us today for a free consultation.
            </p>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 btn-animate hover-glow hover-lift transition-smooth" onClick={handleStartProject}>
                Start a Project
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-blue-900 border-blue-100 hover:bg-white hover:text-primary hover-scale transition-bounce" onClick={handleScheduleConsultation}>
                Schedule Consultation
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

export default Portfolio