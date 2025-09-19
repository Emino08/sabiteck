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
            if (!this.checkGDPRConsent()) {
                this.log('GDPR consent not given, analytics disabled');
                this.isTracking = false;
                return;
            }

            this.loadIdentifiers();
            this.setupEventListeners();

            if (this.config.trackPageViews) {
                this.trackPageView();
            }

            this.startHeartbeat();
            this.log('Analytics initialized', this.config);
        }

        /**
         * Check GDPR consent
         */
        checkGDPRConsent() {
            if (!this.config.gdprCompliant) {
                return true;
            }

            // Check for various consent cookie names
            const consentCookies = [
                'analytics_consent',
                'cookie_consent',
                'gdpr_consent',
                'cookieConsent'
            ];

            for (const cookieName of consentCookies) {
                const consent = this.getCookie(cookieName);
                if (consent === 'true' || consent === '1' || consent === 'accepted') {
                    return true;
                }
            }

            // If no consent cookie found, assume consent for non-GDPR mode
            return !this.config.gdprCompliant;
        }

        /**
         * Load visitor and session identifiers
         */
        loadIdentifiers() {
            this.visitorId = this.getCookie('analytics_visitor_id') || this.generateVisitorId();
            this.sessionId = this.getCookie('analytics_session_id') || this.generateSessionId();

            // Set cookies
            this.setCookie('analytics_visitor_id', this.visitorId, 365);
            this.setCookie('analytics_session_id', this.sessionId, 0.021); // 30 minutes
        }

        /**
         * Generate unique visitor ID
         */
        generateVisitorId() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Analytics fingerprint', 2, 2);

            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL()
            ].join('|');

            return this.sha1(fingerprint);
        }

        /**
         * Generate session ID
         */
        generateSessionId() {
            return this.sha1(this.visitorId + Date.now() + Math.random());
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Track page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.trackPageExit();
                } else {
                    this.updateLastActivity();
                }
            });

            // Track scroll depth
            if (this.config.trackScrollDepth) {
                let ticking = false;
                const updateScrollDepth = () => {
                    this.updateScrollDepth();
                    ticking = false;
                };

                window.addEventListener('scroll', () => {
                    if (!ticking) {
                        requestAnimationFrame(updateScrollDepth);
                        ticking = true;
                    }
                });
            }

            // Track outbound links
            if (this.config.trackOutboundLinks) {
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && this.isOutboundLink(link.href)) {
                        this.trackEvent('outbound', 'click', link.href, null, link);
                    }
                });
            }

            // Track downloads
            if (this.config.trackDownloads) {
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && this.isDownloadLink(link.href)) {
                        const filename = this.getFilename(link.href);
                        this.trackEvent('download', 'click', filename, null, link);
                    }
                });
            }

            // Track form submissions
            document.addEventListener('submit', (e) => {
                if (e.target.tagName === 'FORM') {
                    const formName = e.target.name || e.target.id || 'unnamed';
                    this.trackEvent('form', 'submit', formName, null, e.target);
                }
            });

            // Update activity on user interactions
            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
            });

            // Track page exit
            window.addEventListener('beforeunload', () => {
                this.trackPageExit();
            });
        }

        /**
         * Track a page view
         */
        trackPageView() {
            if (!this.isTracking) return;

            const data = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                page_url: window.location.href,
                page_title: document.title,
                page_path: window.location.pathname,
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                language: navigator.language,
                screen_resolution: screen.width + 'x' + screen.height,
                viewport_size: window.innerWidth + 'x' + window.innerHeight,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                is_entry_page: this.isEntryPage(),
                ...this.getUTMParameters()
            };

            this.sendData('/analytics/track', data);
            this.log('Page view tracked', data);
        }

        /**
         * Track an event
         */
        trackEvent(category, action, label = null, value = null, element = null) {
            if (!this.isTracking) return;

            const data = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                event_category: category,
                event_action: action,
                event_label: label,
                event_value: value,
                page_url: window.location.href,
                page_title: document.title,
                element_selector: element ? this.getElementSelector(element) : null
            };

            this.sendData('/analytics/track-event', data);
            this.log('Event tracked', data);
        }

        /**
         * Track page exit with time spent and scroll depth
         */
        trackPageExit() {
            if (!this.isTracking) return;

            const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);

            const data = {
                visitor_id: this.visitorId,
                session_id: this.sessionId,
                page_url: window.location.href,
                page_path: window.location.pathname,
                time_on_page: timeOnPage,
                scroll_depth: this.maxScrollDepth,
                is_exit_page: true
            };

            // Use sendBeacon for reliable delivery on page exit
            if (navigator.sendBeacon) {
                const url = this.config.apiUrl + '/analytics/track';
                navigator.sendBeacon(url, JSON.stringify(data));
            } else {
                this.sendData('/analytics/track', data, false);
            }

            this.log('Page exit tracked', data);
        }

        /**
         * Update scroll depth
         */
        updateScrollDepth() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const windowHeight = window.innerHeight;

            const scrollPercent = Math.min(
                Math.round(((scrollTop + windowHeight) / docHeight) * 100),
                100
            );

            if (scrollPercent > this.maxScrollDepth) {
                this.maxScrollDepth = scrollPercent;
            }
        }

        /**
         * Check if this is an entry page
         */
        isEntryPage() {
            return !document.referrer ||
                   !document.referrer.includes(window.location.hostname);
        }

        /**
         * Get UTM parameters from URL
         */
        getUTMParameters() {
            const params = new URLSearchParams(window.location.search);
            return {
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                utm_term: params.get('utm_term'),
                utm_content: params.get('utm_content')
            };
        }

        /**
         * Check if URL is an outbound link
         */
        isOutboundLink(url) {
            try {
                const link = new URL(url, window.location.href);
                return link.hostname !== window.location.hostname;
            } catch (e) {
                return false;
            }
        }

        /**
         * Check if URL is a download link
         */
        isDownloadLink(url) {
            const downloadExtensions = [
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                'zip', 'rar', '7z', 'tar', 'gz',
                'mp3', 'mp4', 'avi', 'mov', 'wmv',
                'jpg', 'jpeg', 'png', 'gif', 'svg',
                'exe', 'dmg', 'deb', 'rpm'
            ];

            try {
                const link = new URL(url, window.location.href);
                const extension = link.pathname.split('.').pop().toLowerCase();
                return downloadExtensions.includes(extension);
            } catch (e) {
                return false;
            }
        }

        /**
         * Get filename from URL
         */
        getFilename(url) {
            try {
                const link = new URL(url, window.location.href);
                return link.pathname.split('/').pop();
            } catch (e) {
                return 'unknown';
            }
        }

        /**
         * Get CSS selector for element
         */
        getElementSelector(element) {
            if (!element) return null;

            if (element.id) {
                return '#' + element.id;
            }

            if (element.className) {
                return '.' + element.className.split(' ').join('.');
            }

            let selector = element.tagName.toLowerCase();
            if (element.parentNode && element.parentNode !== document) {
                const siblings = Array.from(element.parentNode.children);
                const index = siblings.indexOf(element);
                if (index > 0) {
                    selector += ':nth-child(' + (index + 1) + ')';
                }
            }

            return selector;
        }

        /**
         * Start heartbeat to keep session alive
         */
        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (Date.now() - this.lastActivity > this.config.sessionTimeout * 60 * 1000) {
                    this.endSession();
                }
            }, this.config.heartbeatInterval * 1000);
        }

        /**
         * End current session
         */
        endSession() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }

            this.trackPageExit();
            this.deleteCookie('analytics_session_id');
            this.sessionId = this.generateSessionId();
            this.setCookie('analytics_session_id', this.sessionId, 0.021);
        }

        /**
         * Update last activity timestamp
         */
        updateLastActivity() {
            this.lastActivity = Date.now();
        }

        /**
         * Send data to analytics API
         */
        sendData(endpoint, data, async = true) {
            const url = this.config.apiUrl + endpoint;

            if (navigator.sendBeacon && !async) {
                navigator.sendBeacon(url, JSON.stringify(data));
                return;
            }

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                keepalive: !async
            }).catch(error => {
                this.log('Failed to send analytics data:', error);
            });
        }

        /**
         * Set cookie
         */
        setCookie(name, value, days) {
            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }

            const domain = this.config.cookieDomain ? '; domain=' + this.config.cookieDomain : '';
            document.cookie = name + '=' + value + expires + '; path=/' + domain + '; SameSite=Lax';
        }

        /**
         * Get cookie value
         */
        getCookie(name) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        /**
         * Delete cookie
         */
        deleteCookie(name) {
            this.setCookie(name, '', -1);
        }

        /**
         * Simple SHA-1 implementation
         */
        sha1(str) {
            function rotateLeft(n, s) {
                return (n << s) | (n >>> (32 - s));
            }

            function toHexStr(n) {
                let s = '';
                for (let t = 7; t >= 0; t--) {
                    s += ((n >>> (t * 4)) & 0x0F).toString(16);
                }
                return s;
            }

            const utf8Encode = function(string) {
                string = string.replace(/\r\n/g, '\n');
                let utftext = '';
                for (let n = 0; n < string.length; n++) {
                    const c = string.charCodeAt(n);
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    } else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            };

            str = utf8Encode(str);
            const strLen = str.length;
            const wordArray = [];
            for (let i = 0; i < strLen - 3; i += 4) {
                wordArray.push(str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3));
            }

            let i = strLen % 4;
            if (i > 0) {
                let word = str.charCodeAt(strLen - i) << 24;
                if (i > 1) word |= str.charCodeAt(strLen - i + 1) << 16;
                if (i > 2) word |= str.charCodeAt(strLen - i + 2) << 8;
                wordArray.push(word);
            }

            while (wordArray.length % 16 !== 14) wordArray.push(0);
            wordArray.push(strLen >>> 29);
            wordArray.push((strLen << 3) & 0x0FFFFFFFF);

            let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;

            for (let blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
                const w = wordArray.slice(blockstart, blockstart + 16);
                for (let t = 16; t <= 79; t++) {
                    w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
                }

                let a = h0, b = h1, c = h2, d = h3, e = h4;

                for (let t = 0; t <= 79; t++) {
                    let f, k;
                    if (t <= 19) {
                        f = (b & c) | ((~b) & d);
                        k = 0x5A827999;
                    } else if (t <= 39) {
                        f = b ^ c ^ d;
                        k = 0x6ED9EBA1;
                    } else if (t <= 59) {
                        f = (b & c) | (b & d) | (c & d);
                        k = 0x8F1BBCDC;
                    } else {
                        f = b ^ c ^ d;
                        k = 0xCA62C1D6;
                    }

                    const temp = (rotateLeft(a, 5) + f + e + k + w[t]) & 0x0FFFFFFFF;
                    e = d;
                    d = c;
                    c = rotateLeft(b, 30);
                    b = a;
                    a = temp;
                }

                h0 = (h0 + a) & 0x0FFFFFFFF;
                h1 = (h1 + b) & 0x0FFFFFFFF;
                h2 = (h2 + c) & 0x0FFFFFFFF;
                h3 = (h3 + d) & 0x0FFFFFFFF;
                h4 = (h4 + e) & 0x0FFFFFFFF;
            }

            return toHexStr(h0) + toHexStr(h1) + toHexStr(h2) + toHexStr(h3) + toHexStr(h4);
        }

        /**
         * Opt out of analytics tracking
         */
        optOut() {
            this.isTracking = false;
            this.setCookie('analytics_opt_out', 'true', 365);
            this.deleteCookie('analytics_visitor_id');
            this.deleteCookie('analytics_session_id');

            // Notify server
            this.sendData('/analytics/opt-out', {
                visitor_id: this.visitorId
            });

            this.log('Analytics tracking disabled');
        }

        /**
         * Opt in to analytics tracking
         */
        optIn() {
            this.deleteCookie('analytics_opt_out');
            this.isTracking = true;
            this.loadIdentifiers();

            // Notify server
            this.sendData('/analytics/opt-in', {
                visitor_id: this.visitorId
            });

            this.log('Analytics tracking enabled');
        }

        /**
         * Log debug messages
         */
        log(...args) {
            if (this.config.debug) {
                console.log('[SabiteckAnalytics]', ...args);
            }
        }
    }

    // Auto-initialize if script is loaded normally
    let analytics = null;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            analytics = new SabiteckAnalytics();
        });
    } else {
        analytics = new SabiteckAnalytics();
    }

    // Expose API to global scope
    window.SabiteckAnalytics = {
        init: (config) => {
            analytics = new SabiteckAnalytics(config);
            return analytics;
        },
        track: (category, action, label, value) => {
            if (analytics) {
                analytics.trackEvent(category, action, label, value);
            }
        },
        optOut: () => {
            if (analytics) {
                analytics.optOut();
            }
        },
        optIn: () => {
            if (analytics) {
                analytics.optIn();
            }
        }
    };

})(window, document);