import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, ChevronDown, Home, User, Briefcase,
  GraduationCap, FileText, Folder, Bell, Mail,
  Phone, Globe, Users, Building
} from 'lucide-react';
import { Button } from '../ui/button';

const ImprovedNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDropdownToggle = (dropdownName, e) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const navigationItems = {
    main: [
      { name: 'Home', href: '/', icon: Home },
    ],
    company: {
      label: 'Company',
      icon: Building,
      items: [
        { name: 'About Us', href: '/about', icon: FileText, description: 'Our story, mission & vision' },
        { name: 'Our Team', href: '/team', icon: Users, description: 'Meet our professionals' },
        { name: 'Portfolio', href: '/portfolio', icon: Folder, description: 'Our work & case studies' },
        { name: 'Announcements', href: '/announcements', icon: Bell, description: 'Latest news & updates' },
      ]
    },
    services: {
      label: 'Services',
      icon: Globe,
      items: [
        { name: 'All Services', href: '/services', icon: Globe, description: 'Complete service offerings' },
        { name: 'Study Abroad', href: '/services/study-abroad', icon: GraduationCap, description: 'International education guidance' },
        { name: 'Business Intelligence', href: '/services/business-intelligence', icon: Briefcase, description: 'Data-driven insights' },
        { name: 'Consulting', href: '/services/consulting', icon: User, description: 'Strategic business advice' },
      ]
    },
    opportunities: {
      label: 'Opportunities',
      icon: Briefcase,
      items: [
        { name: 'Job Openings', href: '/jobs', icon: Briefcase, description: 'Current career opportunities' },
        { name: 'Scholarships', href: '/scholarships', icon: GraduationCap, description: 'Educational funding opportunities' },
        { name: 'Internships', href: '/internships', icon: User, description: 'Professional development programs' },
      ]
    },
    contact: [
      { name: 'Contact', href: '/contact', icon: Phone },
    ]
  };

  const isActiveLink = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const DropdownMenu = ({ items, isOpen, onClose }) => (
    <div className={`absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border transform transition-all duration-200 ${
      isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    }`}>
      <div className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`block p-3 rounded-lg transition-colors group ${
                isActiveLink(item.href) 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 mt-0.5 ${
                  isActiveLink(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <div className="flex-1">
                  <div className={`font-medium ${
                    isActiveLink(item.href) ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div className={`text-sm ${
                      isActiveLink(item.href) ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const MobileDropdown = ({ items, isOpen }) => (
    <div className={`overflow-hidden transition-all duration-200 ${
      isOpen ? 'max-h-96' : 'max-h-0'
    }`}>
      <div className="py-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-6 py-3 text-sm transition-colors ${
                isActiveLink(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              SABI
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Home */}
            {navigationItems.main.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Dropdown Menus */}
            {Object.entries(navigationItems).filter(([key]) => !['main', 'contact'].includes(key)).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <div key={key} className="relative">
                  <button
                    onClick={(e) => handleDropdownToggle(key, e)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      openDropdown === key
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      openDropdown === key ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <DropdownMenu
                    items={section.items}
                    isOpen={openDropdown === key}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>
              );
            })}

            {/* Contact */}
            {navigationItems.contact.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button asChild>
              <Link to="/contact">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="py-4 space-y-1 border-t">
            {/* Home */}
            {navigationItems.main.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile Dropdowns */}
            {Object.entries(navigationItems).filter(([key]) => !['main', 'contact'].includes(key)).map(([key, section]) => {
              const Icon = section.icon;
              const isDropdownOpen = openDropdown === key;
              return (
                <div key={key}>
                  <button
                    onClick={(e) => handleDropdownToggle(key, e)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                      isDropdownOpen
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span>{section.label}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <MobileDropdown items={section.items} isOpen={isDropdownOpen} />
                </div>
              );
            })}

            {/* Contact */}
            {navigationItems.contact.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile CTA */}
            <div className="px-4 py-3">
              <Button asChild className="w-full">
                <Link to="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ImprovedNavigation;
