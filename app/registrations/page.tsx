'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { CheckCircle, XCircle, Clock, Users, ArrowLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Registration {
  id: string
  name: string
  email: string
  nrp: string | null
  position: string | null
  phone: string | null
  isApproved: boolean
  isActive: boolean
  createdAt: string
}

export default function RegistrationsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [list, setList] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/registrations?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setList(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    fetchList()
  }, [filter, token])

  const handleAction = async (userId: string, action: 'approve' | 'reject', name: string) => {
    setProcessing(userId)
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(action === 'approve' ? `${name} disetujui` : `${name} ditolak`)
        fetchList()
      } else {
        toast.error(data.error)
      }
    } finally {
      setProcessing(null)
    }
  }

  const pending = list.filter(u => !u.isApproved)

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Approval Registrasi</h1>
            <p className="text-sm text-gray-500">Setujui atau tolak pendaftaran akun sales baru</p>
          </div>
          {pending.length > 0 && (
            <span className="ml-auto bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'pending' ? '⏳ Pending' : f === 'approved' ? '✅ Disetujui' : '📋 Semua'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {filter === 'pending' ? 'Tidak ada pendaftaran yang menunggu' : 'Tidak ada data'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(reg => (
              <div key={reg.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{reg.name}</h3>
                      {reg.isApproved ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{reg.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {reg.nrp && <span>NRP: <b>{reg.nrp}</b></span>}
                      {reg.position && <span>Posisi: <b>{reg.position}</b></span>}
                      {reg.phone && <span>HP: <b>{reg.phone}</b></span>}
                      <span>Daftar: {new Date(reg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {!reg.isApproved && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        disabled={processing === reg.id}
                        onClick={() => handleAction(reg.id, 'approve', reg.name)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={16} />
                        Setujui
                      </button>
                      <button
                        disabled={processing === reg.id}
                        onClick={() => handleAction(reg.id, 'reject', reg.name)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <XCircle size={16} />
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
