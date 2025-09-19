import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const ScrollReveal = ({ 
  children, 
  className = '', 
  delay = 0, 
  threshold = 0.1,
  triggerOnce = true,
  animation = 'fade-up'
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          
          if (triggerOnce) {
            observer.unobserve(entry.target)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [delay, threshold, triggerOnce])

  const animations = {
    'fade-up': isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-8',
    'fade-down': isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 -translate-y-8',
    'fade-left': isVisible ? 'animate-slide-in-left opacity-100' : 'opacity-0 translate-x-8',
    'fade-right': isVisible ? 'animate-slide-in-right opacity-100' : 'opacity-0 -translate-x-8',
    'fade-in': isVisible ? 'animate-fade-in opacity-100' : 'opacity-0',
    'scale-in': isVisible ? 'animate-scale-in opacity-100 scale-100' : 'opacity-0 scale-95',
    'zoom-in': isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        animations[animation],
        className
      )}
    >
      {children}
    </div>
  )
}

export { ScrollReveal }