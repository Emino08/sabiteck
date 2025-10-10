/**
 * Route to Permission Mapping
 * Maps admin panel routes to required permissions
 */

export const ROUTE_PERMISSIONS = {
    // Dashboard - all authenticated admin users
    dashboard: ['dashboard.view'],
    overview: ['dashboard.view'],

    // Content Management
    content: ['content.view', 'content.create', 'content.edit'],
    services: ['services.view', 'services.create', 'services.edit'],
    portfolio: ['portfolio.view', 'portfolio.create', 'portfolio.edit'],
    about: ['about.view', 'about.edit'],
    team: ['team.view', 'team.create', 'team.edit'],
    announcements: ['announcements.view', 'announcements.create', 'announcements.edit'],

    // Program Management
    jobs: ['jobs.view', 'jobs.create', 'jobs.edit'],
    scholarships: ['scholarships.view', 'scholarships.create', 'scholarships.edit'],
    organizations: ['organizations.view', 'organizations.create', 'organizations.edit'],

    // Marketing Tools
    analytics: ['analytics.view'],
    newsletter: ['newsletter.view', 'newsletter.create'],
    'tools-curriculum': ['tools.view', 'curriculum.view'],

    // System Settings
    'user-roles': ['users.view', 'roles.manage'],
    navigation: ['routes.manage'],
    settings: ['settings.view', 'settings.edit'],
};

/**
 * Navigation structure for admin panel
 * Organized by sections
 */
export const ADMIN_NAVIGATION = [
    {
        section: 'Dashboard',
        routes: [
            {
                name: 'Overview',
                path: '/admin',
                key: 'dashboard',
                icon: 'LayoutDashboard'
            },
        ],
    },
    {
        section: 'Content Management',
        routes: [
            {
                name: 'Content',
                path: '/admin/content',
                key: 'content',
                icon: 'FileText'
            },
            {
                name: 'Services',
                path: '/admin/services',
                key: 'services',
                icon: 'Briefcase'
            },
            {
                name: 'Portfolio',
                path: '/admin/portfolio',
                key: 'portfolio',
                icon: 'Folder'
            },
            {
                name: 'About',
                path: '/admin/about',
                key: 'about',
                icon: 'Info'
            },
            {
                name: 'Team',
                path: '/admin/team',
                key: 'team',
                icon: 'Users'
            },
            {
                name: 'Announcements',
                path: '/admin/announcements',
                key: 'announcements',
                icon: 'Megaphone'
            },
        ],
    },
    {
        section: 'Program Management',
        routes: [
            {
                name: 'Jobs',
                path: '/admin/jobs',
                key: 'jobs',
                icon: 'Briefcase'
            },
            {
                name: 'Scholarships',
                path: '/admin/scholarships',
                key: 'scholarships',
                icon: 'GraduationCap'
            },
            {
                name: 'Organizations',
                path: '/admin/organizations',
                key: 'organizations',
                icon: 'Building'
            },
        ],
    },
    {
        section: 'Marketing Tools',
        routes: [
            {
                name: 'Analytics',
                path: '/admin/analytics',
                key: 'analytics',
                icon: 'BarChart'
            },
            {
                name: 'Newsletter',
                path: '/admin/newsletter',
                key: 'newsletter',
                icon: 'Mail'
            },
            {
                name: 'Tools & Curriculum',
                path: '/admin/tools-curriculum',
                key: 'tools-curriculum',
                icon: 'Wrench'
            },
        ],
    },
    {
        section: 'System Settings',
        routes: [
            {
                name: 'User Roles',
                path: '/admin/user-roles',
                key: 'user-roles',
                icon: 'Shield'
            },
            {
                name: 'Navigation',
                path: '/admin/navigation',
                key: 'navigation',
                icon: 'Navigation'
            },
            {
                name: 'Settings',
                path: '/admin/settings',
                key: 'settings',
                icon: 'Settings'
            },
        ],
    },
];

/**
 * Check if user has permission to access a route
 * @param {Array} userPermissions - Array of permission strings
 * @param {string} routeKey - The route key to check
 * @returns {boolean} - True if user has at least one required permission
 */
export function canAccessRoute(userPermissions, routeKey) {
    const requiredPermissions = ROUTE_PERMISSIONS[routeKey];

    // If no permissions required, deny access (shouldn't happen)
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return false;
    }

    // User needs at least ONE of the required permissions
    return requiredPermissions.some(permission =>
        userPermissions.includes(permission)
    );
}

/**
 * Get filtered navigation based on user permissions
 * @param {Array} userPermissions - Array of permission strings
 * @returns {Array} - Filtered navigation structure
 */
export function getFilteredNavigation(userPermissions) {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return [];
    }

    const filteredNavigation = [];

    for (const section of ADMIN_NAVIGATION) {
        const accessibleRoutes = section.routes.filter(route =>
            canAccessRoute(userPermissions, route.key)
        );

        // Only include section if it has accessible routes
        if (accessibleRoutes.length > 0) {
            filteredNavigation.push({
                ...section,
                routes: accessibleRoutes,
            });
        }
    }

    return filteredNavigation;
}

/**
 * Get all accessible route paths for a user
 * @param {Array} userPermissions - Array of permission strings
 * @returns {Array} - Array of accessible route paths
 */
export function getAccessibleRoutes(userPermissions) {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return [];
    }

    const accessibleRoutes = [];

    for (const section of ADMIN_NAVIGATION) {
        for (const route of section.routes) {
            if (canAccessRoute(userPermissions, route.key)) {
                accessibleRoutes.push(route.path);
            }
        }
    }

    return accessibleRoutes;
}

/**
 * Check if a user can access a specific path
 * @param {Array} userPermissions - Array of permission strings
 * @param {string} path - The path to check
 * @returns {boolean} - True if user can access the path
 */
export function canAccessPath(userPermissions, path) {
    const accessibleRoutes = getAccessibleRoutes(userPermissions);
    return accessibleRoutes.includes(path);
}
