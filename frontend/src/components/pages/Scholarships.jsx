import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Globe, GraduationCap, DollarSign, Clock, Award, BookOpen, Users, Trophy, Briefcase, Star, Crown, Shield, Sparkles, Diamond, Zap, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { apiRequest } from '../../utils/api'

const Scholarships = () => {
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
      if (selectedLevel) params.append('level', selectedLevel)
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
        return { categories: [] }
      })
      const regionsRes = await apiRequest('/api/scholarships/regions').catch(e => {
        console.error('Failed to load regions:', e)
        return { regions: [] }
      })
      const levelsRes = await apiRequest('/api/scholarships/education-levels').catch(e => {
        console.error('Failed to load education levels:', e)
        return { education_levels: [] }
      })
      
      console.log('Categories response:', categoriesRes) // Debug log
      console.log('Regions response:', regionsRes) // Debug log
      console.log('Education levels response:', levelsRes) // Debug log

      // Handle the response structure properly
      const categories = categoriesRes.categories || categoriesRes.data?.categories || []
      const regions = regionsRes.regions || regionsRes.data?.regions || []
      const educationLevels = levelsRes.education_levels || levelsRes.data?.education_levels || []

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

  return (
    <div className="min-h-screen pt-32 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Elite Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-6000"></div>
      </div>
      {/* Elite Hero Section */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 text-white py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                  <Trophy className="w-16 h-16 text-yellow-400" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Elite Scholarship Portal
            </h1>
            <div className="flex justify-center items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <span className="text-2xl font-bold text-yellow-400">Premium Educational Opportunities</span>
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </div>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover elite scholarship opportunities from prestigious institutions worldwide.
              Your gateway to academic excellence and professional distinction.
            </p>
            
            {/* Elite Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Search className="h-6 w-6 text-indigo-400" />
                    <Crown className="h-5 w-5 text-yellow-400 animate-pulse" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search elite scholarships by keyword, institution, or field..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-20 pr-32 py-6 text-lg bg-black/50 backdrop-blur-lg border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-white placeholder-gray-400 transition-all duration-300"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Search Elite</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Elite Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 bg-black/30 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-3xl font-black text-yellow-400 mb-2">{scholarships.length || 150}+</div>
                <div className="text-gray-300 font-semibold">Elite Scholarships</div>
              </div>
              <div className="p-6 bg-black/30 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-3">
                  <BookOpen className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-3xl font-black text-green-400 mb-2">{categories.length || 25}+</div>
                <div className="text-gray-300 font-semibold">Elite Categories</div>
              </div>
              <div className="p-6 bg-black/30 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-3">
                  <Globe className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-3xl font-black text-purple-400 mb-2">{regions.length || 50}+</div>
                <div className="text-gray-300 font-semibold">Global Regions</div>
              </div>
              <div className="p-6 bg-black/30 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:scale-105">
                <div className="flex justify-center mb-3">
                  <DollarSign className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-indigo-400 mb-2">$100M+</div>
                <div className="text-gray-300 font-semibold">Elite Funding</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                Elite Featured Opportunities
              </h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-yellow-400 font-bold">Prestigious & Time-Sensitive</span>
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
              <p className="text-xl text-gray-300">
                Don't miss these exclusive elite scholarship opportunities
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(featuredScholarships) && featuredScholarships.slice(0, 6).map((scholarship) => {
                const CategoryIcon = getCategoryIcon(scholarship.category_icon)
                return (
                  <div key={scholarship.id} className="group bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-yellow-500/30 shadow-2xl hover:shadow-3xl transition-all duration-500 p-6 hover:scale-105 transform relative overflow-hidden">
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
                          {scholarship.category || 'Elite General'}
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
                          {scholarship.education_level || 'All Elite Levels'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-2 text-purple-400" />
                          <span className="text-sm text-gray-400">Region</span>
                        </div>
                        <span className="font-bold text-purple-400">
                          {scholarship.region || 'Global Elite'}
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

                    <Link
                      to={`/scholarships/${scholarship.slug || scholarship.id}`}
                      className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Explore Elite Opportunity</span>
                        <Zap className="w-4 h-4" />
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Elite Filters and Results Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Elite Filter Bar */}
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-12 shadow-2xl hover:border-white/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                  <Filter className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Elite Search Filters
                </h3>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Elite Filters</span>
              </button>
            </div>
            
            <div className={`space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-6 ${showFilters ? 'block' : 'hidden md:grid'}`}>
              {/* Elite Category Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-indigo-400" />
                  Elite Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">All Elite Categories</option>
                  {Array.isArray(categories) && categories.map((category, index) => (
                    <option key={`category-${category.id || category.slug || category.name || index}`} value={category.slug || category.name || category} className="bg-gray-800">
                      {category.name || category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elite Region Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-purple-400" />
                  Elite Region
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
                  Elite Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">All Elite Levels</option>
                  {Array.isArray(educationLevels) && educationLevels.map((level, index) => (
                    <option key={`level-${level.id || level.slug || level.name || index}`} value={level.slug || level.name || level} className="bg-gray-800">
                      {level.name || level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elite Deadline Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-red-400" />
                  Elite Deadline
                </label>
                <select
                  value={selectedDeadline}
                  onChange={(e) => {
                    setSelectedDeadline(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="" className="bg-gray-800">Any Elite Deadline</option>
                  <option value="week" className="bg-gray-800">Elite Urgent (1 Week)</option>
                  <option value="month" className="bg-gray-800">Elite Priority (1 Month)</option>
                  <option value="quarter" className="bg-gray-800">Elite Standard (3 Months)</option>
                </select>
              </div>

              {/* Elite Sort Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                  Elite Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-4 bg-black/50 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 transition-all duration-300 hover:border-white/30"
                >
                  <option value="newest" className="bg-gray-800">Elite Newest</option>
                  <option value="deadline" className="bg-gray-800">Elite Urgent</option>
                  <option value="popular" className="bg-gray-800">Elite Popular</option>
                  <option value="alphabetical" className="bg-gray-800">Elite A-Z</option>
                </select>
              </div>
            </div>

            {/* Elite Active Filters & Clear */}
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
                      Level: {educationLevels.find(l => l.slug === selectedLevel)?.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-2xl font-bold border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Clear All Elite Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Elite Results Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-gray-300 font-semibold">
                  {pagination.total ? (
                    <>
                      <span className="text-green-400 font-bold">{pagination.total}</span> elite scholarships discovered
                    </>
                  ) : (
                    'Discovering elite opportunities...'
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
                return (
                  <div key={scholarship.id} className="group bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-indigo-500/30 shadow-2xl hover:shadow-3xl transition-all duration-500 p-6 hover:scale-105 transform relative overflow-hidden">
                    {/* Elite Scholarship Card */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-2xl text-sm font-bold border border-indigo-500/30">
                          <CategoryIcon className="h-4 w-4 mr-2" />
                          {scholarship.category || 'Elite General'}
                        </div>
                        {scholarship.featured && (
                          <div className="flex items-center px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30 animate-pulse">
                            <Crown className="w-3 h-3 mr-1 fill-current" />
                            ELITE
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
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
                          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                          <span className="text-sm text-gray-400">Elite Funding</span>
                        </div>
                        <span className="font-bold text-green-400">
                          ${scholarship.amount || 'Premium Package'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-blue-500/30">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-sm text-gray-400">Elite Level</span>
                        </div>
                        <span className="font-bold text-blue-400">
                          {scholarship.education_level || 'All Elite'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-purple-500/30">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="text-sm text-gray-400">Elite Region</span>
                        </div>
                        <span className="font-bold text-purple-400">
                          {scholarship.region || 'Global Elite'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-red-500/30">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-red-400" />
                          <span className="text-sm text-gray-400">Elite Deadline</span>
                        </div>
                        <span className="font-bold text-red-400">
                          {formatDeadline(scholarship.deadline)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/scholarships/${scholarship.slug || scholarship.id}`}
                      className="block w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Diamond className="w-4 h-4" />
                        <span>Explore Elite Opportunity</span>
                        <Zap className="w-4 h-4" />
                      </div>
                    </Link>
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
                No Elite Scholarships Found
              </h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                Refine your elite search criteria to discover premium opportunities
              </p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>Reset Elite Filters</span>
              </button>
            </div>
          )}

          {/* Elite Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-16">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-black/40 backdrop-blur-lg border border-white/20 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Previous Elite</span>
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
                <span>Next Elite</span>
                <Diamond className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Scholarships