'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  Percent,
  Gift
} from 'lucide-react'

interface Promotion {
  id: string
  name: string
  type: 'PERCENTAGE' | 'NOMINAL' | 'BUY_X_GET_Y' | 'VOUCHER'
  value: number
  startDate: string
  endDate: string
  isActive: boolean
  minPurchase: number | null
  maxDiscount: number | null
  voucherCode: string | null
  buyQuantity: number | null
  getQuantity: number | null
  freeProductId: string | null
  applicableProductIds: string | null
  applicableCategoryId: string | null
  tiers: string | null
  isFlashSale: boolean
  flashSaleEndTime: string | null
  bundleProductIds: string | null
  bundlePrice: number | null
  createdAt: string
}

export default function PromotionsPage() {
  const router = useRouter()
  const { token, user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [mounted, setMounted] = useState(false)

  // Products & Categories for selectors
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [allCategories, setAllCategories] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'PERCENTAGE' as Promotion['type'],
    value: '',
    startDate: '',
    endDate: '',
    isActive: true,
    minPurchase: '',
    maxDiscount: '',
    voucherCode: '',
    // BXGY
    buyQuantity: '',
    getQuantity: '',
    // Target
    applicableProductIds: '',
    applicableCategoryId: '',
    // Tiered
    tiers: '',
    // Flash Sale
    isFlashSale: false,
    flashSaleEndDateTime: '',
    // Bundle
    bundleProductIds: '',
    bundlePrice: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
      if (!_hasHydrated) return
      if (!isAuthenticated()) {
        router.push('/login')
        return
      }
      // Check permission
      if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '')) {
        toast.error('You do not have permission to access this page')
        router.push('/dashboard')
        return
      }
  
      fetchPromotions()
      fetchProductsAndCategories()
    }, [, _hasHydrated])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/promotions?search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch promotions')
      }

      const data = await response.json()
      setPromotions(data.promotions || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsAndCategories = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?limit=500', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setAllProducts(prodData.products || [])
      }
      if (catRes.ok) {
        const catData = await catRes.json()
        setAllCategories(Array.isArray(catData) ? catData : catData.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch products/categories:', error)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (isAuthenticated()) {
        fetchPromotions()
      }
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo)
      const startDate = new Date(promo.startDate)
      const endDate = new Date(promo.endDate)
      const flashEnd = promo.flashSaleEndTime ? new Date(promo.flashSaleEndTime) : null
      setFormData({
        name: promo.name,
        type: promo.type,
        value: promo.value.toString(),
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
        isActive: promo.isActive,
        minPurchase: promo.minPurchase?.toString() || '',
        maxDiscount: promo.maxDiscount?.toString() || '',
        voucherCode: promo.voucherCode || '',
        buyQuantity: promo.buyQuantity?.toString() || '',
        getQuantity: promo.getQuantity?.toString() || '',
        applicableProductIds: promo.applicableProductIds || '',
        applicableCategoryId: promo.applicableCategoryId || '',
        tiers: promo.tiers || '',
        isFlashSale: promo.isFlashSale,
        flashSaleEndDateTime: flashEnd ? formatDateForInput(flashEnd) + ' ' + String(flashEnd.getHours()).padStart(2,'0') + ':' + String(flashEnd.getMinutes()).padStart(2,'0') : '',
        bundleProductIds: promo.bundleProductIds || '',
        bundlePrice: promo.bundlePrice?.toString() || ''
      })
    } else {
      setEditingPromo(null)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData({
        name: '',
        type: 'PERCENTAGE',
        value: '',
        startDate: formatDateForInput(today),
        endDate: formatDateForInput(tomorrow),
        isActive: true,
        minPurchase: '',
        maxDiscount: '',
        voucherCode: '',
        buyQuantity: '',
        getQuantity: '',
        applicableProductIds: '',
        applicableCategoryId: '',
        tiers: '',
        isFlashSale: false,
        flashSaleEndDateTime: '',
        bundleProductIds: '',
        bundlePrice: ''
      })
    }
    setShowModal(true)
  }

  const formatDateForInput = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const parseDateFromInput = (dateStr: string) => {
    // Parse DD-MM-YYYY to Date object
    const [day, month, year] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPromo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPromo
        ? `/api/promotions/${editingPromo.id}`
        : '/api/promotions'

      const method = editingPromo ? 'PUT' : 'POST'

      // Parse DD-MM-YYYY to ISO date
      const startDate = parseDateFromInput(formData.startDate)
      const endDate = parseDateFromInput(formData.endDate)

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Invalid date format. Use DD-MM-YYYY')
        return
      }

      if (endDate < startDate) {
        toast.error('End date must be after start date')
        return
      }

      // Parse flash sale end time if present
      let flashSaleEndTime = null
      if (formData.isFlashSale && formData.flashSaleEndDateTime) {
        // Format: "DD-MM-YYYY HH:mm"
        const parts = formData.flashSaleEndDateTime.split(' ')
        if (parts.length === 2) {
          const datePart = parseDateFromInput(parts[0])
          const timePart = parts[1].split(':')
          if (!isNaN(datePart.getTime()) && timePart.length === 2) {
            datePart.setHours(parseInt(timePart[0]), parseInt(timePart[1]))
            flashSaleEndTime = datePart.toISOString()
          }
        }
      }

      // Convert comma-separated product/bundle IDs to JSON arrays
      const toJsonArray = (val: string) => {
        if (!val || !val.trim()) return null
        const parts = val.split(',').map(s => s.trim()).filter(Boolean)
        return parts.length > 0 ? JSON.stringify(parts) : null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          flashSaleEndTime,
          applicableProductIds: toJsonArray(formData.applicableProductIds),
          bundleProductIds: toJsonArray(formData.bundleProductIds),
          tiers: formData.tiers && formData.tiers.trim() ? formData.tiers : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save promotion')
      }

      toast.success(`Promotion ${editingPromo ? 'updated' : 'created'} successfully`)
      handleCloseModal()
      fetchPromotions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) {
      return
    }

    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete promotion')
      }

      toast.success('Promotion deleted successfully')
      fetchPromotions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent size={16} className="text-blue-400" />
      case 'NOMINAL':
        return <DollarSign size={16} className="text-green-400" />
      case 'VOUCHER':
        return <Tag size={16} className="text-purple-400" />
      case 'BUY_X_GET_Y':
        return <Gift size={16} className="text-orange-400" />
      default:
        return <Tag size={16} className="text-gray-400" />
    }
  }

  const formatPromoValue = (type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return `${value}%`
    } else if (type === 'NOMINAL') {
      return formatCurrency(value)
    } else {
      return value.toString()
    }
  }

  const isPromoActive = (promo: Promotion) => {
    if (!promo.isActive) return false
    const now = new Date()
    const start = new Date(promo.startDate)
    const end = new Date(promo.endDate)
    return now >= start && now <= end
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />

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
                <h1 className="text-2xl font-bold text-white">Promo Management</h1>
                <p className="text-sm text-gray-400">Manage promotions and vouchers</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Promo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search promotions..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Promotions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Tag size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No promotions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promo => (
              <div
                key={promo.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(promo.type)}
                    <h3 className="font-semibold text-white">{promo.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(promo)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Type:</span>
                    <span className="text-sm text-white">{promo.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Value:</span>
                    <span className="text-lg font-bold text-blue-400">
                      {formatPromoValue(promo.type, promo.value)}
                    </span>
                  </div>
                  {promo.minPurchase && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Min Purchase:</span>
                      <span className="text-sm text-white">{formatCurrency(promo.minPurchase)}</span>
                    </div>
                  )}
                  {promo.maxDiscount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Max Discount:</span>
                      <span className="text-sm text-white">{formatCurrency(promo.maxDiscount)}</span>
                    </div>
                  )}
                  {promo.voucherCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Code:</span>
                      <span className="text-sm font-mono text-purple-400">{promo.voucherCode}</span>
                    </div>
                  )}
                  {promo.type === 'BUY_X_GET_Y' && promo.buyQuantity && promo.getQuantity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">BXGY:</span>
                      <span className="text-sm text-orange-400">Buy {promo.buyQuantity} Get {promo.getQuantity}</span>
                    </div>
                  )}
                  {promo.applicableCategoryId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Target:</span>
                      <span className="text-sm text-purple-400">Specific category</span>
                    </div>
                  )}
                  {promo.tiers && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Tiers:</span>
                      <span className="text-sm text-yellow-400">Volume discount</span>
                    </div>
                  )}
                  {promo.isFlashSale && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Flash Sale:</span>
                      <span className="text-sm text-orange-400 font-semibold">⏱ Active</span>
                    </div>
                  )}
                  {promo.bundlePrice && promo.bundleProductIds && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Bundle:</span>
                      <span className="text-sm text-green-400">{formatCurrency(promo.bundlePrice)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={14} />
                    <span>
                      {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        isPromoActive(promo)
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {isPromoActive(promo) ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingPromo ? 'Edit Promotion' : 'Add New Promotion'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Promotion Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="NOMINAL">Nominal</option>
                    <option value="VOUCHER">Voucher</option>
                    <option value="BUY_X_GET_Y">Buy X Get Y</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.type === 'BUY_X_GET_Y' ? 'Configure buy & get qty below' : formData.type === 'VOUCHER' ? 'Uses voucher code' : 'Discount on total'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Value{formData.type !== 'BUY_X_GET_Y' ? ' *' : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={formData.type !== 'BUY_X_GET_Y'}
                    placeholder={formData.type === 'PERCENTAGE' ? 'e.g. 10 for 10%' : formData.type === 'NOMINAL' ? 'e.g. 10000' : 'Discount value'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.type === 'PERCENTAGE' ? 'Percentage value (e.g. 10 = 10%)' :
                     formData.type === 'NOMINAL' ? 'Nominal amount in Rp' :
                     formData.type === 'BUY_X_GET_Y' ? 'Discount amount for the free item(s)' :
                     'Discount value'}
                  </p>
                </div>
              </div>

              {/* Buy X Get Y Configuration */}
              {formData.type === 'BUY_X_GET_Y' && (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-orange-400">Buy X Get Y Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Buy Quantity (X) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.buyQuantity}
                        onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 2"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">Customer must buy this many</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Get Quantity (Y) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.getQuantity}
                        onChange={(e) => setFormData({ ...formData, getQuantity: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 1"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">Free items given</p>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      <span className="text-orange-400 font-semibold">How it works:</span> Jika customer membeli <strong>{formData.buyQuantity || 'X'}</strong> item, maka mendapat <strong>{formData.getQuantity || 'Y'}</strong> item gratis (senilai <strong>Rp{parseFloat(formData.value || '0').toLocaleString('id-ID')}</strong> diskon per unit gratis).
                    </p>
                  </div>
                </div>
              )}

              {/* Target Products / Categories */}
              <details className="bg-gray-700 border border-gray-600 rounded-lg">
                <summary className="px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                  🎯 Target Products / Categories (Optional)
                </summary>
                <div className="p-4 space-y-3 border-t border-gray-600">
                  <p className="text-xs text-gray-400">Limit this promotion to specific products or categories. Leave empty to apply to all.</p>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
                    <select
                      value={formData.applicableCategoryId}
                      onChange={(e) => setFormData({ ...formData, applicableCategoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {allCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Product IDs (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.applicableProductIds}
                      onChange={(e) => setFormData({ ...formData, applicableProductIds: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. prod-id-1, prod-id-2, prod-id-3"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated product IDs (leave empty for all products)</p>
                  </div>
                </div>
              </details>

              {/* Bundle Configuration */}
              <details className="bg-gray-700 border border-gray-600 rounded-lg">
                <summary className="px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                  📦 Bundle / Package Deal (Optional)
                </summary>
                <div className="p-4 space-y-3 border-t border-gray-600">
                  <p className="text-xs text-gray-400">Set a special price when multiple products are bought together as a bundle.</p>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Bundle Product IDs (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.bundleProductIds}
                      onChange={(e) => setFormData({ ...formData, bundleProductIds: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. prod-id-1, prod-id-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Bundle Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bundlePrice}
                      onChange={(e) => setFormData({ ...formData, bundlePrice: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Special price for bundle"
                    />
                  </div>
                </div>
              </details>

              {/* Tiered / Volume Discount */}
              <details className="bg-gray-700 border border-gray-600 rounded-lg">
                <summary className="px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                  📊 Tiered / Volume Discount (Optional)
                </summary>
                <div className="p-4 space-y-3 border-t border-gray-600">
                  <p className="text-xs text-gray-400">Offer increasing discounts based on quantity purchased. Format: JSON array of tiers.</p>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Example format:</p>
                    <pre className="text-xs text-green-400 font-mono">
{`[
  {"minQty": 1, "discount": 0, "label": "1-2 pcs"},
  {"minQty": 3, "discount": 5, "label": "3-5 pcs (5% off)"},
  {"minQty": 6, "discount": 10, "label": "6+ pcs (10% off)"}
]`}
                    </pre>
                  </div>
                  <textarea
                    value={formData.tiers}
                    onChange={(e) => setFormData({ ...formData, tiers: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={6}
                    placeholder='[{&quot;minQty&quot;:1,&quot;discount&quot;:0,&quot;label&quot;:&quot;1-2 pcs&quot;},{&quot;minQty&quot;:3,&quot;discount&quot;:5,&quot;label&quot;:&quot;3-5 pcs&quot;}]'
                  />
                  {formData.tiers && (() => {
                    try {
                      const parsed = JSON.parse(formData.tiers)
                      return (
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-2">Preview ({parsed.length} tiers):</p>
                          <div className="space-y-1">
                            {parsed.map((tier: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-gray-300">{tier.label || `${tier.minQty}+ items`}</span>
                                <span className="text-green-400">{tier.discount}% off</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    } catch {
                      return <p className="text-xs text-red-400">Invalid JSON format</p>
                    }
                  })()}
                </div>
              </details>

              {/* Flash Sale */}
              <details className="bg-gray-700 border border-gray-600 rounded-lg">
                <summary className="px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                  ⚡ Flash Sale Timer (Optional)
                </summary>
                <div className="p-4 space-y-3 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Enable Flash Sale Timer</p>
                      <p className="text-xs text-gray-400">Show a countdown timer on the POS screen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFlashSale}
                        onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  {formData.isFlashSale && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Flash Sale End Date & Time
                      </label>
                      <input
                        type="text"
                        value={formData.flashSaleEndDateTime}
                        onChange={(e) => setFormData({ ...formData, flashSaleEndDateTime: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="DD-MM-YYYY HH:mm (e.g. 31-12-2026 23:59)"
                      />
                      <p className="text-xs text-gray-400 mt-1">Format: Tanggal-Bulan-Tahun Jam:Menit</p>
                    </div>
                  )}
                </div>
              </details>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Start Date *
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    placeholder="DD-MM-YYYY (e.g., 01-05-2026)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: Tanggal-Bulan-Tahun</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    End Date *
                  </label>
                  <input
                    type="text"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="DD-MM-YYYY (e.g., 02-05-2026)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: Tanggal-Bulan-Tahun</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Min Purchase
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Max Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Voucher Code
                </label>
                <input
                  type="text"
                  value={formData.voucherCode}
                  onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Optional (e.g., PROMO2026)"
                />
              </div>

              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                      Promotion Status
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.isActive ? 'This promotion is active and will be applied automatically' : 'This promotion is inactive and will not be applied'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${formData.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPromo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
