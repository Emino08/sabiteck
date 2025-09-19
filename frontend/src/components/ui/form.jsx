import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

// Enhanced Input component with validation states
const Input = React.forwardRef(({
  className,
  type = 'text',
  error,
  success,
  helperText,
  label,
  required,
  loading,
  icon: Icon,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}

        <input
          type={inputType}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-smooth',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            error && 'border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:ring-green-500',
            loading && 'opacity-50 cursor-not-allowed',
            className
          )}
          ref={ref}
          disabled={loading}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {error && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        )}

        {success && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {(helperText || error) && (
        <p className={cn(
          'text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

// Enhanced Textarea component
const Textarea = React.forwardRef(({
  className,
  error,
  success,
  helperText,
  label,
  required,
  loading,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          rows={rows}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-smooth',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none',
            error && 'border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:ring-green-500',
            loading && 'opacity-50 cursor-not-allowed',
            className
          )}
          ref={ref}
          disabled={loading}
          {...props}
        />
      </div>

      {(helperText || error) && (
        <p className={cn(
          'text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

// Enhanced Select component
const Select = React.forwardRef(({
  className,
  options = [],
  error,
  success,
  helperText,
  label,
  required,
  loading,
  placeholder = 'Select an option...',
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-smooth',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            success && 'border-green-500 focus:ring-green-500',
            loading && 'opacity-50 cursor-not-allowed',
            className
          )}
          ref={ref}
          disabled={loading}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(helperText || error) && (
        <p className={cn(
          'text-sm',
          error ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

// Form validation hook
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return null
  }

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))

    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateAll = () => {
    const newErrors = {}
    const newTouched = {}

    Object.keys(validationRules).forEach(name => {
      newTouched[name] = true
      const error = validateField(name, values[name])
      if (error) newErrors[name] = error
    })

    setTouched(newTouched)
    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues,
    setErrors
  }
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => (value) => {
    if (!value || value.toString().trim() === '') return message
    return null
  },

  email: (message = 'Please enter a valid email') => (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : message
  },

  minLength: (min, message) => (value) => {
    if (!value) return null
    message = message || `Must be at least ${min} characters`
    return value.length >= min ? null : message
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null
    message = message || `Must be no more than ${max} characters`
    return value.length <= max ? null : message
  },

  phone: (message = 'Please enter a valid phone number') => (value) => {
    if (!value) return null
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : message
  }
}

// Enhanced Form component wrapper
const Form = ({ onSubmit, children, className, ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      {...props}
    >
      {children}
    </form>
  )
}

Input.displayName = 'Input'
Textarea.displayName = 'Textarea'
Select.displayName = 'Select'
Form.displayName = 'Form'

export { Input, Textarea, Select, Form }
