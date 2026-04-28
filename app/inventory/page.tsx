'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { Warehouse, Package, AlertCircle, ArrowLeft, Plus, Minus } from 'lucide-react'

export default function InventoryPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [stocks, setStocks] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchWarehouses()
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
      setWarehouses(data)
      if (data.length > 0) {
        setSelectedWarehouse(data[0].id)
      }
    } catch (error) {
      toast.error('Failed to fetch warehouses')
    }
  }

  const fetchStocks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse)

      const response = await fetch(`/api/stocks?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setStocks(data.stocks || [])
    } catch (error) {
      toast.error('Failed to fetch stocks')
    } finally {
      setLoading(false)
    }
  }

  const handleStockUpdate = async (stockId: string, type: 'IN' | 'OUT', quantity: number) => {
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      const stock = stocks.find(s => s.id === stockId)
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          quantity,
          type,
          notes: `Manual ${type === 'IN' ? 'stock in' : 'stock out'}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update stock')
      }

      toast.success(`Stock ${type === 'IN' ? 'added' : 'removed'} successfully`)
      fetchStocks()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const lowStockItems = stocks.filter(s => s.quantity <= s.minStock)

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-600">Manage stock across warehouses</p>
              </div>
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <h3 className="font-semibold text-red-900">Low Stock Alert</h3>
                <p className="text-sm text-red-700">
                  {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} running low on stock
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stock Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : stocks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No stock found</h3>
            <p className="text-gray-600">Add products to start tracking inventory</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Current Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Min Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => {
                    const isLowStock = stock.quantity <= stock.minStock
                    const stockPercentage = (stock.quantity / (stock.minStock * 2)) * 100

                    return (
                      <tr key={stock.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{stock.product?.name}</p>
                              <p className="text-xs text-gray-500">{stock.warehouse?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{stock.product?.sku}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{stock.product?.category?.name}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                              {stock.quantity}
                            </p>
                            <p className="text-xs text-gray-500">{stock.product?.unit}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{stock.minStock}</td>
                        <td className="py-3 px-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
                              <AlertCircle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const qty = prompt('Enter quantity to add:')
                                if (qty) handleStockUpdate(stock.id, 'IN', parseInt(qty))
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Add Stock"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const qty = prompt('Enter quantity to remove:')
                                if (qty) handleStockUpdate(stock.id, 'OUT', parseInt(qty))
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove Stock"
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
        {!loading && stocks.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stocks.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {stocks.reduce((sum, s) => sum + (s.quantity * (s.product?.sellPrice || 0)), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
