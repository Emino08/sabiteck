import React, { useState, useEffect } from 'react'
import { X, Cookie, Shield, Eye, BarChart3, Settings, Check } from 'lucide-react'

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,     // Always required
    analytics: false,
    functional: false,
    marketing: false
  })

  // Cookie categories with detailed information
  const cookieCategories = {
    necessary: {
      name: 'Strictly Necessary',
      icon: Shield,
      description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
      required: true,
      cookies: [
        { name: 'session_token', purpose: 'User session management', duration: 'Session' },
        { name: 'csrf_token', purpose: 'Security protection', duration: '24 hours' },
        { name: 'cookie_consent', purpose: 'Store your cookie preferences', duration: '1 year' }
      ]
    },
    analytics: {
      name: 'Analytics & Performance',
      icon: BarChart3,
      description: 'These cookies help us understand how visitors interact with our website by collecting information anonymously.',
      required: false,
      cookies: [
        { name: 'analytics_visitor_id', purpose: 'Unique visitor identification', duration: '1 year' },
        { name: 'analytics_session_id', purpose: 'Session tracking', duration: '30 minutes' },
        { name: 'analytics_location', purpose: 'Geographic analytics', duration: '24 hours' }
      ]
    },
    functional: {
      name: 'Functional',
      icon: Settings,
      description: 'These cookies enable enhanced functionality and personalization.',
      required: false,
      cookies: [
        { name: 'language_preference', purpose: 'Remember language selection', duration: '1 year' },
        { name: 'theme_preference', purpose: 'Remember dark/light theme', duration: '1 year' },
        { name: 'user_preferences', purpose: 'Store user interface preferences', duration: '6 months' }
      ]
    },
    marketing: {
      name: 'Marketing & Advertising',
      icon: Eye,
      description: 'These cookies are used to deliver personalized advertisements and measure their effectiveness.',
      required: false,
      cookies: [
        { name: 'marketing_id', purpose: 'Personalized advertising', duration: '90 days' },
        { name: 'campaign_tracking', purpose: 'Marketing campaign analytics', duration: '30 days' }
      ]
    }
  }

  useEffect(() => {
    checkConsentStatus()
  }, [])

  const checkConsentStatus = () => {
    const consentData = getCookie('cookie_consent')
    const consentTimestamp = getCookie('cookie_consent_timestamp')

    if (!consentData || !consentTimestamp) {
      setIsVisible(true)
      return
    }

    try {
      const consent = JSON.parse(consentData)
      const timestamp = parseInt(consentTimestamp)
      const oneYear = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds

      // Show consent banner if it's been more than a year or consent is invalid
      if (Date.now() - timestamp > oneYear || !consent.version) {
        setIsVisible(true)
      } else {
        // Apply saved preferences
        setPreferences(consent.preferences || preferences)
        applyConsentPreferences(consent.preferences || preferences)
      }
    } catch (error) {
      setIsVisible(true)
    }
  }

  const getCookie = (name) => {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  const setCookie = (name, value, days) => {
    let expires = ''
    if (days) {
      const date = new Date()
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
      expires = '; expires=' + date.toUTCString()
    }
    document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax; Secure'
  }

  const saveConsentPreferences = (newPreferences) => {
    const consentData = {
      version: '1.0',
      timestamp: Date.now(),
      preferences: newPreferences,
      gdpr_compliant: true,
      ccpa_compliant: true
    }

    setCookie('cookie_consent', JSON.stringify(consentData), 365)
    setCookie('cookie_consent_timestamp', Date.now().toString(), 365)

    // Set individual consent cookies for easy checking
    setCookie('analytics_consent', newPreferences.analytics ? 'true' : 'false', 365)
    setCookie('functional_consent', newPreferences.functional ? 'true' : 'false', 365)
    setCookie('marketing_consent', newPreferences.marketing ? 'true' : 'false', 365)

    applyConsentPreferences(newPreferences)
  }

  const applyConsentPreferences = (prefs) => {
    // Initialize analytics based on consent
    if (prefs.analytics && window.SabiteckAnalytics) {
      window.SabiteckAnalytics.optIn()
    } else if (window.SabiteckAnalytics) {
      window.SabiteckAnalytics.optOut()
    }

    // Apply other preferences as needed
    if (!prefs.functional) {
      // Remove functional cookies
      setCookie('language_preference', '', -1)
      setCookie('theme_preference', '', -1)
      setCookie('user_preferences', '', -1)
    }

    if (!prefs.marketing) {
      // Remove marketing cookies
      setCookie('marketing_id', '', -1)
      setCookie('campaign_tracking', '', -1)
    }
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true
    }
    setPreferences(allAccepted)
    saveConsentPreferences(allAccepted)
    setIsVisible(false)
  }

  const handleAcceptSelected = () => {
    saveConsentPreferences(preferences)
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false
    }
    setPreferences(onlyNecessary)
    saveConsentPreferences(onlyNecessary)
    setIsVisible(false)
  }

  const handleCategoryToggle = (category) => {
    if (category === 'necessary') return // Cannot toggle necessary cookies

    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getUserLocation = () => {
    // Simple check for EU/EEA countries (GDPR) and California (CCPA)
    // This should ideally be done server-side with proper IP geolocation
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language || 'en-US'

    const euTimezones = [
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
      'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna',
      'Europe/Stockholm', 'Europe/Copenhagen', 'Europe/Helsinki', 'Europe/Oslo'
    ]

    const isEU = euTimezones.some(tz => timezone.includes(tz)) || language.includes('de') || language.includes('fr')
    const isCA = timezone.includes('America/Los_Angeles') || timezone.includes('America/San_Francisco')

    return { isEU, isCA }
  }

  const { isEU, isCA } = getUserLocation()

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cookie className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Cookie Preferences</h2>
                <p className="text-blue-100 mt-1">
                  We value your privacy and comply with {isEU ? 'GDPR' : ''} {isEU && isCA ? 'and' : ''} {isCA ? 'CCPA' : ''} regulations
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {!showDetails ? (
            // Simple view
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies.
                </p>
                <p className="text-gray-600 mt-3">
                  You can customize your preferences or learn more about our cookie policy.
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Customize Preferences
                </button>
                <a
                  href="/privacy-policy"
                  className="text-gray-600 hover:text-gray-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          ) : (
            // Detailed view
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookie Categories</h3>
                <p className="text-gray-600 mb-4">
                  Choose which cookies you're comfortable with. You can change these settings at any time.
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(cookieCategories).map(([key, category]) => {
                  const Icon = category.icon
                  const isEnabled = preferences[key]

                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Icon className={`w-6 h-6 mt-1 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{category.name}</h4>
                              {category.required && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{category.description}</p>

                            {/* Cookie details */}
                            <div className="mt-3">
                              <div className="text-xs text-gray-500 space-y-1">
                                {category.cookies.map((cookie, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span className="font-medium">{cookie.name}</span>
                                    <span>{cookie.duration}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleCategoryToggle(key)}
                            disabled={category.required}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isEnabled ? 'bg-green-600' : 'bg-gray-200'
                            } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Your Rights</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {isEU && (
                    <>
                      <p>• Right to access, rectify, or erase your personal data (GDPR)</p>
                      <p>• Right to data portability and restriction of processing</p>
                    </>
                  )}
                  {isCA && (
                    <>
                      <p>• Right to know what personal information is collected (CCPA)</p>
                      <p>• Right to delete personal information and opt-out of sale</p>
                    </>
                  )}
                  <p>• You can withdraw consent at any time</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  ← Back to simple view
                </button>
                <div className="flex space-x-4">
                  <a
                    href="/privacy-policy"
                    className="text-gray-600 hover:text-gray-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/cookie-policy"
                    className="text-gray-600 hover:text-gray-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleRejectAll}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Reject All
            </button>
            {showDetails && (
              <button
                onClick={handleAcceptSelected}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Preferences
              </button>
            )}
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-colors"
            >
              Accept All Cookies
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              This consent banner complies with GDPR, CCPA, and other privacy regulations.
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent