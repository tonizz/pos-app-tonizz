// UI Components Library
import React from 'react'

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`} />
  )
}

// Loading Skeleton Component
export const Skeleton = ({ className = '', width = '100%', height = '20px' }: { className?: string, width?: string, height?: string }) => {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={{ width, height }}
    />
  )
}

// Empty State Component
export const EmptyState = ({
  icon = '📭',
  title = 'No data found',
  description = 'There are no items to display',
  action
}: {
  icon?: string,
  title?: string,
  description?: string,
  action?: React.ReactNode
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

// Status Badge Component
export const StatusBadge = ({
  status,
  label
}: {
  status: 'success' | 'warning' | 'error' | 'info',
  label: string
}) => {
  const statusClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info'
  }

  return (
    <span className={`badge ${statusClasses[status]}`}>
      {label}
    </span>
  )
}

// Loading Overlay Component
export const LoadingOverlay = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="loading-overlay">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-white mt-4">{message}</p>
      </div>
    </div>
  )
}

// Card Component with Hover Effect
export const Card = ({
  children,
  className = '',
  hover = false
}: {
  children: React.ReactNode,
  className?: string,
  hover?: boolean
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 card-spacing ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

// Button Component with Variants
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button'
}: {
  children: React.ReactNode,
  variant?: 'primary' | 'secondary' | 'danger' | 'success',
  size?: 'sm' | 'md' | 'lg',
  loading?: boolean,
  disabled?: boolean,
  onClick?: () => void,
  className?: string,
  type?: 'button' | 'submit' | 'reset'
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg font-medium
        btn-hover
        focus-ring
        ${disabled || loading ? 'disabled' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : children}
    </button>
  )
}

// Table Loading Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height="40px" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Alert Component
export const Alert = ({
  type = 'info',
  title,
  message
}: {
  type?: 'success' | 'warning' | 'error' | 'info',
  title?: string,
  message: string
}) => {
  const typeClasses = {
    success: 'bg-green-900/20 border-green-700 text-green-400',
    warning: 'bg-yellow-900/20 border-yellow-700 text-yellow-400',
    error: 'bg-red-900/20 border-red-700 text-red-400',
    info: 'bg-blue-900/20 border-blue-700 text-blue-400'
  }

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  }

  return (
    <div className={`border rounded-lg p-4 ${typeClasses[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Tooltip Component (Simple)
export const Tooltip = ({
  children,
  text
}: {
  children: React.ReactNode,
  text: string
}) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {text}
      </div>
    </div>
  )
}
