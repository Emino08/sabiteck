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

  // Enhanced services data processing with safety checks
  const processedServices = (Array.isArray(services) ? services : []).map(service => ({
    ...service,
    icon: iconMap[service.icon] || iconMap[service.icon?.toLowerCase()] || Code,
    gradient: colorMap[service.title] || 'from-blue-500 to-blue-600',
    description: formatData.truncate(service.short_description || service.description, 120)
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <AnimatedBackground />

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="mb-8 flex justify-center">
                <img
                  src={SabiteckLogo}
                  alt="Sabiteck Limited Logo"
                  className="h-20 w-auto animate-float"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <h1 className="text-responsive-xl font-bold text-gray-900 mb-6 leading-tight">
                Your Premier
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Tech Partner
                </span>
                <br />in Sierra Leone
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <p className="text-responsive-md text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Transform your business with cutting-edge technology solutions. We specialize in
                software development, digital innovation, and tech education to drive your success.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={600}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-colored hover-lift transition-smooth group"
                  onClick={() => navigate('/services')}
                >
                  Explore Our Services
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth group"
                  onClick={() => navigate('/portfolio')}
                >
                  <Play className="mr-2 h-5 w-5" />
                  View Portfolio
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
                Trusted by Businesses Across Sierra Leone
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our track record speaks for itself - delivering excellence in every project
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processedStats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <MetricCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  trend={stat.trend}
                  trendValue={stat.trendValue}
                  loading={statsLoading}
                  className="animate-fade-in"
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-responsive">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">
                Our Core Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive technology solutions tailored to meet your unique business needs
              </p>
            </div>
          </ScrollReveal>

          <DataRenderer
            data={processedServices}
            loading={servicesLoading}
            error={servicesError}
            emptyMessage="No services available at the moment"
            loadingComponent={<SkeletonGrid items={6} columns={3} />}
            errorComponent={<ErrorMessage title="Failed to load services" />}
          >
            {(servicesList) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servicesList.map((service, index) => (
                  <ScrollReveal key={service.id || index} delay={index * 100}>
                    <Card
                      variant="interactive"
                      className="group h-full animate-fade-in hover:shadow-2xl"
                      onClick={() => navigate('/services')}
                    >
                      <CardHeader className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <service.icon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="group-hover:text-blue-600 transition-colors">
                          {service.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-center leading-relaxed">
                          {service.description}
                        </CardDescription>
                        <div className="mt-6 flex justify-center">
                          <Button
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 group-hover:translate-x-2 transition-transform"
                          >
                            Learn More
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
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
      <section className="section-padding bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container-responsive relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-responsive-lg font-bold mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Let's discuss how our technology solutions can help you achieve your goals.
                Get a free consultation today and see the difference we can make.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth group"
                  onClick={() => navigate('/contact')}
                >
                  Get Free Consultation
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold hover-lift transition-smooth"
                  onClick={() => navigate('/portfolio')}
                >
                  View Our Work
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}

export default Home
