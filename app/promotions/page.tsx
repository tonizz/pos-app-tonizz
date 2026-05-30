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

// ── Product Multi-Selector Component ──
const ProductSelector = ({
  selectedIds,
  onChange,
  allProducts: products,
  placeholder = 'Search products...'
}: {
  selectedIds: string
  onChange: (val: string) => void
  allProducts: any[]
  placeholder?: string
}) => {
  const [search, setSearch] = useState('')

  // Parse selected IDs from string (JSON array or comma-separated)
  const getSelectedArray = (): string[] => {
    if (!selectedIds || !selectedIds.trim()) return []
    try {
      const parsed = JSON.parse(selectedIds)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return selectedIds.split(',').map(s => s.trim()).filter(Boolean)
  }

  const selected = getSelectedArray()
  const selectedProducts = products.filter((p: any) => selected.includes(p.id))

  const filtered = products.filter((p: any) =>
    !search ||
    (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleProduct = (productId: string) => {
    const current = getSelectedArray()
    const updated = current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId]
    onChange(updated.join(','))
  }

  return (
    <div className="space-y-2">
      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
      />

      {/* Selected products as chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProducts.map((p: any) => (
            <span
              key={p.id}
              onClick={() => toggleProduct(p.id)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900 text-blue-300 rounded-full text-xs cursor-pointer hover:bg-blue-800 transition-colors"
            >
              {p.name}
              <span className="text-blue-400 ml-0.5 font-bold">×</span>
            </span>
          ))}
        </div>
      )}

      {/* Filtered product list */}
      <div className="max-h-36 overflow-y-auto space-y-0.5 bg-gray-900 rounded-lg p-1.5 border border-gray-700">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 py-2 text-center">No products found</p>
        ) : (
          filtered.slice(0, 40).map((p: any) => {
            const isSelected = selected.includes(p.id)
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                  isSelected ? 'bg-blue-900 bg-opacity-40' : 'hover:bg-gray-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProduct(p.id)}
                  className="rounded border-gray-500"
                />
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-white truncate">{p.name}</span>
                  <span className="text-gray-500 text-xs ml-2 shrink-0">{p.sku || ''}</span>
                </div>
                <span className="text-blue-400 text-xs shrink-0">{formatCurrency(p.sellPrice)}</span>
              </label>
            )
          })
        )}
        {filtered.length > 40 && (
          <p className="text-xs text-gray-500 text-center py-1">...and {filtered.length - 40} more</p>
        )}
      </div>

      {/* Selected count indicator */}
      {selected.length > 0 && (
        <p className="text-xs text-gray-400">{selected.length} product{selected.length !== 1 ? 's' : ''} selected</p>
      )}
    </div>
  )
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

  // Tab UI State
  const [activeTab, setActiveTab] = useState<'general' | 'rules' | 'advanced'>('general')

  // Toggle states untuk modul Paket dan Tier
  const [isBundleActive, setIsBundleActive] = useState(false)
  const [isTieredActive, setIsTieredActive] = useState(false)

  // Visual Tiers state
  interface Tier {
    minQty: number
    discount: number
    label: string
  }
  const [localTiers, setLocalTiers] = useState<Tier[]>([])

  // Bundle builder states
  const [bundleSearch, setBundleSearch] = useState('')
  const [selectedBundleItems, setSelectedBundleItems] = useState<any[]>([])

  // Computed values for bundle deal
  const filteredBundleProducts = allProducts.filter((p: any) => {
    const isAlreadySelected = selectedBundleItems.some((item) => item.id === p.id)
    if (isAlreadySelected) return false
    if (!bundleSearch.trim()) return false
    return (
      p.name.toLowerCase().includes(bundleSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(bundleSearch.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(bundleSearch.toLowerCase()))
    )
  })

  const totalBundleNormalPrice = selectedBundleItems.reduce((sum, item) => sum + item.sellPrice, 0)
  const bundlePriceNum = parseFloat(formData.bundlePrice) || 0
  const bundleSavings = totalBundleNormalPrice > bundlePriceNum ? totalBundleNormalPrice - bundlePriceNum : 0
  const bundleSavingsPercent = totalBundleNormalPrice > 0 ? Math.round((bundleSavings / totalBundleNormalPrice) * 100) : 0

  // Sync toggles when modal opens or bundle/tiers states change
  useEffect(() => {
    if (showModal) {
      setIsBundleActive(selectedBundleItems.length > 0)
      setIsTieredActive(localTiers.length > 0)
    }
  }, [showModal])

  // Date formatting helpers
  const formatDateToHTMLDate = (dateString: string | null | Date) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateToHTMLDatetime = (dateString: string | null | Date) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const parseDateFromInput = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return new Date()
    const parts = dateStr.split('-')
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const [year, month, day] = parts.map(Number)
      return new Date(year, month - 1, day)
    } else {
      // DD-MM-YYYY
      const [day, month, year] = parts.map(Number)
      return new Date(year, month - 1, day)
    }
  }

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
    setActiveTab('general')
    setBundleSearch('')
    
    if (promo) {
      setEditingPromo(promo)
      setFormData({
        name: promo.name,
        type: promo.type,
        value: promo.value.toString(),
        startDate: formatDateToHTMLDate(promo.startDate),
        endDate: formatDateToHTMLDate(promo.endDate),
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
        flashSaleEndDateTime: promo.flashSaleEndTime ? formatDateToHTMLDatetime(promo.flashSaleEndTime) : '',
        bundleProductIds: promo.bundleProductIds || '',
        bundlePrice: promo.bundlePrice?.toString() || ''
      })

      // Set bundle items state
      let bundleIds: string[] = []
      if (promo.bundleProductIds) {
        try {
          const parsed = JSON.parse(promo.bundleProductIds)
          if (Array.isArray(parsed)) bundleIds = parsed
        } catch {
          bundleIds = promo.bundleProductIds.split(',').map(s => s.trim()).filter(Boolean)
        }
      }
      const matchedProducts = allProducts.filter((p: any) => bundleIds.includes(p.id))
      setSelectedBundleItems(matchedProducts)

      // Set tiers state
      try {
        const parsed = JSON.parse(promo.tiers || '[]')
        setLocalTiers(Array.isArray(parsed) ? parsed : [])
      } catch {
        setLocalTiers([])
      }
    } else {
      setEditingPromo(null)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData({
        name: '',
        type: 'PERCENTAGE',
        value: '',
        startDate: formatDateToHTMLDate(today),
        endDate: formatDateToHTMLDate(tomorrow),
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
      setSelectedBundleItems([])
      setLocalTiers([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPromo(null)
    setSelectedBundleItems([])
    setLocalTiers([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation across tabs
    if (!formData.name || !formData.name.trim()) {
      toast.error('Nama Promosi wajib diisi! (Silakan isi di Tab Info Dasar)')
      setActiveTab('general')
      return
    }

    if (!formData.startDate) {
      toast.error('Tanggal Mulai wajib diisi! (Silakan isi di Tab Info Dasar)')
      setActiveTab('general')
      return
    }

    if (!formData.endDate) {
      toast.error('Tanggal Berakhir wajib diisi! (Silakan isi di Tab Info Dasar)')
      setActiveTab('general')
      return
    }

    if (formData.type === 'VOUCHER' && (!formData.voucherCode || !formData.voucherCode.trim())) {
      toast.error('Kode Voucher wajib diisi! (Silakan isi di Tab Aturan Diskon)')
      setActiveTab('rules')
      return
    }

    if (formData.type === 'BUY_X_GET_Y') {
      if (!formData.buyQuantity || parseInt(formData.buyQuantity) <= 0) {
        toast.error('Jumlah Beli (X) wajib diisi dan lebih dari 0! (Silakan isi di Tab Aturan Diskon)')
        setActiveTab('rules')
        return
      }
      if (!formData.getQuantity || parseInt(formData.getQuantity) <= 0) {
        toast.error('Jumlah Gratis (Y) wajib diisi dan lebih dari 0! (Silakan isi di Tab Aturan Diskon)')
        setActiveTab('rules')
        return
      }
    }

    if (isBundleActive) {
      if (selectedBundleItems.length === 0) {
        toast.error('Silakan cari dan tambahkan produk ke dalam Paket Bundle! (Tab Target & Lanjutan)')
        setActiveTab('advanced')
        return
      }
      if (!formData.bundlePrice || parseFloat(formData.bundlePrice) < 0) {
        toast.error('Harga Paket Baru wajib diisi! (Tab Target & Lanjutan)')
        setActiveTab('advanced')
        return
      }
    }

    try {
      const url = editingPromo
        ? `/api/promotions/${editingPromo.id}`
        : '/api/promotions'

      const method = editingPromo ? 'PUT' : 'POST'

      const startDate = parseDateFromInput(formData.startDate)
      const endDate = parseDateFromInput(formData.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Invalid date format')
        return
      }

      if (endDate < startDate) {
        toast.error('End date must be after start date')
        return
      }

      let flashSaleEndTime = null
      if (formData.isFlashSale && formData.flashSaleEndDateTime) {
        if (formData.flashSaleEndDateTime.includes('T')) {
          const [datePart, timePart] = formData.flashSaleEndDateTime.split('T')
          const [year, month, day] = datePart.split('-').map(Number)
          const [hours, minutes] = timePart.split(':').map(Number)
          const dateObj = new Date(year, month - 1, day, hours, minutes)
          if (!isNaN(dateObj.getTime())) {
            flashSaleEndTime = dateObj.toISOString()
          }
        } else {
          // Fallback old format
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
      }

      const toJsonArray = (val: string) => {
        if (!val || !val.trim()) return null
        const parts = val.split(',').map(s => s.trim()).filter(Boolean)
        return parts.length > 0 ? JSON.stringify(parts) : null
      }

      let submitValue = formData.value
      if (!submitValue || submitValue.trim() === '' || submitValue === '0' || parseFloat(submitValue) === 0) {
        submitValue = '1'
      }

      const payload = {
        ...formData,
        value: submitValue,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        flashSaleEndTime,
        applicableProductIds: toJsonArray(formData.applicableProductIds),
        bundleProductIds: selectedBundleItems.length > 0 ? JSON.stringify(selectedBundleItems.map(p => p.id)) : null,
        tiers: localTiers.length > 0 ? JSON.stringify(localTiers) : null
      }

      console.log('Sending Promotion Payload:', payload)

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save promotion')
      }

      toast.success(`Promotion ${editingPromo ? 'updated' : 'created'} successfully`)
      handleCloseModal()
      fetchPromotions()
    } catch (error: any) {
      console.error('Error submitting promotion:', error)
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
        <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-850">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingPromo ? '✏️ Edit Promosi' : '✨ Tambah Promosi Baru'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Konfigurasi diskon, voucher, paket bundle, dan flash sale</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            {/* Premium Tabs Menu */}
            <div className="flex border-b border-gray-700 bg-gray-900/40 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-400 bg-gray-800/60'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
                }`}
              >
                📋 Info Dasar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'rules'
                    ? 'border-blue-500 text-blue-400 bg-gray-800/60'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
                }`}
              >
                ⚙️ Aturan Diskon
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'advanced'
                    ? 'border-blue-500 text-blue-400 bg-gray-800/60'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
                }`}
              >
                🎯 Target & Lanjutan
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* === TAB 1: GENERAL INFO === */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-in slide-in-from-left-4 duration-200">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Nama Promosi *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Diskon Akhir Tahun 2026"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Tanggal Mulai *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Tanggal Berakhir *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Minimal Pembelian (Rp)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.minPurchase}
                        onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                        placeholder="Optional (e.g. 50000)"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Promo aktif jika transaksi menyentuh nominal ini</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Maksimal Potongan Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                        placeholder="Optional (e.g. 20000)"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Batas maksimal potongan untuk tipe diskon persentase</p>
                    </div>
                  </div>

                  {/* Status Toggle Card */}
                  <div className="bg-gray-700/60 border border-gray-600 rounded-lg p-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="isActive" className="text-sm font-semibold text-gray-200 cursor-pointer">
                          Status Promosi Aktif
                        </label>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formData.isActive ? '✅ Promosi berjalan dan akan langsung diterapkan otomatis' : '❌ Promosi di-nonaktifkan sementara'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${formData.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                          {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: RULES AND CODES === */}
              {activeTab === 'rules' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Tipe Promosi *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="PERCENTAGE">Persentase (%)</option>
                        <option value="NOMINAL">Nominal Rupiah (Rp)</option>
                        <option value="VOUCHER">Kode Voucher Khusus</option>
                        <option value="BUY_X_GET_Y">Beli X Gratis Y (BXGY)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Nilai Potongan {formData.type !== 'BUY_X_GET_Y' ? ' *' : ''}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={formData.type === 'BUY_X_GET_Y'}
                        required={formData.type !== 'BUY_X_GET_Y'}
                        placeholder={
                          formData.type === 'PERCENTAGE' ? 'e.g. 10 (artinya diskon 10%)' : 
                          formData.type === 'NOMINAL' ? 'e.g. 15000 (diskon Rp15.000)' : 
                          formData.type === 'VOUCHER' ? 'e.g. 20000 (diskon Rp20.000)' :
                          'Diatur di konfigurasi BXGY'
                        }
                      />
                    </div>
                  </div>

                  {/* Voucher Code Block */}
                  {formData.type === 'VOUCHER' && (
                    <div className="bg-purple-950/20 border border-purple-900/50 rounded-xl p-5 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-300">Pengaturan Voucher Code</h4>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Kode Voucher *
                        </label>
                        <input
                          type="text"
                          value={formData.voucherCode}
                          onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm placeholder-purple-900/50"
                          placeholder="e.g. DISKONMANTAP26"
                          required
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Kode yang harus diketik kasir di halaman POS untuk mengaktifkan promo ini</p>
                      </div>
                    </div>
                  )}

                  {/* Buy X Get Y Configuration */}
                  {formData.type === 'BUY_X_GET_Y' && (
                    <div className="bg-orange-950/20 border border-orange-900/50 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-300">Pengaturan Beli X Gratis Y</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Beli Jumlah (X) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.buyQuantity}
                            onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="e.g. 2"
                            required
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Jumlah produk wajib beli</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 mb-1">
                            Gratis Jumlah (Y) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.getQuantity}
                            onChange={(e) => setFormData({ ...formData, getQuantity: e.target.value })}
                            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="e.g. 1"
                            required
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Jumlah barang gratis didapat</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                        <p className="text-xs text-gray-400 leading-relaxed">
                          💡 **Cara Kerja:** Setiap kali pembeli mengambil sebanyak **{formData.buyQuantity || 'X'}** item dari produk yang sama, maka **{formData.getQuantity || 'Y'}** item berikutnya akan digratiskan secara otomatis di sistem kasir.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === TAB 3: TARGETING & ADVANCED FEATURES === */}
              {activeTab === 'advanced' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-200">
                  
                  {/* 🎯 TARGET PENERAPAN */}
                  <div className="bg-gray-750 border border-gray-700 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                      🎯 Target Penerapan Promosi (Optional)
                    </h4>
                    <p className="text-xs text-gray-400">Batasi promo ini hanya untuk kategori barang atau produk tertentu saja. Kosongkan untuk menerapkan ke semua barang.</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Berdasarkan Kategori</label>
                        <select
                          value={formData.applicableCategoryId}
                          onChange={(e) => setFormData({ ...formData, applicableCategoryId: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-750 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          <option value="">Semua Kategori</option>
                          {allCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Berdasarkan Produk Spesifik
                        </label>
                        <ProductSelector
                          selectedIds={formData.applicableProductIds}
                          onChange={(val) => setFormData({ ...formData, applicableProductIds: val })}
                          allProducts={allProducts}
                          placeholder="Ketik nama atau SKU untuk memfilter..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-700" />

                  {/* 📦 BUNDLE BUILDER SECTION (PROMO PAKET) */}
                  <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/20">
                    <div className="flex items-center justify-between p-4 bg-gray-750 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📦</span>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Promo Paket (Bundle Deal)</h4>
                          <p className="text-[10px] text-gray-400">Jual paket gabungan beberapa produk dengan harga diskon khusus</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isBundleActive}
                          onChange={(e) => {
                            setIsBundleActive(e.target.checked)
                            if (!e.target.checked) {
                              setSelectedBundleItems([])
                              setFormData({ ...formData, bundlePrice: '' })
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {isBundleActive && (
                      <div className="p-5 space-y-4 bg-gray-800/40 animate-in slide-in-from-top duration-200">
                        {/* Autocomplete Search */}
                        <div className="relative">
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Cari Produk Paket
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            <input
                              type="text"
                              value={bundleSearch}
                              onChange={(e) => setBundleSearch(e.target.value)}
                              placeholder="Ketik nama barang, SKU, atau barcode..."
                              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                          </div>

                          {/* Search Dropdown */}
                          {bundleSearch.trim() && (
                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 p-1.5 space-y-0.5">
                              {filteredBundleProducts.length === 0 ? (
                                <p className="text-xs text-gray-500 py-3 text-center">Produk tidak ada / sudah masuk paket</p>
                              ) : (
                                filteredBundleProducts.slice(0, 8).map((product: any) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBundleItems([...selectedBundleItems, product])
                                      setBundleSearch('')
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded hover:bg-blue-900/40 hover:text-blue-200 text-xs text-gray-300 flex justify-between items-center transition-colors"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="font-medium truncate text-white">{product.name}</p>
                                      <p className="text-[9px] text-gray-500 truncate">{product.sku || 'No SKU'}</p>
                                    </div>
                                    <span className="text-blue-400 font-semibold shrink-0">{formatCurrency(product.sellPrice)}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected Bundle Items */}
                        {selectedBundleItems.length === 0 ? (
                          <div className="text-center py-6 bg-gray-900/20 rounded-lg border border-dashed border-gray-700">
                            <p className="text-xs text-gray-500">Belum ada barang di dalam paket bundle ini.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden divide-y divide-gray-800 max-h-36 overflow-y-auto">
                              {selectedBundleItems.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-center p-2.5 hover:bg-gray-850/30">
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">{item.sku || 'No SKU'}</p>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-xs font-semibold text-gray-300">{formatCurrency(item.sellPrice)}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBundleItems(selectedBundleItems.filter((_, i) => i !== idx))
                                      }}
                                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Bundle Stats & Calculator */}
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col justify-center">
                                <span className="text-[10px] text-gray-400 font-semibold uppercase">Total Harga Normal:</span>
                                <span className="text-base font-bold text-white mt-0.5">{formatCurrency(totalBundleNormalPrice)}</span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">
                                  Harga Paket Baru (Rp) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.bundlePrice}
                                  onChange={(e) => setFormData({ ...formData, bundlePrice: e.target.value })}
                                  placeholder="Harga Paket Baru"
                                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 text-white font-bold rounded focus:ring-1 focus:ring-blue-500 text-xs"
                                  required={isBundleActive && selectedBundleItems.length > 0}
                                />
                              </div>

                              {/* Customer Savings */}
                              {selectedBundleItems.length > 0 && formData.bundlePrice && (
                                <div className="sm:col-span-2 border-t border-gray-850 pt-2 flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400">Hemat Pelanggan:</span>
                                  {bundleSavings > 0 ? (
                                    <span className="text-xs font-bold text-green-400 bg-green-950/30 px-2 py-0.5 rounded border border-green-900/30">
                                      Hemat {formatCurrency(bundleSavings)} ({bundleSavingsPercent}% Off)
                                    </span>
                                  ) : bundleSavings === 0 && totalBundleNormalPrice === bundlePriceNum ? (
                                    <span className="text-[10px] text-gray-500">Sama dengan harga normal</span>
                                  ) : (
                                    <span className="text-[10px] text-yellow-400 font-semibold bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-900/30">
                                      ⚠️ Harga paket lebih mahal!
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 📊 TIERED DISCOUNT SECTION (DISKON VOLUME) */}
                  <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/20">
                    <div className="flex items-center justify-between p-4 bg-gray-750 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Diskon Volume Bertingkat (Tiered)</h4>
                          <p className="text-[10px] text-gray-400">Atur diskon grosir (makin banyak beli, makin besar diskonnya)</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTieredActive}
                          onChange={(e) => {
                            setIsTieredActive(e.target.checked)
                            if (!e.target.checked) {
                              setLocalTiers([])
                            } else if (localTiers.length === 0) {
                              setLocalTiers([{ minQty: 3, discount: 5, label: '3+ pcs' }])
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {isTieredActive && (
                      <div className="p-5 space-y-4 bg-gray-800/40 animate-in slide-in-from-top duration-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-400">Atur Tingkat Diskon:</span>
                          <button
                            type="button"
                            onClick={() => setLocalTiers([...localTiers, { minQty: 5, discount: 10, label: '' }])}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Plus size={10} /> Tambah Tingkat
                          </button>
                        </div>

                        {localTiers.length === 0 ? (
                          <div className="text-center py-4 bg-gray-900/10 rounded-lg border border-dashed border-gray-700">
                            <p className="text-xs text-gray-500">Belum ada tingkatan diskon.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {localTiers.map((tier, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-900/60 p-2 rounded border border-gray-700">
                                <div className="grid grid-cols-3 gap-2 flex-1">
                                  <div>
                                    <span className="block text-[8px] text-gray-500 font-bold uppercase mb-0.5">Min Qty</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={tier.minQty}
                                      onChange={(e) => {
                                        const updated = [...localTiers]
                                        updated[idx].minQty = parseInt(e.target.value) || 1
                                        if (!updated[idx].label || updated[idx].label.match(/^\d+\+ pcs/)) {
                                          updated[idx].label = `${updated[idx].minQty}+ pcs`
                                        }
                                        setLocalTiers(updated)
                                      }}
                                      className="w-full px-2 py-1 bg-gray-850 border border-gray-700 text-white text-[11px] rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[8px] text-gray-500 font-bold uppercase mb-0.5">Diskon (%)</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={tier.discount}
                                      onChange={(e) => {
                                        const updated = [...localTiers]
                                        updated[idx].discount = parseFloat(e.target.value) || 0
                                        setLocalTiers(updated)
                                      }}
                                      className="w-full px-2 py-1 bg-gray-850 border border-gray-700 text-white text-[11px] rounded"
                                    />
                                  </div>
                                  <div>
                                    <span className="block text-[8px] text-gray-500 font-bold uppercase mb-0.5">Label</span>
                                    <input
                                      type="text"
                                      value={tier.label}
                                      onChange={(e) => {
                                        const updated = [...localTiers]
                                        updated[idx].label = e.target.value
                                        setLocalTiers(updated)
                                      }}
                                      placeholder="e.g. Grosir 3-5"
                                      className="w-full px-2 py-1 bg-gray-850 border border-gray-700 text-white text-[11px] rounded"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLocalTiers(localTiers.filter((_, i) => i !== idx))}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded mt-3"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ⚡ FLASH SALE SECTION */}
                  <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/20">
                    <div className="flex items-center justify-between p-4 bg-gray-750 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Timer Flash Sale (Optional)</h4>
                          <p className="text-[10px] text-gray-400">Tampilkan hitungan mundur / countdown di layar POS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFlashSale}
                          onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>

                    {formData.isFlashSale && (
                      <div className="p-5 space-y-3 bg-gray-800/40 animate-in slide-in-from-top duration-200">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Tanggal & Jam Berakhir Flash Sale *
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.flashSaleEndDateTime}
                            onChange={(e) => setFormData({ ...formData, flashSaleEndDateTime: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 text-xs"
                            required={formData.isFlashSale}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Pilih tanggal dan jam kapan flash sale ditutup otomatis</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Cross-tab validation error display */}
              {(!formData.name || !formData.name.trim() || (isBundleActive && selectedBundleItems.length === 0) || (isBundleActive && !formData.bundlePrice)) && (
                <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-[11px] space-y-1 mx-6 mt-2">
                  {(!formData.name || !formData.name.trim()) && (
                    <p className="text-red-400 font-medium flex items-center gap-1">
                      ⚠️ Nama Promosi belum diisi (Lengkapi di Tab Info Dasar)
                    </p>
                  )}
                  {isBundleActive && selectedBundleItems.length === 0 && (
                    <p className="text-red-400 font-medium flex items-center gap-1">
                      ⚠️ Produk paket bundle belum dipilih (Lengkapi di Tab Target & Lanjutan)
                    </p>
                  )}
                  {isBundleActive && !formData.bundlePrice && (
                    <p className="text-red-400 font-medium flex items-center gap-1">
                      ⚠️ Harga Paket Baru belum diisi (Lengkapi di Tab Target & Lanjutan)
                    </p>
                  )}
                </div>
              )}

              {/* Form Footer Action Buttons */}
              <div className="flex gap-3 p-6 pt-4 border-t border-gray-750 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-blue-900/30"
                >
                  {editingPromo ? 'Simpan Perubahan' : 'Buat Promosi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
