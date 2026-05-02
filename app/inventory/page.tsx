'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import {
  Package,
  ArrowLeft,
  Plus,
  Minus,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  X
} from 'lucide-react'

export default function InventoryPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [stocks, setStocks] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN')
  const [adjustmentQty, setAdjustmentQty] = useState('')
  const [adjustmentNotes, setAdjustmentNotes] = useState('')
  const [showAddStockModal, setShowAddStockModal] = useState(false)
  const [newStockData, setNewStockData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    minStock: '',
    expiredDate: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchWarehouses()
    fetchProducts()
    fetchStocks()
  }, [])

  useEffect(() => {
    fetchStocks()
  }, [selectedWarehouse])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setWarehouses(data || [])
    } catch (error) {
      toast.error('Failed to fetch warehouses')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error('Failed to fetch products')
    }
  }

  const fetchStocks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedWarehouse) {
        params.append('warehouseId', selectedWarehouse)
      }

      const response = await fetch(`/api/stocks?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stocks')
      }

      const data = await response.json()
      setStocks(data.stocks || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustStock = (stock: any, type: 'IN' | 'OUT') => {
    setSelectedStock(stock)
    setAdjustmentType(type)
    setAdjustmentQty('')
    setAdjustmentNotes('')
    setShowAdjustModal(true)
  }

  const handleSubmitAdjustment = async () => {
    if (!selectedStock || !adjustmentQty) {
      toast.error('Please enter quantity')
      return
    }

    const qty = parseInt(adjustmentQty)
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    if (adjustmentType === 'OUT' && qty > selectedStock.quantity) {
      toast.error('Insufficient stock')
      return
    }

    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedStock.product.id,
          warehouseId: selectedStock.warehouse.id,
          quantity: qty,
          type: adjustmentType,
          notes: adjustmentNotes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to adjust stock')
      }

      toast.success(`Stock ${adjustmentType === 'IN' ? 'added' : 'reduced'} successfully`)
      setShowAdjustModal(false)
      setSelectedStock(null)
      fetchStocks()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleAddStock = async () => {
    if (!newStockData.productId || !newStockData.warehouseId || !newStockData.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newStockData,
          quantity: parseInt(newStockData.quantity),
          minStock: parseInt(newStockData.minStock) || 0,
          type: 'IN',
          notes: 'Initial stock'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add stock')
      }

      toast.success('Stock added successfully')
      setShowAddStockModal(false)
      setNewStockData({
        productId: '',
        warehouseId: '',
        quantity: '',
        minStock: '',
        expiredDate: ''
      })
      fetchStocks()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredStocks = stocks.filter(stock =>
    stock.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.warehouse?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockItems = filteredStocks.filter(s => s.quantity <= s.minStock)
  const totalValue = filteredStocks.reduce((sum, s) => sum + (s.quantity * (s.product?.buyPrice || 0)), 0)

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Adjustment Modal */}
      {showAdjustModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {adjustmentType === 'IN' ? 'Add Stock' : 'Reduce Stock'}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400">Product</p>
                <p className="font-semibold text-white">{selectedStock.product?.name}</p>
                <p className="text-sm text-gray-400">SKU: {selectedStock.product?.sku}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Warehouse</p>
                <p className="font-semibold text-white">{selectedStock.warehouse?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400">Current Stock</p>
                <p className="text-2xl font-bold text-white">
                  {selectedStock.quantity} {selectedStock.product?.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  min="1"
                  max={adjustmentType === 'OUT' ? selectedStock.quantity : undefined}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for adjustment..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitAdjustment}
                  className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold ${
                    adjustmentType === 'IN'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjustmentType === 'IN' ? 'Add Stock' : 'Reduce Stock'}
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add New Stock</h3>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product *
                </label>
                <select
                  value={newStockData.productId}
                  onChange={(e) => setNewStockData({ ...newStockData, productId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Warehouse *
                </label>
                <select
                  value={newStockData.warehouseId}
                  onChange={(e) => setNewStockData({ ...newStockData, warehouseId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={newStockData.quantity}
                  onChange={(e) => setNewStockData({ ...newStockData, quantity: e.target.value })}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  value={newStockData.minStock}
                  onChange={(e) => setNewStockData({ ...newStockData, minStock: e.target.value })}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum stock alert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expired Date
                </label>
                <input
                  type="date"
                  value={newStockData.expiredDate}
                  onChange={(e) => setNewStockData({ ...newStockData, expiredDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddStock}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Add Stock
                </button>
                <button
                  onClick={() => setShowAddStockModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
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
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                <p className="text-sm text-gray-400">Manage stock levels and movements</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddStockModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Stock
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-white">{filteredStocks.length}</p>
              </div>
              <div className="p-3 bg-blue-900 rounded-lg">
                <Package size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-white">{lowStockItems.length}</p>
              </div>
              <div className="p-3 bg-red-900 rounded-lg">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 bg-green-900 rounded-lg">
                <TrendingUp size={24} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, or warehouse..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No stock found</h3>
            <p className="text-gray-400">Try adjusting your search or add new stock</p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Warehouse</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Min Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => {
                    const isLowStock = stock.quantity <= stock.minStock
                    const stockValue = stock.quantity * (stock.product?.buyPrice || 0)

                    return (
                      <tr key={stock.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{stock.product?.name}</p>
                              {stock.expiredDate && (
                                <p className="text-xs text-yellow-400">
                                  Exp: {new Date(stock.expiredDate).toLocaleDateString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">{stock.product?.sku}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">{stock.product?.category?.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">{stock.warehouse?.name}</td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-semibold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                            {stock.quantity} {stock.product?.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{stock.minStock}</td>
                        <td className="py-3 px-4 text-sm text-gray-300">{formatCurrency(stockValue)}</td>
                        <td className="py-3 px-4">
                          {isLowStock ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-300 flex items-center gap-1 w-fit">
                              <AlertTriangle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdjustStock(stock, 'IN')}
                              className="p-2 text-green-400 hover:bg-gray-700 rounded-lg"
                              title="Add Stock"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(stock, 'OUT')}
                              className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"
                              title="Reduce Stock"
                            >
                              <Minus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredStocks.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredStocks.length} item(s)
            {lowStockItems.length > 0 && (
              <span className="text-red-400 ml-2">
                • {lowStockItems.length} low stock alert(s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
