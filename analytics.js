/**
 * Sabiteck Analytics - Client-side tracking script
 *
 * Usage: Include this script in your website's <head> section:
 * <script src="/analytics.js"></script>
 *
 * Or initialize manually:
 * SabiteckAnalytics.init({
 *   apiUrl: 'https://your-api-url.com/api',
 *   trackPageViews: true,
 *   trackEvents: true,
 *   gdprCompliant: true
 * });
 */

(function(window, document) {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        apiUrl: window.location.origin + '/api',
        trackPageViews: true,
        trackEvents: true,
        trackOutboundLinks: true,
        trackDownloads: true,
        trackScrollDepth: true,
        gdprCompliant: true,
        cookieDomain: null,
        sessionTimeout: 30, // minutes
        heartbeatInterval: 15, // seconds
        debug: false
    };

    class SabiteckAnalytics {
        constructor(config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.visitorId = null;
            this.sessionId = null;
            this.pageStartTime = Date.now();
            this.lastActivity = Date.now();
            this.scrollDepth = 0;
            this.maxScrollDepth = 0;
            this.heartbeatTimer = null;
            this.isTracking = true;

            this.init();
        }

        /**
         * Initialize the analytics system
         */
        init() {
            this.log('Initializing Sabiteck Analytics...');

            // Check for GDPR compliance
            if (this.config.gdprCompliant && !this.hasConsent()) {
                this.log('GDPR consent not given, analytics disabled');
                this.isTracking = false;
                return;
            }

            // Generate or retrieve visitor ID
            this.visitorId = this.getOrCreateVisitorId();
            this.sessionId = this.getOrCreateSessionId();

            this.log(`Visitor ID: ${this.visitorId}, Session ID: ${this.sessionId}`);

            // Set up tracking
            this.setupEventListeners();

            if (this.config.trackPageViews) {
                this.trackPageView();
            }

            // Start heartbeat
            this.startHeartbeat();
        }

        /**
         * Check if user has given consent for tracking
         */
        hasConsent() {
            const consent = localStorage.getItem('sabiteck_analytics_consent');
            return consent === 'true';
        }

        /**
         * Enable analytics tracking (for GDPR compliance)
         */
        enableTracking() {
            localStorage.setItem('sabiteck_analytics_consent', 'true');
            this.isTracking = true;
            this.init();
        }

        /**
         * Disable analytics tracking
         */
        disableTracking() {
            localStorage.setItem('sabiteck_analytics_consent', 'false');
            this.isTracking = false;
            this.clearData();
        }

        /**
         * Generate or retrieve visitor ID
         */
        getOrCreateVisitorId() {
            let visitorId = localStorage.getItem('sabiteck_visitor_id');
            if (!visitorId) {
                visitorId = this.generateId();
                localStorage.setItem('sabiteck_visitor_id', visitorId);
            }
            return visitorId;
        }

        /**
         * Generate or retrieve session ID
         */
        getOrCreateSessionId() {
            const sessionKey = 'sabiteck_session_id';
            const sessionTimeKey = 'sabiteck_session_time';

            let sessionId = sessionStorage.getItem(sessionKey);
            const sessionTime = sessionStorage.getItem(sessionTimeKey);

            // Check if session has expired
            if (!sessionId || !sessionTime ||
                (Date.now() - parseInt(sessionTime)) > (this.config.sessionTimeout * 60 * 1000)) {
                sessionId = this.generateId();
                sessionStorage.setItem(sessionKey, sessionId);
            }

            sessionStorage.setItem(sessionTimeKey, Date.now().toString());
            return sessionId;
        }

        /**
         * Generate a unique ID
         */
        generateId() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        /**
         * Set up event listeners
         */
        setupEventListeners() {
            // Track scroll depth
            if (this.config.trackScrollDepth) {
                window.addEventListener('scroll', this.throttle(() => {
                    this.trackScrollDepth();
                }, 250));
            }

            // Track outbound links
            if (this.config.trackOutboundLinks) {
                document.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A' && this.isOutboundLink(e.target.href)) {
                        this.trackEvent('outbound_link', 'click', e.target.href);
                    }
                });
            }

            // Track downloads
            if (this.config.trackDownloads) {
                document.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A' && this.isDownloadLink(e.target.href)) {
                        this.trackEvent('download', 'click', e.target.href);
                    }
                });
            }

            // Track user activity
            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, () => {
                    this.lastActivity = Date.now();
                });
            });

            // Track page unload
            window.addEventListener('beforeunload', () => {
                this.trackPageUnload();
            });
        }

        /**
         * Track page view
         */
        trackPageView() {
            if (!this.isTracking) return;

            const locationInfo = this.getLocationInfo();

            const data = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                page_url: window.location.pathname + window.location.search,
                page_title: document.title,
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                country: locationInfo.country,
                city: locationInfo.city,
                timezone: locationInfo.timezone,
                timestamp: new Date().toISOString()
            };

            this.sendData('analytics/track', data);
            this.log('Page view tracked', data);
        }

        /**
         * Get location information with privacy considerations
         */
        getLocationInfo() {
            // Check for cached location data first
            const cachedLocation = this.getCookie('analytics_location');
            if (cachedLocation) {
                try {
                    return JSON.parse(cachedLocation);
                } catch (e) {
                    this.log('Failed to parse cached location data');
                }
            }

            // Default location data
            const defaultLocation = {
                country: null,
                countryCode: null,
                region: null,
                city: null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // Fetch location data asynchronously (with CSP-safe error handling)
            this.fetchLocationData().then(locationData => {
                if (locationData) {
                    // Cache location for 24 hours
                    this.setCookie('analytics_location', JSON.stringify(locationData), 1);
                }
            }).catch(error => {
                this.log('Location fetching disabled or failed (CSP/privacy)', error.message);
            });

            return defaultLocation;
        }

        /**
         * Fetch location data from IP geolocation service (CSP-safe)
         */
        async fetchLocationData() {
            try {
                // Use ipapi.co service (now allowed in CSP)
                const response = await fetch('https://ipapi.co/json/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return {
                        country: data.country_name,
                        countryCode: data.country,
                        region: data.region,
                        city: data.city,
                        timezone: data.timezone
                    };
                } else {
                    this.log('Location service returned error status:', response.status);
                    return null;
                }
            } catch (error) {
                // This will catch CSP violations and other fetch errors
                this.log('Location service unavailable (CSP or network):', error.message);
                return null;
            }
        }

        /**
         * Set a cookie with expiration
         */
        setCookie(name, value, days) {
            try {
                const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
                document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
            } catch (error) {
                this.log('Cookie setting failed:', error.message);
            }
        }

        /**
         * Get a cookie value
         */
        getCookie(name) {
            try {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
            } catch (error) {
                this.log('Cookie reading failed:', error.message);
            }
            return null;
        }

        /**
         * Track custom event
         */
        trackEvent(category, action, label = null, value = null) {
            if (!this.isTracking) return;

            const data = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                event_category: category,
                event_action: action,
                event_label: label,
                event_value: value,
                page_url: window.location.pathname + window.location.search,
                timestamp: new Date().toISOString()
            };

            this.sendData('analytics/track-event', data);
            this.log('Event tracked', data);
        }

        /**
         * Track scroll depth
         */
        trackScrollDepth() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

            if (scrollPercent > this.maxScrollDepth && scrollPercent % 25 === 0) {
                this.maxScrollDepth = scrollPercent;
                this.trackEvent('scroll_depth', 'milestone', `${scrollPercent}%`, scrollPercent);
            }
        }

        /**
         * Track page unload (time on page)
         */
        trackPageUnload() {
            if (!this.isTracking) return;

            const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);
            this.trackEvent('engagement', 'time_on_page', window.location.pathname, timeOnPage);
        }

        /**
         * Start heartbeat to track active sessions
         */
        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (this.isTracking && (Date.now() - this.lastActivity) < 30000) { // 30 seconds
                    this.sendData('analytics/heartbeat', {
                        visitor_id: this.visitorId,
                        session_id: this.sessionId,
                        timestamp: new Date().toISOString()
                    });
                }
            }, this.config.heartbeatInterval * 1000);
        }

        /**
         * Send data to analytics endpoint
         */
        async sendData(endpoint, data) {
            try {
                const response = await fetch(`${this.config.apiUrl}/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                this.log('Data sent successfully', { endpoint, data });
            } catch (error) {
                this.log('Error sending data', error);
            }
        }

        /**
         * Check if link is outbound
         */
        isOutboundLink(url) {
            try {
                const link = new URL(url);
                return link.hostname !== window.location.hostname;
            } catch {
                return false;
            }
        }

        /**
         * Check if link is a download
         */
        isDownloadLink(url) {
            const downloadExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'exe', 'dmg'];
            const extension = url.split('.').pop()?.toLowerCase();
            return downloadExtensions.includes(extension);
        }

        /**
         * Throttle function calls
         */
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        /**
         * Clear all stored data
         */
        clearData() {
            localStorage.removeItem('sabiteck_visitor_id');
            sessionStorage.removeItem('sabiteck_session_id');
            sessionStorage.removeItem('sabiteck_session_time');
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
            }
        }

        /**
         * Debug logging
         */
        log(...args) {
            if (this.config.debug) {
                console.log('[Sabiteck Analytics]', ...args);
            }
        }
    }

    // Create global instance
    window.SabiteckAnalytics = {
        instance: null,

        init(config = {}) {
            if (!this.instance) {
                this.instance = new SabiteckAnalytics(config);
            }
            return this.instance;
        },

        track(category, action, label, value) {
            if (this.instance) {
                this.instance.trackEvent(category, action, label, value);
            }
        },

        enableTracking() {
            if (this.instance) {
                this.instance.enableTracking();
            }
        },

        disableTracking() {
            if (this.instance) {
                this.instance.disableTracking();
            }
        }
    };

    // Auto-initialize if script is loaded directly
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SabiteckAnalytics.init();
        });
    } else {
        window.SabiteckAnalytics.init();
    }

})(window, document);