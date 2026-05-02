'use client'

import { useState, useEffect } from 'react'
import { X, Package, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  categories: any[]
  initialBarcode?: string
}

export default function AddProductModal({
  isOpen,
  onClose,
  onCreate,
  categories,
  initialBarcode = ''
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    unit: 'pcs',
    buyPrice: '',
    sellPrice: '',
    wholesalePrice: '',
    autoDiscount: '',
    autoDiscountType: 'nominal' as 'percentage' | 'nominal',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Set barcode when initialBarcode changes
  useEffect(() => {
    if (initialBarcode) {
      setFormData(prev => ({ ...prev, barcode: initialBarcode }))
      // Auto-generate SKU from barcode
      const skuFromBarcode = `PRD-${initialBarcode.slice(-6)}`
      setFormData(prev => ({ ...prev, sku: skuFromBarcode }))
    }
  }, [initialBarcode])

  // Auto-generate SKU when category changes
  useEffect(() => {
    if (formData.categoryId && !formData.sku) {
      generateSKU()
    }
  }, [formData.categoryId])

  const generateSKU = () => {
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return

    // Get category prefix (first 3 letters uppercase)
    const categoryPrefix = category.name.substring(0, 3).toUpperCase()

    // Generate random number
    const randomNum = Math.floor(Math.random() * 9000) + 1000

    // Generate timestamp suffix
    const timestamp = Date.now().toString().slice(-4)

    const sku = `${categoryPrefix}-${randomNum}-${timestamp}`
    setFormData({ ...formData, sku })
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const createData: any = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        categoryId: formData.categoryId,
        unit: formData.unit,
        description: formData.description || null,
        buyPrice: parseFloat(formData.buyPrice),
        sellPrice: parseFloat(formData.sellPrice),
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null
      }

      // Add auto discount if provided
      if (formData.autoDiscount) {
        createData.autoDiscount = parseFloat(formData.autoDiscount)
        createData.autoDiscountType = formData.autoDiscountType
      }

      await onCreate(createData)

      // Reset form
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        unit: 'pcs',
        buyPrice: '',
        sellPrice: '',
        wholesalePrice: '',
        autoDiscount: '',
        autoDiscountType: 'nominal',
        description: ''
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscountedPrice = () => {
    const sellPrice = parseFloat(formData.sellPrice) || 0
    const discount = parseFloat(formData.autoDiscount) || 0

    if (!discount) return sellPrice

    if (formData.autoDiscountType === 'percentage') {
      return sellPrice - (sellPrice * discount / 100)
    } else {
      return sellPrice - discount
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" suppressHydrationWarning>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Add New Product</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                  placeholder="Auto-generated"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  title="Generate new SKU"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-generated based on category</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Scan or enter barcode"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="pcs, kg, liter, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buy Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sell Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wholesale Price
              </label>
              <input
                type="number"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              rows={2}
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Auto Discount (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.autoDiscountType}
                  onChange={(e) => setFormData({ ...formData, autoDiscountType: e.target.value as 'percentage' | 'nominal' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nominal">Nominal (Rp)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  value={formData.autoDiscount}
                  onChange={(e) => setFormData({ ...formData, autoDiscount: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max={formData.autoDiscountType === 'percentage' ? '100' : undefined}
                />
              </div>
            </div>

            {formData.autoDiscount && formData.sellPrice && (
              <div className="mt-3 bg-blue-900 border border-blue-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Original Price</p>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(parseFloat(formData.sellPrice))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">After Auto Discount</p>
                    <p className="text-lg font-semibold text-green-400">
                      {formatCurrency(calculateDiscountedPrice())}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Discount: {formData.autoDiscountType === 'percentage'
                    ? `${formData.autoDiscount}%`
                    : formatCurrency(parseFloat(formData.autoDiscount))}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
