'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useLicense } from '@/hooks/useLicense'
import { FeatureCode, ALL_FEATURE_LABELS } from '@/lib/license'
import { Lock, Zap, ArrowLeft } from 'lucide-react'

interface FeatureGuardProps {
  feature: FeatureCode
  children: ReactNode
  /** Jika true, redirect ke /license alih-alih tampilkan halaman terkunci */
  redirect?: boolean
}

export default function FeatureGuard({ feature, children, redirect = false }: FeatureGuardProps) {
  const { hasFeature, loading } = useLicense()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  // Fitur terkunci — tampilkan halaman upgrade
  if (redirect) {
    router.push('/license')
    return null
  }

  const featureLabel = ALL_FEATURE_LABELS[feature] || feature

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            <Lock className="w-10 h-10 text-gray-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">PRO</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Fitur Terkunci</h1>
        <p className="text-gray-400 mb-1">
          <span className="text-white font-semibold">{featureLabel}</span>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Fitur ini tidak termasuk dalam paket Anda saat ini.
          Hubungi developer untuk upgrade lisensi.
        </p>

        {/* Upgrade card */}
        <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border border-violet-700/50 rounded-2xl p-6 mb-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-violet-400" />
            <p className="font-semibold text-white">Cara Upgrade</p>
          </div>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-violet-400 font-bold shrink-0">1.</span>
              Hubungi developer untuk membeli fitur ini
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400 font-bold shrink-0">2.</span>
              Anda akan menerima License Key baru
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400 font-bold shrink-0">3.</span>
              Masukkan key di halaman Aktivasi Lisensi
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <button
            onClick={() => router.push('/license')}
            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors"
          >
            Aktivasi Lisensi
          </button>
        </div>
      </div>
    </div>
  )
}
