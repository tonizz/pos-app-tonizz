'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { useForm } from '@/lib/useForm'
import { loginSchema } from '@/lib/validations'
import { FormInput, FormButton, FormError } from '@/components/FormComponents'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore(state => state.setAuth)

  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Login failed')
        }

        setAuth(data.user, data.token)
        toast.success('Login successful!')
        router.push('/dashboard')
      } catch (error: any) {
        form.setErrors({ _error: error.message || 'Login failed' })
        toast.error(error.message || 'Login failed')
      }
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200" suppressHydrationWarning>
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md" suppressHydrationWarning>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">POS System</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={form.handleSubmit} className="space-y-6" suppressHydrationWarning>
          <FormError error={form.errors._error} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...form.getFieldProps('email')}
              className={`w-full px-4 py-3 border ${
                form.hasError('email') ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white`}
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              placeholder="admin@example.com"
              suppressHydrationWarning
            />
            {form.hasError('email') && (
              <p className="mt-1 text-sm text-red-600">{form.getFieldError('email')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              {...form.getFieldProps('password')}
              className={`w-full px-4 py-3 border ${
                form.hasError('password') ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white`}
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              placeholder="••••••••"
              suppressHydrationWarning
            />
            {form.hasError('password') && (
              <p className="mt-1 text-sm text-red-600">{form.getFieldError('password')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={form.isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            {form.isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center" suppressHydrationWarning>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium" suppressHydrationWarning>
              Register here
            </a>
          </p>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-300" suppressHydrationWarning>
          <p className="text-sm text-gray-900 font-bold mb-2">Demo Credentials:</p>
          <p className="text-sm text-gray-900 font-medium">Email: admin@pos.com</p>
          <p className="text-sm text-gray-900 font-medium">Password: admin123</p>
        </div>
      </div>
    </div>
  )
}
