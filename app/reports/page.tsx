'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import { exportReportToPDF, exportReportToExcel } from '@/lib/exportUtils'
import { exportChartAsPNG, exportAllChartsAsPNG } from '@/lib/chartExport'
import toast, { Toaster } from 'react-hot-toast'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  Image as ImageIcon,
  Users
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ReportData {
  summary: {
    totalRevenue: number
    totalTransactions: number
    totalDiscount: number
    totalTax: number
    totalProfit: number
    averageTransaction: number
  }
  dailySales: Array<{
    date: string
    revenue: number
    transactions: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
  paymentMethods: Array<{
    method: string
    amount: number
  }>
  categoryPerformance: Array<{
    categoryId: string
    name: string
    revenue: number
    quantity: number
  }>
  cashierPerformance: Array<{
    cashierId: string
    name: string
    transactions: number
    revenue: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])

    fetchWarehouses()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData()
    }
  }, [startDate, endDate, selectedWarehouse])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setWarehouses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch warehouses')
      setWarehouses([])
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate,
        endDate
      })

      if (selectedWarehouse) {
        params.append('warehouseId', selectedWarehouse)
      }

      const response = await fetch(`/api/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch report data')
      }

      const data = await response.json()
      setReportData(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (!reportData) {
      toast.error('No data to export')
      return
    }

    try {
      const warehouseName = selectedWarehouse
        ? warehouses.find(w => w.id === selectedWarehouse)?.name
        : undefined

      exportReportToExcel(reportData, startDate, endDate, warehouseName)
      toast.success('Report exported to Excel successfully!')
    } catch (error) {
      toast.error('Failed to export to Excel')
      console.error(error)
    }
  }

  const handleExportPDF = () => {
    if (!reportData) {
      toast.error('No data to export')
      return
    }

    try {
      const warehouseName = selectedWarehouse
        ? warehouses.find(w => w.id === selectedWarehouse)?.name
        : undefined

      exportReportToPDF(reportData, startDate, endDate, warehouseName)
      toast.success('Report exported to PDF successfully!')
    } catch (error) {
      toast.error('Failed to export to PDF')
      console.error(error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  }

  const handleExportChart = (chartId: string, filename: string) => {
    try {
      exportChartAsPNG(chartId, filename)
      toast.success('Chart exported successfully!')
    } catch (error) {
      toast.error('Failed to export chart')
      console.error(error)
    }
  }

  const handleExportAllCharts = () => {
    try {
      const chartIds = [
        'daily-sales-chart',
        'top-products-chart',
        'payment-methods-chart',
        'category-performance-chart',
        'cashier-performance-chart'
      ]
      exportAllChartsAsPNG(chartIds, 'all-reports')
      toast.success('All charts exported successfully!')
    } catch (error) {
      toast.error('Failed to export charts')
      console.error(error)
    }
  }

  const aggregateDataByViewMode = (data: any[]) => {
    if (viewMode === 'daily') return data

    const aggregated: { [key: string]: { date: string; revenue: number; transactions: number } } = {}

    data.forEach(item => {
      const date = new Date(item.date)
      let key = ''

      if (viewMode === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else if (viewMode === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!aggregated[key]) {
        aggregated[key] = { date: key, revenue: 0, transactions: 0 }
      }
      aggregated[key].revenue += item.revenue
      aggregated[key].transactions += item.transactions
    })

    return Object.values(aggregated)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-sm text-gray-400">Sales performance and insights</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportAllCharts}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <ImageIcon size={20} />
                Export Charts
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download size={20} />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Download size={20} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <div className="p-2 bg-green-900 rounded-lg">
                    <DollarSign size={20} className="text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Profit: {formatCurrency(reportData.summary.totalProfit)}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Transactions</p>
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <ShoppingCart size={20} className="text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {reportData.summary.totalTransactions}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Avg: {formatCurrency(reportData.summary.averageTransaction)}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Discount</p>
                  <div className="p-2 bg-yellow-900 rounded-lg">
                    <TrendingUp size={20} className="text-yellow-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(reportData.summary.totalDiscount)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Tax: {formatCurrency(reportData.summary.totalTax)}
                </p>
              </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sales Trend ({viewMode})</h3>
                <button
                  onClick={() => handleExportChart('daily-sales-chart', 'sales-trend')}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                  title="Export chart as image"
                >
                  <Download size={20} />
                </button>
              </div>
              <div id="daily-sales-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregateDataByViewMode(reportData.dailySales)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#9ca3af"
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Top 10 Products</h3>
                  <button
                    onClick={() => handleExportChart('top-products-chart', 'top-products')}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                    title="Export chart as image"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div id="top-products-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
                  <button
                    onClick={() => handleExportChart('payment-methods-chart', 'payment-methods')}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                    title="Export chart as image"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div id="payment-methods-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percent }) => `${method}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {reportData.paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category Performance & Cashier Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Performance */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Category Performance</h3>
                  <button
                    onClick={() => handleExportChart('category-performance-chart', 'category-performance')}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                    title="Export chart as image"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div id="category-performance-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cashier Performance */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Cashier Performance</h3>
                  <button
                    onClick={() => handleExportChart('cashier-performance-chart', 'cashier-performance')}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                    title="Export chart as image"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div id="cashier-performance-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.cashierPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Product Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Quantity Sold</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((product, index) => (
                      <tr key={product.productId} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-400">#{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                            <p className="font-semibold text-white">{product.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{product.quantity} units</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cashier Performance Table */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Cashier Performance Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cashier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Transactions</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Total Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Avg per Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cashierPerformance.map((cashier, index) => (
                      <tr key={cashier.cashierId} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-400">#{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Users size={20} className="text-gray-400" />
                            </div>
                            <p className="font-semibold text-white">{cashier.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{cashier.transactions}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {formatCurrency(cashier.revenue)}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {formatCurrency(cashier.revenue / cashier.transactions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <TrendingUp size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No data available</h3>
            <p className="text-gray-400">Select a date range to view reports</p>
          </div>
        )}
      </div>
    </div>
  )
}
