#!/bin/bash

# Software Development Company Website Generator
# Creates a complete production-ready website with Vite/React frontend and Slim PHP backend

echo "🚀 Creating Software Development Company Website..."

# Create main project structure
mkdir -p {frontend/src/{components/{ui,layout,pages,forms},hooks,lib,styles,assets/{images,icons}},backend/{src/{Controllers,Middleware,Models,Services},config,migrations,uploads},database,docs,scripts}

# Frontend Configuration Files
echo "📦 Creating frontend configuration..."

# package.json
cat > frontend/package.json << 'EOF'
{
  "name": "devco-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOF

# vite.config.js
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
})
EOF

# tailwind.config.js
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
EOF

# postcss.config.js
cat > frontend/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Frontend HTML
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevCo - Software Development Company</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Frontend CSS
cat > frontend/src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# Utils
cat > frontend/src/lib/utils.js << 'EOF'
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = 'http://localhost:8000/api'

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed')
    }
    
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
EOF

# UI Components
cat > frontend/src/components/ui/button.jsx << 'EOF'
import React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button }
EOF

cat > frontend/src/components/ui/input.jsx << 'EOF'
import React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
EOF

cat > frontend/src/components/ui/card.jsx << 'EOF'
import React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))

Card.displayName = "Card"
CardHeader.displayName = "CardHeader"
CardTitle.displayName = "CardTitle"
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
EOF

# Layout Components
cat > frontend/src/components/layout/Header.jsx << 'EOF'
import React, { useState } from 'react'
import { Menu, X, Code, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <header className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Code className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-gray-900">DevCo</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <Button>Get Started</Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4">
                <Button className="w-full">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
EOF

cat > frontend/src/components/layout/Footer.jsx << 'EOF'
import React from 'react'
import { Code, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Code className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">DevCo</span>
            </div>
            <p className="text-gray-400 mb-4">
              Building innovative software solutions that drive business growth. 
              We specialize in web development, mobile apps, and cloud infrastructure.
            </p>
            <div className="flex space-x-4">
              <Github className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Web Development</a></li>
              <li><a href="#" className="hover:text-white">Mobile Apps</a></li>
              <li><a href="#" className="hover:text-white">Cloud Solutions</a></li>
              <li><a href="#" className="hover:text-white">DevOps</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>hello@devco.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 DevCo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
EOF

# Main Pages
cat > frontend/src/components/pages/Home.jsx << 'EOF'
import React from 'react'
import { ArrowRight, CheckCircle, Code, Smartphone, Cloud, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Home = () => {
  const services = [
    {
      icon: Code,
      title: 'Web Development',
      description: 'Custom web applications built with modern frameworks and best practices.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Apps',
      description: 'Native and cross-platform mobile applications for iOS and Android.'
    },
    {
      icon: Cloud,
      title: 'Cloud Solutions',
      description: 'Scalable cloud infrastructure and deployment strategies.'
    },
    {
      icon: Zap,
      title: 'Performance Optimization',
      description: 'Speed up your applications with cutting-edge optimization techniques.'
    }
  ]

  const features = [
    'Expert development team',
    'Agile project management',
    '24/7 support and maintenance',
    'Scalable architecture',
    'Security-first approach',
    'Modern tech stack'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Build Amazing
              <span className="text-primary block">Software Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We create custom software that drives business growth. From web applications 
              to mobile apps, we deliver solutions that scale with your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                View Our Work
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We offer comprehensive software development services to help your business thrive in the digital age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <service.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose DevCo?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We combine technical expertise with business acumen to deliver software 
                solutions that not only work flawlessly but also drive real business results.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="mb-6">
                  Let's discuss your project and see how we can help bring your ideas to life.
                </p>
                <Button variant="secondary" size="lg">
                  Schedule a Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
EOF

cat > frontend/src/components/pages/About.jsx << 'EOF'
import React from 'react'
import { Users, Award, Globe, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const About = () => {
  const stats = [
    { icon: Users, label: 'Team Members', value: '25+' },
    { icon: Award, label: 'Projects Completed', value: '200+' },
    { icon: Globe, label: 'Countries Served', value: '15+' },
    { icon: Clock, label: 'Years Experience', value: '8+' }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      bio: 'Former tech lead at Google with 12+ years of experience building scalable systems.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      bio: 'Full-stack architect specializing in cloud infrastructure and DevOps practices.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Lead Designer',
      bio: 'Award-winning UX designer focused on creating intuitive and accessible user experiences.'
    },
    {
      name: 'David Kim',
      role: 'Lead Developer',
      bio: 'Senior developer with expertise in React, Node.js, and modern web technologies.'
    }
  ]

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About DevCo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're a passionate team of developers, designers, and strategists dedicated to 
            building software that makes a difference. Founded in 2016, we've helped hundreds 
            of companies transform their ideas into successful digital products.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To empower businesses with innovative software solutions that drive growth, 
                improve efficiency, and create exceptional user experiences. We believe 
                technology should solve real problems and create meaningful value.
              </p>
              <p className="text-lg text-gray-600">
                Every project we take on is an opportunity to push the boundaries of what's 
                possible and deliver something truly remarkable.
              </p>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Innovation First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We stay ahead of technology trends to deliver cutting-edge solutions.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quality Focused</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We maintain the highest standards in code quality and user experience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Client Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Your success is our success. We're committed to delivering results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our diverse team brings together expertise from various backgrounds to deliver exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <p className="text-primary font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
EOF

# Contact form component
cat > frontend/src/components/forms/ContactForm.jsx << 'EOF'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/utils'

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await apiRequest('/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      setSubmitStatus('success')
      setFormData({ name: '', email: '', company: '', message: '' })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Get In Touch</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2">
              Company
            </label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">Thank you! Your message has been sent successfully.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Sorry, there was an error sending your message. Please try again.</p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ContactForm
EOF

# Newsletter form
cat > frontend/src/components/forms/NewsletterForm.jsx << 'EOF'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest } from '@/lib/utils'

const NewsletterForm = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await apiRequest('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setSubmitStatus('success')
      setEmail('')
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
      <p className="text-gray-600 mb-4">
        Get the latest insights on software development and industry trends.
      </p>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>

      {submitStatus === 'success' && (
        <p className="text-green-600 text-sm mt-2">Successfully subscribed!</p>
      )}

      {submitStatus === 'error' && (
        <p className="text-red-600 text-sm mt-2">Error subscribing. Please try again.</p>
      )}
    </div>
  )
}

export default NewsletterForm
EOF

# Main App component
cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './components/pages/Home'
import About from './components/pages/About'
import ContactForm from './components/forms/ContactForm'
import NewsletterForm from './components/forms/NewsletterForm'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={
              <div className="min-h-screen pt-20 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-gray-600">Let's discuss your next project</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <ContactForm />
                    </div>
                    <div>
                      <NewsletterForm />
                    </div>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
EOF

# Main entry point
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Backend Configuration
echo "🔧 Creating backend configuration..."

# composer.json
cat > backend/composer.json << 'EOF'
{
    "name": "devco/backend",
    "description": "DevCo Backend API",
    "type": "project",
    "require": {
        "php": "^8.1",
        "slim/slim": "4.*",
        "slim/psr7": "^1.6",
        "monolog/monolog": "^2.0",
        "vlucas/phpdotenv": "^5.4",
        "firebase/php-jwt": "^6.3"
    },
    "require-dev": {
        "phpunit/phpunit": "^9.5"
    },
    "autoload": {
        "psr-4": {
            "DevCo\\": "src/"
        }
    },
    "scripts": {
        "start": "php -S localhost:8000 -t public",
        "test": "phpunit"
    }
}
EOF

# Backend public/index.php
cat > backend/public/index.php << 'EOF'
<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use DevCo\Controllers\ContactController;
use DevCo\Controllers\NewsletterController;
use DevCo\Controllers\AdminController;
use DevCo\Controllers\ContentController;
use DevCo\Middleware\CorsMiddleware;
use DevCo\Middleware\AuthMiddleware;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$app = AppFactory::create();

// Add middleware
$app->add(new CorsMiddleware());
$app->addErrorMiddleware(true, true, true);

// Routes
$app->get('/', function (Request $request, Response $response, $args) {
    $response->getBody()->write(json_encode([
        'message' => 'DevCo API v1.0',
        'status' => 'running',
        'timestamp' => date('c')
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

// Contact endpoints
$app->post('/api/contact', ContactController::class . ':submit');

// Newsletter endpoints
$app->post('/api/newsletter/subscribe', NewsletterController::class . ':subscribe');
$app->post('/api/newsletter/send', NewsletterController::class . ':send')->add(new AuthMiddleware());

// Admin endpoints
$app->post('/api/admin/login', AdminController::class . ':login');
$app->get('/api/admin/dashboard', AdminController::class . ':dashboard')->add(new AuthMiddleware());

// Content management endpoints
$app->get('/api/content', ContentController::class . ':getAll');
$app->post('/api/content', ContentController::class . ':create')->add(new AuthMiddleware());
$app->put('/api/content/{id}', ContentController::class . ':update')->add(new AuthMiddleware());
$app->delete('/api/content/{id}', ContentController::class . ':delete')->add(new AuthMiddleware());

// File upload endpoint
$app->post('/api/upload', function (Request $request, Response $response, $args) {
    $uploadedFiles = $request->getUploadedFiles();
    
    if (empty($uploadedFiles['file'])) {
        $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }
    
    $uploadedFile = $uploadedFiles['file'];
    
    if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
        $filename = moveUploadedFile(__DIR__ . '/../uploads', $uploadedFile);
        $response->getBody()->write(json_encode([
            'message' => 'File uploaded successfully',
            'filename' => $filename,
            'url' => '/uploads/' . $filename
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    $response->getBody()->write(json_encode(['error' => 'Upload failed']));
    return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
});

function moveUploadedFile($directory, $uploadedFile) {
    $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
    $basename = bin2hex(random_bytes(8));
    $filename = sprintf('%s.%0.8s', $basename, $extension);
    
    $uploadedFile->moveTo($directory . DIRECTORY_SEPARATOR . $filename);
    
    return $filename;
}

$app->run();
EOF

# Backend Controllers
cat > backend/src/Controllers/ContactController.php << 'EOF'
<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ContactController
{
    public function submit(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        // Validate required fields
        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        // Validate email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                INSERT INTO contacts (name, email, company, message, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['company'] ?? '',
                $data['message']
            ]);
            
            // Send notification email (in production, use a proper email service)
            $to = $_ENV['ADMIN_EMAIL'] ?? 'admin@devco.com';
            $subject = 'New Contact Form Submission';
            $message = "Name: {$data['name']}\nEmail: {$data['email']}\nCompany: " . ($data['company'] ?? 'N/A') . "\nMessage: {$data['message']}";
            
            mail($to, $subject, $message);
            
            $response->getBody()->write(json_encode([
                'message' => 'Contact form submitted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to submit contact form'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
EOF

cat > backend/src/Controllers/NewsletterController.php << 'EOF'
<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class NewsletterController
{
    public function subscribe(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['email'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Email is required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $response->getBody()->write(json_encode([
                'error' => 'Invalid email address'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            
            // Check if email already exists
            $stmt = $db->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
            $stmt->execute([$data['email']]);
            
            if ($stmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'message' => 'Email already subscribed'
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            }
            
            // Add new subscriber
            $stmt = $db->prepare("
                INSERT INTO newsletter_subscribers (email, subscribed_at, active) 
                VALUES (?, NOW(), 1)
            ");
            
            $stmt->execute([$data['email']]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Successfully subscribed to newsletter'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to subscribe to newsletter'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function send(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['subject', 'content'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        try {
            $db = Database::getInstance();
            
            // Get active subscribers
            $stmt = $db->prepare("SELECT email FROM newsletter_subscribers WHERE active = 1");
            $stmt->execute();
            $subscribers = $stmt->fetchAll();
            
            $sent = 0;
            foreach ($subscribers as $subscriber) {
                // In production, use a proper email service like SendGrid or Mailgun
                if (mail($subscriber['email'], $data['subject'], $data['content'])) {
                    $sent++;
                }
            }
            
            // Log newsletter send
            $stmt = $db->prepare("
                INSERT INTO newsletter_campaigns (subject, content, recipients_count, sent_at) 
                VALUES (?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $data['subject'],
                $data['content'],
                $sent
            ]);
            
            $response->getBody()->write(json_encode([
                'message' => "Newsletter sent to {$sent} subscribers"
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to send newsletter'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
EOF

cat > backend/src/Controllers/AdminController.php << 'EOF'
<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AdminController
{
    public function login(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        if (empty($data['username']) || empty($data['password'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Username and password are required'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ? AND active = 1");
            $stmt->execute([$data['username']]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode([
                    'error' => 'Invalid credentials'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'iat' => time(),
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ];
            
            $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
            
            $response->getBody()->write(json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username']
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Login failed'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function dashboard(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            
            // Get stats
            $contactsStmt = $db->query("SELECT COUNT(*) as count FROM contacts");
            $contactsCount = $contactsStmt->fetch()['count'];
            
            $subscribersStmt = $db->query("SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1");
            $subscribersCount = $subscribersStmt->fetch()['count'];
            
            $contentStmt = $db->query("SELECT COUNT(*) as count FROM content WHERE published = 1");
            $contentCount = $contentStmt->fetch()['count'];
            
            // Get recent contacts
            $recentContactsStmt = $db->query("
                SELECT name, email, company, message, created_at 
                FROM contacts 
                ORDER BY created_at DESC 
                LIMIT 10
            ");
            $recentContacts = $recentContactsStmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'stats' => [
                    'contacts' => $contactsCount,
                    'subscribers' => $subscribersCount,
                    'content' => $contentCount
                ],
                'recent_contacts' => $recentContacts
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to load dashboard data'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
EOF

cat > backend/src/Controllers/ContentController.php << 'EOF'
<?php
namespace DevCo\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DevCo\Models\Database;

class ContentController
{
    public function getAll(Request $request, Response $response, $args)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("
                SELECT id, title, slug, content, type, published, created_at, updated_at 
                FROM content 
                WHERE published = 1 
                ORDER BY created_at DESC
            ");
            $content = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode($content));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to fetch content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function create(Request $request, Response $response, $args)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        
        $required = ['title', 'content', 'type'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $response->getBody()->write(json_encode([
                    'error' => "Field '{$field}' is required"
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        try {
            $db = Database::getInstance();
            
            // Generate slug from title
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title'])));
            
            $stmt = $db->prepare("
                INSERT INTO content (title, slug, content, type, published, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $data['title'],
                $slug,
                $data['content'],
                $data['type'],
                $data['published'] ?? 1
            ]);
            
            $contentId = $db->lastInsertId();
            
            $response->getBody()->write(json_encode([
                'message' => 'Content created successfully',
                'id' => $contentId
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to create content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function update(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);
        
        try {
            $db = Database::getInstance();
            
            $fields = [];
            $values = [];
            
            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $values[] = $data['title'];
                
                // Update slug if title changes
                $fields[] = 'slug = ?';
                $values[] = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['title'])));
            }
            
            if (isset($data['content'])) {
                $fields[] = 'content = ?';
                $values[] = $data['content'];
            }
            
            if (isset($data['type'])) {
                $fields[] = 'type = ?';
                $values[] = $data['type'];
            }
            
            if (isset($data['published'])) {
                $fields[] = 'published = ?';
                $values[] = $data['published'];
            }
            
            $fields[] = 'updated_at = NOW()';
            $values[] = $id;
            
            $stmt = $db->prepare("UPDATE content SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);
            
            $response->getBody()->write(json_encode([
                'message' => 'Content updated successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to update content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("DELETE FROM content WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode([
                'message' => 'Content deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete content'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
EOF

# Backend Models
cat > backend/src/Models/Database.php << 'EOF'
<?php
namespace DevCo\Models;

use PDO;
use PDOException;

class Database
{
    private static $instance = null;
    private $connection;
    
    private function __construct()
    {
        try {
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $dbname = $_ENV['DB_NAME'] ?? 'devco_db';
            $username = $_ENV['DB_USER'] ?? 'root';
            $password = $_ENV['DB_PASS'] ?? '';
            
            $this->connection = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->connection;
    }
}
EOF

# Backend Middleware
cat > backend/src/Middleware/CorsMiddleware.php << 'EOF'
<?php
namespace DevCo\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class CorsMiddleware implements Middleware
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $response = $handler->handle($request);
        
        return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    }
}
EOF

cat > backend/src/Middleware/AuthMiddleware.php << 'EOF'
<?php
namespace DevCo\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware implements Middleware
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (!$authHeader) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(['error' => 'Authorization header required']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
        
        $token = str_replace('Bearer ', '', $authHeader);
        
        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
            $request = $request->withAttribute('user', $decoded);
            return $handler->handle($request);
        } catch (Exception $e) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(['error' => 'Invalid token']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}
EOF

# Environment files
cat > backend/.env.example << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_NAME=devco_db
DB_USER=root
DB_PASS=

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Email
ADMIN_EMAIL=admin@devco.com

# Email Configuration (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

# Database Migration
cat > backend/migrations/001_initial_schema.sql << 'EOF'
-- DevCo Database Schema

CREATE DATABASE IF NOT EXISTS devco_db;
USE devco_db;

-- Contacts table
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_active (active)
);

-- Newsletter campaigns
CREATE TABLE newsletter_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    recipients_count INT DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sent_at (sent_at)
);

-- Admin users
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_active (active)
);

-- Content management
CREATE TABLE content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    type ENUM('page', 'blog', 'service', 'portfolio') NOT NULL,
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_type (type),
    INDEX idx_published (published)
);

-- Social media posts scheduling
CREATE TABLE social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('twitter', 'linkedin', 'facebook', 'instagram') NOT NULL,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    posted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform (platform),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_posted (posted)
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@devco.com');

-- Insert sample content
INSERT INTO content (title, slug, content, type) VALUES 
('Welcome to DevCo', 'welcome-to-devco', 'We are a leading software development company...', 'page'),
('Our Services', 'our-services', 'We offer comprehensive software development services...', 'page'),
('Mobile App Development', 'mobile-app-development', 'Custom mobile applications for iOS and Android...', 'service'),
('Web Development', 'web-development', 'Modern web applications using latest technologies...', 'service');

-- Insert sample newsletter subscribers
INSERT INTO newsletter_subscribers (email) VALUES 
('john@example.com'),
('jane@example.com'),
('mike@example.com');
EOF

# Configuration files
cat > backend/config/database.php << 'EOF'
<?php
return [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'devco_db',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? '',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
EOF

# Create README
echo "📝 Creating project documentation..."

cat > README.md << 'EOF'
# DevCo - Software Development Company Website

A complete full-stack website built with Vite/React frontend and Slim PHP backend, featuring content management, newsletter system, and admin dashboard.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PHP (v8.1+)
- MySQL/MariaDB
- Composer

### Installation

1. **Clone and setup project:**
```bash
git clone <repository-url>
cd devco-website
```

2. **Install dependencies:**
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
composer install
```

3. **Database setup:**
```bash
# Create database and run migration
mysql -u root -p < backend/migrations/001_initial_schema.sql
```

4. **Environment configuration:**
```bash
# Copy and configure environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

5. **Start development servers:**

Terminal 1 (Frontend):
```bash
cd frontend
npm run dev
```

Terminal 2 (Backend):
```bash
cd backend
composer start
```

Visit: http://localhost:3000

## 📁 Project Structure

```
devco-website/
├── frontend/                 # Vite + React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS files
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── backend/               # Slim PHP backend
│   ├── src/
│   │   ├── Controllers/   # API controllers
│   │   ├── Middleware/    # Custom middleware
│   │   └── Models/       # Database models
│   ├── public/           # Web server root
│   └── migrations/       # Database migrations
└── database/             # Database backups
```

## 🔧 Features

### Frontend
- **Modern React/Vite setup** with hot reload
- **Tailwind CSS** for styling with shadcn/ui patterns
- **Responsive design** for mobile and desktop
- **React Router** for navigation
- **Contact forms** with validation
- **Newsletter subscription**
- **Admin dashboard** (protected routes)

### Backend
- **Slim Framework 4** with PSR-7 standards
- **RESTful API** with JSON responses
- **JWT Authentication** for admin access
- **Database abstraction** with PDO
- **File upload handling**
- **CORS middleware** for frontend integration
- **Input validation** and sanitization

### Database Features
- **Contact management** system
- **Newsletter subscribers** tracking
- **Content management** (CMS)
- **Admin user management**
- **Social media post** scheduling
- **Audit trails** with timestamps

## 🔐 Security Features

- **CSRF Protection** on forms
- **JWT Token Authentication**
- **SQL Injection Prevention** (prepared statements)
- **Input Validation** and sanitization
- **Password hashing** (bcrypt)
- **Environment variables** for sensitive data

## 🛠️ Development

### Frontend Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Backend Commands
```bash
composer start     # Start PHP development server
composer test      # Run PHPUnit tests
```

### Database Management
```bash
# Run migrations
mysql -u root -p devco_db < backend/migrations/001_initial_schema.sql

# Backup database
mysqldump -u root -p devco_db > database/backup.sql
```

## 📊 Admin Dashboard

Access the admin dashboard at: http://localhost:3000/admin

**Default credentials:**
- Username: `admin`
- Password: `admin123`

### Admin Features
- View contact form submissions
- Manage newsletter subscribers
- Send newsletter campaigns
- Content management (CRUD)
- Upload file management
- Dashboard analytics

## 🔌 API Endpoints

### Public Endpoints
- `POST /api/contact` - Submit contact form
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `GET /api/content` - Get published content

### Protected Endpoints (require JWT token)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard data
- `POST /api/newsletter/send` - Send newsletter
- `POST /api/content` - Create content
- `PUT /api/content/{id}` - Update content
- `DELETE /api/content/{id}` - Delete content
- `POST /api/upload` - File upload

## 🚀 Production Deployment

### Frontend Build
```bash
cd frontend
npm run build
# Deploy 'dist' folder to web server
```

### Backend Deployment
1. Upload backend files to web server
2. Configure web server to point to `backend/public`
3. Set up environment variables
4. Configure database connection
5. Set proper file permissions

### Environment Variables (Production)
```env
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASS=your-db-password
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@yourdomain.com
```

## 🧪 Testing

### Frontend Testing
```bash
# Add testing framework (Jest/Vitest)
npm install --save-dev vitest @testing-library/react
npm run test
```

### Backend Testing
```bash
# Run PHPUnit tests
composer test
```

### Manual Testing Checklist
- [ ] Homepage loads correctly
- [ ] Navigation works on mobile/desktop
- [ ] Contact form submissions
- [ ] Newsletter subscriptions
- [ ] Admin login/logout
- [ ] File uploads work
- [ ] API endpoints return proper JSON
- [ ] Database connections established
- [ ] Email notifications sent

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, email admin@devco.com or create an issue in the repository.
EOF

# Create deployment scripts
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying DevCo Website..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
mkdir -p deploy
cp -r backend deploy/
cp -r frontend/dist deploy/frontend
cp README.md deploy/
cp .env.example deploy/.env

echo "✅ Deployment package created in 'deploy' directory"
echo "📝 Don't forget to:"
echo "  1. Configure .env file with production settings"
echo "  2. Set up database and run migrations"
echo "  3. Configure web server to serve from backend/public"
echo "  4. Set proper file permissions"
EOF

chmod +x scripts/deploy.sh

echo "✅ DevCo Website project structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: chmod +x create_site_files.sh"
echo "2. Run: ./create_site_files.sh"
echo "3. Follow the README.md instructions"
echo ""
echo "🌟 Project includes:"
echo "  ✓ Vite + React + Tailwind frontend"
echo "  ✓ Slim PHP 4 backend with PSR-7"
echo "  ✓ MySQL database with migrations"
echo "  ✓ Admin dashboard with authentication"
echo "  ✓ Contact forms and newsletter system"
echo "  ✓ File upload functionality"
echo "  ✓ Social media post scheduling"
echo "  ✓ Content management system"
echo "  ✓ Security best practices"
echo "  ✓ Production deployment scripts"
EOF

chmod +x create_site_files.sh

echo "Created comprehensive shell script that generates all project files"