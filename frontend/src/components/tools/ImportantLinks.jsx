import React, { useState, useEffect } from 'react';

// Icons
const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Custom UI Components
const Button = ({ children, onClick, disabled, variant, size, className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white",
    ghost: "text-purple-600 hover:bg-purple-50",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant || 'default']} ${sizes[size || 'default']} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-white ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 pb-6 ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
    {...props}
  />
);

const Select = ({ children, className = '', ...props }) => (
  <select
    className={`w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
    {...props}
  >
    {children}
  </select>
);

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Removed static fallback data - now using database data only

const ImportantLinks = () => {
  const [categories, setCategories] = useState([]);
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch categories and links
  useEffect(() => {
    fetchCategories();
    fetchLinks();
  }, []);

  // Filter links based on search and category
  useEffect(() => {
    let filtered = links;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(link => link.category_id === selectedCategory.id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(link =>
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by link type
    if (linkTypeFilter !== 'all') {
      filtered = filtered.filter(link => link.link_type === linkTypeFilter);
    }

    setFilteredLinks(filtered);
  }, [links, selectedCategory, searchTerm, linkTypeFilter]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/important-links/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        setUsingFallback(false);
      } else {
        throw new Error(data.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again later.');
    }
  };

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/important-links`);
      if (!response.ok) throw new Error('Failed to fetch links');
      const data = await response.json();
      if (data.success) {
        setLinks(data.data);
        setUsingFallback(false);
      } else {
        throw new Error(data.error || 'Failed to load links');
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      setError('Failed to load links. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (link) => {
    try {
      // Track click
      await fetch(`${API_BASE_URL}/api/important-links/download?link_id=${link.id}`);

      if (link.link_type === 'website') {
        // Open external link in new tab
        window.open(link.url, link.target_blank ? '_blank' : '_self');
      } else if (link.link_type === 'download') {
        // Download file
        const downloadUrl = `${API_BASE_URL}/api/important-links/download?link_id=${link.id}`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error accessing link:', error);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category);
  };

  const getCategoryIcon = (iconName) => {
    const icons = {
      'Monitor': '💻',
      'Book': '📚',
      'Code': '💻',
      'FileText': '📄',
      'GraduationCap': '🎓',
      'Globe': '🌍',
      'Link': '🔗'
    };
    return icons[iconName] || '🔗';
  };

  const getLinkIcon = (link) => {
    if (link.link_type === 'download') return <DownloadIcon />;
    return <ExternalLinkIcon />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <LinkIcon />
            <h1 className="text-4xl font-bold text-white ml-3">Important Links</h1>
          </div>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Access curated collection of important links and downloadable resources organized by categories.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={linkTypeFilter}
                onChange={(e) => setLinkTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="website">Website Links</option>
                <option value="download">Download Files</option>
              </Select>
              <div className="flex items-center space-x-2">
                <FilterIcon className="text-gray-400" />
                <span className="text-white text-sm">
                  {filteredLinks.length} of {links.length} links
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  !selectedCategory
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 hover:border-purple-500/50 text-purple-200 hover:text-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔗</div>
                  <div className="text-sm font-medium">All</div>
                  <div className="text-xs opacity-75">{links.length}</div>
                </div>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedCategory?.id === category.id
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 hover:border-purple-500/50 text-purple-200 hover:text-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{getCategoryIcon(category.icon)}</div>
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-xs opacity-75">{category.links_count}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links Grid */}
        {filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <LinkIcon className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No Links Found</h3>
              <p className="text-purple-200">
                {searchTerm || selectedCategory
                  ? 'No links match your current filters.'
                  : 'No links are available at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link) => (
              <Card key={link.id} className="hover:scale-105 transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${link.category_color || 'blue'}-500/20`}>
                        {getLinkIcon(link)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{link.title}</h3>
                        <p className="text-sm text-purple-200">{link.category_name}</p>
                      </div>
                    </div>
                    {link.link_type === 'download' && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <FileIcon className="w-3 h-3" />
                        <span>{link.file_type?.toUpperCase()}</span>
                        {link.file_size && <span>• {link.file_size}</span>}
                      </div>
                    )}
                  </div>

                  {link.description && (
                    <p className="text-purple-200 text-sm mb-4 line-clamp-2">{link.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => handleLinkClick(link)}
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      {link.link_type === 'download' ? (
                        <>
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLinkIcon className="w-4 h-4 mr-2" />
                          Visit Link
                        </>
                      )}
                    </Button>
                  </div>

                  {link.click_count > 0 && (
                    <div className="text-xs text-gray-400 mt-3 text-center">
                      {link.click_count} {link.click_count === 1 ? 'access' : 'accesses'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportantLinks;