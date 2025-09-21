// API service for Sabiteck website
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8002'}/api`;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const err = new Error(`HTTP error! status: ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return await response.json();
    } catch (error) {
      const suppress404 = options && options.suppress404;
      if (!(suppress404 && (error?.status === 404 || String(error?.message || '').includes('404')))) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Blog methods
  async getBlogPosts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await this.request(`/blog${queryParams ? `?${queryParams}` : ''}`);
    return response.posts || response.data || response;
  }

  async getFeaturedBlogPosts() {
    const response = await this.request('/blog/featured');
    return response.posts || response.data || response;
  }

  async getBlogPost(slug) {
    return this.request(`/blog/${slug}`);
  }

  async getBlogCategories() {
    return this.request('/blog/categories');
  }

  // Portfolio methods
  async getPortfolioProjects(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await this.request(`/portfolio${queryParams ? `?${queryParams}` : ''}`);
    return response.projects || response.data?.projects || response.data?.data || response.data || response;
  }

  async getFeaturedProjects() {
    const response = await this.request('/portfolio/featured');
    return response.projects || response.data?.projects || response.data?.data || response.data || response;
  }

  async getPortfolioProject(slug) {
    return this.request(`/portfolio/${slug}`);
  }

  async getPortfolioCategories() {
    try {
      // Add cache-busting timestamp to force fresh request
      const timestamp = Date.now();
      const response = await this.request(`/portfolio/categories?_t=${timestamp}`, {
        suppress404: true
      });
      return response.data || response.categories || response || [];
    } catch (error) {
      return [];
    }
  }

  // Services methods
  async getServices() {
    const response = await this.request('/services');
    return response.services || response.data?.services || response.data?.data || response.data || response; // Handle wrapped or direct arrays
  }

  async getPopularServices() {
    const response = await this.request('/services/popular');
    return response.services || response; // Extract services array from response
  }

  async getService(slug) {
    return this.request(`/services/${slug}`);
  }

  // Team methods
  async getTeamMembers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await this.request(`/team${queryParams ? `?${queryParams}` : ''}`);
    return response.team || response.data?.team || response.data || response; // Extract team array from response
  }

  async getFeaturedTeamMembers() {
    const response = await this.request('/team/featured');
    return response.team || response.data?.team || response.data || response; // Normalize to array if possible
  }

  async getTeamDepartments() {
    const response = await this.request('/team/departments');
    return response.departments || response.data?.departments || response; // Return departments array
  }

  // Jobs methods (public)
  async getJobs(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await this.request(`/jobs${queryParams ? `?${queryParams}` : ''}`);
    return response.jobs || response.data?.jobs || response.data || response;
  }

  // Contact methods
  async submitContact(data) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Newsletter methods
  async subscribeNewsletter(email) {
    return this.request('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Admin methods (require authentication)
  async adminLogin(credentials) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getAdminDashboard(token) {
    return this.request('/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Admin Settings methods
  async getAdminSettings(token) {
    return this.request('/admin/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async saveAdminSettings(token, settings) {
    return this.request('/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
  }

  // Route Settings methods
  async getRouteSettings(token = null) {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      return this.request('/admin/settings/routes', { headers });
    } else {
      return this.request('/settings/routes');
    }
  }

  async updateRouteSettings(token, routes) {
    return this.request('/admin/settings/routes', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ routes }),
    });
  }

  async updateRouteVisibility(token, routeName, visible) {
    return this.request(`/admin/settings/routes/${routeName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ visible }),
    });
  }

  // Social media methods (require authentication)
  async getSocialPosts(token, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/social${queryParams ? `?${queryParams}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getScheduledSocialPosts(token) {
    return this.request('/social/scheduled', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createSocialPost(token, data) {
    return this.request('/social', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateSocialPostStatus(token, id, data) {
    return this.request(`/social/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteSocialPost(token, id) {
    return this.request(`/social/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // File upload
  async uploadFile(file, token = null) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request('/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // Dashboard and stats methods
  async getDashboardStats() {
    const response = await this.request('/admin/dashboard');
    return response.data || response;
  }

  async getCompanyStats() {
    // This will fetch stats for public display on homepage
    const response = await this.request('/company/stats');
    return response.stats || response.data?.stats || {};
  }

  async getSettings() {
    const response = await this.request('/settings/routes');
    return response.settings || response;
  }

  // Content methods for dynamic homepage content
  async getHomePageContent() {
    const response = await this.request('/content/homepage');
    return response.content || response;
  }

  async getCompanyFeatures() {
    const response = await this.request('/content/features');
    return response.features || response;
  }

  // About page content methods
  async getAboutPageContent() {
    try {
      const response = await this.request('/content/about');
      return response.content || response;
    } catch (error) {
      console.warn('About content not available, using fallback');
      return null;
    }
  }

  async getCompanyInfo() {
    try {
      const response = await this.request('/company/info');
      return response.data || response;
    } catch (error) {
      console.warn('Company info not available, using fallback');
      return null;
    }
  }

  async getCompanyMission() {
    try {
      const response = await this.request('/company/mission');
      return response.data || response;
    } catch (error) {
      console.warn('Company mission not available, using fallback');
      return null;
    }
  }

  async getCompanyValues() {
    try {
      const response = await this.request('/company/values');
      return response.data || response;
    } catch (error) {
      console.warn('Company values not available, using fallback');
      return null;
    }
  }
}

export default new ApiService();