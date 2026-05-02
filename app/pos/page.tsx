'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils'
import { printReceipt, printReceiptPDF } from '@/lib/printUtils'
import toast, { Toaster } from 'react-hot-toast'
import { Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft, Package, Clock, LogOut, Camera, Printer } from 'lucide-react'
import DiscountApprovalModal from '../components/DiscountApprovalModal'
import OpenShiftModal from '../components/OpenShiftModal'
import CloseShiftModal from '../components/CloseShiftModal'
import BarcodeScanner from '../components/BarcodeScanner'

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

  // Promotions
  const [promotions, setPromotions] = useState<any[]>([])
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null)
  const [voucherCode, setVoucherCode] = useState('')

  // Tax
  const [activeTax, setActiveTax] = useState<any>(null)
  const [taxAmount, setTaxAmount] = useState(0)

  // Multiple payment methods
  const [payments, setPayments] = useState<Array<{ method: string; amount: number }>>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH')
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('')

  // Shift management
  const [activeShift, setActiveShift] = useState<any>(null)
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)

  // Discount approval
  const [showDiscountApproval, setShowDiscountApproval] = useState(false)
  const [pendingDiscountValue, setPendingDiscountValue] = useState('')
  const [discountApprovedBy, setDiscountApprovedBy] = useState<string | null>(null)

  // Barcode scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchActiveShift()
    fetchWarehouses()
    fetchProducts()
    fetchActivePromotions()
    fetchActiveTax()
  }, [])

  // Auto-check promotions when cart changes
  useEffect(() => {
    if (items.length > 0 && promotions.length > 0 && !appliedPromotion) {
      console.log('Cart changed, checking promotions...')
      checkAndApplyPromotion(promotions)
    }
  }, [items, promotions])

  // Recalculate tax when cart or discount changes
  useEffect(() => {
    if (activeTax) {
      calculateTax()
    }
  }, [items, discount, activeTax])

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
      const warehouseList = Array.isArray(data) ? data : []
      setWarehouses(warehouseList)
      if (warehouseList.length > 0) {
        setSelectedWarehouse(warehouseList[0].id)
      }
    } catch (error) {
      toast.error('Failed to fetch warehouses')
      setWarehouses([])
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

  const fetchActivePromotions = async () => {
    try {
      const response = await fetch('/api/promotions?isActive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const promoList = Array.isArray(data.promotions) ? data.promotions : []
      setPromotions(promoList)

      console.log('Active promotions:', promoList) // Debug log

      // Auto-apply promotion if eligible
      if (promoList.length > 0) {
        checkAndApplyPromotion(promoList)
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error)
    }
  }

  const fetchActiveTax = async () => {
    try {
      const response = await fetch('/api/settings/tax', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      // Convert Store tax format to activeTax format
      if (data.taxRate && data.taxRate > 0) {
        const taxData = {
          name: 'PPN',
          rate: data.taxRate,
          type: data.taxInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'
        }
        setActiveTax(taxData)
        console.log('Active tax:', taxData)
      } else {
        setActiveTax(null)
        console.log('No active tax')
      }
    } catch (error) {
      console.error('Failed to fetch tax settings:', error)
    }
  }

  const calculateTax = () => {
    if (!activeTax) {
      setTaxAmount(0)
      return 0
    }

    const subtotal = getSubtotal()
    const afterDiscount = subtotal - discount

    if (activeTax.type === 'INCLUSIVE') {
      // Tax already included in price
      // Calculate tax portion: price / (1 + rate/100) * (rate/100)
      const taxPortion = (afterDiscount / (1 + activeTax.rate / 100)) * (activeTax.rate / 100)
      setTaxAmount(taxPortion)
      return taxPortion
    } else {
      // Tax added to price (EXCLUSIVE)
      const taxAmount = (afterDiscount * activeTax.rate) / 100
      setTaxAmount(taxAmount)
      return taxAmount
    }
  }

  const getTotalWithTax = () => {
    const subtotal = getSubtotal()
    const afterDiscount = subtotal - discount

    if (!activeTax) {
      return afterDiscount
    }

    if (activeTax.type === 'INCLUSIVE') {
      // Tax already included, no change to total
      return afterDiscount
    } else {
      // Tax added to total (EXCLUSIVE)
      return afterDiscount + taxAmount
    }
  }

  const checkAndApplyPromotion = (promoList: any[]) => {
    const subtotal = getSubtotal()

    console.log('=== CHECK AND APPLY PROMOTION ===')
    console.log('Subtotal:', subtotal)
    console.log('Total promotions:', promoList.length)

    // Find eligible promotions (no voucher code required, meets min purchase)
    const eligible = promoList.filter(promo => {
      const hasVoucher = !!promo.voucherCode
      const isActive = promo.isActive
      const now = new Date()
      const start = new Date(promo.startDate)
      const end = new Date(promo.endDate)
      const isInDateRange = start <= now && end >= now
      const meetsMinPurchase = !promo.minPurchase || subtotal >= promo.minPurchase

      console.log(`Promo: ${promo.name}`)
      console.log('  - Has voucher code:', hasVoucher)
      console.log('  - Is active:', isActive)
      console.log('  - Start date:', start.toISOString())
      console.log('  - End date:', end.toISOString())
      console.log('  - Now:', now.toISOString())
      console.log('  - In date range:', isInDateRange)
      console.log('  - Min purchase:', promo.minPurchase)
      console.log('  - Meets min purchase:', meetsMinPurchase)
      console.log('  - ELIGIBLE:', !hasVoucher && isActive && isInDateRange && meetsMinPurchase)

      return !hasVoucher && isActive && isInDateRange && meetsMinPurchase
    })

    console.log('Eligible promotions:', eligible.length)

    if (eligible.length > 0) {
      // Apply the best promotion (highest discount)
      const bestPromo = eligible.reduce((best, current) => {
        const bestDiscount = calculatePromotionDiscount(best, subtotal)
        const currentDiscount = calculatePromotionDiscount(current, subtotal)
        console.log(`  ${best.name}: ${bestDiscount} vs ${current.name}: ${currentDiscount}`)
        return currentDiscount > bestDiscount ? current : best
      })

      console.log('Best promotion:', bestPromo.name)
      applyPromotion(bestPromo)
    } else {
      console.log('No eligible promotions found')
    }
  }

  const calculatePromotionDiscount = (promo: any, subtotal: number) => {
    if (promo.type === 'PERCENTAGE') {
      const discount = (subtotal * promo.value) / 100
      return promo.maxDiscount ? Math.min(discount, promo.maxDiscount) : discount
    } else {
      return promo.value
    }
  }

  const applyPromotion = (promo: any) => {
    const subtotal = getSubtotal()
    const discountAmount = calculatePromotionDiscount(promo, subtotal)

    setAppliedPromotion(promo)
    setDiscount(discountAmount)
    setDiscountType('nominal')

    toast.success(`Promotion applied: ${promo.name}`)
  }

  const applyVoucherCode = () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter voucher code')
      return
    }

    const voucher = promotions.find(p =>
      p.voucherCode === voucherCode.trim() &&
      p.isActive &&
      new Date(p.startDate) <= new Date() &&
      new Date(p.endDate) >= new Date()
    )

    if (!voucher) {
      toast.error('Invalid or expired voucher code')
      return
    }

    const subtotal = getSubtotal()
    if (voucher.minPurchase && subtotal < voucher.minPurchase) {
      toast.error(`Minimum purchase ${formatCurrency(voucher.minPurchase)} required`)
      return
    }

    applyPromotion(voucher)
    setVoucherCode('')
  }

  const removePromotion = () => {
    setAppliedPromotion(null)
    setDiscount(0)
    toast.info('Promotion removed')
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

  const handleBarcodeScan = (barcode: string) => {
    // Search for product by barcode or SKU
    const product = products.find(p =>
      p.barcode === barcode || p.sku === barcode
    )

    if (product) {
      handleAddToCart(product)
      toast.success(`Scanned: ${product.name}`)
    } else {
      // If not found in current products list, fetch from API
      fetchProductByBarcode(barcode)
    }
  }

  const fetchProductByBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`/api/products?search=${barcode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (data.products && data.products.length > 0) {
        const product = data.products.find((p: any) =>
          p.barcode === barcode || p.sku === barcode
        )

        if (product) {
          handleAddToCart(product)
          toast.success(`Scanned: ${product.name}`)
        } else {
          toast.error('Product not found')
        }
      } else {
        toast.error('Product not found')
      }
    } catch (error) {
      toast.error('Failed to fetch product')
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  // Auto-check promotions when cart changes
  useEffect(() => {
    if (items.length > 0 && promotions.length > 0 && !appliedPromotion) {
      checkAndApplyPromotion(promotions)
    }
  }, [items, promotions])

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

    const total = getTotalWithTax()
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    if (totalPaid < total) {
      toast.error(`Insufficient payment. Need ${formatCurrency(total - totalPaid)} more`)
      return
    }

    setLoading(true)

    try {
      console.log('=== CREATE TRANSACTION DEBUG ===')
      console.log('Tax Amount:', taxAmount)
      console.log('Active Tax:', activeTax)
      console.log('Tax Rate:', activeTax?.rate || 0)
      console.log('Tax Type:', activeTax?.type || 'INCLUSIVE')

      const transactionData = {
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
        tax: taxAmount,
        taxRate: activeTax?.rate || 0,
        taxType: activeTax?.type || 'INCLUSIVE',
        paymentMethod: payments.length === 1 ? payments[0].method : 'SPLIT',
        paidAmount: totalPaid,
        payments: payments
      }

      console.log('Transaction data to send:', transactionData)

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transaction failed')
      }

      const transaction = await response.json()

      // Reset all states first (clearCart already resets discount to 0)
      clearCart()
      setShowPayment(false)
      setPaymentAmount('')
      setPayments([])
      setCurrentPaymentAmount('')
      setDiscountValue('')
      setDiscountType('nominal')
      setDiscountApprovedBy(null)

      // Show success message
      toast.success(`Transaction completed! Invoice: ${transaction.invoiceNo}`, {
        duration: 3000
      })

      // Print receipt (non-blocking)
      setTimeout(() => {
        try {
          handlePrintReceipt(transaction)
        } catch (error) {
          console.error('Print error:', error)
        }
      }, 500)

      // Refresh shift data
      fetchActiveShift()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = () => {
    const amount = parseFloat(currentPaymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter valid amount')
      return
    }

    const total = getTotalWithTax()
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = total - totalPaid

    // Only check for exceeding if there are already payments (split payment scenario)
    // Allow overpayment for single/first payment (for change)
    if (payments.length > 0 && amount > remaining) {
      toast.error(`Amount exceeds remaining ${formatCurrency(remaining)}`)
      return
    }

    setPayments([...payments, { method: selectedPaymentMethod, amount }])
    setCurrentPaymentAmount('')
    toast.success(`Added ${selectedPaymentMethod} payment: ${formatCurrency(amount)}`)
  }

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index)
    setPayments(newPayments)
  }

  const handleQuickPay = () => {
    const total = getTotal()
    setPayments([{ method: selectedPaymentMethod, amount: total }])
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

  const handlePrintReceipt = (transaction: any) => {
    try {
      console.log('=== PRINT RECEIPT DEBUG ===')
      console.log('Transaction data:', transaction)
      console.log('Tax:', transaction.tax)
      console.log('Tax Rate:', transaction.taxRate)
      console.log('Tax Type:', transaction.taxType)

      const receiptData = {
        invoiceNo: transaction.invoiceNo,
        date: transaction.createdAt,
        cashier: user?.name || '',
        customer: transaction.customer?.name,
        items: transaction.items.map((item: any) => ({
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        taxRate: transaction.taxRate,
        taxType: transaction.taxType,
        total: transaction.total,
        payments: transaction.payments || payments,
        change: transaction.changeAmount,
        store: {
          name: 'POS Store',
          address: 'Jl. Example No. 123',
          phone: '021-12345678'
        }
      }

      console.log('Receipt data:', receiptData)

      // Use browser print (works for all printers including thermal)
      printReceipt(receiptData)
    } catch (error: any) {
      console.error('Print error:', error)
      toast.error('Failed to print receipt')
    }
  }

  const subtotal = getSubtotal()
  const total = getTotalWithTax()
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Modals */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />

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
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
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
                  <button
                    onClick={() => setShowBarcodeScanner(true)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    title="Scan Barcode"
                  >
                    <Camera size={20} />
                    <span className="hidden sm:inline">Scan</span>
                  </button>
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
                  <label className="block text-sm font-medium text-gray-300">Discount / Promotion</label>

                  {/* Applied Promotion Display */}
                  {appliedPromotion && (
                    <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-300">{appliedPromotion.name}</p>
                          <p className="text-xs text-green-400">
                            {appliedPromotion.type === 'PERCENTAGE'
                              ? `${appliedPromotion.value}% off`
                              : `${formatCurrency(appliedPromotion.value)} off`}
                            {appliedPromotion.maxDiscount && ` (max ${formatCurrency(appliedPromotion.maxDiscount)})`}
                          </p>
                        </div>
                        <button
                          onClick={removePromotion}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Voucher Code Input */}
                  {!appliedPromotion && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Enter voucher code"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={applyVoucherCode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Manual Discount (only if no promotion applied) */}
                  {!appliedPromotion && (
                    <>
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
                          placeholder="Manual discount"
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                        />
                      </div>
                    </>
                  )}

                  {discount > 0 && (
                    <p className="text-xs text-green-400">
                      {appliedPromotion ? 'Promotion' : 'Manual'} discount: {formatCurrency(discount)}
                    </p>
                  )}
                </div>

                {/* Tax Display */}
                {activeTax && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {activeTax.name} ({activeTax.rate}%)
                      {activeTax.type === 'INCLUSIVE' && (
                        <span className="text-xs text-gray-500 ml-1">(included)</span>
                      )}
                    </span>
                    <span className="font-semibold text-white">{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                  <span className="text-gray-300">Total</span>
                  <span className="text-blue-400">{formatCurrency(getTotalWithTax())}</span>
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
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Payment Method</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>

                  {/* Payment Amount Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Amount</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={currentPaymentAmount}
                        onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                      <button
                        onClick={handleQuickPay}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Exact
                      </button>
                      <button
                        onClick={handleAddPayment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Payment List */}
                  {payments.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-300">Payments:</p>
                      {payments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                          <div>
                            <p className="text-sm text-white">{payment.method}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(payment.amount)}</p>
                          </div>
                          <button
                            onClick={() => handleRemovePayment(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="border-t border-gray-600 pt-2 flex justify-between">
                        <span className="text-sm text-gray-300">Total Paid:</span>
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Remaining Amount */}
                  {payments.length > 0 && (
                    <div className={`p-3 rounded-lg ${
                      payments.reduce((sum, p) => sum + p.amount, 0) >= total
                        ? 'bg-green-900 border border-green-700'
                        : 'bg-yellow-900 border border-yellow-700'
                    }`}>
                      <p className="text-sm text-gray-300">
                        {payments.reduce((sum, p) => sum + p.amount, 0) >= total ? 'Change' : 'Remaining'}
                      </p>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(Math.abs(total - payments.reduce((sum, p) => sum + p.amount, 0)))}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPayment(false)
                        setPayments([])
                        setCurrentPaymentAmount('')
                      }}
                      className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={loading || payments.length === 0 || payments.reduce((sum, p) => sum + p.amount, 0) < total}
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
