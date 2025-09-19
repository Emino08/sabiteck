import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast types with their corresponding icons and styles
const toastTypes = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500'
  }
}

// Individual Toast component
const Toast = ({ id, type, title, message, duration, onClose }) => {
  const { icon: Icon, className, iconClassName } = toastTypes[type] || toastTypes.info

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div
      className={cn(
        'relative flex items-start space-x-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-slide-up',
        'hover:shadow-xl transform hover:scale-[1.02]',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconClassName)} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-medium text-sm">{title}</p>
        )}
        {message && (
          <p className={cn('text-sm', title ? 'mt-1' : '')}>{message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toast container component
const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

// Toast Provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = ({ type = 'info', title, message, duration = 5000 }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, type, title, message, duration }

    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  // Convenience methods
  const toast = {
    success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
    warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
    info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
    custom: addToast
  }

  return (
    <ToastContext.Provider value={{ toast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

// Hook for easy toast usage
export const useNotification = () => {
  const { toast } = useToast()

  return {
    success: (message, title = 'Success') => toast.success(title, message),
    error: (message, title = 'Error') => toast.error(title, message),
    warning: (message, title = 'Warning') => toast.warning(title, message),
    info: (message, title = 'Info') => toast.info(title, message),
    notify: toast.custom
  }
}
