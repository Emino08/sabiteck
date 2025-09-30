/**
 * Permission utilities for frontend access control
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with permissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  // Super admin and admin have all permissions
  if (user.role === 'super-admin' || user.role === 'admin' || user.role_name === 'super-admin' || user.role_name === 'admin') {
    return true;
  }

  // Check in permissions array
  if (user.permissions) {
    return user.permissions.some(p =>
      p === permission ||
      (typeof p === 'object' && (p.name === permission || p.display_name === permission))
    );
  }

  return false;
};

/**
 * Check if user has any of the given permissions
 * @param {Object} user - User object with permissions
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user || !permissions || !Array.isArray(permissions)) return false;

  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all given permissions
 * @param {Object} user - User object with permissions
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user || !permissions || !Array.isArray(permissions)) return false;

  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has access to a specific module
 * @param {Object} user - User object with modules
 * @param {string} module - Module to check
 * @returns {boolean}
 */
export const hasModuleAccess = (user, module) => {
  if (!user || !module) return false;

  // Super admin and admin have access to all modules
  if (user.role === 'super-admin' || user.role === 'admin' || user.role_name === 'super-admin' || user.role_name === 'admin') {
    return true;
  }

  // Check in modules array
  if (user.modules) {
    return user.modules.includes(module);
  }

  return false;
};

/**
 * Get filtered navigation items based on user permissions
 * @param {Object} user - User object with permissions
 * @param {Array} navigationItems - Array of navigation items
 * @returns {Array} Filtered navigation items
 */
export const getFilteredNavigation = (user, navigationItems) => {
  if (!user || !navigationItems) return [];

  return navigationItems.filter(item => {
    // If no permissions required, show the item
    if (!item.permissions && !item.modules) return true;

    // Check permissions
    if (item.permissions) {
      if (!hasAnyPermission(user, item.permissions)) return false;
    }

    // Check modules
    if (item.modules) {
      if (!item.modules.some(module => hasModuleAccess(user, module))) return false;
    }

    return true;
  });
};

/**
 * Admin tab configurations with permission requirements
 */
export const adminTabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'BarChart3',
    permissions: ['view-dashboard'],
    modules: ['dashboard']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'TrendingUp',
    permissions: ['view-analytics'],
    modules: ['dashboard']
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'Users',
    permissions: ['view-users'],
    modules: ['users']
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'FileText',
    permissions: ['view-content'],
    modules: ['content']
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: 'Briefcase',
    permissions: ['view-jobs'],
    modules: ['jobs']
  },
  {
    id: 'scholarships',
    label: 'Scholarships',
    icon: 'GraduationCap',
    permissions: ['view-scholarships'],
    modules: ['scholarships']
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'Globe',
    permissions: ['view-services'],
    modules: ['services']
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'Folder',
    permissions: ['view-portfolio'],
    modules: ['portfolio']
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'User',
    permissions: ['view-team'],
    modules: ['team']
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: 'Megaphone',
    permissions: ['view-announcements'],
    modules: ['announcements']
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: 'Mail',
    permissions: ['view-newsletter'],
    modules: ['newsletter']
  },
  {
    id: 'about',
    label: 'About',
    icon: 'FileText',
    permissions: ['view-content'],
    modules: ['content']
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: 'Database',
    permissions: ['view-organizations'],
    modules: ['organizations']
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'Settings',
    permissions: ['view-tools'],
    modules: ['tools']
  },
  {
    id: 'routes',
    label: 'Routes',
    icon: 'Navigation',
    permissions: ['edit-settings'],
    modules: ['settings']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    permissions: ['view-settings'],
    modules: ['settings']
  }
];

/**
 * Role-based access definitions
 */
export const rolePermissions = {
  'super-admin': '*', // All permissions
  'admin': '*', // All permissions
  'content-manager': [
    'view-dashboard',
    'view-content', 'create-content', 'edit-content', 'delete-content', 'publish-content',
    'view-jobs', 'create-jobs', 'edit-jobs', 'delete-jobs',
    'view-scholarships', 'create-scholarships', 'edit-scholarships', 'delete-scholarships',
    'view-announcements', 'create-announcements', 'edit-announcements', 'delete-announcements'
  ],
  'hr-manager': [
    'view-dashboard',
    'view-users', 'create-users', 'edit-users',
    'view-jobs', 'create-jobs', 'edit-jobs', 'delete-jobs', 'manage-job-applications',
    'view-team', 'create-team', 'edit-team', 'delete-team'
  ],
  'editor': [
    'view-dashboard',
    'view-content', 'create-content', 'edit-content',
    'view-portfolio', 'create-portfolio', 'edit-portfolio'
  ],
  'user': [
    'view-dashboard'
  ],
  'viewer': [
    'view-dashboard',
    'view-content', 'view-jobs', 'view-scholarships', 'view-portfolio', 'view-team', 'view-announcements'
  ]
};

/**
 * Check if user can perform action based on permission
 * @param {Object} user - User object
 * @param {string} action - Action to check (create, edit, delete, view)
 * @param {string} resource - Resource type (users, content, jobs, etc.)
 * @returns {boolean}
 */
export const canPerformAction = (user, action, resource) => {
  const permission = `${action}-${resource}`;
  return hasPermission(user, permission);
};

/**
 * Get user's accessible tabs
 * @param {Object} user - User object with permissions
 * @returns {Array} Array of accessible tabs
 */
export const getAccessibleTabs = (user) => {
  return getFilteredNavigation(user, adminTabs);
};

/**
 * Permission component wrapper
 * @param {Object} props - Component props
 * @param {Object} props.user - User object
 * @param {string|Array} props.permission - Required permission(s)
 * @param {string|Array} props.module - Required module(s)
 * @param {React.Component} props.children - Child components
 * @param {React.Component} props.fallback - Fallback component
 * @returns {React.Component}
 */
export const PermissionWrapper = ({ user, permission, module, children, fallback = null }) => {
  let hasAccess = true;

  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    hasAccess = hasAnyPermission(user, permissions);
  }

  if (hasAccess && module) {
    const modules = Array.isArray(module) ? module : [module];
    hasAccess = modules.some(mod => hasModuleAccess(user, mod));
  }

  return hasAccess ? children : fallback;
};