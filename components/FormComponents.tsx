'use client'

import { AlertCircle } from 'lucide-react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  touched?: boolean
  required?: boolean
}

export function FormInput({
  label,
  error,
  touched,
  required,
  className = '',
  ...props
}: FormInputProps) {
  const hasError = touched && error

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2 bg-gray-700 border ${
          hasError ? 'border-red-500' : 'border-gray-600'
        } text-white rounded-lg focus:ring-2 ${
          hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
        } focus:border-transparent ${className}`}
      />
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  touched?: boolean
  required?: boolean
}

export function FormTextarea({
  label,
  error,
  touched,
  required,
  className = '',
  ...props
}: FormTextareaProps) {
  const hasError = touched && error

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        {...props}
        className={`w-full px-4 py-2 bg-gray-700 border ${
          hasError ? 'border-red-500' : 'border-gray-600'
        } text-white rounded-lg focus:ring-2 ${
          hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
        } focus:border-transparent ${className}`}
      />
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  touched?: boolean
  required?: boolean
  options: Array<{ value: string; label: string }>
}

export function FormSelect({
  label,
  error,
  touched,
  required,
  options,
  className = '',
  ...props
}: FormSelectProps) {
  const hasError = touched && error

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        {...props}
        className={`w-full px-4 py-2 bg-gray-700 border ${
          hasError ? 'border-red-500' : 'border-gray-600'
        } text-white rounded-lg focus:ring-2 ${
          hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
        } focus:border-transparent ${className}`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
}

export function FormButton({
  loading,
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: FormButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

interface FormErrorProps {
  error?: string
}

export function FormError({ error }: FormErrorProps) {
  if (!error) return null

  return (
    <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
      <div className="flex items-center gap-2 text-red-200">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    </div>
  )
}

interface FormSuccessProps {
  message?: string
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null

  return (
    <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
      <div className="flex items-center gap-2 text-green-200">
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
    </div>
  )
}
