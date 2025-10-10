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

  // Super admins (role_name='admin') have all permissions
  // Note: All staff have role='admin', but role_name determines their type
  const userRoleName = user.role_name || user.role;
  const isTrueSuperAdmin = (
    userRoleName === 'admin' || 
    userRoleName === 'super_admin' || 
    userRoleName === 'Administrator'
  );
  
  if (isTrueSuperAdmin) {
    return true;
  }

  // For all other staff users, check permissions array
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

  // Super admins (role_name='admin') have access to all modules
  const userRoleName = user.role_name || user.role;
  const isTrueSuperAdmin = (
    userRoleName === 'admin' || 
    userRoleName === 'super_admin' || 
    userRoleName === 'Administrator'
  );
  
  if (isTrueSuperAdmin) {
    return true;
  }

  // For all other staff users, check modules array
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
    permissions: ['dashboard.view'],
    modules: ['dashboard']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'TrendingUp',
    permissions: ['analytics.view'],
    modules: ['analytics']
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'Users',
    permissions: ['users.view'],
    modules: ['users']
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'FileText',
    permissions: ['content.view'],
    modules: ['content']
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: 'Briefcase',
    permissions: ['jobs.view'],
    modules: ['jobs']
  },
  {
    id: 'scholarships',
    label: 'Scholarships',
    icon: 'GraduationCap',
    permissions: ['scholarships.view'],
    modules: ['scholarships']
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'Globe',
    permissions: ['content.view'],
    modules: ['content']
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'Folder',
    permissions: ['content.view'],
    modules: ['content']
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'User',
    permissions: ['team.view'],
    modules: ['team']
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: 'Megaphone',
    permissions: ['announcements.view'],
    modules: ['announcements']
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    icon: 'Mail',
    permissions: ['newsletter.view'],
    modules: ['newsletter']
  },
  {
    id: 'about',
    label: 'About',
    icon: 'FileText',
    permissions: ['content.view'],
    modules: ['content']
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: 'Database',
    permissions: ['organizations.view'],
    modules: ['organizations']
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'Settings',
    permissions: ['system.settings'],
    modules: ['system']
  },
  {
    id: 'routes',
    label: 'Routes',
    icon: 'Navigation',
    permissions: ['system.settings'],
    modules: ['system']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    permissions: ['system.settings'],
    modules: ['system']
  }
];

/**
 * Role-based access definitions
 */
export const rolePermissions = {
  'super-admin': '*', // All permissions
  'admin': '*', // All permissions
  'content-manager': [
    'dashboard.view',
    'content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete',
    'scholarships.view', 'scholarships.create', 'scholarships.edit', 'scholarships.delete',
    'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete'
  ],
  'hr-manager': [
    'dashboard.view',
    'users.view', 'users.create', 'users.edit',
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.manage_applications',
    'team.view', 'team.create', 'team.edit', 'team.delete'
  ],
  'editor': [
    'dashboard.view',
    'content.view', 'content.create', 'content.edit'
  ],
  'user': [
    'dashboard.view'
  ],
  'viewer': [
    'dashboard.view',
    'content.view', 'jobs.view', 'scholarships.view', 'team.view', 'announcements.view'
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
  // Use dot notation: resource.action (e.g., content.view, users.edit)
  const permission = `${resource}.${action}`;
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