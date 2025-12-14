import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Globe, GraduationCap, DollarSign, Clock, Award, BookOpen, Users, Trophy, Briefcase, Star, Crown, Shield, Sparkles, Diamond, Zap, CheckCircle, TrendingUp, Copy, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { apiRequest } from '../../utils/api'
import { toast } from 'sonner'
import SEOHead from '../SEO/SEOHead'

const Scholarships = () => {
  const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="%23222"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="28" font-family="Arial">Scholarship</text></svg>'
  const [scholarships, setScholarships] = useState([])
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [featuredScholarships, setFeaturedScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedDeadline, setSelectedDeadline] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadScholarships()
    loadMetadata()
    loadFeaturedScholarships()
  }, [currentPage, searchQuery, selectedCategory, selectedRegion, selectedLevel, selectedDeadline, sortBy])

  const loadScholarships = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sort: sortBy
      })
      
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedRegion) params.append('region', selectedRegion)
      if (selectedLevel) params.append('education_level', selectedLevel)
      if (selectedDeadline) params.append('deadline', selectedDeadline)
      
      const response = await apiRequest(`/api/scholarships?${params}`)
      console.log('Scholarships API response:', response) // Debug log

      // The backend returns scholarships in response.data (which is an array)
      const scholarshipsData = response.data || response.scholarships || []
      const paginationData = response.pagination || {}

      setScholarships(scholarshipsData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to load scholarships:', error)
      setScholarships([])
      setPagination({})
    } finally {
      setLoading(false)
    }
  }

  const loadMetadata = async () => {
    try {
      // Make individual requests to avoid Promise.all failing everything
      const categoriesRes = await apiRequest('/api/scholarships/categories').catch(e => {
        console.error('Failed to load categories:', e)
        return { data: [] }
      })
      const regionsRes = await apiRequest('/api/scholarships/regions').catch(e => {
        console.error('Failed to load regions:', e)
        return { data: [] }
      })
      const levelsRes = await apiRequest('/api/scholarships/education-levels').catch(e => {
        console.error('Failed to load education levels:', e)
        return { data: [] }
      })
      
      console.log('Categories response:', categoriesRes) // Debug log
      console.log('Regions response:', regionsRes) // Debug log
      console.log('Education levels response:', levelsRes) // Debug log

      // Handle the new response structure with data array
      const categories = categoriesRes.data || []
      const regions = regionsRes.data || []
      const educationLevels = levelsRes.data || []

      setCategories(Array.isArray(categories) ? categories : [])
      setRegions(Array.isArray(regions) ? regions : [])
      setEducationLevels(Array.isArray(educationLevels) ? educationLevels : [])
    } catch (error) {
      console.error('Failed to load metadata:', error)
      setCategories([])
      setRegions([])
      setEducationLevels([])
    }
  }

  const loadFeaturedScholarships = async () => {
    try {
      const response = await apiRequest('/api/scholarships/featured')
      console.log('Featured scholarships response:', response) // Debug log

      // Handle the response structure properly
      const featuredData = response.data || response.scholarships || []
      setFeaturedScholarships(featuredData)
    } catch (error) {
      console.error('Failed to load featured scholarships:', error)
      setFeaturedScholarships([])
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedRegion('')
    setSelectedLevel('')
    setSelectedDeadline('')
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadScholarships()
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline specified'
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Deadline passed'
    if (diffDays === 0) return 'Deadline today'
    if (diffDays === 1) return '1 day left'
    return `${diffDays} days left`
  }

  const getCategoryIcon = (icon) => {
    const iconMap = {
      Award: Award,
      DollarSign: DollarSign,
      BookOpen: BookOpen,
      Briefcase: Briefcase,
      Users: Users,
      Trophy: Trophy,
      Calendar: Calendar,
      Globe: Globe,
      GraduationCap: GraduationCap
    }
    return iconMap[icon] || Award
  }

  const displayLevel = (level) => {
    if (!level) return 'All Levels'
    
    // Handle arrays
    if (Array.isArray(level)) {
      return level.filter(Boolean).join(', ') || 'All Levels'
    }
    
    // Handle string names (most common case)
    if (typeof level === 'string') {
      // Skip corrupted data
      if (level.includes('[') || level.includes('\\')) {
        return 'All Levels'
      }
      // Return clean string
      return level
    }
    
    // Fallback
    return 'All Levels'
  }

  const displayCategory = (scholarship) => {
    // First try to get category from scholarship.category
    if (scholarship.category && typeof scholarship.category === 'string') {
      // Skip corrupted data
      if (scholarship.category.includes('[') || scholarship.category.includes('\\')) {
        // Try to get from category_ids
        if (scholarship.category_ids) {
          try {
            const ids = JSON.parse(scholarship.category_ids)
            if (Array.isArray(ids) && ids.length > 0 && categories.length > 0) {
              const cat = categories.find(c => c.id === ids[0])
              return cat ? cat.name : 'General'
            }
          } catch (e) {
            return 'General'
          }
        }
        return 'General'
      }
      
      // If it's a numeric ID, find the name
      if (/^\d+$/.test(scholarship.category)) {
        const catId = parseInt(scholarship.category)
        const cat = categories.find(c => c.id === catId)
        return cat ? cat.name : 'General'
      }
      
      // Return the string as-is
      return scholarship.category
    }
    
    // Try category_ids
    if (scholarship.category_ids) {
      try {
        const ids = JSON.parse(scholarship.category_ids)
        if (Array.isArray(ids) && ids.length > 0 && categories.length > 0) {
          const cat = categories.find(c => c.id === ids[0])
          return cat ? cat.name : 'General'
        }
      } catch (e) {}
    }
    
    return 'General'
  }

  const copyScholarshipLink = async (scholarship) => {
    try {
      // Generate the scholarship link based on the slug or ID
      const baseUrl = window.location.origin
      const scholarshipUrl = `${baseUrl}/scholarships/${scholarship.slug || scholarship.id}`

      // Copy to clipboard
      await navigator.clipboard.writeText(scholarshipUrl)

      toast.success('✨ Scholarship link copied to clipboard!', {
        description: `${scholarship.title} - ${scholarshipUrl}`,
        duration: 3000
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      const baseUrl = window.location.origin
      const scholarshipUrl = `${baseUrl}/scholarships/${scholarship.slug || scholarship.id}`

      textArea.value = scholarshipUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      toast.success('✨ Scholarship link copied to clipboard!', {
        description: `${scholarship.title} - ${scholarshipUrl}`,
        duration: 3000
      })
    }
  }

  // Stats for hero section
  const stats = [
    { label: 'Available Scholarships', value: `${scholarships.length || 150}+` },
    { label: 'Total Worth', value: '$10M+' },
    { label: 'Recipients Helped', value: '5K+' },
    { label: 'Partner Universities', value: '100+' }
  ];

  return (
    <>
      <SEOHead
        title="Scholarships - Fund Your Education Dreams"
        description="Discover international scholarships, grants, and financial aid opportunities. Browse scholarships by category, region, and education level. Apply now and turn your educational dreams into reality."
        keywords="scholarships, international scholarships, study abroad, financial aid, education funding, grants, student funding, scholarship opportunities, education grants, study grants"
        image="https://sabiteck.com/src/assets/icons/Sabitek Logo.png"
        url="/scholarships"
        type="website"
      />
      <div className="min-h-screen">
        {/* Enhanced Hero Section - Matching Portfolio/Team/Tools/Jobs Style */}
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
            <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Scholarship Opportunities
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
            Fund Your Education
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Dreams into Reality
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
            Explore hundreds of scholarship opportunities from prestigious institutions worldwide. Whether you're pursuing undergraduate, graduate, or professional studies, find funding that matches your goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
              onClick={() => document.querySelector('.scholarships-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="mr-3 h-6 w-6" />
              Find Scholarships
              <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
              onClick={() => window.open('/resources', '_blank')}
            >
              <BookOpen className="mr-3 h-6 w-6" />
              Application Tips
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-blue-200 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Section - Matching Portfolio/Team/Tools/Jobs Style */}
      <section className="scholarships-content py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 20px 20px, #60A5FA 1px, transparent 1px)`
               }}>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 backdrop-blur-sm rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-400/20">
              <Filter className="h-4 w-4 mr-2" />
              Scholarship Types
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Find Your Scholarship
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Browse scholarships by category, location, and funding amount to find the perfect opportunity for your educational journey.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scholarships by name, institution, or field of study..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-32 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-white placeholder-gray-300 transition-all duration-300 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>

          {/* Category Pills */}
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap gap-3 sm:gap-4 bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20">
              <button
                onClick={() => setSelectedCategory('')}
                className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                  selectedCategory === ''
                    ? 'text-white shadow-xl'
                    : 'bg-white/10 text-gray-200 hover:bg-white/20'
                }`}
                style={selectedCategory === '' ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>All Scholarships</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === '' ? 'bg-white/20 text-white' : 'bg-blue-400/20 text-blue-200'}`}>
                    {scholarships.length}
                  </span>
                </span>
              </button>
              {categories.map(category => {
                const isActive = selectedCategory === category.name;
                const CategoryIcon = getCategoryIcon(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-xl'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{category.name}</span>
                      {category.count > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-400/20 text-blue-200'}`}>
                          {category.count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Scholarships Content Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative">

      {/* Elite Featured Scholarships Section */}
      {featuredScholarships.length > 0 && (
        <section className="py-20 bg-black/20 backdrop-blur-xl border-y border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30">
                  <Crown className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent">
                Featured Opportunities
              </h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-yellow-400 font-bold">Prestigious & Time-Sensitive</span>
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
              <p className="text-xl text-gray-300">
                Don't miss these exclusive scholarship opportunities
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(featuredScholarships) && featuredScholarships.slice(0, 6).map((scholarship) => {
                const CategoryIcon = getCategoryIcon(scholarship.category_icon)
                const coverImage = scholarship.image_url || FALLBACK_IMAGE
                return (
                  <div key={scholarship.id} className="group bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-yellow-500/30 shadow-2xl hover:shadow-3xl transition-all duration-500 p-6 hover:scale-105 transform relative overflow-hidden flex flex-col h-full">
                    <div className="relative mb-4 rounded-2xl overflow-hidden border border-white/10">
                      <img
                        src={coverImage}
                        alt={scholarship.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                    {/* Elite Featured Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30 animate-pulse">
                        <Crown className="w-3 h-3 mr-1 fill-current" />
                        FEATURED
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-2xl text-sm font-bold border border-indigo-500/30">
                          <CategoryIcon className="h-4 w-4 mr-2" />
                          {displayCategory(scholarship)}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors line-clamp-2">
                        <Link to={`/scholarships/${scholarship.slug || scholarship.id}`}>
                          {scholarship.title}
                        </Link>
                      </h3>

                      <p className="text-gray-300 mb-6 line-clamp-3">
                        {scholarship.description}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-green-500/30">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                          <span className="text-sm text-gray-400">Funding</span>
                        </div>
                        <span className="font-bold text-green-400">
                          ${scholarship.amount || 'Premium Package'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-blue-500/30">
                        <div className="flex items-center">
                          <GraduationCap className="h-5 w-5 mr-2 text-blue-400" />
                          <span className="text-sm text-gray-400">Level</span>
                        </div>
                        <span className="font-bold text-blue-400">
                          {displayLevel(scholarship.education_level)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-2 text-purple-400" />
                          <span className="text-sm text-gray-400">Region</span>
                        </div>
                        <span className="font-bold text-purple-400">
                          {scholarship.region || 'Global'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-red-500/30">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-red-400" />
                          <span className="text-sm text-gray-400">Deadline</span>
                        </div>
                        <span className="font-bold text-red-400">
                          {formatDeadline(scholarship.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => copyScholarshipLink(scholarship)}
                        className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                        title="Copy Scholarship Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/scholarships/${scholarship.slug || scholarship.id}`}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Star className="w-4 h-4 fill-current" />
                          <span>Explore Opportunity</span>
                          <Zap className="w-4 h-4" />
                        </div>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filters and Results Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12 shadow-2xl hover:border-white/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                  <Filter className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Search Filters
                </h3>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
            
            <div className={`space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-6 ${showFilters ? 'block' : 'hidden md:grid'}`}>
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-400" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">All Categories</option>
                  {Array.isArray(categories) && categories.map((category, index) => (
                    <option key={`category-${category.id || category.slug || category.name || index}`} value={category.slug || category.name || category} className="bg-gray-800">
                      {category.name || category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-purple-400" />
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">All Global Regions</option>
                  {Array.isArray(regions) && regions.map((region, index) => (
                    <option key={`region-${region.id || region.slug || region.name || index}`} value={region.slug || region.name || region} className="bg-gray-800">
                      {region.name || region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elite Education Level Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-blue-400" />
                  Education Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">All Levels</option>
                  {Array.isArray(educationLevels) && educationLevels.map((level, index) => (
                    <option key={`level-${level?.id || level}-${index}`} value={level?.name || level} className="bg-gray-800">
                      {level?.name || level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-red-400" />
                  Deadline
                </label>
                <select
                  value={selectedDeadline}
                  onChange={(e) => {
                    setSelectedDeadline(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">Any Deadline</option>
                  <option value="week" className="bg-gray-800">Urgent (1 Week)</option>
                  <option value="month" className="bg-gray-800">Priority (1 Month)</option>
                  <option value="quarter" className="bg-gray-800">Standard (3 Months)</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="newest" className="bg-gray-800">Newest</option>
                  <option value="deadline" className="bg-gray-800">Urgent</option>
                  <option value="popular" className="bg-gray-800">Most Popular</option>
                  <option value="alphabetical" className="bg-gray-800">A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filters & Clear */}
            {(searchQuery || selectedCategory || selectedRegion || selectedLevel || selectedDeadline) && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
                <div className="flex flex-wrap gap-3">
                  {searchQuery && (
                    <div className="px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-2xl text-sm font-bold border border-indigo-500/30 flex items-center">
                      <Search className="w-3 h-3 mr-1" />
                      Search: {searchQuery}
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-2xl text-sm font-bold border border-blue-500/30 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Category: {categories.find(c => c.slug === selectedCategory)?.name}
                    </div>
                  )}
                  {selectedRegion && (
                    <div className="px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-2xl text-sm font-bold border border-purple-500/30 flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      Region: {regions.find(r => r.slug === selectedRegion)?.name}
                    </div>
                  )}
                  {selectedLevel && (
                    <div className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-2xl text-sm font-bold border border-green-500/30 flex items-center">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Level: {selectedLevel}
                    </div>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-2xl font-bold border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-gray-300 font-semibold">
                  {pagination.total ? (
                    <>
                      <span className="text-green-400 font-bold">{pagination.total}</span> scholarships found
                    </>
                  ) : (
                    'Loading scholarships...'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Scholarships Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scholarships.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(scholarships) && scholarships.map((scholarship) => {
                const CategoryIcon = getCategoryIcon(scholarship.category_icon)
                const coverImage = scholarship.image_url || FALLBACK_IMAGE
                return (
                  <div key={scholarship.id} className="group bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-indigo-500/30 shadow-2xl hover:shadow-3xl transition-all duration-500 p-6 hover:scale-105 transform relative overflow-hidden flex flex-col h-full">
                    <div className="relative mb-4 rounded-2xl overflow-hidden border border-white/10">
                      <img
                        src={coverImage}
                        alt={scholarship.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                    {/* Scholarship Card */}
                    <div className="mb-6 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-2xl text-sm font-bold border border-indigo-500/30">
                          <CategoryIcon className="h-4 w-4 mr-2" />
                          {displayCategory(scholarship)}
                        </div>
                        {scholarship.featured && (
                          <div className="flex items-center px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30 animate-pulse">
                            <Crown className="w-3 h-3 mr-1 fill-current" />
                            ELITE
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2 min-h-[48px]">
                        <Link to={`/scholarships/${scholarship.slug || scholarship.id}`}>
                          {scholarship.title}
                        </Link>
                      </h3>

                      <p className="text-gray-300 mb-6 line-clamp-3 min-h-[72px]">
                        {scholarship.description || scholarship.short_description || 'Excellent opportunity for your education'}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-green-500/30">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                          <span className="text-sm text-gray-400">Funding</span>
                        </div>
                        <span className="font-bold text-green-400">
                          ${scholarship.amount || 'Premium Package'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-blue-500/30">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm text-gray-400">Education Level</span>
                        </div>
                        <span className="font-bold text-blue-400">
                          {displayLevel(scholarship.education_level)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm text-gray-400">Region</span>
                        </div>
                        <span className="font-bold text-purple-400">
                          {scholarship.region || 'Global'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-red-500/30">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-red-400" />
                          <span className="text-sm text-gray-400">Deadline</span>
                        </div>
                        <span className="font-bold text-red-400">
                          {formatDeadline(scholarship.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-auto">
                      <button
                        onClick={() => copyScholarshipLink(scholarship)}
                        className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                        title="Copy Scholarship Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/scholarships/${scholarship.slug || scholarship.id}`}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Diamond className="w-4 h-4" />
                          <span>Explore Opportunity</span>
                          <Zap className="w-4 h-4" />
                        </div>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-black/30 backdrop-blur-lg rounded-full border border-white/20">
                  <Search className="w-16 h-16 text-gray-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Scholarships Found
              </h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                Refine your search criteria to discover more opportunities
              </p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-16">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-black/40 backdrop-blur-lg border border-white/20 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-3 font-bold rounded-2xl transition-all duration-300 hover:scale-105 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl'
                          : 'bg-black/40 backdrop-blur-lg border border-white/20 text-white hover:border-indigo-500/30'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                disabled={currentPage === pagination.total_pages}
                className="px-6 py-3 bg-black/40 backdrop-blur-lg border border-white/20 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
              >
                <span>Next</span>
                <Diamond className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
      </section>
    </div>
    </>
  );
};

export default Scholarships;
