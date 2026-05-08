'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { CheckCircle, XCircle, Clock, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function JurnalSyncPage() {
  const router = useRouter()
  const { token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'synced' | 'pending' | 'error'>('all')
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) { router.push('/login'); return }
    fetchData()
  }, [filter, _hasHydrated])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jurnal/sync?status=${filter === 'all' ? '' : filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const retry = async (transactionId: string) => {
    setRetrying(transactionId)
    try {
      const res = await fetch('/api/jurnal/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      })
      const result = await res.json()
      if (res.ok) {
        toast.success('Sync berhasil!')
        fetchData()
      } else {
        toast.error(result.error || 'Sync gagal')
      }
    } finally {
      setRetrying(null)
    }
  }

  const stats = data?.stats

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Jurnal.id Sync Monitor</h1>
            <p className="text-sm text-gray-500">Status sinkronisasi transaksi POS ke Jurnal.id</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
              <p className="text-2xl font-bold text-green-600">{stats.synced}</p>
              <p className="text-sm text-gray-500">Tersinkron</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <Clock className="mx-auto text-yellow-500 mb-2" size={28} />
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <XCircle className="mx-auto text-red-500 mb-2" size={28} />
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              <p className="text-sm text-gray-500">Error</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'synced', 'pending', 'error'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'synced' ? '✅ Tersinkron' : f === 'pending' ? '⏳ Pending' : '❌ Error'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Kasir</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Customer</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tanggal</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Status Jurnal</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.transactions?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{t.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-700">{t.cashier?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{t.customer?.name ?? 'Walk-in'}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      Rp {t.total.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(t.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.jurnalSynced ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs">
                          <CheckCircle size={12} /> Synced
                          {t.jurnalId && (
                            <a
                              href={`https://app.jurnal.id/sales_invoices/${t.jurnalId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1"
                            >
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </span>
                      ) : t.jurnalError ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs" title={t.jurnalError}>
                          <XCircle size={12} /> Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full text-xs">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(t.jurnalError || !t.jurnalSynced) && (
                        <button
                          onClick={() => retry(t.id)}
                          disabled={retrying === t.id}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {retrying === t.id ? '...' : 'Sync'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data?.transactions?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
