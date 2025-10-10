import { useState, useEffect } from 'react';

/**
 * useResponsive - Custom hook for responsive design
 * Detects screen size and provides responsive utilities
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
      });
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

/**
 * useBreakpoint - Hook to get current breakpoint
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xl');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

/**
 * useTouchDevice - Detect if device supports touch
 */
export const useTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Responsive utility functions
 */
export const responsiveUtils = {
  // Get responsive font size
  getFontSize: (baseSize, mobileSize) => {
    return window.innerWidth < 768 ? mobileSize : baseSize;
  },

  // Get responsive spacing
  getSpacing: (baseSpacing, mobileSpacing) => {
    return window.innerWidth < 768 ? mobileSpacing : baseSpacing;
  },

  // Get grid columns based on screen size
  getGridCols: (desktop = 3, tablet = 2, mobile = 1) => {
    const width = window.innerWidth;
    if (width < 768) return mobile;
    if (width < 1024) return tablet;
    return desktop;
  },

  // Check if should show text or icon only
  shouldShowText: () => {
    return window.innerWidth >= 640;
  },

  // Get responsive class names
  getResponsiveClass: (baseClass, mobileClass) => {
    return window.innerWidth < 768 ? mobileClass : baseClass;
  },
};

export default useResponsive;
