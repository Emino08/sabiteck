import React from 'react'
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react'
import SabiteckLogo from '../../assets/icons/SabitekLogo.png'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src={SabiteckLogo} 
                alt="Sabiteck Limited Logo - Technology Solutions Sierra Leone" 
                className="h-10 w-auto filter brightness-0 invert" 
                loading="lazy"
                width="40"
                height="40"
              />
              <span className="ml-3 text-xl font-bold">Sabiteck Limited</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your premier technology partner in Sierra Leone. We provide comprehensive tech solutions, 
              consultancy, training, and digital services. From software development to photography, 
              we're here to drive innovation and growth since 2020.
            </p>
            <div className="flex space-x-4">
              <Github className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/services" className="hover:text-white transition-colors">Software Development</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">Tech Consultancy</a></li>
              <li><a href="/training" className="hover:text-white transition-colors">Training & Education</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">Photography</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog & Content</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">Business Solutions</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>info@sabiteck.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>+232 78 618 435</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>6 Hancil Road, Bo<br />Sierra Leone</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Founded: 2020</p>
              <p>CEO & Founder: Emmanuel Koroma</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Sabiteck Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
