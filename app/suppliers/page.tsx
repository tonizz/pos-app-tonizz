'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { Truck, Plus, Edit, Trash2, Search, ArrowLeft, X, Phone, Mail, MapPin, History, CreditCard, DollarSign } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  debt: number
  _count?: { products: number }
  createdAt: string
  updatedAt: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const { token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [mounted, setMounted] = useState(false)
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null)
  const [detailTab, setDetailTab] = useState<'transactions' | 'payment'>('transactions')
  const [transactions, setTransactions] = useState<any[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payNotes, setPayNotes] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
      if (!_hasHydrated) return
      if (!isAuthenticated()) {
        router.push('/login')
        return
      }
      fetchSuppliers()
    }, [, _hasHydrated])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchSuppliers()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/suppliers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      toast.error('Failed to fetch suppliers')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({ name: '', phone: '', email: '', address: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSupplier(null)
    setFormData({ name: '', phone: '', email: '', address: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }

    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : '/api/suppliers'

      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save supplier')
      }

      toast.success(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully`)
      handleCloseModal()
      fetchSuppliers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openDetail = async (supplier: Supplier) => {
    setDetailSupplier(supplier)
    setDetailTab('transactions')
    setTxLoading(true)
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setTransactions(await res.json())
    } finally {
      setTxLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!detailSupplier || !payAmount) return
    try {
      const res = await fetch(`/api/suppliers/${detailSupplier.id}/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(payAmount), notes: payNotes })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const result = await res.json()
      toast.success('Pembayaran berhasil')
      setPayAmount('')
      setPayNotes('')
      // Update sisa hutang di state
      setDetailSupplier(prev => prev ? { ...prev, debt: result.remainingDebt } : null)
      setSuppliers(prev => prev.map(s => s.id === detailSupplier.id ? { ...s, debt: result.remainingDebt } : s))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplier')
      }

      toast.success('Supplier deleted successfully')
      fetchSuppliers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., PT Supplier Jaya"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., 08123456789"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., supplier@example.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSupplier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Supplier Modal */}
      {detailSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-white">{detailSupplier.name}</h2>
                {detailSupplier.debt > 0 && (
                  <p className="text-sm text-red-400">Hutang: Rp {detailSupplier.debt.toLocaleString('id-ID')}</p>
                )}
              </div>
              <button onClick={() => setDetailSupplier(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button onClick={() => setDetailTab('transactions')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${detailTab === 'transactions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}>
                <History size={16} /> Riwayat PO
              </button>
              <button onClick={() => setDetailTab('payment')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${detailTab === 'payment' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}>
                <CreditCard size={16} /> Bayar Hutang
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {detailTab === 'transactions' && (
                txLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Belum ada riwayat transaksi</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((po: any) => (
                      <div key={po.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-white">{po.poNumber}</p>
                            <p className="text-xs text-gray-400">{po.warehouse?.name} • {new Date(po.createdAt).toLocaleDateString('id-ID')}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            po.status === 'RECEIVED' ? 'bg-green-900 text-green-300' :
                            po.status === 'CANCELLED' ? 'bg-red-900 text-red-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>{po.status}</span>
                        </div>
                        <div className="text-sm text-gray-300">
                          {po.items?.map((item: any) => (
                            <span key={item.id} className="mr-3">{item.product?.name} ×{item.quantity}</span>
                          ))}
                        </div>
                        <p className="text-right text-white font-semibold mt-1">Rp {po.total?.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === 'payment' && (
                <div className="space-y-4">
                  {detailSupplier.debt <= 0 ? (
                    <div className="text-center py-8">
                      <p className="text-green-400 text-lg font-semibold">✓ Tidak ada hutang</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                        <p className="text-sm text-red-300">Total Hutang</p>
                        <p className="text-2xl font-bold text-white">Rp {detailSupplier.debt.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Jumlah Pembayaran *</label>
                        <input type="number" value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          max={detailSupplier.debt} min={1}
                          placeholder="Masukkan jumlah"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 mt-2">
                          {[25, 50, 75, 100].map(pct => (
                            <button key={pct} type="button"
                              onClick={() => setPayAmount(String(Math.round(detailSupplier.debt * pct / 100)))}
                              className="flex-1 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Keterangan</label>
                        <input type="text" value={payNotes}
                          onChange={(e) => setPayNotes(e.target.value)}
                          placeholder="Transfer BCA, tunai, dll"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={handlePayment}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                        Bayar Hutang
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <h1 className="text-2xl font-bold text-white">Suppliers</h1>
                <p className="text-sm text-gray-400">Manage your suppliers</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Supplier
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers by name, phone, or email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <Truck size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No suppliers found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first supplier'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
                      <Truck size={24} className="text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{supplier.name}</h3>
                      <p className="text-xs text-gray-400">
                        {supplier._count?.products || 0} products
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone size={16} />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail size={16} />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-400">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.debt > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                      <DollarSign size={16} />
                      <span>Hutang: Rp {supplier.debt.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => openDetail(supplier)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-400 hover:bg-gray-700 rounded-lg"
                  >
                    <History size={16} />
                    Detail
                  </button>
                  <button
                    onClick={() => handleOpenModal(supplier)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-400 hover:bg-gray-700 rounded-lg"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(supplier)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg"
                  >
                    <Trash2 size={16} />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && suppliers.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
