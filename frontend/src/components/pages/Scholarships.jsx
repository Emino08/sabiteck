import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Globe, GraduationCap, DollarSign, Clock, Award, BookOpen, Users, Trophy, Briefcase } from 'lucide-react'
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
    <div className="min-h-screen pt-32 bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Dream Scholarship
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Discover thousands of scholarship opportunities from around the world. 
              Your next step towards academic excellence starts here.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search scholarships by keyword, provider, or field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg border-0 rounded-full"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{scholarships.length || 8}</div>
                <div className="text-blue-200">Active Scholarships</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{categories.length || 8}</div>
                <div className="text-blue-200">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{regions.length || 13}</div>
                <div className="text-blue-200">Countries & Regions</div>
              </div>
              <div>
                <div className="text-3xl font-bold">$50M+</div>
                <div className="text-blue-200">Total Funding</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Scholarships Section */}
      {featuredScholarships.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Scholarships
              </h2>
              <p className="text-xl text-gray-600">
                Don't miss out on these prestigious opportunities
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(featuredScholarships) && featuredScholarships.slice(0, 6).map((scholarship) => {
                const CategoryIcon = getCategoryIcon(scholarship.category_icon)
                return (
                  <Card key={scholarship.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-500 text-white"
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {scholarship.category || 'General'}
                        </Badge>
                        <Badge variant="outline" className="text-red-600">
                          {formatDeadline(scholarship.deadline)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                        <Link to={`/scholarships/${scholarship.slug || scholarship.id}`}>
                          {scholarship.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {scholarship.description}
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${scholarship.amount || 'Amount not specified'}
                        </div>
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {scholarship.education_level || 'All levels'}
                        </div>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          {scholarship.region || 'Global'}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link 
                          to={`/scholarships/${scholarship.slug || scholarship.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Learn More →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filters and Results Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Filter Scholarships
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className={`space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option key="all-categories" value="">All Categories</option>
                  {Array.isArray(categories) && categories.map((category, index) => (
                    <option key={`category-${category.id || category.slug || category.name || index}`} value={category.slug || category.name || category}>
                      {category.name || category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option key="all-regions" value="">All Regions</option>
                  {Array.isArray(regions) && regions.map((region, index) => (
                    <option key={`region-${region.id || region.slug || region.name || index}`} value={region.slug || region.name || region}>
                      {region.name || region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option key="all-levels" value="">All Levels</option>
                  {Array.isArray(educationLevels) && educationLevels.map((level, index) => (
                    <option key={`level-${level.id || level.slug || level.name || index}`} value={level.slug || level.name || level}>
                      {level.name || level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <select
                  value={selectedDeadline}
                  onChange={(e) => {
                    setSelectedDeadline(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option key="any-deadline" value="">Any Deadline</option>
                  <option key="deadline-week" value="week">Within 1 Week</option>
                  <option key="deadline-month" value="month">Within 1 Month</option>
                  <option key="deadline-quarter" value="quarter">Within 3 Months</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="deadline">Deadline Soon</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Active Filters & Clear */}
            {(searchQuery || selectedCategory || selectedRegion || selectedLevel || selectedDeadline) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {selectedCategory && (
                    <Badge variant="secondary">
                      Category: {categories.find(c => c.slug === selectedCategory)?.name}
                    </Badge>
                  )}
                  {selectedRegion && (
                    <Badge variant="secondary">
                      Region: {regions.find(r => r.slug === selectedRegion)?.name}
                    </Badge>
                  )}
                  {selectedLevel && (
                    <Badge variant="secondary">
                      Level: {educationLevels.find(l => l.slug === selectedLevel)?.name}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {pagination.total ? `${pagination.total} scholarships found` : 'Loading scholarships...'}
              </p>
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
                  <Card key={scholarship.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-500 text-white"
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {scholarship.category || 'General'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-orange-600"
                        >
                          {formatDeadline(scholarship.deadline)}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                        <Link to={`/scholarships/${scholarship.slug || scholarship.id}`}>
                          {scholarship.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {scholarship.description}
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          ${scholarship.amount || 'Amount not specified'}
                        </div>
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {scholarship.education_level || 'All levels'}
                        </div>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          {scholarship.region || 'Global'}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link 
                          to={`/scholarships/${scholarship.slug || scholarship.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Learn More →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No scholarships found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                disabled={currentPage === pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Scholarships