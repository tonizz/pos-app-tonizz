'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft, Package, Clock, LogOut } from 'lucide-react'
import DiscountApprovalModal from '../components/DiscountApprovalModal'
import OpenShiftModal from '../components/OpenShiftModal'
import CloseShiftModal from '../components/CloseShiftModal'

export default function POSPage() {
  const router = useRouter()
  const { token, user, isAuthenticated } = useAuthStore()
  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal, getSubtotal, discount, setDiscount } = useCartStore()

  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'nominal'>('nominal')
  const [discountValue, setDiscountValue] = useState('')

  // Shift management
  const [activeShift, setActiveShift] = useState<any>(null)
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)

  // Discount approval
  const [showDiscountApproval, setShowDiscountApproval] = useState(false)
  const [pendingDiscountValue, setPendingDiscountValue] = useState('')
  const [discountApprovedBy, setDiscountApprovedBy] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchActiveShift()
    fetchWarehouses()
    fetchProducts()
  }, [])

  const fetchActiveShift = async () => {
    try {
      const response = await fetch('/api/shift', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setActiveShift(data.shift)

      if (!data.shift) {
        setShowOpenShift(true)
      }
    } catch (error) {
      toast.error('Failed to fetch shift')
    }
  }

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

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?search=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error('Failed to fetch products')
    }
  }

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // When Enter is pressed (barcode scanner), try to add product directly
      const exactMatch = products.find(p =>
        p.barcode === searchQuery.trim() ||
        p.sku === searchQuery.trim()
      )

      if (exactMatch) {
        handleAddToCart(exactMatch)
        setSearchQuery('') // Clear search after adding
      } else if (products.length === 1) {
        // If only one product matches, add it
        handleAddToCart(products[0])
        setSearchQuery('')
      }
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  const handleAddToCart = (product: any) => {
    // Apply auto discount if exists
    let itemDiscount = 0
    if (product.autoDiscount && product.autoDiscountType) {
      if (product.autoDiscountType === 'percentage') {
        itemDiscount = (product.sellPrice * product.autoDiscount) / 100
      } else {
        itemDiscount = product.autoDiscount
      }
    }

    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.sellPrice,
      quantity: 1,
      discount: itemDiscount,
      sku: product.sku
    })

    if (itemDiscount > 0) {
      toast.success(`${product.name} added with ${product.autoDiscountType === 'percentage' ? product.autoDiscount + '%' : formatCurrency(product.autoDiscount)} auto discount!`)
    } else {
      toast.success(`${product.name} added to cart`)
    }
  }

  const handleOpenShift = async (openAmount: number) => {
    try {
      const response = await fetch('/api/shift', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ openAmount })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to open shift')
      }

      const data = await response.json()
      setActiveShift(data)
      toast.success(`Shift opened: ${data.code}`)
    } catch (error: any) {
      throw error
    }
  }

  const handleCloseShift = async (actualAmount: number, notes: string) => {
    try {
      const response = await fetch('/api/shift/close', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shiftId: activeShift.id,
          actualAmount,
          notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to close shift')
      }

      const data = await response.json()
      toast.success('Shift closed successfully')
      setActiveShift(null)
      router.push('/dashboard')
    } catch (error: any) {
      throw error
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!selectedWarehouse) {
      toast.error('Please select a warehouse')
      return
    }

    const total = getTotal()
    const paid = parseFloat(paymentAmount)

    if (paid < total) {
      toast.error('Insufficient payment amount')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.subtotal
          })),
          warehouseId: selectedWarehouse,
          shiftId: activeShift?.id,
          discount,
          discountApprovedBy,
          tax: 0,
          paymentMethod: 'CASH',
          paidAmount: paid
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transaction failed')
      }

      const transaction = await response.json()
      toast.success(`Transaction completed! Invoice: ${transaction.invoiceNo}`)
      clearCart()
      setShowPayment(false)
      setPaymentAmount('')
      setDiscountValue('')
      setDiscountType('nominal')
      setDiscountApprovedBy(null)
      fetchActiveShift() // Refresh shift data
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscountChange = (value: string) => {
    const numValue = parseFloat(value) || 0

    // Check if discount requires approval (>5%)
    if (discountType === 'percentage' && numValue > 5) {
      setPendingDiscountValue(value)
      setShowDiscountApproval(true)
      return
    }

    // Apply discount if within limit
    setDiscountValue(value)

    if (discountType === 'percentage') {
      const discountAmount = (subtotal * numValue) / 100
      setDiscount(discountAmount)
    } else {
      setDiscount(numValue)
    }
  }

  const handleDiscountTypeChange = (type: 'percentage' | 'nominal') => {
    setDiscountType(type)
    setDiscountValue('')
    setDiscount(0)
    setDiscountApprovedBy(null)
  }

  const handleDiscountApproval = async (username: string, password: string) => {
    try {
      const numValue = parseFloat(pendingDiscountValue) || 0

      const response = await fetch('/api/discount/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          discountPercentage: numValue
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Approval failed')
      }

      const data = await response.json()

      // Apply approved discount
      setDiscountValue(pendingDiscountValue)
      const discountAmount = (subtotal * numValue) / 100
      setDiscount(discountAmount)
      setDiscountApprovedBy(data.approvedBy.id)

      toast.success(`Discount approved by ${data.approvedBy.name}`)
    } catch (error: any) {
      throw error
    }
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const change = paymentAmount ? parseFloat(paymentAmount) - total : 0

  // Block POS if no active shift
  if (!activeShift) {
    return (
      <>
        <OpenShiftModal
          isOpen={showOpenShift}
          onClose={() => {
            setShowOpenShift(false)
            router.push('/dashboard')
          }}
          onOpen={handleOpenShift}
          cashierName={user?.name || ''}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Modals */}
      <DiscountApprovalModal
        isOpen={showDiscountApproval}
        onClose={() => {
          setShowDiscountApproval(false)
          setPendingDiscountValue('')
        }}
        onApprove={handleDiscountApproval}
        discountPercentage={parseFloat(pendingDiscountValue) || 0}
      />

      <CloseShiftModal
        isOpen={showCloseShift}
        onClose={() => setShowCloseShift(false)}
        onCloseShift={handleCloseShift}
        shift={{
          code: activeShift.code,
          openAmount: activeShift.openAmount,
          totalSales: activeShift.totalSales || 0,
          expectedAmount: activeShift.expectedAmount || activeShift.openAmount
        }}
      />

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
                <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
                {activeShift && (
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {activeShift.code}
                    </span>
                    <span>•</span>
                    <span>{user?.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {activeShift && (
                <button
                  onClick={() => setShowCloseShift(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 flex items-center gap-2"
                >
                  <Clock size={18} />
                  Close Shift
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleBarcodeSearch}
                    placeholder="Search products by name, SKU, or barcode..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Scan barcode or type SKU/product name, press Enter to add
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {products.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="border border-gray-600 bg-gray-700 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                      <Package size={48} className="text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate text-white">{product.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{product.sku}</p>
                    <p className="text-lg font-bold text-blue-400">{formatCurrency(product.sellPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Cart</h2>
                <ShoppingCart size={24} className="text-gray-400" />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                {items.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Cart is empty</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="border border-gray-600 bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-white">{item.name}</h3>
                          <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 bg-gray-600 rounded hover:bg-gray-500 text-white"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-semibold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 bg-gray-600 rounded hover:bg-gray-500 text-white"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-bold text-white">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Discount</label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => handleDiscountTypeChange(e.target.value as 'percentage' | 'nominal')}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="nominal">Rp</option>
                      <option value="percentage">%</option>
                    </select>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                    />
                  </div>
                  {discount > 0 && (
                    <p className="text-xs text-gray-400">
                      Discount: {discountType === 'percentage' ? `${discountValue}%` : ''} = {formatCurrency(discount)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                  <span className="text-gray-300">Total</span>
                  <span className="text-blue-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {!showPayment ? (
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={items.length === 0}
                  className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Payment Amount</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  {change >= 0 && paymentAmount && (
                    <div className="bg-green-900 border border-green-700 p-3 rounded-lg">
                      <p className="text-sm text-green-300">Change</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(change)}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPayment(false)}
                      className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={loading || !paymentAmount || parseFloat(paymentAmount) < total}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600"
                    >
                      {loading ? 'Processing...' : 'Complete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
