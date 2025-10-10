import React from 'react';

/**
 * ResponsiveButton - A button that shows text on desktop and icon-only on mobile
 * @param {object} props - Component props
 * @param {React.ReactNode} props.icon - Icon component (from lucide-react)
 * @param {string} props.text - Button text (hidden on mobile)
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant (primary, secondary, danger, etc.)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.ariaLabel - Accessibility label
 */
const ResponsiveButton = ({ 
  icon: Icon, 
  text, 
  onClick, 
  className = '', 
  variant = 'primary',
  disabled = false,
  ariaLabel,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 transition-all rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
  };

  // Responsive classes: full padding on desktop, compact on mobile
  const responsiveClasses = 'px-4 py-2 md:px-6 md:py-3 mobile-icon-only';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || text}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${responsiveClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 md:w-5 md:h-5" />}
      <span className="button-text hidden sm:inline">{text}</span>
      {/* Screen reader text for accessibility */}
      <span className="sr-only">{text}</span>
    </button>
  );
};

export default ResponsiveButton;
