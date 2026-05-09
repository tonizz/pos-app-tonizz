'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Search, RotateCcw, Package, CheckCircle } from 'lucide-react'

export default function ReturnPage() {
  const router = useRouter()
  const { token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [invoiceNo, setInvoiceNo] = useState('')
  const [transaction, setTransaction] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [returnItems, setReturnItems] = useState<any[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [refundResult, setRefundResult] = useState<number | null>(null)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) { router.push('/login'); return }
    fetchWarehouses()
  }, [_hasHydrated])

  const fetchWarehouses = async () => {
    const res = await fetch('/api/warehouses', { headers: { 'Authorization': `Bearer ${token}` } })
    const data = await res.json()
    const list = data.warehouses || data || []
    setWarehouses(list)
    if (list.length > 0) setSelectedWarehouse(list[0].id)
  }

  const searchTransaction = async () => {
    if (!invoiceNo.trim()) return
    setSearching(true)
    setTransaction(null)
    setReturnItems([])
    setRefundResult(null)
    try {
      const res = await fetch(`/api/transactions?invoiceNo=${invoiceNo.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const tx = data.transactions?.[0] || null
      if (!tx) { toast.error('Transaksi tidak ditemukan'); return }
      if (tx.status === 'REFUNDED') { toast.error('Transaksi ini sudah di-refund'); return }
      setTransaction(tx)
      setReturnItems(tx.items.map((item: any) => ({
        transactionItemId: item.id,
        productId: item.productId,
        productName: item.product?.name,
        maxQty: item.quantity,
        returnQty: 0,
        price: item.price - (item.discount || 0),
      })))
    } catch {
      toast.error('Gagal mencari transaksi')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0)
    if (!itemsToReturn.length) { toast.error('Pilih minimal 1 item untuk di-return'); return }
    if (!selectedWarehouse) { toast.error('Pilih gudang tujuan return'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/return', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          reason,
          returnItems: itemsToReturn.map(i => ({
            transactionItemId: i.transactionItemId,
            productId: i.productId,
            quantity: i.returnQty,
            warehouseId: selectedWarehouse
          }))
        })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const result = await res.json()
      setRefundResult(result.refundTotal)
      toast.success('Return berhasil diproses')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalRefund = returnItems.reduce((sum, i) => sum + i.price * i.returnQty, 0)

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Return / Refund</h1>
            <p className="text-sm text-gray-400">Proses pengembalian barang dan uang</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cari transaksi */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Cari Transaksi</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTransaction()}
              placeholder="Masukkan nomor invoice (contoh: INV-001)"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            <button onClick={searchTransaction} disabled={searching}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Search size={20} />
              {searching ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </div>

        {/* Hasil pencarian */}
        {transaction && !refundResult && (
          <>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{transaction.invoiceNo}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.createdAt).toLocaleString('id-ID')} •
                    Kasir: {transaction.cashier?.name}
                  </p>
                  {transaction.customer && (
                    <p className="text-sm text-gray-400">Customer: {transaction.customer.name}</p>
                  )}
                </div>
                <p className="text-xl font-bold text-white">{formatCurrency(transaction.total)}</p>
              </div>

              {/* Pilih gudang */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Kembalikan stok ke gudang *</label>
                <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-gray-300">Pilih item yang di-return:</p>
                {returnItems.map((item, i) => (
                  <div key={item.transactionItemId} className="flex items-center gap-4 bg-gray-700 rounded-lg p-3">
                    <Package size={20} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.productName}</p>
                      <p className="text-xs text-gray-400">Dibeli: {item.maxQty} • {formatCurrency(item.price)}/pcs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const u = [...returnItems]; u[i].returnQty = Math.max(0, u[i].returnQty - 1); setReturnItems(u)
                      }} className="w-8 h-8 bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center justify-center">−</button>
                      <span className="w-8 text-center text-white font-semibold">{item.returnQty}</span>
                      <button onClick={() => {
                        const u = [...returnItems]; u[i].returnQty = Math.min(item.maxQty, u[i].returnQty + 1); setReturnItems(u)
                      }} className="w-8 h-8 bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center justify-center">+</button>
                    </div>
                    <p className="text-sm font-semibold text-green-400 w-24 text-right">
                      {item.returnQty > 0 ? formatCurrency(item.price * item.returnQty) : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Alasan */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Alasan Return</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Barang rusak, salah ukuran, dll"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              {/* Total refund */}
              {totalRefund > 0 && (
                <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-300 font-medium">Total Refund</span>
                    <span className="text-2xl font-bold text-white">{formatCurrency(totalRefund)}</span>
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading || totalRefund === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold">
                <RotateCcw size={20} />
                {loading ? 'Memproses...' : 'Proses Return'}
              </button>
            </div>
          </>
        )}

        {/* Sukses */}
        {refundResult !== null && (
          <div className="bg-gray-800 border border-green-700 rounded-xl p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Return Berhasil!</h3>
            <p className="text-gray-400 mb-4">Stok sudah dikembalikan ke gudang</p>
            <div className="bg-green-900 rounded-lg p-4 mb-6 inline-block">
              <p className="text-green-300 text-sm">Total Refund ke Customer</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(refundResult)}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setTransaction(null); setInvoiceNo(''); setRefundResult(null) }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Return Lagi
              </button>
              <button onClick={() => router.push('/transactions')}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                Lihat Transaksi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
