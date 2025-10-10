import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
    link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
  }

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm sm:text-base',
    sm: 'h-8 sm:h-9 rounded-md px-2 sm:px-3 text-xs sm:text-sm',
    lg: 'h-11 sm:h-12 rounded-md px-6 sm:px-8 text-base sm:text-lg',
    xl: 'h-12 sm:h-14 rounded-lg px-8 sm:px-10 text-lg sm:text-xl',
    icon: 'h-10 w-10 sm:h-11 sm:w-11'
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover-lift active:scale-95 touch-target'

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'cursor-not-allowed',
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  )
})

// Floating Action Button
const FAB = React.forwardRef(({
  className,
  children,
  position = 'bottom-right',
  ...props
}, ref) => {
  const positions = {
    'bottom-right': 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-left': 'fixed bottom-4 left-4 sm:bottom-6 sm:left-6',
    'top-right': 'fixed top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'fixed top-4 left-4 sm:top-6 sm:left-6'
  }

  return (
    <Button
      ref={ref}
      className={cn(
        'h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl z-50 active:scale-90',
        positions[position],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
})

// Button Group
const ButtonGroup = ({ children, className, ...props }) => (
  <div
    className={cn('inline-flex rounded-md shadow-sm', className)}
    role="group"
    {...props}
  >
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        const isFirst = index === 0
        const isLast = index === React.Children.count(children) - 1

        return React.cloneElement(child, {
          className: cn(
            child.props.className,
            isFirst ? 'rounded-r-none' : '',
            isLast ? 'rounded-l-none' : '',
            !isFirst && !isLast ? 'rounded-none' : '',
            !isFirst ? '-ml-px' : ''
          )
        })
      }
      return child
    })}
  </div>
)

// Icon Button
const IconButton = React.forwardRef(({
  icon: Icon,
  tooltip,
  className,
  ...props
}, ref) => (
  <Button
    ref={ref}
    size="icon"
    variant="ghost"
    className={cn('relative group no-tap-highlight', className)}
    title={tooltip}
    {...props}
  >
    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    {tooltip && (
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
        {tooltip}
      </span>
    )}
  </Button>
))

Button.displayName = 'Button'
FAB.displayName = 'FAB'
ButtonGroup.displayName = 'ButtonGroup'
IconButton.displayName = 'IconButton'

export { Button, FAB, ButtonGroup, IconButton }
