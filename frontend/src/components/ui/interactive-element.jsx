import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

const InteractiveElement = ({ 
  children, 
  className = '',
  hoverEffect = 'lift',
  rippleEffect = false,
  glowColor = 'primary',
  disabled = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState([])
  const elementRef = useRef(null)

  const hoverEffects = {
    lift: 'hover-lift',
    scale: 'hover-scale',
    tilt: 'hover-tilt',
    glow: 'hover-glow',
    none: ''
  }

  const glowColors = {
    primary: 'hover:shadow-primary/25',
    blue: 'hover:shadow-blue-500/25',
    green: 'hover:shadow-green-500/25',
    red: 'hover:shadow-red-500/25',
    purple: 'hover:shadow-purple-500/25'
  }

  const handleMouseDown = (e) => {
    if (disabled) return
    
    setIsPressed(true)
    
    if (rippleEffect && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      
      const newRipple = {
        x,
        y,
        size,
        id: Date.now()
      }
      
      setRipples(prev => [...prev, newRipple])
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const handleMouseLeave = () => {
    setIsPressed(false)
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative overflow-hidden transition-smooth select-none',
        hoverEffects[hoverEffect],
        glowColors[glowColor],
        isPressed && 'scale-95',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      
      {/* Ripple effect */}
      {rippleEffect && (
        <div className="absolute inset-0 pointer-events-none">
          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="absolute bg-white/30 rounded-full animate-ping"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const HoverCard = ({ 
  children, 
  className = '',
  intensity = 'medium',
  ...props 
}) => {
  const intensities = {
    subtle: 'hover:shadow-md hover:-translate-y-1',
    medium: 'hover-lift hover-glow',
    strong: 'hover:shadow-2xl hover:-translate-y-3 hover:scale-105'
  }

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out cursor-pointer',
        intensities[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const ClickAnimation = ({ 
  children, 
  className = '',
  animation = 'bounce',
  ...props 
}) => {
  const [isClicked, setIsClicked] = useState(false)

  const animations = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    wiggle: 'animate-wiggle',
    shake: 'animate-shake'
  }

  const handleClick = (e) => {
    if (props.onClick) {
      props.onClick(e)
    }
    
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 600)
  }

  return (
    <div
      className={cn(
        'transition-transform cursor-pointer',
        isClicked && animations[animation],
        className
      )}
      {...props}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

const MagneticElement = ({ 
  children, 
  className = '',
  strength = 0.3,
  ...props 
}) => {
  const [transform, setTransform] = useState('')
  const elementRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!elementRef.current) return

    const rect = elementRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    const moveX = x * strength
    const moveY = y * strength

    setTransform(`translate3d(${moveX}px, ${moveY}px, 0)`)
  }

  const handleMouseLeave = () => {
    setTransform('')
  }

  return (
    <div
      ref={elementRef}
      className={cn('transition-transform duration-300 ease-out', className)}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

export { InteractiveElement, HoverCard, ClickAnimation, MagneticElement }