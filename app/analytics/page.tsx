'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import FeatureGuard from '@/components/FeatureGuard'
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
  Activity,
  Flame,
  Package
} from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <FeatureGuard feature="analytics">
      <AnalyticsContent />
    </FeatureGuard>
  )
}

function AnalyticsContent() {
  const router = useRouter()
  const { token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  const [salesTrends, setSalesTrends] = useState<any>(null)
  const [peakHours, setPeakHours] = useState<any>(null)
  const [customerPatterns, setCustomerPatterns] = useState<any>(null)
  const [productCorrelation, setProductCorrelation] = useState<any>(null)
  const [profitMargin, setProfitMargin] = useState<any>(null)
  const [topByHour, setTopByHour] = useState<any>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  useEffect(() => {
      if (!_hasHydrated) return
      if (!isAuthenticated()) {
        router.push('/login')
        return
      }
      fetchAllAnalytics()
    }, [period, _hasHydrated])

  const fetchAllAnalytics = async () => {
    setLoading(true)
    try {
      const headers = { 'Authorization': `Bearer ${token}` }

      const [trends, hours, patterns, correlation, margin, byHour] = await Promise.all([
        fetch(`/api/analytics/sales-trends?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/peak-hours?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/customer-patterns?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/product-correlation?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/profit-margin?days=${period}`, { headers }).then(r => r.json()),
        fetch(`/api/analytics/top-products-by-hour?days=${period}`, { headers }).then(r => r.json()),
      ])

      setSalesTrends(trends)
      setPeakHours(hours)
      setCustomerPatterns(patterns)
      setProductCorrelation(correlation)
      setProfitMargin(margin)
      setTopByHour(byHour)
      // Auto-select jam puncak
      if (hours?.insights?.peakHour?.hour) {
        const peakH = parseInt(hours.insights.peakHour.hour.split(':')[0])
        setSelectedHour(peakH)
      }
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
        {salesTrends && salesTrends.summary && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Sales Trends & Forecast</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Growth Rate</p>
                <p className={`text-2xl font-bold ${parseFloat(salesTrends.summary.growthRate || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {salesTrends.summary.growthRate || '0.00'}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(salesTrends.summary.totalSales || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Daily Sales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(salesTrends.summary.avgDailySales || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-white">{salesTrends.summary.totalTransactions || 0}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Transaction</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency((salesTrends.summary.totalSales || 0) / (salesTrends.summary.totalTransactions || 1))}
                </p>
              </div>
            </div>

            {/* Forecast */}
            {salesTrends.forecast && salesTrends.forecast.length > 0 && (
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">7-Day Forecast</h3>
              <div className="grid grid-cols-7 gap-2">
                {salesTrends.forecast.map((day: any, index: number) => (
                  <div key={index} className="text-center">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(day.predictedTotal || 0)}
                    </p>
                    <p className="text-xs text-gray-500">{((day.confidence || 0) * 100).toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* Peak Hours & Days */}
        {peakHours && peakHours.insights && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">Peak Hours</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Busiest Hour</p>
                  <p className="text-2xl font-bold text-green-400">{peakHours.insights.peakHour?.hour || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.peakHour?.total || 0)} • {peakHours.insights.peakHour?.transactions || 0} transactions</p>
                </div>
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Slowest Hour</p>
                  <p className="text-2xl font-bold text-red-400">{peakHours.insights.slowestHour?.hour || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.slowestHour?.total || 0)} • {peakHours.insights.slowestHour?.transactions || 0} transactions</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {peakHours.hourlyData && peakHours.hourlyData
                  .filter((h: any) => h.count > 0)
                  .sort((a: any, b: any) => b.total - a.total)
                  .slice(0, 10)
                  .map((hour: any) => (
                    <div key={hour.hour} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-sm text-gray-300">{hour.hourLabel}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(hour.total || 0)}</p>
                        <p className="text-xs text-gray-500">{hour.count || 0} trans</p>
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
                  <p className="text-2xl font-bold text-green-400">{peakHours.insights.peakDay?.day || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.peakDay?.total || 0)} • {peakHours.insights.peakDay?.transactions || 0} transactions</p>
                </div>
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Slowest Day</p>
                  <p className="text-2xl font-bold text-red-400">{peakHours.insights.slowestDay?.day || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{formatCurrency(peakHours.insights.slowestDay?.total || 0)} • {peakHours.insights.slowestDay?.transactions || 0} transactions</p>
                </div>
              </div>

              <div className="space-y-2">
                {peakHours.dailyData && peakHours.dailyData
                  .sort((a: any, b: any) => b.total - a.total)
                  .map((day: any) => (
                    <div key={day.day} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-sm text-gray-300">{day.dayName}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(day.total || 0)}</p>
                        <p className="text-xs text-gray-500">{day.count || 0} trans</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Patterns */}
        {customerPatterns && customerPatterns.summary && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-6 h-6 text-pink-400" />
              <h2 className="text-xl font-bold text-white">Customer Behavior Analysis</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-white">{customerPatterns.summary.totalCustomers || 0}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-400">{customerPatterns.summary.vipCustomers || 0}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(customerPatterns.summary.avgOrderValue || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Transactions</p>
                <p className="text-2xl font-bold text-white">{(customerPatterns.summary.avgTransactionsPerCustomer || 0).toFixed(1)}</p>
              </div>
            </div>

            {/* RFM Segments */}
            {customerPatterns.segments && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Champions</p>
                <p className="text-3xl font-bold text-yellow-400">{customerPatterns.segments.champions || 0}</p>
              </div>
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Loyal</p>
                <p className="text-3xl font-bold text-green-400">{customerPatterns.segments.loyal || 0}</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">Potential</p>
                <p className="text-3xl font-bold text-blue-400">{customerPatterns.segments.potential || 0}</p>
              </div>
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-1">At Risk</p>
                <p className="text-3xl font-bold text-red-400">{customerPatterns.segments.atRisk || 0}</p>
              </div>
            </div>
            )}

            {/* Top Customers */}
            {customerPatterns.topCustomers && customerPatterns.topCustomers.length > 0 && (
            <>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Top 10 Customers</h3>
            <div className="space-y-2">
              {customerPatterns.topCustomers.map((customer: any, index: number) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.totalTransactions || 0} transactions • {customer.memberTier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(customer.totalSpent || 0)}</p>
                    <p className="text-xs text-gray-400">Avg: {formatCurrency(customer.avgOrderValue || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        )}

        {/* Product Correlation */}
        {productCorrelation && productCorrelation.summary && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Frequently Bought Together</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Product Pairs</p>
                <p className="text-2xl font-bold text-white">{productCorrelation.summary.totalProductPairs || 0}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Avg Items/Transaction</p>
                <p className="text-2xl font-bold text-white">{(productCorrelation.summary.avgItemsPerTransaction || 0).toFixed(1)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{productCorrelation.summary.totalTransactions || 0}</p>
              </div>
            </div>

            {productCorrelation.correlations && productCorrelation.correlations.length > 0 && (
            <>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Product Combinations</h3>
            <div className="space-y-2">
              {productCorrelation.correlations.slice(0, 10).map((pair: any, index: number) => (
                <div key={index} className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{pair.product1?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">+</p>
                      <p className="text-sm font-semibold text-white">{pair.product2?.name || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-400">{((pair.confidence || 0) * 100).toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{pair.count || 0} times</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-1 bg-gray-600 rounded text-gray-300">
                      Support: {((pair.support || 0) * 100).toFixed(1)}%
                    </span>
                    <span className="px-2 py-1 bg-gray-600 rounded text-gray-300">
                      Lift: {(pair.lift || 0).toFixed(2)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        )}

        {/* Profit Margin Analysis */}
        {profitMargin && profitMargin.summary && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Profit Margin Analysis</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(profitMargin.summary.totalRevenue || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Cost</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(profitMargin.summary.totalCost || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(profitMargin.summary.totalProfit || 0)}</p>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Overall Margin</p>
                <p className="text-2xl font-bold text-green-400">{profitMargin.summary.overallMargin || '0.00'}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Top by Profit */}
              {profitMargin.topByProfit && profitMargin.topByProfit.length > 0 && (
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
                        <p className="text-sm font-bold text-green-400">{formatCurrency(product.profit || 0)}</p>
                        <p className="text-xs text-gray-400">{(product.profitMargin || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Low Margin Products */}
              {profitMargin.lowMarginProducts && profitMargin.lowMarginProducts.length > 0 && (
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
                        <p className="text-sm font-bold text-red-400">{(product.profitMargin || 0).toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">{formatCurrency(product.profit || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Category Profitability */}
            {profitMargin.categoryProfitability && profitMargin.categoryProfitability.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Profitability by Category</h3>
              <div className="space-y-2">
                {profitMargin.categoryProfitability.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{category.category}</p>
                      <p className="text-xs text-gray-400">{category.productCount || 0} products • {category.quantitySold || 0} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(category.profit || 0)}</p>
                      <p className="text-sm text-green-400">{(category.profitMargin || 0).toFixed(1)}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── Top Products by Hour ── */}
        {topByHour && topByHour.heatmapData && topByHour.heatmapData.length > 0 && (() => {
          const heatmap: any[] = topByHour.heatmapData
          const hourlyTop: any[] = topByHour.hourlyTopProducts || []
          const maxQty: number = topByHour.maxQty || 1

          const activeHourData = selectedHour !== null
            ? hourlyTop.find((h: any) => h.hour === selectedHour)
            : null

          // Jam yang punya data
          const activeHours = hourlyTop.filter((h: any) => h.totalQty > 0).map((h: any) => h.hour)

          return (
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Flame className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">Produk Terlaris per Jam</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Klik jam di bawah untuk melihat ranking produk terlaris pada jam tersebut.
              </p>

              {/* ── Jam Selector ── */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Pilih Jam</p>
                <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
                  {Array.from({ length: 24 }, (_, h) => {
                    const hData = hourlyTop.find((d: any) => d.hour === h)
                    const hasData = (hData?.totalQty || 0) > 0
                    const isSelected = selectedHour === h
                    const intensity = hasData ? (hData.totalQty / Math.max(...hourlyTop.map((d: any) => d.totalQty), 1)) : 0
                    return (
                      <button
                        key={h}
                        onClick={() => setSelectedHour(h)}
                        title={`${String(h).padStart(2,'0')}:00 — ${hData?.totalQty || 0} pcs`}
                        className={`relative rounded-lg py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? 'ring-2 ring-orange-400 scale-110 z-10'
                            : 'hover:scale-105'
                        } ${
                          !hasData ? 'bg-gray-700 text-gray-600' : ''
                        }`}
                        style={hasData ? {
                          background: isSelected
                            ? `rgba(249, 115, 22, ${0.4 + intensity * 0.6})`
                            : `rgba(249, 115, 22, ${0.15 + intensity * 0.55})`,
                          color: isSelected ? '#fff' : `rgba(255,255,255,${0.5 + intensity * 0.5})`,
                        } : {}}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-700" />
                    <span>Tidak ada transaksi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: 'rgba(249,115,22,0.3)' }} />
                    <span>Sepi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: 'rgba(249,115,22,0.9)' }} />
                    <span>Ramai</span>
                  </div>
                </div>
              </div>

              {/* ── Ranking Produk Jam Terpilih ── */}
              {activeHourData && activeHourData.topProducts.length > 0 ? (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-400" />
                      <h3 className="font-semibold text-white">
                        Jam {activeHourData.hourLabel}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-400">
                      Total: <span className="font-bold text-white">{activeHourData.totalQty} pcs</span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeHourData.topProducts.map((p: any, idx: number) => {
                      const barW = (p.qty / activeHourData.topProducts[0].qty) * 100
                      return (
                        <div key={p.productId}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-sm font-bold w-6 text-center ${
                                idx === 0 ? 'text-amber-400' :
                                idx === 1 ? 'text-gray-300' :
                                idx === 2 ? 'text-orange-700' : 'text-gray-500'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="text-sm text-gray-200 truncate">{p.name}</p>
                            </div>
                            <div className="text-right ml-3 shrink-0">
                              <p className="text-sm font-bold text-white">{p.qty} pcs</p>
                              <p className="text-xs text-gray-500">{formatCurrency(p.revenue)}</p>
                            </div>
                          </div>
                          <div className="ml-8 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barW}%`,
                                background: idx === 0
                                  ? 'linear-gradient(90deg, #f97316, #fb923c)'
                                  : 'rgba(249,115,22,0.4)',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : selectedHour !== null ? (
                <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-8 text-center">
                  <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada transaksi pada jam {String(selectedHour).padStart(2,'0')}:00</p>
                </div>
              ) : (
                <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-500">Pilih jam di atas untuk melihat detail produk</p>
                </div>
              )}

              {/* ── Heatmap Tabel ── */}
              <div className="mt-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Heatmap Penjualan</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse" style={{ minWidth: '700px' }}>
                    <thead>
                      <tr>
                        <th className="text-left py-2 pr-3 text-gray-400 font-medium w-36 sticky left-0 bg-gray-800 z-10">Produk</th>
                        {Array.from({ length: 24 }, (_, h) => (
                          <th
                            key={h}
                            className={`text-center py-2 px-0.5 font-medium cursor-pointer transition-colors ${
                              selectedHour === h ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                            onClick={() => setSelectedHour(h)}
                          >
                            {String(h).padStart(2,'0')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmap.map((row: any) => (
                        <tr key={row.productId} className="hover:bg-gray-700/30">
                          <td className="py-1.5 pr-3 text-gray-300 truncate max-w-[144px] sticky left-0 bg-gray-800 z-10"
                              title={row.name}>
                            {row.name}
                          </td>
                          {row.hourData.map((cell: any) => {
                            const intensity = cell.qty > 0 ? cell.qty / maxQty : 0
                            const isSelectedCol = selectedHour === cell.hour
                            return (
                              <td
                                key={cell.hour}
                                className={`text-center py-1.5 px-0.5 cursor-pointer transition-all ${
                                  isSelectedCol ? 'ring-1 ring-orange-500/50' : ''
                                }`}
                                onClick={() => setSelectedHour(cell.hour)}
                                title={cell.qty > 0 ? `${row.name} — ${String(cell.hour).padStart(2,'0')}:00 — ${cell.qty} pcs` : ''}
                              >
                                <div
                                  className="w-5 h-5 rounded mx-auto"
                                  style={{
                                    background: cell.qty > 0
                                      ? `rgba(249,115,22,${0.12 + intensity * 0.85})`
                                      : 'transparent',
                                  }}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
