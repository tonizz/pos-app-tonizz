'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { useLicense } from '@/hooks/useLicense'
import { ALL_FEATURE_LABELS, FREE_FEATURES, FeatureCode } from '@/lib/license'
import toast, { Toaster } from 'react-hot-toast'
import {
  Key,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Shield,
  Calendar,
  User,
  Lock,
  Unlock,
  Trash2,
} from 'lucide-react'

export default function LicensePage() {
  const router = useRouter()
  const { token, user, isAuthenticated, _hasHydrated } = useAuthStore()
  const { licenseInfo, licenseKey, loading, refresh } = useLicense()
  const [inputKey, setInputKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) router.push('/login')
  }, [_hasHydrated])

  const handleActivate = async () => {
    if (!inputKey.trim()) {
      toast.error('Masukkan license key terlebih dahulu')
      return
    }
    setActivating(true)
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ licenseKey: inputKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengaktifkan lisensi')
        return
      }
      toast.success('🎉 Lisensi berhasil diaktifkan!')
      setInputKey('')
      refresh()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setActivating(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Hapus lisensi? Fitur premium akan terkunci kembali.')) return
    setRemoving(true)
    try {
      const res = await fetch('/api/license', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Lisensi dihapus')
        refresh()
      }
    } catch {
      toast.error('Gagal menghapus lisensi')
    } finally {
      setRemoving(false)
    }
  }

  const allFeatures = Object.keys(ALL_FEATURE_LABELS) as FeatureCode[]
  const activeFeatures = licenseInfo?.features || []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Aktivasi Lisensi</h1>
            <p className="text-sm text-gray-500">Kelola fitur yang aktif di aplikasi ini</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Status Lisensi */}
        {!loading && (
          <div className={`rounded-2xl p-5 border ${
            licenseInfo && !licenseInfo.isExpired
              ? 'bg-green-950/30 border-green-800/50'
              : 'bg-gray-900 border-gray-800'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  licenseInfo && !licenseInfo.isExpired ? 'bg-green-500/20' : 'bg-gray-700'
                }`}>
                  <Shield size={20} className={licenseInfo && !licenseInfo.isExpired ? 'text-green-400' : 'text-gray-500'} />
                </div>
                <div>
                  <p className="font-semibold">Status Lisensi</p>
                  <p className={`text-sm ${
                    licenseInfo && !licenseInfo.isExpired ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {licenseInfo && !licenseInfo.isExpired
                      ? '✅ Aktif'
                      : licenseInfo?.isExpired
                        ? '❌ Expired'
                        : '⚪ Tidak ada lisensi (mode gratis)'}
                  </p>
                </div>
              </div>
              {licenseInfo && !licenseInfo.isExpired && user?.role === 'SUPER_ADMIN' && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              )}
            </div>

            {licenseInfo && !licenseInfo.isExpired && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <User size={14} className="text-gray-500 shrink-0" />
                  <span className="truncate">{licenseInfo.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={14} className="text-gray-500 shrink-0" />
                  <span>
                    {licenseInfo.licenseType === 'lifetime'
                      ? 'Lifetime'
                      : licenseInfo.daysRemaining !== null
                        ? `${licenseInfo.daysRemaining} hari lagi`
                        : 'Berlangganan'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aktivasi Key */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key size={18} className="text-violet-400" />
              <p className="font-semibold">Masukkan License Key</p>
            </div>
            <textarea
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="Paste license key di sini..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
            />
            <button
              onClick={handleActivate}
              disabled={activating || !inputKey.trim()}
              className="mt-3 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {activating ? 'Mengaktifkan...' : '🔓 Aktifkan Lisensi'}
            </button>
          </div>
        )}

        {/* Daftar Fitur */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="font-semibold mb-4">Daftar Fitur</p>
          <div className="space-y-2">
            {allFeatures.map(feature => {
              const isFree = FREE_FEATURES.includes(feature)
              const isActive = isFree || activeFeatures.includes(feature)
              return (
                <div
                  key={feature}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-green-950/20 border-green-900/40'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isActive
                      ? <Unlock size={16} className="text-green-400 shrink-0" />
                      : <Lock size={16} className="text-gray-600 shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {ALL_FEATURE_LABELS[feature]}
                      </p>
                      {isFree && (
                        <p className="text-xs text-emerald-500">Gratis</p>
                      )}
                    </div>
                  </div>
                  {isActive
                    ? <CheckCircle size={18} className={isFree ? 'text-emerald-400' : 'text-green-400'} />
                    : <XCircle size={18} className="text-gray-600" />
                  }
                </div>
              )
            })}
          </div>
        </div>

        {/* Info kontak */}
        <div className="bg-violet-950/30 border border-violet-800/40 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-400">
            Ingin upgrade atau beli fitur tambahan?
          </p>
          <p className="text-sm font-semibold text-violet-300 mt-1">
            Hubungi developer untuk mendapatkan License Key
          </p>
        </div>
      </div>
    </div>
  )
}
