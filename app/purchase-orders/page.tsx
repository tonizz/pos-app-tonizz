'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { ShoppingBag, Plus, Search, ArrowLeft, X, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplier: { id: string; name: string }
  warehouseId: string
  warehouse: { id: string; name: string }
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED'
  subtotal: number
  tax: number
  total: number
  expectedDate: string | null
  receivedDate: string | null
  notes: string | null
  items: {
    id: string
    productId: string
    product: { id: string; name: string; sku: string }
    quantity: number
    price: number
    subtotal: number
  }[]
  createdAt: string
  updatedAt: string
}

interface Supplier {
  id: string
  name: string
}

interface Warehouse {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  buyPrice: number
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDate: '',
    notes: ''
  })
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number; price: number }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchSuppliers()
    fetchWarehouses()
    fetchProducts()
    fetchPurchaseOrders()
  }, [])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [statusFilter])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      toast.error('Failed to fetch suppliers')
    }
  }

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

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/purchase-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setPurchaseOrders(data.purchaseOrders || [])
    } catch (error) {
      toast.error('Failed to fetch purchase orders')
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({ supplierId: '', warehouseId: '', expectedDate: '', notes: '' })
    setSelectedItems([])
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ supplierId: '', warehouseId: '', expectedDate: '', notes: '' })
    setSelectedItems([])
  }

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1, price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill price when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].price = product.buyPrice
      }
    }

    setSelectedItems(newItems)
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.supplierId || !formData.warehouseId) {
      toast.error('Please select supplier and warehouse')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    const invalidItems = selectedItems.filter(item => !item.productId || item.quantity <= 0 || item.price <= 0)
    if (invalidItems.length > 0) {
      toast.error('Please fill all item details')
      return
    }

    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supplierId: formData.supplierId,
          warehouseId: formData.warehouseId,
          expectedDate: formData.expectedDate || null,
          notes: formData.notes || null,
          items: selectedItems
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create purchase order')
      }

      toast.success('Purchase order created successfully')
      handleCloseModal()
      fetchPurchaseOrders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateStatus = async (poId: string, status: string) => {
    const confirmMessages: any = {
      PENDING: 'submit this purchase order',
      APPROVED: 'approve this purchase order',
      RECEIVED: 'mark this purchase order as received (stock will be updated)',
      CANCELLED: 'cancel this purchase order'
    }

    if (!confirm(`Are you sure you want to ${confirmMessages[status]}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update purchase order')
      }

      toast.success(`Purchase order ${status.toLowerCase()} successfully`)
      fetchPurchaseOrders()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { bg: 'bg-gray-700', text: 'text-gray-300', icon: FileText },
      PENDING: { bg: 'bg-yellow-900', text: 'text-yellow-300', icon: Clock },
      APPROVED: { bg: 'bg-blue-900', text: 'text-blue-300', icon: CheckCircle },
      RECEIVED: { bg: 'bg-green-900', text: 'text-green-300', icon: CheckCircle },
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

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Date
                  </label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
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
                        </div>
                        <div className="w-24">
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
                        <div className="w-32">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                          />
                        </div>
                        <div className="w-32 px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg text-sm text-right">
                          {formatCurrency(item.quantity * item.price)}
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
                    <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-600">
                      <span className="text-gray-300 font-semibold">Total:</span>
                      <span className="text-xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
                    </div>
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
                  Create PO
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
                <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
                <p className="text-sm text-gray-400">Manage purchase orders from suppliers</p>
              </div>
            </div>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              New PO
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
                placeholder="Search by PO number or supplier..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Purchase Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPurchaseOrders.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No purchase orders found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Create your first purchase order'}
            </p>
            {!searchQuery && !statusFilter && (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                New PO
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchaseOrders.map((po) => (
              <div
                key={po.id}
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{po.poNumber}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>Supplier: {po.supplier.name}</span>
                      <span>•</span>
                      <span>Warehouse: {po.warehouse.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(po.status)}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {po.notes && (
                  <p className="text-sm text-gray-400 mb-3">{po.notes}</p>
                )}

                {po.expectedDate && (
                  <p className="text-sm text-gray-400 mb-3">
                    Expected: {new Date(po.expectedDate).toLocaleDateString()}
                  </p>
                )}

                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Items:</p>
                  <div className="space-y-1">
                    {po.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-white">{item.product.name}</span>
                        <span className="text-gray-400">
                          {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-600">
                    <span className="text-sm font-semibold text-gray-300">Total:</span>
                    <span className="text-lg font-bold text-white">{formatCurrency(po.total)}</span>
                  </div>
                </div>

                {po.status === 'DRAFT' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(po.id, 'PENDING')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(po.id, 'CANCELLED')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {po.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(po.id, 'CANCELLED')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {po.status === 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Mark as Received
                  </button>
                )}

                {po.status === 'RECEIVED' && po.receivedDate && (
                  <p className="text-sm text-green-400 text-center">
                    Received on {new Date(po.receivedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredPurchaseOrders.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredPurchaseOrders.length} purchase order{filteredPurchaseOrders.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
