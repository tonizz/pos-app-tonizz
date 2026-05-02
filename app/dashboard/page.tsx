'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  TrendingUp,
  AlertCircle,
  LogOut,
  MapPin,
  BarChart3,
  Receipt,
  DollarSign,
  FolderTree,
  Truck,
  ArrowLeftRight,
  ShoppingBag,
  CreditCard,
  Calculator,
  Gift,
  Database
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, logout, isAuthenticated } = useAuthStore()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">POS Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(dashboardData?.summary?.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-green-900 p-3 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {dashboardData?.summary?.totalTransactions || 0}
                </p>
              </div>
              <div className="bg-blue-900 p-3 rounded-lg">
                <ShoppingCart className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {dashboardData?.summary?.totalProducts || 0}
                </p>
              </div>
              <div className="bg-purple-900 p-3 rounded-lg">
                <Package className="text-purple-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Low Stock Items</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {dashboardData?.summary?.lowStockProducts || 0}
                </p>
              </div>
              <div className="bg-red-900 p-3 rounded-lg">
                <AlertCircle className="text-red-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => router.push('/pos')}
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart size={32} className="mb-2" />
            <p className="font-semibold">New Sale</p>
          </button>

          <button
            onClick={() => router.push('/categories')}
            className="bg-yellow-600 text-white p-6 rounded-xl hover:bg-yellow-700 transition-colors"
          >
            <FolderTree size={32} className="mb-2" />
            <p className="font-semibold">Categories</p>
          </button>

          <button
            onClick={() => router.push('/products')}
            className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Package size={32} className="mb-2" />
            <p className="font-semibold">Products</p>
          </button>

          <button
            onClick={() => router.push('/transactions')}
            className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Receipt size={32} className="mb-2" />
            <p className="font-semibold">Transactions</p>
          </button>

          <button
            onClick={() => router.push('/reports')}
            className="bg-orange-600 text-white p-6 rounded-xl hover:bg-orange-700 transition-colors"
          >
            <BarChart3 size={32} className="mb-2" />
            <p className="font-semibold">Reports</p>
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <TrendingUp size={32} className="mb-2" />
            <p className="font-semibold">Analytics</p>
          </button>

          <button
            onClick={() => router.push('/inventory')}
            className="bg-violet-600 text-white p-6 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Warehouse size={32} className="mb-2" />
            <p className="font-semibold">Inventory</p>
          </button>

          <button
            onClick={() => router.push('/stock-transfers')}
            className="bg-violet-600 text-white p-6 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <ArrowLeftRight size={32} className="mb-2" />
            <p className="font-semibold">Stock Transfer</p>
          </button>

          <button
            onClick={() => router.push('/cash-session')}
            className="bg-cyan-600 text-white p-6 rounded-xl hover:bg-cyan-700 transition-colors"
          >
            <DollarSign size={32} className="mb-2" />
            <p className="font-semibold">Cash Session</p>
          </button>

          <button
            onClick={() => router.push('/promotions')}
            className="bg-fuchsia-600 text-white p-6 rounded-xl hover:bg-fuchsia-700 transition-colors"
          >
            <Gift size={32} className="mb-2" />
            <p className="font-semibold">Promotions</p>
          </button>

          <button
            onClick={() => router.push('/loyalty')}
            className="bg-pink-600 text-white p-6 rounded-xl hover:bg-pink-700 transition-colors"
          >
            <Gift size={32} className="mb-2" />
            <p className="font-semibold">Loyalty Program</p>
          </button>

          <button
            onClick={() => router.push('/settings/tax')}
            className="bg-sky-600 text-white p-6 rounded-xl hover:bg-sky-700 transition-colors"
          >
            <Calculator size={32} className="mb-2" />
            <p className="font-semibold">Tax Settings</p>
          </button>

          <button
            onClick={() => router.push('/customers')}
            className="bg-slate-600 text-white p-6 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Users size={32} className="mb-2" />
            <p className="font-semibold">Customers</p>
          </button>

          <button
            onClick={() => router.push('/credits')}
            className="bg-rose-600 text-white p-6 rounded-xl hover:bg-rose-700 transition-colors"
          >
            <CreditCard size={32} className="mb-2" />
            <p className="font-semibold">Credits</p>
          </button>

          <button
            onClick={() => router.push('/suppliers')}
            className="bg-emerald-600 text-white p-6 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Truck size={32} className="mb-2" />
            <p className="font-semibold">Suppliers</p>
          </button>

          <button
            onClick={() => router.push('/purchase-orders')}
            className="bg-lime-600 text-white p-6 rounded-xl hover:bg-lime-700 transition-colors"
          >
            <ShoppingBag size={32} className="mb-2" />
            <p className="font-semibold">Purchase Orders</p>
          </button>

          <button
            onClick={() => router.push('/employees')}
            className="bg-teal-600 text-white p-6 rounded-xl hover:bg-teal-700 transition-colors"
          >
            <Users size={32} className="mb-2" />
            <p className="font-semibold">Employees</p>
          </button>

          <button
            onClick={() => router.push('/users')}
            className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Users size={32} className="mb-2" />
            <p className="font-semibold">User Management</p>
          </button>

          <button
            onClick={() => router.push('/attendance-admin')}
            className="bg-amber-600 text-white p-6 rounded-xl hover:bg-amber-700 transition-colors"
          >
            <MapPin size={32} className="mb-2" />
            <p className="font-semibold">Attendance</p>
          </button>

          <button
            onClick={() => router.push('/backup')}
            className="bg-red-600 text-white p-6 rounded-xl hover:bg-red-700 transition-colors"
          >
            <Database size={32} className="mb-2" />
            <p className="font-semibold">Backup</p>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cashier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recentTransactions?.map((transaction: any) => (
                  <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-200">{transaction.invoiceNo}</td>
                    <td className="py-3 px-4 text-sm text-gray-200">{transaction.customer?.name || 'Guest'}</td>
                    <td className="py-3 px-4 text-sm text-gray-200">{transaction.cashier?.name}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-white">{formatCurrency(transaction.total)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
