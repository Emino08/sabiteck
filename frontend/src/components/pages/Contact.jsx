import React, { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, Globe, Calendar, Users, Building2, Navigation, Star, Trophy, Target, Heart, Lightbulb, Play, Award, CheckCircle, ArrowRight, Zap, Shield, HeadphonesIcon, Video, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ContactForm from '@/components/forms/ContactForm'
import NewsletterForm from '@/components/forms/NewsletterForm'
import SEOHead from '../SEO/SEOHead'

const Contact = () => {
  const [selectedOffice, setSelectedOffice] = useState('main')

  const offices = [
    {
      id: 'main',
      name: 'Sabiteck Limited HQ',
      address: '6 Hancil Road, Bo, Sierra Leone',
      phone: '+232 78 618 435',
      email: 'info@sabiteck.com',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM GMT',
      coordinates: { lat: 7.9644, lng: -11.7383 },
      image: '/api/placeholder/400/300',
      description: 'Our headquarters in Bo, providing comprehensive tech solutions across Sierra Leone.',
      teamSize: 12,
      services: ['Software Development', 'Tech Training', 'Photography', 'Business Consultancy', 'Media Production']
    },
    {
      id: 'freetown',
      name: 'Freetown Office',
      address: 'Coming Soon - Freetown, Sierra Leone',
      phone: '+232 78 618 435',
      email: 'freetown@sabiteck.com',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM GMT',
      coordinates: { lat: 8.4657, lng: -13.2317 },
      image: '/api/placeholder/400/300',
      description: 'Expanding our services to the capital city with focus on government and corporate clients.',
      teamSize: 'Coming Soon',
      services: ['Government Solutions', 'Corporate Training', 'Enterprise Software']
    }
  ]

  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      contact: '+232 (78) 618-435',
      availability: '24/7 Emergency Support',
      color: 'green'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email anytime',
      contact: 'info@sabiteck.com',
      availability: 'Response within 24 hours',
      color: 'blue'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our team in real-time',
      contact: 'Available on website',
      availability: 'Mon-Fri: 9 AM - 6 PM GMT',
      color: 'purple'
    },
    {
      icon: Calendar,
      title: 'Schedule Meeting',
      description: 'Book a consultation call',
      contact: 'calendly.com/sabiteck',
      availability: 'Flexible scheduling',
      color: 'orange'
    }
  ]

  const faqs = [
    {
      question: 'What is your typical project timeline?',
      answer: 'Project timelines vary depending on complexity. Web applications typically take 8-16 weeks, while mobile apps range from 12-24 weeks. We provide detailed estimates during our initial consultation.'
    },
    {
      question: 'Do you offer ongoing support and maintenance?',
      answer: 'Yes, we provide comprehensive support packages including bug fixes, security updates, performance monitoring, and feature enhancements. Support plans start at $500/month.'
    },
    {
      question: 'What technologies do you specialize in?',
      answer: 'We specialize in modern web technologies including React, Vue.js, Node.js, PHP, Python, and cloud platforms like AWS and Azure. We adapt our tech stack to best fit your project needs.'
    },
    {
      question: 'Can you work with our existing team?',
      answer: 'Absolutely! We offer staff augmentation services and can seamlessly integrate with your existing development team, following your processes and methodologies.'
    },
    {
      question: 'What is your pricing structure?',
      answer: 'We offer flexible pricing models including fixed-price projects, hourly rates, and dedicated team arrangements. Rates start at $150/hour for development work.'
    },
    {
      question: 'Do you sign NDAs and work with confidential projects?',
      answer: 'Yes, we regularly sign NDAs and have extensive experience working with confidential and sensitive projects. Data security and confidentiality are top priorities.'
    }
  ]

  const currentOffice = offices.find(office => office.id === selectedOffice)

  const handleGetDirections = (office) => {
    const address = encodeURIComponent(office.address)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`
    window.open(googleMapsUrl, '_blank')
  }

  const handleViewInMap = (office) => {
    const address = encodeURIComponent(office.address)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`
    window.open(googleMapsUrl, '_blank')
  }

  const handleSendMessage = () => {
    // Scroll to the contact form
    const contactForm = document.querySelector('form')
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScheduleCall = () => {
    // Open calendly link or external scheduling tool
    window.open('https://calendly.com/sabiteck', '_blank')
  }

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Sabiteck Limited",
    "description": "Get in touch with Sierra Leone's premier technology company. Located in Bo, Sierra Leone, we're here to help with your software development, training, and consultancy needs.",
    "url": "https://sabiteck.com/contact",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Sabiteck Limited",
      "telephone": "+232-78-618-435",
      "email": "info@sabiteck.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "6 Hancil Road",
        "addressLocality": "Bo",
        "addressCountry": "Sierra Leone"
      },
      "openingHours": "Mo-Fr 08:00-18:00",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 7.9644,
        "longitude": -11.7383
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="Contact Us - Get in Touch with Sabiteck Limited in Bo, Sierra Leone"
        description="Contact Sabiteck Limited for technology solutions in Sierra Leone. Located at 6 Hancil Road, Bo. Call +232 78 618 435 or email info@sabiteck.com for software development, training, and consultancy services."
        keywords="contact Sabiteck Limited, Bo Sierra Leone tech company, software development contact, technology consultancy Sierra Leone, Emmanuel Koroma CEO contact, Sabiteck address phone email"
        url="/contact"
        schema={contactSchema}
      />
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
          <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-400/20">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Let's Connect
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            Ready to Transform
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Your Vision?
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
            We'd love to hear from you! Whether you have a project in mind, need expert advice,
            or just want to say hello – we're here and ready to help.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
              onClick={handleSendMessage}
            >
              <MessageSquare className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
              Send Message
              <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
              onClick={handleScheduleCall}
            >
              <Calendar className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
              Schedule Call
            </button>
          </div>

          {/* Quick contact highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Phone className="h-8 w-8 mx-auto mb-3 text-blue-300" />
              <p className="font-bold text-white mb-2">Call Us</p>
              <p className="text-blue-200">+232 78 618 435</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Mail className="h-8 w-8 mx-auto mb-3 text-blue-300" />
              <p className="font-bold text-white mb-2">Email Us</p>
              <p className="text-blue-200">info@sabiteck.com</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <MapPin className="h-8 w-8 mx-auto mb-3 text-blue-300" />
              <p className="font-bold text-white mb-2">Visit Us</p>
              <p className="text-blue-200">Bo, Sierra Leone</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Methods */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 20px 20px, #3B82F6 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-green-600/10 rounded-full text-green-600 text-sm font-medium mb-6">
              <Coffee className="h-4 w-4 mr-2" />
              Multiple Ways to Connect
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              How to Reach Us
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Choose the method that works best for you. We're here to help and respond quickly
              with expert solutions tailored to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => {
              const gradients = {
                green: 'from-green-500 to-emerald-600',
                blue: 'from-blue-500 to-indigo-600',
                purple: 'from-purple-500 to-violet-600',
                orange: 'from-orange-500 to-red-600'
              }
              const gradient = gradients[method.color] || 'from-blue-500 to-blue-600'

              return (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center h-full">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <method.icon className="h-10 w-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {method.title}
                    </h3>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {method.description}
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="font-bold text-gray-900 text-lg mb-2">{method.contact}</p>
                      <p className="text-sm text-gray-500">{method.availability}</p>
                    </div>

                    <button className={`w-full px-6 py-3 bg-gradient-to-r ${gradient} text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg`}>
                      {method.title === 'Phone Support' && 'Call Now'}
                      {method.title === 'Email Support' && 'Send Email'}
                      {method.title === 'Live Chat' && 'Start Chat'}
                      {method.title === 'Schedule Meeting' && 'Book Now'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Main Contact Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 backdrop-blur-sm rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-500/20">
              <MessageSquare className="h-4 w-4 mr-2" />
              Get In Touch
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Send Us a Message
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Ready to discuss your project? Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Enhanced Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Contact Form</h3>
                      <p className="text-gray-600">Tell us about your project</p>
                    </div>
                  </div>
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Enhanced Office Info & Newsletter */}
            <div className="space-y-8">
              {/* Office Selector */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Our Offices</h3>
                </div>
                <div className="space-y-3">
                  {offices.map((office) => {
                    const isSelected = selectedOffice === office.id
                    return (
                      <button
                        key={office.id}
                        onClick={() => setSelectedOffice(office.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                            : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                        }`}
                      >
                        <div className="font-bold text-lg">{office.name}</div>
                        <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                          {office.teamSize} team members
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Enhanced Selected Office Details */}
              {currentOffice && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{currentOffice.name}</h3>
                  </div>

                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl relative overflow-hidden mb-6 shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Building2 className="h-12 w-12 mx-auto mb-3" />
                        <span className="font-bold text-lg">{currentOffice.name}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">{currentOffice.description}</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start bg-gray-50 rounded-xl p-3">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 text-blue-600" />
                      <span className="text-gray-700">{currentOffice.address}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <Phone className="h-5 w-5 mr-3 text-green-600" />
                      <span className="text-gray-700">{currentOffice.phone}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <Mail className="h-5 w-5 mr-3 text-purple-600" />
                      <span className="text-gray-700">{currentOffice.email}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <Clock className="h-5 w-5 mr-3 text-orange-600" />
                      <span className="text-gray-700">{currentOffice.hours}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-xl p-3">
                      <Users className="h-5 w-5 mr-3 text-indigo-600" />
                      <span className="text-gray-700">{currentOffice.teamSize} team members</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      Services Offered:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentOffice.services.map((service, index) => (
                        <span key={index} className="text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full font-medium">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center"
                    onClick={() => handleGetDirections(currentOffice)}
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Get Directions
                  </button>
                </div>
              )}

              {/* Enhanced Newsletter Signup */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Stay Updated</h3>
                  </div>
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Map Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:50px_50px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 25px 25px, #6B46C1 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-600/10 rounded-full text-indigo-600 text-sm font-medium mb-6">
              <MapPin className="h-4 w-4 mr-2" />
              Our Location
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Find Us on the Map
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Visit our offices in Sierra Leone or connect with us remotely.
              We're here to serve you wherever you are.
            </p>
          </div>

          {/* Enhanced Interactive Map */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 h-96 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-repeat bg-[length:30px_30px]"
                     style={{
                       backgroundImage: `radial-gradient(circle at 15px 15px, white 1px, transparent 1px)`
                     }}>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                    <MapPin className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{currentOffice?.name}</h3>
                  <p className="text-xl text-blue-100 mb-8 max-w-md mx-auto">{currentOffice?.address}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center"
                      onClick={() => handleViewInMap(currentOffice)}
                    >
                      <Globe className="h-5 w-5 mr-2" />
                      View in Google Maps
                    </button>
                    <button
                      className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-2xl font-bold backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                      onClick={() => handleGetDirections(currentOffice)}
                    >
                      <Navigation className="h-5 w-5 mr-2" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Office quick info */}
            <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Call Us</h4>
                  <p className="text-gray-600">{currentOffice?.phone}</p>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Business Hours</h4>
                  <p className="text-gray-600">{currentOffice?.hours}</p>
                </div>
                <div className="text-center">
                  <Mail className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 mb-2">Email Us</h4>
                  <p className="text-gray-600">{currentOffice?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-600/20 backdrop-blur-sm rounded-full text-yellow-300 text-sm font-medium mb-6 border border-yellow-500/20">
              <Lightbulb className="h-4 w-4 mr-2" />
              Quick Answers
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Find quick answers to common questions about our services, process,
              and how we can help transform your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => {
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-pink-600',
                'from-green-500 to-emerald-600',
                'from-orange-500 to-red-600',
                'from-teal-500 to-blue-600',
                'from-indigo-500 to-purple-600'
              ]
              const gradient = gradients[index % gradients.length]

              return (
                <div key={index} className="group">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {faq.question}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed ml-14">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* FAQ CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Still Have Questions?</h3>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  Our team is here to help! Get in touch and we'll answer any questions you have about our services.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center"
                    onClick={handleSendMessage}
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Ask a Question
                  </button>
                  <button
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-bold backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    onClick={handleScheduleCall}
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Schedule Call
                  </button>
                </div>
              </div>
            </div>
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
          <div className="inline-flex items-center px-6 py-3 bg-green-600/20 rounded-full text-green-200 text-sm font-medium mb-8">
            <CheckCircle className="h-4 w-4 mr-2" />
            Ready to Get Started?
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Let's Bring Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ideas to Life
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto">
            Don't wait! Get in touch today and let's discuss how we can help
            transform your vision into a powerful digital reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button
              className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
              onClick={handleSendMessage}
            >
              <Send className="mr-3 h-6 w-6" />
              Send Message
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
              onClick={handleScheduleCall}
            >
              <Calendar className="mr-3 h-6 w-6" />
              Schedule Call
            </button>
          </div>

          {/* Response time promise */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="font-bold text-white mb-2">Quick Response</h3>
              <p className="text-blue-200">We respond within 24 hours</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="font-bold text-white mb-2">Confidential</h3>
              <p className="text-blue-200">Your ideas are safe with us</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="font-bold text-white mb-2">Free Consultation</h3>
              <p className="text-blue-200">No commitment required</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}

export default Contact