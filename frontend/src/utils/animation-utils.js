// Animation utility functions for performance optimization

// Debounce function for scroll events
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Intersection Observer helper for scroll animations
export const createScrollObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  }

  if (typeof IntersectionObserver === 'undefined') {
    // Fallback for older browsers
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    }
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Performance-optimized animation class toggler
export const toggleAnimationClass = (element, className, remove = false) => {
  if (!element) return

  if (remove) {
    element.classList.remove(className)
  } else {
    element.classList.add(className)
  }
}

// Stagger animation delays
export const staggerDelay = (index, baseDelay = 100) => {
  return `${baseDelay * index}ms`
}

// Random animation delay within range
export const randomDelay = (min = 0, max = 500) => {
  return `${Math.random() * (max - min) + min}ms`
}

// Animation duration calculator based on distance
export const calculateDuration = (distance, speed = 1) => {
  const baseDuration = Math.min(Math.max(distance * 2, 300), 800)
  return `${baseDuration * speed}ms`
}

// Easing functions
export const easingFunctions = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
}

// Performance monitor for animations
export class AnimationPerformanceMonitor {
  constructor() {
    this.animations = new Map()
    this.isMonitoring = false
  }

  start(animationId) {
    if (this.isMonitoring) {
      this.animations.set(animationId, performance.now())
    }
  }

  end(animationId) {
    if (this.isMonitoring && this.animations.has(animationId)) {
      const startTime = this.animations.get(animationId)
      const duration = performance.now() - startTime
      console.log(`Animation ${animationId} took ${duration.toFixed(2)}ms`)
      this.animations.delete(animationId)
    }
  }

  enable() {
    this.isMonitoring = true
  }

  disable() {
    this.isMonitoring = false
    this.animations.clear()
  }
}

// Global animation monitor instance
export const animationMonitor = new AnimationPerformanceMonitor()

// Optimize animations based on device capabilities
export const getOptimizedAnimationSettings = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const isLowPowerMode = 'getBattery' in navigator
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
  
  return {
    reduceMotion: prefersReducedMotion(),
    disableComplexAnimations: isSlowConnection || isLowPowerMode,
    preferSimpleTransitions: connection && connection.saveData,
    maxAnimationDuration: isSlowConnection ? 200 : 800
  }
}

// CSS custom properties for dynamic animations
export const setCSSAnimationProperty = (property, value, element = document.documentElement) => {
  element.style.setProperty(`--animation-${property}`, value)
}

// Batch DOM operations for better performance
export const batchDOMOperations = (operations) => {
  requestAnimationFrame(() => {
    operations.forEach(operation => operation())
  })
}

// Preload animation classes
export const preloadAnimationClasses = () => {
  const preloadElement = document.createElement('div')
  preloadElement.style.visibility = 'hidden'
  preloadElement.style.position = 'absolute'
  preloadElement.style.top = '-9999px'
  
  const animationClasses = [
    'animate-fade-in',
    'animate-slide-up',
    'animate-slide-in-left',
    'animate-slide-in-right',
    'animate-scale-in',
    'hover-lift',
    'hover-scale',
    'hover-glow'
  ]
  
  preloadElement.className = animationClasses.join(' ')
  document.body.appendChild(preloadElement)
  
  setTimeout(() => {
    document.body.removeChild(preloadElement)
  }, 100)
}