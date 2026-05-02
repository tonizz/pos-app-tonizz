'use client'

import { useEffect } from 'react'
import { X, Package, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useForm } from '@/lib/useForm'
import { productSchema } from '@/lib/validations'
import { FormInput, FormSelect, FormTextarea, FormButton, FormError } from '@/components/FormComponents'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  categories: any[]
  initialBarcode?: string
}

export default function AddProductModalV2({
  isOpen,
  onClose,
  onCreate,
  categories,
  initialBarcode = ''
}: AddProductModalProps) {
  const form = useForm({
    initialValues: {
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      unit: 'pcs',
      buyPrice: 0,
      sellPrice: 0,
      minStock: 0,
      description: ''
    },
    validationSchema: productSchema,
    onSubmit: async (values) => {
      try {
        await onCreate(values)
        form.resetForm()
        onClose()
      } catch (error: any) {
        form.setErrors({ _error: error.message || 'Failed to create product' })
      }
    }
  })

  // Set barcode when initialBarcode changes
  useEffect(() => {
    if (initialBarcode) {
      form.setFieldValue('barcode', initialBarcode)
      // Auto-generate SKU from barcode
      const skuFromBarcode = `PRD-${initialBarcode.slice(-6)}`
      form.setFieldValue('sku', skuFromBarcode)
    }
  }, [initialBarcode])

  // Auto-generate SKU when category changes
  useEffect(() => {
    if (form.values.categoryId && !form.values.sku) {
      generateSKU()
    }
  }, [form.values.categoryId])

  const generateSKU = () => {
    const category = categories.find(c => c.id === form.values.categoryId)
    if (!category) return

    // Get category prefix (first 3 letters uppercase)
    const categoryPrefix = category.name.substring(0, 3).toUpperCase()

    // Generate random number
    const randomNum = Math.floor(Math.random() * 9000) + 1000

    // Generate timestamp suffix
    const timestamp = Date.now().toString().slice(-4)

    const sku = `${categoryPrefix}-${randomNum}-${timestamp}`
    form.setFieldValue('sku', sku)
  }

  if (!isOpen) return null

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }))

  const profitMargin = form.values.sellPrice > 0 && form.values.buyPrice > 0
    ? ((form.values.sellPrice - form.values.buyPrice) / form.values.buyPrice * 100).toFixed(2)
    : '0'

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

        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormError error={form.errors._error} />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Product Name"
              required
              {...form.getFieldProps('name')}
              error={form.getFieldError('name')}
              touched={form.touched.name}
              placeholder="Enter product name"
            />

            <FormSelect
              label="Category"
              required
              {...form.getFieldProps('categoryId')}
              error={form.getFieldError('categoryId')}
              touched={form.touched.categoryId}
              options={categoryOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SKU <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  {...form.getFieldProps('sku')}
                  className={`flex-1 px-4 py-2 bg-gray-700 border ${
                    form.hasError('sku') ? 'border-red-500' : 'border-gray-600'
                  } text-white rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Auto-generated"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
                  title="Generate new SKU"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              {form.hasError('sku') && (
                <p className="mt-1 text-sm text-red-400">{form.getFieldError('sku')}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Auto-generated based on category</p>
            </div>

            <FormInput
              label="Barcode"
              {...form.getFieldProps('barcode')}
              error={form.getFieldError('barcode')}
              touched={form.touched.barcode}
              placeholder="Scan or enter barcode"
            />
          </div>

          <FormInput
            label="Unit"
            required
            {...form.getFieldProps('unit')}
            error={form.getFieldError('unit')}
            touched={form.touched.unit}
            placeholder="pcs, kg, liter, etc."
          />

          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="Buy Price"
              type="number"
              required
              {...form.getFieldProps('buyPrice')}
              error={form.getFieldError('buyPrice')}
              touched={form.touched.buyPrice}
              min="0"
              step="0.01"
            />

            <FormInput
              label="Sell Price"
              type="number"
              required
              {...form.getFieldProps('sellPrice')}
              error={form.getFieldError('sellPrice')}
              touched={form.touched.sellPrice}
              min="0"
              step="0.01"
            />

            <FormInput
              label="Min Stock"
              type="number"
              {...form.getFieldProps('minStock')}
              error={form.getFieldError('minStock')}
              touched={form.touched.minStock}
              min="0"
            />
          </div>

          {/* Profit Margin Display */}
          {form.values.buyPrice > 0 && form.values.sellPrice > 0 && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">Buy Price</p>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(form.values.buyPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sell Price</p>
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(form.values.sellPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Profit Margin</p>
                  <p className={`text-sm font-semibold ${
                    parseFloat(profitMargin) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {profitMargin}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <FormTextarea
            label="Description"
            {...form.getFieldProps('description')}
            error={form.getFieldError('description')}
            touched={form.touched.description}
            rows={3}
            placeholder="Product description (optional)"
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <FormButton
              type="submit"
              loading={form.isSubmitting}
              disabled={!form.isValid}
              className="flex-1"
            >
              Create Product
            </FormButton>
          </div>
        </form>
      </div>
    </div>
  )
}
