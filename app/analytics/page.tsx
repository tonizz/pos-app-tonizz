'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import {
  TrendingUp,
  Clock,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  const [salesTrends, setSalesTrends] = useState<any>(null)
  const [peakHours, setPeakHours] = useState<any>(null)
  const [customerPatterns, setCustomerPatterns] = useState<any>(null)
  const [productCorrelation, setProductCorrelation] = useState<any>(null)
  const [profitMargin, setProfitMargin] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchAllAnalytics()
  }, [period])

  const fetchAllAnalytics = async () => {
    setLoading(true)
    try {
      const headers = { 'Authorization': `Bearer ${token}` }

      const [trends, hours, patterns, correlation, margin] = await Promise.all([
        fetch(`/api/analytics/sales-trends?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/peak-hours?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/customer-patterns?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/product-correlation?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/profit-margin?days=${period}`, { headers }).then(r => r.json())
      ])

      setSalesTrends(trends)
      setPeakHours(hours)
      setCustomerPatterns(patterns)
      setProductCorrelation(correlation)
      setProfitMargin(margin)
    } catch (error: any) {
      toast.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
                <p className="text-sm text-gray-400">Business insights and forecasting</p>
              </div>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Sales Trends & Forecast */}
        {salesTrends && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Sales Trends & Forecast</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Growth Rate</p>
                <p className={`text-2xl font-bold ${parseFloat(salesTrends.summary.growthRate) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {salesTrends.summary.growthRate}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(salesTrends.summary.totalSales)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Daily Sales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(salesTrends.summary.avgDailySales)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-white">{salesTrends.summary.totalTransactions}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Transaction</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(salesTrends.summary.totalSales / salesTrends.summary.totalTransactions || 0)}
                </p>
              </div>
            </div>

            {/* Forecast */}
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">7-Day Forecast</h3>
              <div className="grid grid-cols-7 gap-2">
                {salesTrends.forecast.map((day: any, index: number) => (
                  <div key={index} className="text-center">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(day.predictedTotal)}
                    </p>
                    <p className="text-xs text-gray-500">{(day.confidence * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Peak Hours & Days */}
        {peakHours && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">Peak Hours</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Busiest Hour</p>
                  <p className="text-2xl font-bold text-green-400">{peakHours.insights.peakHour.hour}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.peakHour.total)} • {peakHours.insights.peakHour.transactions} transactions</p>
                </div>
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Slowest Hour</p>
                  <p className="text-2xl font-bold text-red-400">{peakHours.insights.slowestHour.hour}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.slowestHour.total)} • {peakHours.insights.slowestHour.transactions} transactions</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {peakHours.hourlyData
                  .filter((h: any) => h.count > 0)
                  .sort((a: any, b: any) => b.total - a.total)
                  .slice(0, 10)
                  .map((hour: any) => (
                    <div key={hour.hour} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-sm text-gray-300">{hour.hourLabel}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(hour.total)}</p>
                        <p className="text-xs text-gray-500">{hour.count} trans</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Peak Days</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Busiest Day</p>
                  <p className="text-2xl font-bold text-green-400">{peakHours.insights.peakDay.day}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.peakDay.total)} • {peakHours.insights.peakDay.transactions} transactions</p>
                </div>
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Slowest Day</p>
                  <p className="text-2xl font-bold text-red-400">{peakHours.insights.slowestDay.day}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.slowestDay.total)} • {peakHours.insights.slowestDay.transactions} transactions</p>
                </div>
              </div>

              <div className="space-y-2">
                {peakHours.dailyData
                  .sort((a: any, b: any) => b.total - a.total)
                  .map((day: any) => (
                    <div key={day.day} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-sm text-gray-300">{day.dayName}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(day.total)}</p>
                        <p className="text-xs text-gray-500">{day.count} trans</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Patterns */}
        {customerPatterns && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-pink-400" />
              <h2 className="text-xl font-bold text-white">Customer Behavior Analysis</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-white">{customerPatterns.summary.totalCustomers}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-400">{customerPatterns.summary.vipCustomers}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(customerPatterns.summary.avgOrderValue)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Transactions</p>
                <p className="text-2xl font-bold text-white">{customerPatterns.summary.avgTransactionsPerCustomer.toFixed(1)}</p>
              </div>
            </div>

            {/* RFM Segments */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Champions</p>
                <p className="text-3xl font-bold text-yellow-400">{customerPatterns.segments.champions}</p>
              </div>
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Loyal</p>
                <p className="text-3xl font-bold text-green-400">{customerPatterns.segments.loyal}</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Potential</p>
                <p className="text-3xl font-bold text-blue-400">{customerPatterns.segments.potential}</p>
              </div>
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">At Risk</p>
                <p className="text-3xl font-bold text-red-400">{customerPatterns.segments.atRisk}</p>
              </div>
            </div>

            {/* Top Customers */}
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Top 10 Customers</h3>
            <div className="space-y-2">
              {customerPatterns.topCustomers.map((customer: any, index: number) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.totalTransactions} transactions • {customer.memberTier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-xs text-gray-400">Avg: {formatCurrency(customer.avgOrderValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Correlation */}
        {productCorrelation && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Frequently Bought Together</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Product Pairs</p>
                <p className="text-2xl font-bold text-white">{productCorrelation.summary.totalProductPairs}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Items/Transaction</p>
                <p className="text-2xl font-bold text-white">{productCorrelation.summary.avgItemsPerTransaction.toFixed(1)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{productCorrelation.summary.totalTransactions}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Product Combinations</h3>
            <div className="space-y-2">
              {productCorrelation.correlations.slice(0, 10).map((pair: any, index: number) => (
                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{pair.product1.name}</p>
                      <p className="text-xs text-gray-400">+</p>
                      <p className="text-sm font-semibold text-white">{pair.product2.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-400">{(pair.confidence * 100).toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{pair.count} times</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-1 bg-gray-600 rounded text-gray-300">
                      Support: {(pair.support * 100).toFixed(1)}%
                    </span>
                    <span className="px-2 py-1 bg-gray-600 rounded text-gray-300">
                      Lift: {pair.lift.toFixed(2)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit Margin Analysis */}
        {profitMargin && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Profit Margin Analysis</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(profitMargin.summary.totalRevenue)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(profitMargin.summary.totalCost)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(profitMargin.summary.totalProfit)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Overall Margin</p>
                <p className="text-2xl font-bold text-green-400">{profitMargin.summary.overallMargin}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Top by Profit */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Top 10 by Profit</h3>
                <div className="space-y-2">
                  {profitMargin.topByProfit.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-green-400">{formatCurrency(product.profit)}</p>
                        <p className="text-xs text-gray-400">{product.profitMargin.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Margin Products */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Low Margin Products (Need Attention)</h3>
                <div className="space-y-2">
                  {profitMargin.lowMarginProducts.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-900/20 border border-red-800 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-red-400">{product.profitMargin.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">{formatCurrency(product.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Profitability */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Profitability by Category</h3>
              <div className="space-y-2">
                {profitMargin.categoryProfitability.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{category.category}</p>
                      <p className="text-xs text-gray-400">{category.productCount} products • {category.quantitySold} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(category.profit)}</p>
                      <p className="text-sm text-green-400">{category.profitMargin.toFixed(1)}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
