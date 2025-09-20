import React, { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, Globe, Calendar, Users, Building2, Navigation } from 'lucide-react'
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
      contact: '+1 (555) 123-4567',
      availability: '24/7 Emergency Support',
      color: 'green'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email anytime',
      contact: 'hello@sabiteck.com',
      availability: 'Response within 24 hours',
      color: 'blue'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our team in real-time',
      contact: 'Available on website',
      availability: 'Mon-Fri: 9 AM - 6 PM PST',
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
      <div className="min-h-screen pt-32">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to start your next project? We'd love to hear from you. 
            Reach out to discuss your ideas and get a free consultation.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Reach Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the method that works best for you. We're here to help and respond quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 mx-auto mb-4 bg-${method.color}-100 rounded-full flex items-center justify-center`}>
                    <method.icon className={`h-8 w-8 text-${method.color}-600`} />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{method.description}</p>
                  <p className="font-semibold text-gray-900 mb-2">{method.contact}</p>
                  <p className="text-sm text-gray-500">{method.availability}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            {/* Office Info & Newsletter */}
            <div className="space-y-6">
              {/* Office Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Our Offices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {offices.map((office) => (
                      <button
                        key={office.id}
                        onClick={() => setSelectedOffice(office.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedOffice === office.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-medium">{office.name}</div>
                        <div className={`text-sm ${selectedOffice === office.id ? 'text-blue-100' : 'text-gray-600'}`}>
                          {office.teamSize} team members
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Office Details */}
              {currentOffice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      {currentOffice.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-video bg-gray-200 rounded-lg relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-blue-600/60 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium">{currentOffice.name}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{currentOffice.description}</p>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                        <span>{currentOffice.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{currentOffice.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{currentOffice.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{currentOffice.hours}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{currentOffice.teamSize} team members</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentOffice.services.map((service, index) => (
                          <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" size="sm" onClick={() => handleGetDirections(currentOffice)}>
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Newsletter Signup */}
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find Us on the Map
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We have offices around the world to serve you better. Select an office above to see its location.
            </p>
          </div>

          {/* Interactive Map Placeholder */}
          <div className="bg-gray-200 h-96 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentOffice?.name}</h3>
                <p className="text-gray-600">{currentOffice?.address}</p>
                <Button className="mt-4" onClick={() => handleViewInMap(currentOffice)}>
                  View in Google Maps
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about our services and process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
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
            Ready to Start Your Project?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Don't wait! Get in touch today and let's discuss how we can help 
            bring your software ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" onClick={handleSendMessage}>
              <Send className="h-5 w-5 mr-2" />
              Send Message
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-blue-700 border-white hover:bg-white hover:text-primary" onClick={handleScheduleCall}>
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Call
            </Button>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}

export default Contact