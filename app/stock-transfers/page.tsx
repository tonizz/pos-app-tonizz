'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeftRight, Plus, Search, ArrowLeft, X, Package, CheckCircle, XCircle, Clock } from 'lucide-react'

interface StockTransfer {
  id: string
  transferNo: string
  fromWarehouseId: string
  fromWarehouse: { id: string; name: string }
  toWarehouseId: string
  toWarehouse: { id: string; name: string }
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  items: {
    id: string
    productId: string
    product: { id: string; name: string; sku: string }
    quantity: number
  }[]
  createdAt: string
  updatedAt: string
}

interface Warehouse {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  stocks: { warehouseId: string; quantity: number }[]
}

export default function StockTransfersPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    notes: ''
  })
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchWarehouses()
    fetchProducts()
    fetchTransfers()
  }, [])

  useEffect(() => {
    fetchTransfers()
  }, [statusFilter])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      toast.error('Failed to fetch warehouses')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error('Failed to fetch products')
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/stock-transfers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setTransfers(data.transfers || [])
    } catch (error) {
      toast.error('Failed to fetch transfers')
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({ fromWarehouseId: '', toWarehouseId: '', notes: '' })
    setSelectedItems([])
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ fromWarehouseId: '', toWarehouseId: '', notes: '' })
    setSelectedItems([])
  }

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setSelectedItems(newItems)
  }

  const getAvailableStock = (productId: string, warehouseId: string) => {
    const product = products.find(p => p.id === productId)
    const stock = product?.stocks?.find(s => s.warehouseId === warehouseId)
    return stock?.quantity || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      toast.error('Please select both warehouses')
      return
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.error('Cannot transfer to the same warehouse')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    const invalidItems = selectedItems.filter(item => !item.productId || item.quantity <= 0)
    if (invalidItems.length > 0) {
      toast.error('Please fill all item details')
      return
    }

    // Check stock availability
    for (const item of selectedItems) {
      const available = getAvailableStock(item.productId, formData.fromWarehouseId)
      if (available < item.quantity) {
        const product = products.find(p => p.id === item.productId)
        toast.error(`Insufficient stock for ${product?.name}. Available: ${available}`)
        return
      }
    }

    try {
      const response = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromWarehouseId: formData.fromWarehouseId,
          toWarehouseId: formData.toWarehouseId,
          notes: formData.notes || null,
          items: selectedItems
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transfer')
      }

      toast.success('Stock transfer created successfully')
      handleCloseModal()
      fetchTransfers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateStatus = async (transferId: string, status: string) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this transfer?`)) {
      return
    }

    try {
      const response = await fetch(`/api/stock-transfers/${transferId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update transfer')
      }

      toast.success(`Transfer ${status.toLowerCase()} successfully`)
      fetchTransfers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-900', text: 'text-yellow-300', icon: Clock },
      IN_TRANSIT: { bg: 'bg-blue-900', text: 'text-blue-300', icon: ArrowLeftRight },
      COMPLETED: { bg: 'bg-green-900', text: 'text-green-300', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-900', text: 'text-red-300', icon: XCircle }
    }
    const badge = badges[status as keyof typeof badges]
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
        <Icon size={12} />
        {status}
      </span>
    )
  }

  const filteredTransfers = transfers.filter(transfer =>
    transfer.transferNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.fromWarehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.toWarehouse.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full border border-gray-700 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Create Stock Transfer</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Warehouse *
                  </label>
                  <select
                    value={formData.fromWarehouseId}
                    onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To Warehouse *
                  </label>
                  <select
                    value={formData.toWarehouseId}
                    onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">Items *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-700 rounded-lg">
                    No items added. Click "Add Item" to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start bg-gray-700 p-3 rounded-lg">
                        <div className="flex-1">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                          >
                            <option value="">Select product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {item.productId && formData.fromWarehouseId && (
                            <p className="text-xs text-gray-400 mt-1">
                              Available: {getAvailableStock(item.productId, formData.fromWarehouseId)} units
                            </p>
                          )}
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            placeholder="Qty"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-400 hover:bg-gray-600 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  Create Transfer
                </button>
              </div>
            </form>
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
                <h1 className="text-2xl font-bold text-white">Stock Transfers</h1>
                <p className="text-sm text-gray-400">Transfer stock between warehouses</p>
              </div>
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              New Transfer
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by transfer number or warehouse..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Transfers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <ArrowLeftRight size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No transfers found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Create your first stock transfer'}
            </p>
            {!searchQuery && !statusFilter && (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                New Transfer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{transfer.transferNo}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{transfer.fromWarehouse.name}</span>
                      <ArrowLeftRight size={16} />
                      <span>{transfer.toWarehouse.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(transfer.status)}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(transfer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {transfer.notes && (
                  <p className="text-sm text-gray-400 mb-3">{transfer.notes}</p>
                )}

                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Items:</p>
                  <div className="space-y-1">
                    {transfer.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-white">{item.product.name}</span>
                        <span className="text-gray-400">{item.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>

                {transfer.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(transfer.id, 'IN_TRANSIT')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Start Transfer
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(transfer.id, 'CANCELLED')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {transfer.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => handleUpdateStatus(transfer.id, 'COMPLETED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Complete Transfer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredTransfers.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredTransfers.length} transfer{filteredTransfers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
