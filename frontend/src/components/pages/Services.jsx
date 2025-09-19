import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, Code, Smartphone, Cloud, Database, Globe, Zap, ShoppingCart, Users, BarChart, Shield } from 'lucide-react'
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
      text: 'DevCo transformed our business with their exceptional web development. The platform they built increased our conversions by 300%.',
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
    <div className="min-h-screen pt-20">
      <SEOHead title="Our Services - Sabiteck" description="Explore our services powered by admin-managed content from the backend." />
      {/* Hero Section */}
      <AnimatedBackground variant="blobs" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal animation="fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 gradient-text">
              Our Services
            </h1>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive software development services to help your business thrive 
              in the digital age. From web applications to mobile apps and cloud solutions.
            </p>
          </ScrollReveal>
        </div>
      </AnimatedBackground>

      {/* Services Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {srv.map((service, index) => (
                  <ScrollReveal key={service.id || index} animation="scale-in" delay={index * 150}>
                    <Card
                      variant="interactive"
                      className={`group transition-all hover-lift hover-glow ${
                        (currentService && currentService.id) === service.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <CardHeader className="text-center">
                        {React.createElement(service.icon, { className: 'h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:text-blue-600' })}
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-600 mb-4 group-hover:text-gray-800 transition-colors">{service.shortDesc}</p>
                        <div className="text-sm text-primary font-semibold group-hover:text-blue-600 transition-colors">
                          {service.pricing}
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

      {/* Service Detail */}
      {currentService && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Service Info */}
              <div>
                <div className="flex items-center mb-6">
                  {React.createElement(currentService.icon, { className: 'h-16 w-16 text-primary mr-4' })}
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{currentService.title}</h2>
                    <p className="text-lg text-gray-600">{currentService.shortDesc}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  {currentService.fullDesc}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                    <p className="text-primary font-bold text-lg">{currentService.pricing}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                    <p className="text-gray-600">{currentService.timeline}</p>
                  </div>
                </div>

                <Button size="lg" className="w-full sm:w-auto" onClick={handleStartProject}>
                  Get Started with {currentService.title}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Features and Process */}
              <div className="space-y-8">
                {/* Features */}
                {currentService.features?.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {currentService.features.slice(0, 12).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                {currentService.technologies?.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentService.technologies.slice(0, 16).map((tech, index) => (
                        <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process */}
                {currentService.process?.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Process</h3>
                    <div className="space-y-4">
                      {currentService.process.slice(0, 10).map((step, index) => (
                        <div key={index} className="flex items-center">
                          <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{step}</span>
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

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Client Success Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what our clients say about our services and results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.company}</div>
                    <div className="text-xs text-primary mt-1">{testimonial.service}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Let's discuss your project requirements and create a custom solution 
            that fits your business needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" onClick={handleStartProject}>
              Start Your Project
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-blue-900 border-white hover:bg-blue-900 hover:text-primary" onClick={handleScheduleConsultation}>
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
