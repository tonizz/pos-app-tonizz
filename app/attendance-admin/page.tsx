'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MapPin, Clock, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          <h2 className="font-semibold text-gray-900">Live Location Map</h2>
        </div>
      </div>
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    </div>
  )
})

interface SalesLocation {
  user: {
    id: string
    name: string
    email: string
    nrp: string | null
    phone: string | null
    department: string | null
    position: string | null
  }
  location: {
    latitude: number
    longitude: number
    accuracy: number | null
    createdAt: string
  } | null
  attendance: {
    clockIn: any
    clockOut: any
    status: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'NOT_CLOCKED_IN'
  }
}

export default function AttendanceAdminPage() {
  const router = useRouter()
  const { token, isAuthenticated, logout } = useAuthStore()
  const [salesLocations, setSalesLocations] = useState<SalesLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchSalesLocations = async () => {
    try {
      // Get token from localStorage directly to avoid hydration issues
      const authStorage = localStorage.getItem('auth-storage')
      if (!authStorage) {
        router.push('/login')
        return
      }

      const { state } = JSON.parse(authStorage)
      const token = state?.token

      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/sales-locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch sales locations')
      }

      const data = await response.json()
      setSalesLocations(data)
      setError('')
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    fetchSalesLocations()

    // Refresh every 30 seconds
    const interval = setInterval(fetchSalesLocations, 30000)

    return () => clearInterval(interval)
  }, [token, isAuthenticated, mounted])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOCKED_IN':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CLOCKED_OUT':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'NOT_CLOCKED_IN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CLOCKED_IN':
        return 'Active - On Duty'
      case 'CLOCKED_OUT':
        return 'Clocked Out'
      case 'NOT_CLOCKED_IN':
        return 'Not Started'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('id-ID')
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading attendance data...</div>
        </div>
      </div>
    )
  }

  const clockedInCount = salesLocations.filter(s => s.attendance.status === 'CLOCKED_IN').length
  const clockedOutCount = salesLocations.filter(s => s.attendance.status === 'CLOCKED_OUT').length
  const notStartedCount = salesLocations.filter(s => s.attendance.status === 'NOT_CLOCKED_IN').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Monitoring System</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time sales team location tracking</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{salesLocations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Duty</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{clockedInCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clocked Out</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{clockedOutCount}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Clock className="text-gray-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not Started</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{notStartedCount}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <MapComponent
              salesLocations={salesLocations}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatTime={formatTime}
              formatLastUpdate={formatLastUpdate}
            />
          </div>

          {/* Sales List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Sales Team ({salesLocations.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {salesLocations.map((sales) => (
                  <div key={sales.user.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{sales.user.name}</div>
                        {sales.user.nrp && (
                          <div className="text-sm font-semibold text-blue-600">NRP: {sales.user.nrp}</div>
                        )}
                        <div className="text-sm text-gray-500">{sales.user.email}</div>
                        {sales.user.position && (
                          <div className="text-xs text-gray-600 mt-1">{sales.user.position}</div>
                        )}
                        {sales.user.phone && (
                          <div className="text-xs text-gray-600">{sales.user.phone}</div>
                        )}

                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(sales.attendance.status)}`}>
                            {getStatusText(sales.attendance.status)}
                          </span>
                        </div>

                        {sales.attendance.clockIn && (
                          <div className="mt-2 text-xs">
                            <div className="text-gray-700 font-medium">In: {formatTime(sales.attendance.clockIn.createdAt)}</div>
                            {sales.attendance.clockIn.address && (
                              <div className="text-gray-500 truncate mt-1">{sales.attendance.clockIn.address}</div>
                            )}
                          </div>
                        )}

                        {sales.attendance.clockOut && (
                          <div className="mt-1 text-xs">
                            <div className="text-gray-700 font-medium">Out: {formatTime(sales.attendance.clockOut.createdAt)}</div>
                            {sales.attendance.clockOut.address && (
                              <div className="text-gray-500 truncate mt-1">{sales.attendance.clockOut.address}</div>
                            )}
                          </div>
                        )}

                        {sales.location && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} />
                            Last seen: {formatLastUpdate(sales.location.createdAt)}
                          </div>
                        )}

                        {!sales.location && (
                          <div className="mt-2 text-xs text-gray-400 italic">
                            No location data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {salesLocations.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-2 text-gray-400" />
                    <p>No sales team members found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
