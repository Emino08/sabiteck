/**
 * Sabiteck Security Monitor
 * Monitors and reports CSP violations and unauthorized connection attempts
 */

(function() {
    'use strict';

    // Security monitoring configuration
    const SECURITY_CONFIG = {
        reportEndpoint: '/api/security/csp-report',
        logToConsole: true,
        blockSuspiciousDomains: [
            'overbridgenet.com',
            // Add other suspicious domains here
        ],
        alertOnViolation: true
    };

    /**
     * CSP Violation Reporter
     */
    document.addEventListener('securitypolicyviolation', function(e) {
        const violation = {
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            originalPolicy: e.originalPolicy,
            sourceFile: e.sourceFile,
            lineNumber: e.lineNumber,
            columnNumber: e.columnNumber,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            documentURI: document.location.href
        };

        // Log to console if enabled
        if (SECURITY_CONFIG.logToConsole) {
            console.warn('🚨 CSP Violation Detected:', violation);
        }

        // Check if this is a suspicious domain
        const isSuspicious = SECURITY_CONFIG.blockSuspiciousDomains.some(domain =>
            violation.blockedURI.includes(domain)
        );

        if (isSuspicious) {
            console.error('🔒 BLOCKED SUSPICIOUS CONNECTION:', violation.blockedURI);

            if (SECURITY_CONFIG.alertOnViolation) {
                // Report to admin (non-blocking)
                reportSecurityIncident(violation, 'suspicious_domain');
            }
        }

        // Report violation to backend
        reportCSPViolation(violation);
    });

    /**
     * Report CSP violation to backend
     */
    function reportCSPViolation(violation) {
        try {
            fetch(SECURITY_CONFIG.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'csp_violation',
                    violation: violation
                })
            }).catch(err => {
                console.log('CSP report failed (expected in dev):', err.message);
            });
        } catch (error) {
            console.log('CSP reporting error:', error.message);
        }
    }

    /**
     * Report security incident
     */
    function reportSecurityIncident(violation, type) {
        try {
            fetch('/api/security/incident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: type,
                    violation: violation,
                    severity: 'high',
                    timestamp: new Date().toISOString()
                })
            }).catch(err => {
                console.log('Security incident report failed:', err.message);
            });
        } catch (error) {
            console.log('Security incident reporting error:', error.message);
        }
    }

    /**
     * Monitor for suspicious script injections
     */
    function monitorScriptInjections() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for suspicious script tags
                            if (node.tagName === 'SCRIPT') {
                                const src = node.src || '';
                                const isSuspicious = SECURITY_CONFIG.blockSuspiciousDomains.some(domain =>
                                    src.includes(domain)
                                );

                                if (isSuspicious) {
                                    console.error('🚨 BLOCKED SUSPICIOUS SCRIPT INJECTION:', src);
                                    node.remove();
                                    reportSecurityIncident({
                                        type: 'script_injection',
                                        src: src,
                                        blocked: true
                                    }, 'script_injection');
                                }
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Initialize security monitoring
     */
    function initSecurityMonitoring() {
        console.log('🛡️ Sabiteck Security Monitor initialized');

        // Start monitoring when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', monitorScriptInjections);
        } else {
            monitorScriptInjections();
        }

        // Log security status
        console.log('🔒 Security Status:', {
            cspEnabled: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
            httpsEnabled: location.protocol === 'https:',
            secureContext: window.isSecureContext,
            monitoring: 'active'
        });
    }

    // Initialize when script loads
    initSecurityMonitoring();

    // Expose security controls globally
    window.SabiteckSecurity = {
        reportIncident: reportSecurityIncident,
        checkDomain: function(domain) {
            return !SECURITY_CONFIG.blockSuspiciousDomains.includes(domain);
        },
        getViolations: function() {
            return JSON.parse(localStorage.getItem('sabiteck_csp_violations') || '[]');
        }
    };

})();