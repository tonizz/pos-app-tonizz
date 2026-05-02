'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { CreditCard, Plus, Search, ArrowLeft, X, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface CreditTransaction {
  id: string
  customerId: string
  customer: { id: string; name: string; phone: string | null; creditLimit: number; creditBalance: number }
  transactionId: string | null
  transaction: { id: string; invoiceNo: string } | null
  amount: number
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  dueDate: string | null
  paidDate: string | null
  notes: string | null
  payments: {
    id: string
    amount: number
    paymentMethod: string
    createdAt: string
  }[]
  createdAt: string
  updatedAt: string
}

interface Customer {
  id: string
  name: string
  phone: string | null
  creditLimit: number
  creditBalance: number
}

export default function CreditsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [credits, setCredits] = useState<CreditTransaction[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<CreditTransaction | null>(null)
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    dueDate: '',
    notes: ''
  })
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: ''
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchCustomers()
    fetchCredits()
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [statusFilter])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      toast.error('Failed to fetch customers')
    }
  }

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/credits?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setCredits(data.creditTransactions || [])
    } catch (error) {
      toast.error('Failed to fetch credits')
      setCredits([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({ customerId: '', amount: '', dueDate: '', notes: '' })
    setShowAddModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setFormData({ customerId: '', amount: '', dueDate: '', notes: '' })
  }

  const handleOpenPaymentModal = (credit: CreditTransaction) => {
    const totalPaid = credit.payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = credit.amount - totalPaid
    setSelectedCredit(credit)
    setPaymentData({ amount: remaining.toString(), paymentMethod: 'CASH', reference: '', notes: '' })
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedCredit(null)
    setPaymentData({ amount: '', paymentMethod: 'CASH', reference: '', notes: '' })
  }

  const handleSubmitCredit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || !formData.amount) {
      toast.error('Customer and amount are required')
      return
    }

    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate || null,
          notes: formData.notes || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create credit')
      }

      toast.success('Credit created successfully')
      handleCloseAddModal()
      fetchCredits()
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCredit || !paymentData.amount || !paymentData.paymentMethod) {
      toast.error('All fields are required')
      return
    }

    try {
      const response = await fetch('/api/credits/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creditTransactionId: selectedCredit.id,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference || null,
          notes: paymentData.notes || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process payment')
      }

      toast.success('Payment processed successfully')
      handleClosePaymentModal()
      fetchCredits()
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      UNPAID: { bg: 'bg-red-900', text: 'text-red-300', icon: AlertCircle },
      PARTIAL: { bg: 'bg-yellow-900', text: 'text-yellow-300', icon: Clock },
      PAID: { bg: 'bg-green-900', text: 'text-green-300', icon: CheckCircle },
      OVERDUE: { bg: 'bg-red-900', text: 'text-red-300', icon: AlertCircle }
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

  const filteredCredits = credits.filter(credit =>
    credit.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    credit.customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Add Credit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Add Credit Transaction</h2>
              <button onClick={handleCloseAddModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitCredit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Limit: {formatCurrency(c.creditLimit)} | Balance: {formatCurrency(c.creditBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Process Payment</h2>
              <button onClick={handleClosePaymentModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Customer</p>
                <p className="text-white font-semibold">{selectedCredit.customer.name}</p>
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-white">{formatCurrency(selectedCredit.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Paid:</span>
                    <span className="text-green-400">
                      {formatCurrency(selectedCredit.payments.reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-300">Remaining:</span>
                    <span className="text-red-400">
                      {formatCurrency(selectedCredit.amount - selectedCredit.payments.reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="GOPAY">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="DANA">DANA</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Transaction reference..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Process Payment
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
                <h1 className="text-2xl font-bold text-white">Customer Credits</h1>
                <p className="text-sm text-gray-400">Manage customer credit & payments</p>
              </div>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Credit
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
                placeholder="Search by customer name or phone..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Credits List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCredits.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <CreditCard size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No credits found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Create your first credit transaction'}
            </p>
            {!searchQuery && !statusFilter && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Credit
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCredits.map((credit) => {
              const totalPaid = credit.payments.reduce((sum, p) => sum + p.amount, 0)
              const remaining = credit.amount - totalPaid

              return (
                <div
                  key={credit.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{credit.customer.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {credit.customer.phone && <span>{credit.customer.phone}</span>}
                        {credit.transaction && (
                          <>
                            <span>•</span>
                            <span>Invoice: {credit.transaction.invoiceNo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(credit.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(credit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {credit.notes && (
                    <p className="text-sm text-gray-400 mb-3">{credit.notes}</p>
                  )}

                  {credit.dueDate && (
                    <p className="text-sm text-gray-400 mb-3">
                      Due: {new Date(credit.dueDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Total</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(credit.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Paid</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Remaining</p>
                        <p className="text-lg font-bold text-red-400">{formatCurrency(remaining)}</p>
                      </div>
                    </div>
                  </div>

                  {credit.payments.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-400 mb-2">Payment History:</p>
                      <div className="space-y-1">
                        {credit.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">
                              {new Date(payment.createdAt).toLocaleDateString()} - {payment.paymentMethod}
                            </span>
                            <span className="text-green-400">{formatCurrency(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {credit.status !== 'PAID' && (
                    <button
                      onClick={() => handleOpenPaymentModal(credit)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                    >
                      <DollarSign size={16} />
                      Process Payment
                    </button>
                  )}

                  {credit.status === 'PAID' && credit.paidDate && (
                    <p className="text-sm text-green-400 text-center">
                      Paid on {new Date(credit.paidDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredCredits.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredCredits.length} credit transaction{filteredCredits.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
