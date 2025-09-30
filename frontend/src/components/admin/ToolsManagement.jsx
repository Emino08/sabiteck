import React, { useState, useEffect } from 'react';

// Custom UI Components
const Button = ({ children, onClick, disabled, variant, size, className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white",
    ghost: "text-blue-600 hover:bg-blue-50",
    destructive: "bg-red-600 hover:bg-red-700 text-white shadow-lg"
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
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
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
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
);

const Textarea = ({ className = '', rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${className}`}
    {...props}
  />
);

const Switch = ({ checked, onChange, onCheckedChange, className = '', ...props }) => {
  const handleChange = () => {
    const newValue = !checked;
    if (onChange) onChange(newValue);
    if (onCheckedChange) onCheckedChange(newValue);
  };

  return (
    <button
      onClick={handleChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${className}`}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Enhanced toast notifications
const toast = {
  success: (message) => {
    console.log('Success:', message);
    // Create a temporary toast notification
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toastEl), 300);
    }, 3000);
  },
  error: (message) => {
    console.error('Error:', message);
    // Create a temporary toast notification
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toastEl), 300);
    }, 3000);
  },
  confirm: (message, onConfirm, onCancel) => {
    // Create confirmation toast
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm';

    toastEl.innerHTML = `
      <div class="mb-3">
        <div class="flex items-center mb-2">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span class="font-semibold">Confirm Action</span>
        </div>
        <p class="text-sm">${message}</p>
      </div>
      <div class="flex space-x-2">
        <button id="toast-confirm" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
          Yes, Delete
        </button>
        <button id="toast-cancel" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(toastEl);

    // Add event listeners
    const confirmBtn = toastEl.querySelector('#toast-confirm');
    const cancelBtn = toastEl.querySelector('#toast-cancel');

    const cleanup = () => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toastEl)) {
          document.body.removeChild(toastEl);
        }
      }, 300);
    };

    confirmBtn.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });

    // Auto-close after 10 seconds
    setTimeout(cleanup, 10000);
  }
};
import {
  Settings,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Wrench,
  Calculator,
  RefreshCw,
  BookOpen,
  Monitor,
  Briefcase,
  Cog,
  Heart,
  GraduationCap,
  Palette,
  Upload,
  Download,
  FileText,
  Star,
  Users,
  Database,
  Globe,
  Sparkles,
  Zap,
  Link,
  ExternalLink
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Simple Label component
const Label = ({ htmlFor, children, className = "" }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
);

// Simple Select component
const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
  >
    {children}
  </select>
);

const SelectOption = ({ value, children }) => (
  <option value={value}>{children}</option>
);


const ToolsManagement = () => {
  const [tools, setTools] = useState([]);
  const [curriculumCategories, setCurriculumCategories] = useState([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Important Links state
  const [importantLinksCategories, setImportantLinksCategories] = useState([]);
  const [importantLinks, setImportantLinks] = useState([]);
  const [selectedLinksCategory, setSelectedLinksCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tools');

  // Modal states
  const [isAddToolOpen, setIsAddToolOpen] = useState(false);
  const [isEditToolOpen, setIsEditToolOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  // Important Links modal states
  const [isAddLinksCategoryOpen, setIsAddLinksCategoryOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);

  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    icon: 'Wrench',
    component: '',
    visible: true,
    gradient: 'from-gray-500 via-gray-400 to-gray-300',
    color: 'gray',
    featured: false
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'BookOpen',
    color: 'blue'
  });

  const [subjectForm, setSubjectForm] = useState({
    id: '',
    category_id: '',
    name: '',
    code: '',
    description: '',
    credit_hours: '',
    prerequisites: '',
    learning_outcomes: '',
    assessment_methods: '',
    file: null,
    link_url: '',
    content_type: 'file' // 'file' or 'link'
  });

  // Important Links form states
  const [linksCategoryForm, setLinksCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Link',
    color: 'blue'
  });

  const [linkForm, setLinkForm] = useState({
    id: '',
    category_id: '',
    title: '',
    description: '',
    url: '',
    file: null,
    link_type: 'website', // 'website' or 'download'
    is_downloadable: false,
    target_blank: true,
    icon: 'ExternalLink',
    is_active: true
  });

  const iconOptions = [
    { value: 'Wrench', label: 'Wrench', icon: Wrench },
    { value: 'Calculator', label: 'Calculator', icon: Calculator },
    { value: 'RefreshCw', label: 'Refresh', icon: RefreshCw },
    { value: 'BookOpen', label: 'Book', icon: BookOpen },
    { value: 'Monitor', label: 'Monitor', icon: Monitor },
    { value: 'Briefcase', label: 'Briefcase', icon: Briefcase },
    { value: 'Cog', label: 'Cog', icon: Cog },
    { value: 'Heart', label: 'Heart', icon: Heart },
    { value: 'GraduationCap', label: 'Graduation', icon: GraduationCap },
    { value: 'Palette', label: 'Palette', icon: Palette },
    { value: 'FileText', label: 'File', icon: FileText },
    { value: 'Star', label: 'Star', icon: Star },
    { value: 'Users', label: 'Users', icon: Users },
    { value: 'Database', label: 'Database', icon: Database },
    { value: 'Globe', label: 'Globe', icon: Globe },
    { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
    { value: 'Zap', label: 'Zap', icon: Zap }
  ];

  const gradientOptions = [
    { value: 'from-violet-500 via-purple-500 to-pink-500', label: 'Purple to Pink', color: 'violet' },
    { value: 'from-cyan-500 via-blue-500 to-indigo-500', label: 'Cyan to Blue', color: 'cyan' },
    { value: 'from-emerald-500 via-green-500 to-teal-500', label: 'Green to Teal', color: 'emerald' },
    { value: 'from-orange-500 via-red-500 to-pink-500', label: 'Orange to Pink', color: 'orange' },
    { value: 'from-yellow-500 via-orange-500 to-red-500', label: 'Yellow to Red', color: 'yellow' },
    { value: 'from-gray-500 via-gray-400 to-gray-300', label: 'Gray', color: 'gray' }
  ];

  const colorOptions = [
    'blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'indigo', 'teal', 'cyan', 'gray'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Test login function for debugging
  const testAdminLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        toast.success('Admin login successful');
        await fetchData(); // Refresh data after login
      } else {
        toast.error('Login failed: ' + data.error);
      }
    } catch (error) {
      toast.error('Login error: ' + error.message);
      console.error('Login error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Check if we have a token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found. Admin features require login.');
        toast.error('Please login as admin to access this section');
        setLoading(false);
        return;
      }

      const [toolsRes, categoriesRes, subjectsRes, linksCategoriesRes, linksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/tools/config`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/curriculum/categories`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/curriculum/subjects`, { headers }),
        fetch(`${API_BASE_URL}/api/important-links/categories`, { headers }),
        fetch(`${API_BASE_URL}/api/important-links`, { headers })
      ]);

      // Check for auth errors
      if (toolsRes.status === 401 || categoriesRes.status === 401 || subjectsRes.status === 401) {
        toast.error('Authentication expired. Please login again.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      const [toolsData, categoriesData, subjectsData, linksCategoriesData, linksData] = await Promise.all([
        toolsRes.json(),
        categoriesRes.json(),
        subjectsRes.json(),
        linksCategoriesRes.json(),
        linksRes.json()
      ]);

      console.log('Fetched data:', { toolsData, categoriesData, subjectsData, linksCategoriesData, linksData });

      if (toolsData.success) {
        setTools(toolsData.data || []);
      } else {
        console.error('Tools fetch failed:', toolsData.error);
      }

      if (categoriesData.success) {
        setCurriculumCategories(categoriesData.data || []);
      } else {
        console.error('Categories fetch failed:', categoriesData.error);
      }

      if (subjectsData.success) {
        setCurriculumSubjects(subjectsData.data || []);
      } else {
        console.error('Subjects fetch failed:', subjectsData.error);
      }

      // Handle Important Links data
      if (linksCategoriesData.success) {
        setImportantLinksCategories(linksCategoriesData.data || []);
      } else {
        console.error('Important Links categories fetch failed:', linksCategoriesData.error);
        setImportantLinksCategories([]);
      }

      if (linksData.success) {
        setImportantLinks(linksData.data || []);
      } else {
        console.error('Important Links fetch failed:', linksData.error);
        setImportantLinks([]);
      }

    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleToolVisibility = async (toolId, visible) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tools/visibility`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tool_id: toolId, visible: visible ? 0 : 1 })
      });

      const data = await response.json();
      if (data.success) {
        setTools(prev => prev.map(tool =>
          tool.id === toolId ? { ...tool, visible: visible ? 0 : 1 } : tool
        ));
        toast.success('Tool visibility updated');
      } else {
        throw new Error(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      toast.error('Failed to update tool visibility');
      console.error('Error:', error);
    }
  };

  const handleAddTool = async () => {
    try {
      const formData = {
        ...toolForm,
        visible: toolForm.visible ? 1 : 0,
        featured: toolForm.featured ? 1 : 0
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/tools/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsAddToolOpen(false);
        setToolForm({
          name: '',
          description: '',
          icon: 'Wrench',
          component: '',
          visible: true,
          gradient: 'from-gray-500 via-gray-400 to-gray-300',
          color: 'gray',
          featured: false
        });
        toast.success('Tool added successfully');
      } else {
        throw new Error(data.error || 'Failed to add tool');
      }
    } catch (error) {
      toast.error('Failed to add tool');
      console.error('Error:', error);
    }
  };

  const handleUpdateTool = async () => {
    try {
      const formData = {
        id: editingTool.id,
        ...toolForm,
        visible: toolForm.visible ? 1 : 0,
        featured: toolForm.featured ? 1 : 0
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/tools/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsEditToolOpen(false);
        setEditingTool(null);
        toast.success('Tool updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update tool');
      }
    } catch (error) {
      toast.error('Failed to update tool');
      console.error('Error:', error);
    }
  };

  const handleDeleteTool = async (toolId) => {
    toast.confirm('Are you sure you want to delete this tool?', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/tools/delete`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: toolId })
        });

        const data = await response.json();
        if (data.success) {
          await fetchData();
          toast.success('Tool deleted successfully');
        } else {
          throw new Error(data.error || 'Failed to delete tool');
        }
      } catch (error) {
        toast.error('Failed to delete tool');
        console.error('Error:', error);
      }
    });
  };

  const handleAddCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/curriculum/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsAddCategoryOpen(false);
        setCategoryForm({
          name: '',
          description: '',
          icon: 'BookOpen',
          color: 'blue'
        });
        toast.success('Category added successfully');
      } else {
        throw new Error(data.error || 'Failed to add category');
      }
    } catch (error) {
      toast.error('Failed to add category');
      console.error('Error:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    toast.confirm('Are you sure you want to delete this category? This will also delete all subjects in this category.', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/curriculum/categories/delete`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: categoryId })
        });

        const data = await response.json();
        if (data.success) {
          await fetchData();
          toast.success('Category deleted successfully');
        } else {
          throw new Error(data.error || 'Failed to delete category');
        }
      } catch (error) {
        toast.error('Failed to delete category');
        console.error('Error:', error);
      }
    });
  };

  const handleAddSubject = async () => {
    try {
      let requestBody;
      let headers;

      if (subjectForm.content_type === 'file' && subjectForm.file) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(subjectForm).forEach(key => {
          if (key !== 'file' && key !== 'link_url') {
            formData.append(key, subjectForm[key]);
          }
        });
        formData.append('file', subjectForm.file);

        headers = {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          // Don't set Content-Type for FormData, let browser set it with boundary
        };
        requestBody = formData;
      } else {
        // Use JSON for link or no file
        headers = getAuthHeaders();
        const dataToSend = { ...subjectForm };
        delete dataToSend.file; // Remove file from JSON data
        requestBody = JSON.stringify(dataToSend);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/curriculum/subjects`, {
        method: 'POST',
        headers,
        body: requestBody
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsAddSubjectOpen(false);
        setSubjectForm({
          id: '',
          category_id: '',
          name: '',
          code: '',
          description: '',
          credit_hours: '',
          prerequisites: '',
          learning_outcomes: '',
          assessment_methods: '',
          file: null,
          link_url: '',
          content_type: 'file'
        });
        toast.success('Subject added successfully');
      } else {
        throw new Error(data.error || 'Failed to add subject');
      }
    } catch (error) {
      toast.error('Failed to add subject');
      console.error('Error:', error);
    }
  };

  const handleEditSubject = async () => {
    try {
      if (!subjectForm.id) {
        throw new Error('Subject ID is required for editing');
      }

      let requestBody;
      let headers;

      if (subjectForm.content_type === 'file' && subjectForm.file) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(subjectForm).forEach(key => {
          if (key !== 'file' && key !== 'link_url') {
            formData.append(key, subjectForm[key]);
          }
        });
        formData.append('file', subjectForm.file);

        headers = {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        };
        requestBody = formData;
      } else {
        // Use JSON for link or no file
        headers = getAuthHeaders();
        const dataToSend = { ...subjectForm };
        delete dataToSend.file; // Remove file from JSON data
        requestBody = JSON.stringify(dataToSend);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/curriculum/subjects/update`, {
        method: 'PUT',
        headers,
        body: requestBody
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsEditSubjectOpen(false);
        setSubjectForm({
          id: '',
          category_id: '',
          name: '',
          code: '',
          description: '',
          credit_hours: '',
          prerequisites: '',
          learning_outcomes: '',
          assessment_methods: '',
          file: null,
          link_url: '',
          content_type: 'file'
        });
        toast.success('Subject updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update subject');
      }
    } catch (error) {
      toast.error('Failed to update subject');
      console.error('Error:', error);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    toast.confirm('Are you sure you want to delete this subject?', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/curriculum/subjects/delete`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: subjectId })
        });

        const data = await response.json();
        if (data.success) {
          await fetchData();
          toast.success('Subject deleted successfully');
        } else {
          throw new Error(data.error || 'Failed to delete subject');
        }
      } catch (error) {
        toast.error('Failed to delete subject');
        console.error('Error:', error);
      }
    });
  };

  const openEditTool = (tool) => {
    setEditingTool(tool);
    setToolForm({
      name: tool.name,
      description: tool.description,
      icon: tool.icon,
      component: tool.component || '',
      visible: tool.visible,
      gradient: tool.gradient,
      color: tool.color,
      featured: tool.featured
    });
    setIsEditToolOpen(true);
  };

  const getFilteredSubjects = () => {
    if (!selectedCategory) return curriculumSubjects;
    return curriculumSubjects.filter(subject => subject.category_id === selectedCategory);
  };

  // Important Links CRUD Functions
  const handleAddLinksCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/important-links/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(linksCategoryForm)
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsAddLinksCategoryOpen(false);
        setLinksCategoryForm({
          name: '',
          description: '',
          icon: 'Link',
          color: 'blue'
        });
        toast.success('Important Links category added successfully');
      } else {
        throw new Error(data.error || 'Failed to add category');
      }
    } catch (error) {
      toast.error('Failed to add Important Links category');
      console.error('Error:', error);
    }
  };

  const handleDeleteLinksCategory = async (categoryId) => {
    toast.confirm('Are you sure you want to delete this category?', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/important-links/categories/delete`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: categoryId })
        });
        const data = await response.json();
        if (data.success) {
          await fetchData();
          toast.success('Important Links category deleted successfully');
        } else {
          throw new Error(data.error || 'Failed to delete category');
        }
      } catch (error) {
        toast.error('Failed to delete Important Links category');
        console.error('Error:', error);
      }
    });
  };

  const handleAddLink = async () => {
    try {
      const formData = new FormData();
      Object.keys(linkForm).forEach(key => {
        if (linkForm[key] !== null && linkForm[key] !== undefined) {
          formData.append(key, linkForm[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/important-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsAddLinkOpen(false);
        setLinkForm({
          title: '',
          description: '',
          category_id: '',
          link_type: 'website',
          url: '',
          file: null,
          target_blank: true,
          is_active: true
        });
        toast.success('Important Link added successfully');
      } else {
        throw new Error(data.error || 'Failed to add link');
      }
    } catch (error) {
      toast.error('Failed to add Important Link');
      console.error('Error:', error);
    }
  };

  const handleEditLink = async () => {
    try {
      const formData = new FormData();
      Object.keys(linkForm).forEach(key => {
        if (linkForm[key] !== null && linkForm[key] !== undefined && key !== 'id') {
          formData.append(key, linkForm[key]);
        }
      });
      formData.append('id', linkForm.id);

      const response = await fetch(`${API_BASE_URL}/api/admin/important-links/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
        setIsEditLinkOpen(false);
        setLinkForm({
          id: '',
          title: '',
          description: '',
          category_id: '',
          link_type: 'website',
          url: '',
          file: null,
          target_blank: true,
          is_active: true
        });
        toast.success('Important Link updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update link');
      }
    } catch (error) {
      toast.error('Failed to update Important Link');
      console.error('Error:', error);
    }
  };

  const handleDeleteLink = async (linkId) => {
    toast.confirm('Are you sure you want to delete this link?', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/important-links/delete`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id: linkId })
        });
        const data = await response.json();
        if (data.success) {
          await fetchData();
          toast.success('Important Link deleted successfully');
        } else {
          throw new Error(data.error || 'Failed to delete link');
        }
      } catch (error) {
        toast.error('Failed to delete Important Link');
        console.error('Error:', error);
      }
    });
  };

  const getFilteredLinks = () => {
    if (!selectedLinksCategory) return importantLinks;
    return importantLinks.filter(link => link.category_id === selectedLinksCategory);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Tools & Curriculum Management
        </h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'tools' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tools')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Tools
          </Button>
          <Button
            variant={activeTab === 'curriculum' ? 'default' : 'outline'}
            onClick={() => setActiveTab('curriculum')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Curriculum
          </Button>
          <Button
            variant={activeTab === 'important-links' ? 'default' : 'outline'}
            onClick={() => setActiveTab('important-links')}
            className="flex items-center gap-2"
          >
            <Link className="w-4 h-4" />
            Important Links
          </Button>
          {/* Temporary login button for debugging */}
          <Button
            onClick={testAdminLogin}
            variant="outline"
            className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
          >
            <Users className="w-4 h-4" />
            Test Login
          </Button>
        </div>
      </div>

      {/* Authentication Status Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Info:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Auth Token: {localStorage.getItem('auth_token') ? '✓ Present' : '✗ Missing'}</p>
          <p>Categories: {curriculumCategories.length} loaded</p>
          <p>Subjects: {curriculumSubjects.length} loaded</p>
          <p>Tools: {tools.length} loaded</p>
        </div>
      </div>

      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Tools Configuration</h2>
            <Button
              onClick={() => setIsAddToolOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Tool
            </Button>
          </div>

          <div className="grid gap-4">
            {tools.map((tool) => {
              const IconComponent = iconOptions.find(opt => opt.value === tool.icon)?.icon || Wrench;
              return (
                <Card key={tool.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.gradient}`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{tool.name}</h3>
                          <p className="text-gray-600">{tool.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Component: {tool.component || 'None'}</span>
                            <span>Order: {tool.display_order}</span>
                            {tool.featured && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleToolVisibility(tool.id, tool.visible)}
                          className={tool.visible ? 'text-green-600' : 'text-gray-400'}
                        >
                          {tool.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTool(tool)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTool(tool.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Categories
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsAddCategoryOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {curriculumCategories.map((category) => {
                  const IconComponent = iconOptions.find(opt => opt.value === category.icon)?.icon || BookOpen;
                  return (
                    <div
                      key={category.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCategory === category.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                            <IconComponent className={`w-5 h-5 text-${category.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                            <span className="text-xs text-gray-500">{category.subject_count} subjects</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Subjects */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Subjects {selectedCategory && `(${curriculumCategories.find(c => c.id === selectedCategory)?.name})`}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsAddSubjectOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getFilteredSubjects().map((subject) => (
                  <div key={subject.id} className="p-4 border rounded-lg hover:border-gray-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{subject.name}</h4>
                          {subject.code && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {subject.code}
                            </span>
                          )}
                          {subject.credit_hours && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {subject.credit_hours} credits
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
                        <span className="text-xs text-gray-500">Category: {subject.category_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {subject.file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSubjectForm({
                                id: subject.id,
                                category_id: subject.category_id.toString(),
                                name: subject.name,
                                code: subject.code,
                                description: subject.description,
                                credit_hours: subject.credit_hours.toString(),
                                prerequisites: subject.prerequisites || '',
                                learning_outcomes: subject.learning_outcomes || '',
                                assessment_methods: subject.assessment_methods || '',
                                file: null,
                                link_url: subject.link_url || '',
                                content_type: subject.file_path ? 'file' : 'link'
                              });
                              setIsEditSubjectOpen(true);
                            }}
                            className="text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {getFilteredSubjects().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {selectedCategory ? 'No subjects in this category' : 'Select a category to view subjects'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      <Modal isOpen={isAddToolOpen} onClose={() => setIsAddToolOpen(false)} title="Add New Tool">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tool Name</Label>
              <Input
                id="name"
                value={toolForm.name}
                onChange={(e) => setToolForm({...toolForm, name: e.target.value})}
                placeholder="Enter tool name"
              />
            </div>
            <div>
              <Label htmlFor="component">Component Name</Label>
              <Input
                id="component"
                value={toolForm.component}
                onChange={(e) => setToolForm({...toolForm, component: e.target.value})}
                placeholder="React component name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={toolForm.description}
              onChange={(e) => setToolForm({...toolForm, description: e.target.value})}
              placeholder="Tool description"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select value={toolForm.icon} onChange={(value) => setToolForm({...toolForm, icon: value})}>
                {iconOptions.map((option) => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Select value={toolForm.color} onChange={(value) => setToolForm({...toolForm, color: value})}>
                {colorOptions.map((color) => (
                  <SelectOption key={color} value={color}>
                    {color}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="gradient">Gradient</Label>
              <Select value={toolForm.gradient} onChange={(value) => {
                const selectedGradient = gradientOptions.find(g => g.value === value);
                setToolForm({...toolForm, gradient: value, color: selectedGradient?.color || 'gray'});
              }}>
                {gradientOptions.map((gradient) => (
                  <SelectOption key={gradient.value} value={gradient.value}>
                    {gradient.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="visible"
                checked={toolForm.visible}
                onCheckedChange={(checked) => setToolForm({...toolForm, visible: checked})}
              />
              <Label htmlFor="visible">Visible</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={toolForm.featured}
                onCheckedChange={(checked) => setToolForm({...toolForm, featured: checked})}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddToolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTool}>
              Add Tool
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Tool Modal */}
      <Modal isOpen={isEditToolOpen} onClose={() => setIsEditToolOpen(false)} title="Edit Tool">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editName">Tool Name</Label>
              <Input
                id="editName"
                value={toolForm.name}
                onChange={(e) => setToolForm({...toolForm, name: e.target.value})}
                placeholder="Enter tool name"
              />
            </div>
            <div>
              <Label htmlFor="editComponent">Component Name</Label>
              <Input
                id="editComponent"
                value={toolForm.component}
                onChange={(e) => setToolForm({...toolForm, component: e.target.value})}
                placeholder="React component name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="editDescription">Description</Label>
            <Textarea
              id="editDescription"
              value={toolForm.description}
              onChange={(e) => setToolForm({...toolForm, description: e.target.value})}
              placeholder="Tool description"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="editIcon">Icon</Label>
              <Select value={toolForm.icon} onChange={(value) => setToolForm({...toolForm, icon: value})}>
                {iconOptions.map((option) => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="editColor">Color</Label>
              <Select value={toolForm.color} onChange={(value) => setToolForm({...toolForm, color: value})}>
                {colorOptions.map((color) => (
                  <SelectOption key={color} value={color}>
                    {color}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="editGradient">Gradient</Label>
              <Select value={toolForm.gradient} onChange={(value) => {
                const selectedGradient = gradientOptions.find(g => g.value === value);
                setToolForm({...toolForm, gradient: value, color: selectedGradient?.color || 'gray'});
              }}>
                {gradientOptions.map((gradient) => (
                  <SelectOption key={gradient.value} value={gradient.value}>
                    {gradient.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="editVisible"
                checked={toolForm.visible}
                onCheckedChange={(checked) => setToolForm({...toolForm, visible: checked})}
              />
              <Label htmlFor="editVisible">Visible</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editFeatured"
                checked={toolForm.featured}
                onCheckedChange={(checked) => setToolForm({...toolForm, featured: checked})}
              />
              <Label htmlFor="editFeatured">Featured</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditToolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTool}>
              Update Tool
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Add New Category">
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <Label htmlFor="categoryDescription">Description</Label>
            <Textarea
              id="categoryDescription"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
              placeholder="Category description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryIcon">Icon</Label>
              <Select value={categoryForm.icon} onChange={(value) => setCategoryForm({...categoryForm, icon: value})}>
                {iconOptions.map((option) => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="categoryColor">Color</Label>
              <Select value={categoryForm.color} onChange={(value) => setCategoryForm({...categoryForm, color: value})}>
                {colorOptions.map((color) => (
                  <SelectOption key={color} value={color}>
                    {color}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Add Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} title="Add New Subject">
        <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subjectCategory">Category</Label>
              <Select
                value={subjectForm.category_id}
                onChange={(value) => setSubjectForm({...subjectForm, category_id: value})}
              >
                <SelectOption value="">Select Category</SelectOption>
                {curriculumCategories.map((category) => (
                  <SelectOption key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input
                id="subjectCode"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                placeholder="e.g., CS101"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
              placeholder="Enter subject name"
            />
          </div>
          <div>
            <Label htmlFor="subjectDescription">Description</Label>
            <Textarea
              id="subjectDescription"
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
              placeholder="Subject description"
            />
          </div>
          <div>
            <Label htmlFor="creditHours">Credit Hours</Label>
            <Input
              id="creditHours"
              type="number"
              value={subjectForm.credit_hours}
              onChange={(e) => setSubjectForm({...subjectForm, credit_hours: e.target.value})}
              placeholder="Credit hours"
            />
          </div>
          <div>
            <Label htmlFor="prerequisites">Prerequisites</Label>
            <Textarea
              id="prerequisites"
              value={subjectForm.prerequisites}
              onChange={(e) => setSubjectForm({...subjectForm, prerequisites: e.target.value})}
              placeholder="Prerequisites for this subject"
            />
          </div>
          <div>
            <Label htmlFor="learningOutcomes">Learning Outcomes</Label>
            <Textarea
              id="learningOutcomes"
              value={subjectForm.learning_outcomes}
              onChange={(e) => setSubjectForm({...subjectForm, learning_outcomes: e.target.value})}
              placeholder="Expected learning outcomes"
            />
          </div>
          <div>
            <Label htmlFor="assessmentMethods">Assessment Methods</Label>
            <Textarea
              id="assessmentMethods"
              value={subjectForm.assessment_methods}
              onChange={(e) => setSubjectForm({...subjectForm, assessment_methods: e.target.value})}
              placeholder="How students will be assessed"
            />
          </div>

          {/* Content Type Selection */}
          <div>
            <Label>Content Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="content_type"
                  value="file"
                  checked={subjectForm.content_type === 'file'}
                  onChange={(e) => setSubjectForm({...subjectForm, content_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Upload File (PDF)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="content_type"
                  value="link"
                  checked={subjectForm.content_type === 'link'}
                  onChange={(e) => setSubjectForm({...subjectForm, content_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>External Link</span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          {subjectForm.content_type === 'file' && (
            <div>
              <Label htmlFor="subjectFile">Upload Curriculum File</Label>
              <input
                id="subjectFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSubjectForm({...subjectForm, file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX (Max: 10MB)</p>
              {subjectForm.file && (
                <p className="text-sm text-green-600 mt-1">Selected: {subjectForm.file.name}</p>
              )}
            </div>
          )}

          {/* Link URL */}
          {subjectForm.content_type === 'link' && (
            <div>
              <Label htmlFor="subjectLink">External Link URL</Label>
              <Input
                id="subjectLink"
                type="url"
                value={subjectForm.link_url}
                onChange={(e) => setSubjectForm({...subjectForm, link_url: e.target.value})}
                placeholder="https://example.com/curriculum-document"
              />
              <p className="text-sm text-gray-500 mt-1">Enter the direct URL to the curriculum document</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject}>
              Add Subject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal isOpen={isEditSubjectOpen} onClose={() => setIsEditSubjectOpen(false)} title="Edit Subject">
        <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-subject-category">Category</Label>
              <select
                id="edit-subject-category"
                value={subjectForm.category_id}
                onChange={(e) => setSubjectForm({...subjectForm, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {curriculumCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-subject-code">Subject Code</Label>
              <Input
                id="edit-subject-code"
                type="text"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                placeholder="e.g., CS101"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-subject-name">Subject Name</Label>
            <Input
              id="edit-subject-name"
              type="text"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
              placeholder="Enter subject name"
            />
          </div>
          <div>
            <Label htmlFor="edit-subject-description">Description</Label>
            <textarea
              id="edit-subject-description"
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
              placeholder="Enter subject description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-subject-credits">Credit Hours</Label>
              <Input
                id="edit-subject-credits"
                type="number"
                value={subjectForm.credit_hours}
                onChange={(e) => setSubjectForm({...subjectForm, credit_hours: e.target.value})}
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <Label htmlFor="edit-subject-prerequisites">Prerequisites</Label>
              <Input
                id="edit-subject-prerequisites"
                type="text"
                value={subjectForm.prerequisites}
                onChange={(e) => setSubjectForm({...subjectForm, prerequisites: e.target.value})}
                placeholder="e.g., None or CS100"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-subject-outcomes">Learning Outcomes</Label>
            <textarea
              id="edit-subject-outcomes"
              value={subjectForm.learning_outcomes}
              onChange={(e) => setSubjectForm({...subjectForm, learning_outcomes: e.target.value})}
              placeholder="Enter learning outcomes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
          <div>
            <Label htmlFor="edit-subject-assessment">Assessment Methods</Label>
            <textarea
              id="edit-subject-assessment"
              value={subjectForm.assessment_methods}
              onChange={(e) => setSubjectForm({...subjectForm, assessment_methods: e.target.value})}
              placeholder="Enter assessment methods"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          {/* Content Type Selection */}
          <div>
            <Label>Content Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="edit_content_type"
                  value="file"
                  checked={subjectForm.content_type === 'file'}
                  onChange={(e) => setSubjectForm({...subjectForm, content_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Upload File (PDF)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="edit_content_type"
                  value="link"
                  checked={subjectForm.content_type === 'link'}
                  onChange={(e) => setSubjectForm({...subjectForm, content_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>External Link</span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          {subjectForm.content_type === 'file' && (
            <div>
              <Label htmlFor="editSubjectFile">Upload New Curriculum File</Label>
              <input
                id="editSubjectFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSubjectForm({...subjectForm, file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX (Max: 10MB)</p>
              {subjectForm.file && (
                <p className="text-sm text-green-600 mt-1">New file selected: {subjectForm.file.name}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">Leave empty to keep existing file</p>
            </div>
          )}

          {/* Link URL */}
          {subjectForm.content_type === 'link' && (
            <div>
              <Label htmlFor="editSubjectLink">External Link URL</Label>
              <Input
                id="editSubjectLink"
                type="url"
                value={subjectForm.link_url}
                onChange={(e) => setSubjectForm({...subjectForm, link_url: e.target.value})}
                placeholder="https://example.com/curriculum-document"
              />
              <p className="text-sm text-gray-500 mt-1">Enter the direct URL to the curriculum document</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditSubjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject}>
              Update Subject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Important Links Section */}
      {activeTab === 'important-links' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Important Links Categories */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link className="w-5 h-5" />
                    <CardTitle>Link Categories</CardTitle>
                  </div>
                  <Button onClick={() => setIsAddLinksCategoryOpen(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importantLinksCategories.map((category) => {
                    const IconComponent = iconOptions.find(opt => opt.value === category.icon)?.icon || Link;
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 bg-${category.color}-100 text-${category.color}-600 rounded-lg`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-gray-500">{category.links_count || 0} links</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLinksCategoryForm(category);
                              setIsAddLinksCategoryOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {importantLinksCategories.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No categories yet. Add one to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Links List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-5 h-5" />
                    <CardTitle>Links</CardTitle>
                  </div>
                  <Button onClick={() => setIsAddLinkOpen(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importantLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-${link.category_color || 'blue'}-100 text-${link.category_color || 'blue'}-600 rounded-lg`}>
                          {link.link_type === 'download' ? (
                            <Download className="w-4 h-4" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{link.title}</h4>
                          <p className="text-sm text-gray-500">
                            {link.category_name} • {link.link_type === 'download' ? 'Download' : 'Website'}
                            {link.click_count > 0 && ` • ${link.click_count} clicks`}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLinkForm(link);
                            setIsEditLinkOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {importantLinks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No links yet. Add one to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Links Category Modal */}
      <Modal isOpen={isAddLinksCategoryOpen} onClose={() => setIsAddLinksCategoryOpen(false)} title="Add Link Category">
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="links-category-name">Category Name</Label>
            <Input
              id="links-category-name"
              value={linksCategoryForm.name}
              onChange={(e) => setLinksCategoryForm({...linksCategoryForm, name: e.target.value})}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <Label htmlFor="links-category-description">Description</Label>
            <Textarea
              id="links-category-description"
              value={linksCategoryForm.description}
              onChange={(e) => setLinksCategoryForm({...linksCategoryForm, description: e.target.value})}
              placeholder="Enter category description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="links-category-icon">Icon</Label>
              <select
                id="links-category-icon"
                value={linksCategoryForm.icon}
                onChange={(e) => setLinksCategoryForm({...linksCategoryForm, icon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="links-category-color">Color</Label>
              <select
                id="links-category-color"
                value={linksCategoryForm.color}
                onChange={(e) => setLinksCategoryForm({...linksCategoryForm, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
                <option value="gray">Gray</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddLinksCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => console.log('Add category functionality to be implemented')}>
              Add Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Link Modal */}
      <Modal isOpen={isAddLinkOpen} onClose={() => setIsAddLinkOpen(false)} title="Add Important Link">
        <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="link-category">Category</Label>
              <select
                id="link-category"
                value={linkForm.category_id}
                onChange={(e) => setLinkForm({...linkForm, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {importantLinksCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                placeholder="Enter link title"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="link-description">Description</Label>
            <Textarea
              id="link-description"
              value={linkForm.description}
              onChange={(e) => setLinkForm({...linkForm, description: e.target.value})}
              placeholder="Enter link description"
            />
          </div>
          <div>
            <Label>Link Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="link_type"
                  value="website"
                  checked={linkForm.link_type === 'website'}
                  onChange={(e) => setLinkForm({...linkForm, link_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Website Link</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="link_type"
                  value="download"
                  checked={linkForm.link_type === 'download'}
                  onChange={(e) => setLinkForm({...linkForm, link_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Download File</span>
              </label>
            </div>
          </div>
          {linkForm.link_type === 'website' && (
            <div>
              <Label htmlFor="link-url">Website URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
          )}
          {linkForm.link_type === 'download' && (
            <div>
              <Label htmlFor="link-file">Upload File</Label>
              <input
                id="link-file"
                type="file"
                onChange={(e) => setLinkForm({...linkForm, file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Upload any file type for download</p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink}>
              Add Link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Link Modal */}
      <Modal isOpen={isEditLinkOpen} onClose={() => setIsEditLinkOpen(false)} title="Edit Important Link">
        <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-link-category">Category</Label>
              <select
                id="edit-link-category"
                value={linkForm.category_id}
                onChange={(e) => setLinkForm({...linkForm, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {importantLinksCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-link-title">Title</Label>
              <Input
                id="edit-link-title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                placeholder="Enter link title"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-link-description">Description</Label>
            <Textarea
              id="edit-link-description"
              value={linkForm.description}
              onChange={(e) => setLinkForm({...linkForm, description: e.target.value})}
              placeholder="Enter link description"
            />
          </div>
          <div>
            <Label>Link Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="edit_link_type"
                  value="website"
                  checked={linkForm.link_type === 'website'}
                  onChange={(e) => setLinkForm({...linkForm, link_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Website Link</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="edit_link_type"
                  value="download"
                  checked={linkForm.link_type === 'download'}
                  onChange={(e) => setLinkForm({...linkForm, link_type: e.target.value})}
                  className="text-blue-600"
                />
                <span>Download File</span>
              </label>
            </div>
          </div>
          {linkForm.link_type === 'website' && (
            <div>
              <Label htmlFor="edit-link-url">Website URL</Label>
              <Input
                id="edit-link-url"
                type="url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
          )}
          {linkForm.link_type === 'download' && (
            <div>
              <Label htmlFor="edit-link-file">Upload New File (optional)</Label>
              <input
                id="edit-link-file"
                type="file"
                onChange={(e) => setLinkForm({...linkForm, file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty to keep existing file</p>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-link-active"
              checked={linkForm.is_active}
              onChange={(e) => setLinkForm({...linkForm, is_active: e.target.checked})}
              className="text-blue-600"
            />
            <Label htmlFor="edit-link-active">Active</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLink}>
              Update Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ToolsManagement;