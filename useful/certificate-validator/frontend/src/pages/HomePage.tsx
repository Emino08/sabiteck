import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Shield,
  CheckCircle,
  Lock,
  Zap,
  Globe,
  Users,
  QrCode,
  FileText,
  ArrowRight,
  Star
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Verification',
      description: 'Military-grade encryption and security protocols protect all credential data'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Verify credentials in seconds with our optimized verification engine'
    },
    {
      icon: QrCode,
      title: 'QR Code Support',
      description: 'Scan QR codes for quick mobile verification on any device'
    },
    {
      icon: Globe,
      title: 'Nationwide Network',
      description: 'Connected to universities and colleges across the country'
    },
    {
      icon: Users,
      title: 'Multi-level Access',
      description: 'Role-based permissions for institutions, staff, and employers'
    },
    {
      icon: FileText,
      title: 'Comprehensive Records',
      description: 'Support for certificates, transcripts, diplomas, and project records'
    }
  ]

  const stats = [
    { label: 'Verified Institutions', value: '500+' },
    { label: 'Credentials Issued', value: '1M+' },
    { label: 'Monthly Verifications', value: '50K+' },
    { label: 'Trust Score', value: '99.9%' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Verify Academic
              <span className="text-primary block">Credentials Instantly</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The most trusted platform for verifying academic credentials nationwide.
              Secure, fast, and reliable verification for employers and institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/verify">
                  <Shield className="h-5 w-5 mr-2" />
                  Verify Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/login">
                  Institution Portal
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with security, privacy, and efficiency at its core, trusted by institutions nationwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure verification in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Enter Code or Scan QR</h3>
              <p className="text-gray-600">
                Input the certificate code provided with the credential or scan the QR code with your device.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Verification</h3>
              <p className="text-gray-600">
                Our system instantly checks the credential against our secure database of verified institutions.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Results</h3>
              <p className="text-gray-600">
                Receive detailed verification results with trust scores and audit trails for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Trusted by Leading Institutions
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Our platform is the choice of universities, colleges, and employers
                nationwide for secure credential verification.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-300" />
                  <span>Bank-level security and encryption</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-300" />
                  <span>GDPR and privacy compliance</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-300" />
                  <span>24/7 monitoring and support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-300" />
                  <span>Comprehensive audit trails</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-8">
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-300 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-lg font-semibold">5.0</span>
              </div>
              <blockquote className="text-lg italic mb-4">
                "The platform has revolutionized how we handle credential verification.
                It's fast, secure, and our employers love the instant verification feature."
              </blockquote>
              <div className="font-semibold">Dr. Sarah Johnson</div>
              <div className="text-blue-200">Registrar, National University</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of institutions and employers who trust our platform for credential verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Link to="/verify">
                Start Verifying
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-600 text-white hover:bg-gray-800">
              <a href="#contact">
                Contact Sales
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}