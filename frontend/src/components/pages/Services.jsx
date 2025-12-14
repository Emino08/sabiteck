import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, Code, Smartphone, Cloud, Database, Globe, Zap, ShoppingCart, Users, BarChart, Shield, Star, Trophy, Target, Heart, Lightbulb, Play, Award, Clock, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { DataRenderer, useAsyncData } from '@/components/ui/data-display'
import { SkeletonGrid, ErrorMessage } from '@/components/ui/loading'
import SEOHead from '../SEO/SEOHead'
import ApiService from '../../services/api'

const Services = () => {
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState('web-development')

  const handleStartProject = () => {
    navigate('/contact')
  }

  const handleScheduleConsultation = () => {
    // You can also create a separate scheduling page or open a calendar widget
    navigate('/contact', { state: { service: 'consultation' } })
  }

  // Fallback services (existing hardcoded content)
  const fallbackServices = [
    {
      id: 'web-development',
      title: 'Web Development',
      icon: Code,
      shortDesc: 'Custom web applications built with modern frameworks',
      fullDesc: 'We create powerful, scalable web applications using the latest technologies and best practices. From simple websites to complex enterprise solutions, our team delivers high-quality code that performs.',
      features: [
        'Responsive Design',
        'Modern JavaScript Frameworks',
        'RESTful API Development',
        'Database Architecture',
        'Performance Optimization',
        'SEO Implementation',
        'Security Best Practices',
        'Cross-browser Compatibility'
      ],
      technologies: ['React', 'Vue.js', 'Angular', 'Node.js', 'PHP', 'Python', 'Laravel', 'Express'],
      pricing: 'Starting at $5,000',
      timeline: '4-12 weeks',
      process: [
        'Requirements Analysis',
        'UI/UX Design',
        'Development & Testing',
        'Deployment & Launch'
      ]
    },
    {
      id: 'mobile-development',
      title: 'Mobile App Development',
      icon: Smartphone,
      shortDesc: 'Native and cross-platform mobile applications',
      fullDesc: 'Build engaging mobile experiences for iOS and Android. We develop native apps for optimal performance or cross-platform solutions for faster time-to-market.',
      features: [
        'Native iOS & Android',
        'Cross-platform Development',
        'UI/UX Design',
        'App Store Optimization',
        'Push Notifications',
        'Offline Functionality',
        'Third-party Integrations',
        'App Analytics'
      ],
      technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin', 'Ionic'],
      pricing: 'Starting at $15,000',
      timeline: '8-20 weeks',
      process: [
        'Platform Strategy',
        'Prototype Development',
        'App Development',
        'Testing & App Store Submission'
      ]
    },
    {
      id: 'cloud-solutions',
      title: 'Cloud Solutions',
      icon: Cloud,
      shortDesc: 'Scalable cloud infrastructure and deployment',
      fullDesc: 'Leverage the power of cloud computing with our comprehensive cloud solutions. From migration to optimization, we help you build scalable, reliable cloud infrastructure.',
      features: [
        'Cloud Migration',
        'Infrastructure as Code',
        'Auto-scaling Solutions',
        'Disaster Recovery',
        'Cost Optimization',
        'Security Implementation',
        'Monitoring & Analytics',
        'DevOps Integration'
      ],
      technologies: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform'],
      pricing: 'Starting at $8,000',
      timeline: '6-16 weeks',
      process: [
        'Cloud Assessment',
        'Architecture Design',
        'Migration & Implementation',
        'Optimization & Monitoring'
      ]
    },
    {
      id: 'ecommerce',
      title: 'E-Commerce Solutions',
      icon: ShoppingCart,
      shortDesc: 'Complete online store development and management',
      fullDesc: 'Build powerful e-commerce platforms that drive sales and enhance customer experience. From product catalogs to payment processing, we handle it all.',
      features: [
        'Custom Shopping Cart',
        'Payment Gateway Integration',
        'Inventory Management',
        'Order Processing',
        'Customer Accounts',
        'Analytics & Reporting',
        'SEO Optimization',
        'Mobile Commerce'
      ],
      technologies: ['Shopify', 'WooCommerce', 'Magento', 'Custom Solutions'],
      pricing: 'Starting at $10,000',
      timeline: '8-16 weeks',
      process: [
        'Store Planning',
        'Design & Development',
        'Payment Setup',
        'Launch & Optimization'
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise Solutions',
      icon: Database,
      shortDesc: 'Large-scale business applications and systems',
      fullDesc: 'Develop robust enterprise applications that streamline business processes and improve efficiency. Our solutions are built to scale with your growing business needs.',
      features: [
        'Custom Business Logic',
        'System Integration',
        'Workflow Automation',
        'Reporting & Analytics',
        'User Management',
        'Data Migration',
        'Legacy System Modernization',
        'Compliance & Security'
      ],
      technologies: ['Java', 'C#', '.NET', 'Spring', 'Microservices', 'Oracle', 'SQL Server'],
      pricing: 'Custom Quote',
      timeline: '12-52 weeks',
      process: [
        'Business Analysis',
        'System Architecture',
        'Agile Development',
        'Deployment & Training'
      ]
    },
    {
      id: 'consulting',
      title: 'Tech Consulting',
      icon: Users,
      shortDesc: 'Strategic technology guidance and architecture',
      fullDesc: 'Get expert advice on technology decisions, architecture planning, and digital transformation. Our consultants help you make informed decisions for your tech stack.',
      features: [
        'Technology Assessment',
        'Architecture Planning',
        'Code Review',
        'Performance Audits',
        'Digital Transformation',
        'Team Training',
        'Best Practices',
        'Risk Assessment'
      ],
      technologies: ['Various based on needs'],
      pricing: 'Starting at $200/hour',
      timeline: '1-12 weeks',
      process: [
        'Initial Assessment',
        'Strategy Development',
        'Implementation Planning',
        'Ongoing Support'
      ]
    }
  ]

  // Fetch services from backend (admin-managed)
  const { data: servicesData, loading: servicesLoading, error: servicesError } = useAsyncData(() => ApiService.getServices())

  // Icon resolver for API-provided icon keys
  const iconMap = {
    code: Code,
    smartphone: Smartphone,
    mobile: Smartphone,
    cloud: Cloud,
    database: Database,
    db: Database,
    globe: Globe,
    world: Globe,
    zap: Zap,
    bolt: Zap,
    shoppingcart: ShoppingCart,
    'shopping-cart': ShoppingCart,
    cart: ShoppingCart,
    users: Users,
    team: Users,
    barchart: BarChart,
    'bar-chart': BarChart,
    analytics: BarChart,
    shield: Shield,
    security: Shield
  }

  const resolveIcon = (icon) => {
    if (!icon) return Code
    if (typeof icon === 'function' || typeof icon === 'object') return icon
    const key = String(icon).trim()
    const norm = key.toLowerCase().replace(/[^a-z]/g, '')
    return iconMap[norm] || Code
  }

  const toArray = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try {
        // Try JSON parse if stringified array
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) return parsed
      } catch {}
      return val.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  // Normalize backend services into the shape used by UI
  const normalizedServices = Array.isArray(servicesData)
    ? servicesData.map((s, idx) => ({
        id: s.id || s.slug || s.key || `service-${idx}`,
        title: s.title || s.name || 'Untitled Service',
        icon: resolveIcon(s.icon || s.icon_name),
        shortDesc: s.short_description || s.subtitle || s.tagline || s.description || '',
        fullDesc: s.full_description || s.long_description || s.details || s.description || '',
        features: toArray(s.features),
        technologies: toArray(s.technologies),
        pricing: s.pricing || s.price || 'Contact us',
        timeline: s.timeline || s.duration || 'Varies',
        process: toArray(s.process || s.steps)
      }))
    : []

  const services = normalizedServices.length ? normalizedServices : fallbackServices
  const currentService = services.find(service => service.id === selectedService) || services[0]

  // Fallback testimonials
  const testimonials = [
    {
      name: 'Sarah Johnson',
      company: 'TechStart Inc.',
      text: 'Sabiteck transformed our business with their exceptional web development. The platform they built increased our conversions by 300%.',
      service: 'Web Development'
    },
    {
      name: 'Mike Chen',
      company: 'RetailFlow',
      text: 'Their e-commerce solution streamlined our entire sales process. We saw immediate improvements in user experience and sales.',
      service: 'E-Commerce'
    },
    {
      name: 'Emma Rodriguez',
      company: 'CloudFirst Corp',
      text: 'The cloud migration was seamless. Our infrastructure is now more reliable and costs 40% less than before.',
      service: 'Cloud Solutions'
    }
  ]

  return (
    <div className="min-h-screen">
      <SEOHead title="Our Services - Sabiteck" description="Explore our comprehensive technology services designed to transform your business." />

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
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Premium Technology Services
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
              Transform Your Business with
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mt-2">
                Expert Solutions
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
              Comprehensive software development services to help your business thrive
              in the digital age. From web applications to mobile apps and cloud solutions.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center"
                onClick={handleStartProject}
              >
                <Zap className="mr-3 h-6 w-6" />
                Start Your Project
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center"
                onClick={handleScheduleConsultation}
              >
                <Play className="mr-3 h-6 w-6" />
                Free Consultation
              </button>
            </div>
          </ScrollReveal>

          {/* Service highlights */}
          <ScrollReveal delay={500}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Code className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <p className="font-bold text-white mb-1">Web Development</p>
                <p className="text-blue-200 text-sm">Modern & Responsive</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Smartphone className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <p className="font-bold text-white mb-1">Mobile Apps</p>
                <p className="text-blue-200 text-sm">iOS & Android</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Cloud className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <p className="font-bold text-white mb-1">Cloud Solutions</p>
                <p className="text-blue-200 text-sm">Scalable & Secure</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Users className="h-8 w-8 mx-auto mb-3 text-blue-300" />
                <p className="font-bold text-white mb-1">Consulting</p>
                <p className="text-blue-200 text-sm">Expert Guidance</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Enhanced Services Overview */}
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
              <div className="inline-flex items-center px-4 py-2 bg-blue-600/10 rounded-full text-blue-600 text-sm font-medium mb-6">
                <Trophy className="h-4 w-4 mr-2" />
                Our Services Portfolio
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Choose Your Perfect Solution
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                From concept to deployment, we provide end-to-end technology solutions
                that drive growth and innovation for your business.
              </p>
            </div>
          </ScrollReveal>

          <DataRenderer
            data={services}
            loading={servicesLoading}
            error={servicesError}
            emptyMessage="Services will be available soon."
            loadingComponent={<SkeletonGrid items={6} columns={3} />}
            errorComponent={<ErrorMessage title="Unable to load services" />}
          >
            {(srv) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {srv.map((service, index) => {
                  const isSelected = (currentService && currentService.id) === service.id
                  const gradients = [
                    'from-blue-500 to-blue-600',
                    'from-purple-500 to-purple-600',
                    'from-green-500 to-green-600',
                    'from-orange-500 to-orange-600',
                    'from-red-500 to-red-600',
                    'from-indigo-500 to-indigo-600'
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <ScrollReveal key={service.id || index} delay={index * 100}>
                      <div
                        className={`group cursor-pointer transition-all duration-300 ${
                          isSelected ? 'scale-105' : 'hover:scale-105'
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 ${
                          isSelected ? 'border-blue-500 shadow-2xl' : 'border-white/50 hover:shadow-2xl'
                        } hover:-translate-y-2 transition-all duration-300 h-full`}>

                          <div className="text-center mb-6">
                            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                              {React.createElement(service.icon, { className: 'h-10 w-10 text-white' })}
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                              {service.title}
                            </h3>

                            <p className="text-gray-600 mb-6 leading-relaxed">
                              {service.shortDesc}
                            </p>
                          </div>

                          <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                              <span className="text-gray-600 font-medium">Starting at</span>
                              <span className="text-blue-600 font-bold text-lg">{service.pricing}</span>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                              <span className="text-gray-600 font-medium">Timeline</span>
                              <span className="text-gray-800 font-medium">{service.timeline}</span>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white group-hover:shadow-lg'
                            }`}>
                              {isSelected ? 'Selected' : 'View Details'}
                              <ArrowRight className="ml-2 h-4 w-4 inline group-hover:translate-x-1 transition-transform" />
                            </button>
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

      {/* Enhanced Service Detail */}
      {currentService && (
        <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Service Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-green-600/20 backdrop-blur-sm rounded-full text-green-300 text-sm font-medium mb-6 border border-green-500/20">
                <Target className="h-4 w-4 mr-2" />
                Service Details
              </div>
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-xl">
                  {React.createElement(currentService.icon, { className: 'h-12 w-12 text-white' })}
                </div>
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">{currentService.title}</h2>
                  <p className="text-xl text-blue-100">{currentService.shortDesc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Service Info */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-10 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Service Overview</h3>
                    <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                      {currentService.fullDesc}
                    </p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Timeline
                        </h4>
                        <p className="text-gray-600 font-medium">{currentService.timeline}</p>
                      </div>
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                          <Award className="h-5 w-5 mr-2 text-green-600" />
                          Investment
                        </h4>
                        <p className="text-green-600 font-bold text-lg">{currentService.pricing}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center"
                        onClick={handleStartProject}
                      >
                        <Zap className="mr-2 h-5 w-5" />
                        Start Project
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                      <button
                        className="flex-1 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-300 flex items-center justify-center"
                        onClick={handleScheduleConsultation}
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        Free Consultation
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features, Technologies, and Process */}
              <div className="space-y-8">
                {/* Features */}
                {currentService.features?.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
                      Key Features
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {currentService.features.slice(0, 8).map((feature, index) => (
                        <div key={index} className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-4 flex-shrink-0"></div>
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                {currentService.technologies?.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Code className="h-6 w-6 mr-3 text-blue-500" />
                      Technologies We Use
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {currentService.technologies.slice(0, 12).map((tech, index) => (
                        <span key={index} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:scale-105 transition-transform">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process */}
                {currentService.process?.length > 0 && (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Target className="h-6 w-6 mr-3 text-purple-500" />
                      Our Process
                    </h3>
                    <div className="space-y-4">
                      {currentService.process.slice(0, 6).map((step, index) => (
                        <div key={index} className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 shadow-lg">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Testimonials */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:50px_50px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 25px 25px, #6B46C1 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-purple-600/10 rounded-full text-purple-600 text-sm font-medium mb-6">
                <Heart className="h-4 w-4 mr-2" />
                Client Success Stories
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                What Our Clients Say
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real results from real businesses. See how our services have transformed
                companies across Sierra Leone and beyond.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="group">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <Star className="h-6 w-6 text-white" />
                      </div>

                      <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                        "{testimonial.text}"
                      </p>

                      <div className="border-t border-gray-200 pt-6">
                        <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                        <div className="text-gray-600 font-medium">{testimonial.company}</div>
                        <div className="inline-flex items-center mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Award className="h-3 w-3 mr-1" />
                          {testimonial.service}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
              Ready to Transform Your Business?
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Let's Build Something
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Amazing Together
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
              Let's discuss your project requirements and create a custom solution
              that fits your business needs and budget. Get started today!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button
                className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
                onClick={handleStartProject}
              >
                <Lightbulb className="mr-3 h-6 w-6" />
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

            {/* Contact options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Quick Call</h3>
                <p className="text-blue-200 mb-4">Discuss your project in 15 minutes</p>
                <button className="text-blue-300 hover:text-white font-medium hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                  Schedule Call
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Send Details</h3>
                <p className="text-blue-200 mb-4">Email us your project requirements</p>
                <button className="text-blue-300 hover:text-white font-medium hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                  Send Email
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-bold text-white mb-2">Get Quote</h3>
                <p className="text-blue-200 mb-4">Receive a detailed project proposal</p>
                <button className="text-blue-300 hover:text-white font-medium hover:bg-white/10 px-4 py-2 rounded-lg transition-all">
                  Request Quote
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

export default Services
