'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import FeatureGuard from '@/components/FeatureGuard'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Package,
  BarChart3,
  ArrowLeft,
  Warehouse,
  RefreshCw,
  Users,
  ChevronRight,
  Zap,
} from 'lucide-react'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  return formatCurrency(value)
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Selamat Pagi'
  if (h < 15) return 'Selamat Siang'
  if (h < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

function formatDayDate(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function OwnerDashboardPage() {
  return (
    <FeatureGuard feature="owner_dashboard">
      <OwnerDashboardContent />
    </FeatureGuard>
  )
}

function OwnerDashboardContent() {
  const router = useRouter()
  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Live clock
  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      )
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      try {
        const res = await fetch('/api/owner-dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Gagal memuat data')
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        toast.error(e.message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    if (!ALLOWED_ROLES.includes(user?.role || '')) {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [_hasHydrated])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const summary = data?.summary || {}
  const weeklyChart: { date: string; revenue: number; transactions: number }[] =
    data?.weeklyChart || []
  const topProducts: any[] = data?.topProducts || []
  const recentTransactions: any[] = data?.recentTransactions || []
  const lowStockItems: any[] = data?.lowStockItems || []
  const activeShifts: any[] = data?.activeShifts || []

  const maxWeeklyRevenue = Math.max(...weeklyChart.map((d) => d.revenue), 1)

  const revenueGrowthPositive = summary.revenueGrowth >= 0

  return (
    <div className="min-h-screen bg-gray-950 text-white" suppressHydrationWarning>
      <Toaster position="top-center" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-xs text-gray-500">{getGreeting()},</p>
            <p className="font-bold text-white leading-tight">{user?.name}</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            className={`p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4 pt-4">

        {/* ── Date & Time ── */}
        <div className="text-center">
          <p className="text-3xl font-bold text-white tabular-nums">{currentTime}</p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{formatDayDate()}</p>
        </div>

        {/* ── Revenue Hero Card ── */}
        <div
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
          }}
        >
          {/* glow */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

          <p className="text-violet-200 text-xs font-medium mb-1">Revenue Hari Ini</p>
          <p className="text-3xl font-extrabold tracking-tight mb-3">
            {formatCompact(summary.todayRevenue || 0)}
          </p>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                revenueGrowthPositive
                  ? 'bg-green-500/30 text-green-200'
                  : 'bg-red-500/30 text-red-200'
              }`}
            >
              {revenueGrowthPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {revenueGrowthPositive ? '+' : ''}{summary.revenueGrowth || 0}% vs kemarin
            </span>
          </div>

          <p className="text-violet-300 text-xs mt-2">
            Kemarin: {formatCompact(summary.yesterdayRevenue || 0)}
          </p>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Transaksi */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center mb-1">
              <ShoppingCart size={16} className="text-blue-400" />
            </div>
            <p className="text-xl font-bold">{summary.todayTransactions || 0}</p>
            <p className="text-xs text-gray-500">Transaksi</p>
            {summary.txGrowth !== undefined && (
              <p className={`text-xs font-medium ${summary.txGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.txGrowth >= 0 ? '+' : ''}{summary.txGrowth}%
              </p>
            )}
          </div>

          {/* Avg Transaksi */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1">
              <Zap size={16} className="text-emerald-400" />
            </div>
            <p className="text-lg font-bold leading-tight">
              {formatCompact(summary.avgTransaction || 0)}
            </p>
            <p className="text-xs text-gray-500">Avg/Trx</p>
          </div>

          {/* Stok Kritis */}
          <div
            className={`border rounded-2xl p-4 flex flex-col gap-1 ${
              summary.lowStockCount > 0
                ? 'bg-red-950/50 border-red-800/60'
                : 'bg-gray-900 border-gray-800'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${
                summary.lowStockCount > 0 ? 'bg-red-500/30' : 'bg-gray-700'
              }`}
            >
              <AlertTriangle
                size={16}
                className={summary.lowStockCount > 0 ? 'text-red-400' : 'text-gray-500'}
              />
            </div>
            <p
              className={`text-xl font-bold ${summary.lowStockCount > 0 ? 'text-red-400' : ''}`}
            >
              {summary.lowStockCount || 0}
            </p>
            <p className="text-xs text-gray-500">Stok Kritis</p>
          </div>
        </div>

        {/* ── Shift Aktif ── */}
        {activeShifts.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-400" />
              <p className="text-sm font-semibold">Shift Aktif</p>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                {activeShifts.length} kasir
              </span>
            </div>
            <div className="space-y-2">
              {activeShifts.map((shift: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Users size={12} className="text-amber-400" />
                    </div>
                    <p className="text-sm text-gray-300">{shift.cashierName}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(shift.openedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mini Chart 7 Hari ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-violet-400" />
            <p className="text-sm font-semibold">Omzet 7 Hari Terakhir</p>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {weeklyChart.map((day, i) => {
              const heightPct = (day.revenue / maxWeeklyRevenue) * 100
              const isToday = i === weeklyChart.length - 1
              const dateLabel = new Date(day.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end h-16">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday
                          ? 'bg-violet-500'
                          : day.revenue > 0
                            ? 'bg-gray-600'
                            : 'bg-gray-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, day.revenue > 0 ? 8 : 4)}%` }}
                      title={`${dateLabel}: ${formatCurrency(day.revenue)}`}
                    />
                  </div>
                  <p className={`text-[9px] leading-none ${isToday ? 'text-violet-400 font-bold' : 'text-gray-600'}`}>
                    {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex justify-between mt-2">
            {weeklyChart.map((day) => (
              <p key={day.date} className="flex-1 text-center text-[8px] text-gray-600">
                {day.revenue > 0 ? formatCompact(day.revenue).replace('Rp ', '') : '—'}
              </p>
            ))}
          </div>
        </div>

        {/* ── Top 5 Produk Hari Ini ── */}
        {topProducts.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-emerald-400" />
              <p className="text-sm font-semibold">Top Produk Hari Ini</p>
            </div>
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => {
                const maxQty = topProducts[0]?.totalQty || 1
                const barWidth = (p.totalQty / maxQty) * 100
                return (
                  <div key={p.productId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`text-xs font-bold w-5 text-center rounded-full shrink-0 ${
                            i === 0
                              ? 'text-amber-400'
                              : i === 1
                                ? 'text-gray-300'
                                : i === 2
                                  ? 'text-orange-700'
                                  : 'text-gray-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-200 truncate">{p.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-white ml-2 shrink-0">
                        {p.totalQty} pcs
                      </p>
                    </div>
                    <div className="ml-7 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          i === 0
                            ? 'bg-gradient-to-r from-violet-500 to-purple-400'
                            : 'bg-gray-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Transaksi Terbaru ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-400" />
              <p className="text-sm font-semibold">Transaksi Terbaru</p>
            </div>
            <button
              onClick={() => router.push('/transactions')}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              Semua <ChevronRight size={12} />
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Belum ada transaksi hari ini</p>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-violet-400">{t.invoiceNo}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {t.customer} · {t.cashier}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold">{formatCompact(t.total)}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(t.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Stok Kritis ── */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-sm font-semibold text-red-300">Stok Kritis</p>
              </div>
              <button
                onClick={() => router.push('/inventory')}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                Kelola <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-600">{item.warehouse}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-red-400">{item.quantity}</p>
                    <p className="text-xs text-gray-600">min: {item.minStock}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{lowStockItems.length - 5} produk lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/pos')}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
          >
            <ShoppingCart size={22} />
            <p className="text-xs font-semibold">Kasir</p>
          </button>
          <button
            onClick={() => router.push('/reports')}
            className="bg-violet-600 hover:bg-violet-700 active:scale-95 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
          >
            <BarChart3 size={22} />
            <p className="text-xs font-semibold">Laporan</p>
          </button>
          <button
            onClick={() => router.push('/inventory')}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
          >
            <Warehouse size={22} />
            <p className="text-xs font-semibold">Inventory</p>
          </button>
        </div>

        {/* ── Analytics shortcut ── */}
        <button
          onClick={() => router.push('/analytics')}
          className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-violet-700 active:scale-[0.99] rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Advanced Analytics</p>
              <p className="text-xs text-gray-500">Tren, jam ramai, produk terlaris</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
    </div>
  )
}
