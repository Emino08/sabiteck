import React from 'react'
import { cn } from '@/lib/utils'

const AnimatedBackground = ({ 
  variant = 'particles',
  className = '',
  children,
  intensity = 'medium'
}) => {
  const intensities = {
    low: 'opacity-5',
    medium: 'opacity-10', 
    high: 'opacity-20'
  }

  if (variant === 'particles') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Floating particles */}
        <div className={cn('absolute inset-0', intensities[intensity])}>
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-bounce-subtle"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full animate-bounce-subtle animate-delay-200"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce-subtle animate-delay-400"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-indigo-400 rounded-full animate-bounce-subtle animate-delay-600"></div>
          <div className="absolute bottom-20 right-10 w-3 h-3 bg-cyan-400 rounded-full animate-bounce-subtle animate-delay-800"></div>
          <div className="absolute top-1/2 left-20 w-2 h-2 bg-green-400 rounded-full animate-bounce-subtle animate-delay-300"></div>
        </div>
        {children}
      </div>
    )
  }

  if (variant === 'blobs') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Floating blobs */}
        <div className={cn('absolute inset-0', intensities[intensity])}>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle animate-delay-300"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle animate-delay-600"></div>
        </div>
        {children}
      </div>
    )
  }

  if (variant === 'gradient-waves') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Gradient waves */}
        <div className={cn('absolute inset-0', intensities[intensity])}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 transform -skew-y-3 animate-pulse"></div>
          <div className="absolute top-10 left-0 w-full h-full bg-gradient-to-l from-cyan-400/20 via-indigo-400/20 to-green-400/20 transform skew-y-2 animate-pulse animate-delay-300"></div>
        </div>
        {children}
      </div>
    )
  }

  if (variant === 'geometric') {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Geometric shapes */}
        <div className={cn('absolute inset-0', intensities[intensity])}>
          <div className="absolute top-20 left-10 w-16 h-16 border-2 border-blue-400 rotate-45 animate-spin-slow"></div>
          <div className="absolute top-40 right-20 w-12 h-12 bg-purple-400 rounded animate-bounce-subtle animate-delay-200"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 border-2 border-pink-400 rotate-12 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-indigo-400 transform rotate-45 animate-bounce-subtle animate-delay-400"></div>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  )
}

const FloatingElements = ({ count = 6, className = '' }) => {
  const elements = Array.from({ length: count }, (_, i) => i)
  
  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {elements.map((i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 bg-primary/20 rounded-full animate-bounce-subtle`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

export { AnimatedBackground, FloatingElements }