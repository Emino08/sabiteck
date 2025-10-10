<?php

namespace App\Config;

/**
 * Route to Permission Mapping
 * Maps frontend routes to required permissions
 */
class RoutePermissions
{
    /**
     * Map of route names/paths to required permissions
     * A user needs at least ONE of the permissions in the array to access the route
     */
    public static function getRoutePermissionMap(): array
    {
        return [
            // Dashboard - all authenticated users
            'dashboard' => ['dashboard.view'],
            'overview' => ['dashboard.view'],

            // Content Management
            'content' => ['content.view', 'content.create', 'content.edit'],
            'services' => ['services.view', 'services.create', 'services.edit'],
            'portfolio' => ['portfolio.view', 'portfolio.create', 'portfolio.edit'],
            'about' => ['about.view', 'about.edit'],
            'team' => ['team.view', 'team.create', 'team.edit'],
            'announcements' => ['announcements.view', 'announcements.create', 'announcements.edit'],

            // Program Management
            'jobs' => ['jobs.view', 'jobs.create', 'jobs.edit'],
            'scholarships' => ['scholarships.view', 'scholarships.create', 'scholarships.edit'],
            'organizations' => ['organizations.view', 'organizations.create', 'organizations.edit'],

            // Marketing Tools
            'analytics' => ['analytics.view'],
            'newsletter' => ['newsletter.view', 'newsletter.create'],
            'tools-curriculum' => ['tools.view', 'curriculum.view'],

            // System Settings
            'user-roles' => ['users.view', 'roles.manage'],
            'navigation' => ['routes.manage'],
            'settings' => ['settings.view', 'settings.edit'],
        ];
    }

    /**
     * Get permissions required for a specific route
     */
    public static function getPermissionsForRoute(string $route): array
    {
        $map = self::getRoutePermissionMap();
        return $map[$route] ?? [];
    }

    /**
     * Check if user has permission to access a route
     */
    public static function canAccessRoute(array $userPermissions, string $route): bool
    {
        $requiredPermissions = self::getPermissionsForRoute($route);

        // If no permissions required, allow access (shouldn't happen in practice)
        if (empty($requiredPermissions)) {
            return true;
        }

        // User needs at least ONE of the required permissions
        foreach ($requiredPermissions as $permission) {
            if (in_array($permission, $userPermissions)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all routes a user can access based on their permissions
     */
    public static function getAccessibleRoutes(array $userPermissions): array
    {
        $accessibleRoutes = [];
        $map = self::getRoutePermissionMap();

        foreach ($map as $route => $requiredPermissions) {
            if (self::canAccessRoute($userPermissions, $route)) {
                $accessibleRoutes[] = $route;
            }
        }

        return $accessibleRoutes;
    }

    /**
     * Get navigation structure based on permissions
     * This returns a structured navigation that the frontend can use
     */
    public static function getNavigationForPermissions(array $userPermissions): array
    {
        $navigation = [
            [
                'section' => 'Dashboard',
                'routes' => [
                    ['name' => 'Overview', 'path' => '/admin', 'key' => 'dashboard'],
                ],
            ],
            [
                'section' => 'Content Management',
                'routes' => [
                    ['name' => 'Content', 'path' => '/admin/content', 'key' => 'content'],
                    ['name' => 'Services', 'path' => '/admin/services', 'key' => 'services'],
                    ['name' => 'Portfolio', 'path' => '/admin/portfolio', 'key' => 'portfolio'],
                    ['name' => 'About', 'path' => '/admin/about', 'key' => 'about'],
                    ['name' => 'Team', 'path' => '/admin/team', 'key' => 'team'],
                    ['name' => 'Announcements', 'path' => '/admin/announcements', 'key' => 'announcements'],
                ],
            ],
            [
                'section' => 'Program Management',
                'routes' => [
                    ['name' => 'Jobs', 'path' => '/admin/jobs', 'key' => 'jobs'],
                    ['name' => 'Scholarships', 'path' => '/admin/scholarships', 'key' => 'scholarships'],
                    ['name' => 'Organizations', 'path' => '/admin/organizations', 'key' => 'organizations'],
                ],
            ],
            [
                'section' => 'Marketing Tools',
                'routes' => [
                    ['name' => 'Analytics', 'path' => '/admin/analytics', 'key' => 'analytics'],
                    ['name' => 'Newsletter', 'path' => '/admin/newsletter', 'key' => 'newsletter'],
                    ['name' => 'Tools & Curriculum', 'path' => '/admin/tools-curriculum', 'key' => 'tools-curriculum'],
                ],
            ],
            [
                'section' => 'System Settings',
                'routes' => [
                    ['name' => 'User Roles', 'path' => '/admin/user-roles', 'key' => 'user-roles'],
                    ['name' => 'Navigation', 'path' => '/admin/navigation', 'key' => 'navigation'],
                    ['name' => 'Settings', 'path' => '/admin/settings', 'key' => 'settings'],
                ],
            ],
        ];

        // Filter navigation based on permissions
        $filteredNavigation = [];
        foreach ($navigation as $section) {
            $filteredRoutes = array_filter($section['routes'], function($route) use ($userPermissions) {
                return self::canAccessRoute($userPermissions, $route['key']);
            });

            // Only include section if it has accessible routes
            if (!empty($filteredRoutes)) {
                $filteredNavigation[] = [
                    'section' => $section['section'],
                    'routes' => array_values($filteredRoutes), // Re-index array
                ];
            }
        }

        return $filteredNavigation;
    }
}
