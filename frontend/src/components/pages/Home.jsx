import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowRight, CheckCircle, Code, Smartphone, Cloud, Zap, 
  Camera, GraduationCap, Briefcase, Film, Trophy, 
  Users, Globe, Award, Star, ChevronRight, Play 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, ImageCard } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { DataRenderer, DataGrid, MetricCard, useAsyncData, formatData } from '@/components/ui/data-display'
import { LoadingSpinner, SkeletonGrid, ErrorMessage } from '@/components/ui/loading'
import SEOHead from '../SEO/SEOHead'
import SabiteckLogo from '../../assets/icons/Sabitek Logo.png'
import ApiService from '../../services/api'

const Home = () => {
  const navigate = useNavigate()

  // Enhanced data fetching with better error handling
  const {
    data: services,
    loading: servicesLoading,
    error: servicesError
  } = useAsyncData(() => ApiService.getPopularServices())

  const {
    data: featuredProjects,
    loading: projectsLoading,
    error: projectsError
  } = useAsyncData(() => ApiService.getFeaturedProjects())

  const {
    data: stats,
    loading: statsLoading,
    error: statsError
  } = useAsyncData(() => ApiService.getCompanyStats())

  // Icon mapping for services with enhanced fallbacks
  const iconMap = {
    'code': Code,
    'fa-code': Code,
    'smartphone': Smartphone,
    'fa-mobile-alt': Smartphone,
    'cloud': Cloud,
    'fa-cloud': Cloud,
    'zap': Zap,
    'fa-bolt': Zap,
    'camera': Camera,
    'fa-camera': Camera,
    'graduation-cap': GraduationCap,
    'fa-graduation-cap': GraduationCap,
    'briefcase': Briefcase,
    'fa-briefcase': Briefcase,
    'film': Film,
    'fa-film': Film,
    'trophy': Trophy,
    'fa-trophy': Trophy,
    'globe': Globe,
    'fa-globe': Globe
  }

  // Enhanced color mapping with gradients
  const colorMap = {
    'Software Development': 'from-blue-500 to-blue-600',
    'Web Development': 'from-blue-500 to-indigo-600',
    'Mobile App Development': 'from-green-500 to-emerald-600',
    'Technology Training': 'from-purple-500 to-violet-600',
    'Tech Training': 'from-purple-500 to-violet-600',
    'Business Consultancy': 'from-orange-500 to-red-600',
    'Photography': 'from-pink-500 to-rose-600',
    'Photography Services': 'from-pink-500 to-rose-600',
    'Media & Entertainment': 'from-red-500 to-pink-600',
    'Media Production': 'from-red-500 to-pink-600',
    'Digital Solutions': 'from-indigo-500 to-purple-600'
  }

  // Fallback services for better UX when API data is unavailable
  const fallbackServices = [
    {
      id: 'web-dev',
      title: 'Web Development',
      description: 'Modern, responsive websites and web applications built with cutting-edge technologies like React, Vue.js, and Node.js.',
      icon: 'code',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'mobile-dev',
      title: 'Mobile App Development',
      description: 'Native and cross-platform mobile applications for iOS and Android using React Native and Flutter.',
      icon: 'smartphone',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'cloud-solutions',
      title: 'Cloud Solutions',
      description: 'Scalable cloud infrastructure, deployment, and migration services using AWS, Azure, and Google Cloud.',
      icon: 'cloud',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      id: 'consulting',
      title: 'Business Consultancy',
      description: 'Strategic technology consulting to help businesses optimize their digital transformation journey.',
      icon: 'briefcase',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      id: 'training',
      title: 'Tech Training',
      description: 'Professional development programs and workshops in programming, digital skills, and emerging technologies.',
      icon: 'graduation-cap',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'media',
      title: 'Media Production',
      description: 'Creative media services including photography, videography, and digital content creation.',
      icon: 'camera',
      gradient: 'from-pink-500 to-rose-600'
    }
  ]

  // Enhanced services data processing with safety checks and fallbacks
  const apiServices = (Array.isArray(services) ? services : []).map(service => ({
    ...service,
    icon: iconMap[service.icon] || iconMap[service.icon?.toLowerCase()] || Code,
    gradient: colorMap[service.title] || 'from-blue-500 to-blue-600',
    description: formatData.truncate(service.short_description || service.description, 120)
  }))

  // Use API services if available, otherwise use fallback services
  const processedServices = apiServices.length > 0 ? apiServices : fallbackServices.map(service => ({
    ...service,
    icon: iconMap[service.icon] || Code
  }))

  // Enhanced stats data with better formatting
  const processedStats = [
    {
      title: 'Projects Completed',
      value: featuredProjects?.length || 50,
      icon: Trophy,
      trend: 'up',
      trendValue: '+12%'
    },
    {
      title: 'Happy Clients',
      value: stats?.contacts || 30,
      icon: Users,
      trend: 'up',
      trendValue: '+8%'
    },
    {
      title: 'Years Experience',
      value: 5,
      icon: Award,
      trend: 'up',
      trendValue: 'Since 2020'
    },
    {
      title: 'Team Members',
      value: 10,
      icon: Globe,
      trend: 'up',
      trendValue: '+3 this year'
    }
  ]

  // Enhanced features with better descriptions
  const features = [
    {
      icon: Code,
      title: 'Modern Technology Stack',
      description: 'We use cutting-edge technologies including React, Node.js, Python, and cloud platforms to build scalable solutions.',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Our solutions are optimized for performance with 99.9% uptime guarantee and lightning-fast response times.',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our certified professionals have years of experience in software development, design, and digital marketing.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'We follow international best practices and industry standards to ensure world-class quality in all our deliverables.',
      gradient: 'from-purple-500 to-violet-600'
    }
  ]

  return (
    <>
      <SEOHead 
        title="Sabiteck Limited - Premier Technology Solutions in Sierra Leone"
        description="Transform your business with cutting-edge technology solutions. We offer software development, web applications, mobile apps, tech training, and digital consulting services in Sierra Leone."
        keywords="technology solutions Sierra Leone, software development Bo, web development, mobile apps, tech training, business consultancy, Sabiteck Limited"
      />

      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-32">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat bg-[length:60px_60px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
               }}>
          </div>
        </div>

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container-responsive relative z-10 text-white">
          <div className="text-center max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <img
                    src={SabiteckLogo}
                    alt="Sabiteck Limited Logo"
                    className="h-24 w-auto animate-float drop-shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl -z-10"></div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="inline-flex items-center px-6 py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-blue-400/20">
                <Star className="h-4 w-4 mr-2" />
                Leading Technology Solutions in Sierra Leone
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Transform Your Business with
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Cutting-Edge Technology
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
                We specialize in software development, digital innovation, and tech education
                to drive your success in the digital age.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/services')}
                >
                  <Zap className="mr-3 h-6 w-6" />
                  Explore Our Services
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/portfolio')}
                >
                  <Play className="mr-3 h-6 w-6" />
                  View Our Work
                </Button>
              </div>
            </ScrollReveal>

            {/* Trust indicators */}
            <ScrollReveal delay={600}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                  <div className="text-blue-200 text-sm">Projects Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">5+</div>
                  <div className="text-blue-200 text-sm">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">30+</div>
                  <div className="text-blue-200 text-sm">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-blue-200 text-sm">Support Available</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics Section */}
      <section className="section-padding bg-white relative">
        <div className="container-responsive">
          <ScrollReveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-green-600/10 rounded-full text-green-600 text-sm font-medium mb-6">
                <Trophy className="h-4 w-4 mr-2" />
                Our Impact
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Trusted by Businesses Across Sierra Leone
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our track record speaks for itself - delivering excellence in every project
                and building lasting partnerships with our clients.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processedStats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-semibold">{stat.trendValue}</div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}+</div>
                    <div className="text-gray-600 font-medium">{stat.title}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
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
              <div className="inline-flex items-center px-4 py-2 bg-blue-600/10 rounded-full text-blue-600 text-sm font-medium mb-6">
                <Code className="h-4 w-4 mr-2" />
                What We Offer
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Our Core Services
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Comprehensive technology solutions tailored to meet your unique business needs
                and drive digital transformation.
              </p>
            </div>
          </ScrollReveal>

          {servicesLoading ? (
            <SkeletonGrid items={6} columns={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {processedServices.map((service, index) => (
                <ScrollReveal key={service.id || index} delay={index * 100}>
                  <Card
                    variant="interactive"
                    className="group h-full animate-fade-in hover:shadow-2xl border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2 transition-all duration-300"
                    onClick={() => navigate('/services')}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <service.icon className="h-10 w-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors mb-3">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-center leading-relaxed text-gray-600 mb-6">
                        {service.description}
                      </CardDescription>
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 group-hover:translate-x-2 transition-transform font-semibold"
                        >
                          Learn More
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Enhanced Call-to-Action for Services */}
          <ScrollReveal delay={600}>
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-4">Need a Custom Solution?</h3>
                  <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                    We create tailored technology solutions that perfectly fit your business requirements and goals.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                      onClick={() => navigate('/contact')}
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Get Custom Quote
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                      onClick={() => navigate('/services')}
                    >
                      View All Services
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="section-padding bg-white">
        <div className="container-responsive">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">
                Why Choose Sabiteck?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We combine technical expertise with creative innovation to deliver exceptional results
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <ScrollReveal key={index} delay={index * 150}>
                  <div className="flex items-start space-x-4 group animate-fade-in">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={300}>
              <div className="relative">
                <div className="glass rounded-2xl p-8 backdrop-blur-lg">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">ISO 9001 Quality Standards</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">24/7 Technical Support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">Agile Development Process</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">Money-back Guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Enhanced Projects Section */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container-responsive">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">
                Featured Projects
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover some of our recent work and success stories
              </p>
            </div>
          </ScrollReveal>

          <DataGrid
            data={featuredProjects}
            loading={projectsLoading}
            error={projectsError}
            emptyMessage="No featured projects available"
            columns={3}
            gap={8}
            renderItem={(project, index) => (
              <ScrollReveal delay={index * 100}>
                <ImageCard
                  variant="elevated"
                  className="group cursor-pointer h-full animate-fade-in"
                  imageSrc={project.image}
                  imageAlt={project.title}
                  onClick={() => navigate('/portfolio')}
                >
                  <CardHeader>
                    <CardTitle className="group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription>
                      {formatData.truncate(project.description, 100)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {formatData.date(project.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 group-hover:translate-x-2 transition-transform"
                      >
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </ImageCard>
              </ScrollReveal>
            )}
          />
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
                <CheckCircle className="h-4 w-4 mr-2" />
                Ready to Get Started?
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                Transform Your Business with
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Expert Technology Solutions
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
                Let's discuss how our technology solutions can help you achieve your goals.
                Get a free consultation today and see the difference we can make.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/contact')}
                >
                  <Zap className="mr-3 h-6 w-6" />
                  Get Free Consultation
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  onClick={() => navigate('/portfolio')}
                >
                  <Globe className="mr-3 h-6 w-6" />
                  View Our Work
                </Button>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Visit Us</div>
                  <div className="text-white">Bo, Sierra Leone</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Quick Response</div>
                  <div className="text-white">24/7 Support</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Quality Guaranteed</div>
                  <div className="text-white">100% Satisfaction</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}

export default Home
