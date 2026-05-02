'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import { printReceipt } from '@/lib/printUtils'
import toast, { Toaster } from 'react-hot-toast'
import {
  Receipt,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Download,
  Calendar,
  User,
  CreditCard,
  X,
  Printer
} from 'lucide-react'

interface Transaction {
  id: string
  invoiceNo: string
  total: number
  subtotal: number
  discount: number
  tax: number
  paymentMethod: string
  paidAmount: number
  changeAmount: number
  status: string
  createdAt: string
  cashier: {
    id: string
    name: string
    email: string
  }
  customer?: {
    id: string
    name: string
    phone: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    discount: number
    subtotal: number
    product: {
      id: string
      name: string
      sku: string
      unit: string
    }
  }>
  payments: Array<{
    id: string
    method: string
    amount: number
  }>
}

export default function TransactionsPage() {
  const router = useRouter()
  const { token, isAuthenticated, user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchTransactions()
    }
  }, [pagination.page, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        startDate,
        endDate
      })

      const response = await fetch(`/api/transactions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailModal(true)
  }

  const handlePrint = (transaction: Transaction) => {
    try {
      const receiptData = {
        invoiceNo: transaction.invoiceNo,
        date: transaction.createdAt,
        cashier: transaction.cashier.name,
        customer: transaction.customer?.name,
        items: transaction.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal
        })),
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        total: transaction.total,
        payments: transaction.payments.length > 0
          ? transaction.payments
          : [{ method: transaction.paymentMethod, amount: transaction.paidAmount }],
        change: transaction.changeAmount,
        store: {
          name: 'POS Store',
          address: 'Jl. Example No. 123',
          phone: '021-12345678'
        }
      }

      printReceipt(receiptData)
      toast.success('Printing receipt...')
    } catch (error: any) {
      console.error('Print error:', error)
      toast.error('Failed to print receipt')
    }
  }

  const handleExport = () => {
    // TODO: Implement export to Excel
    toast.success('Export feature coming soon!')
  }

  const filteredTransactions = transactions.filter(t =>
    t.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.cashier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0)
  const totalTransactions = filteredTransactions.length

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Transaction Detail</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Info */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Invoice Number</p>
                    <p className="font-semibold text-white">{selectedTransaction.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Date</p>
                    <p className="font-semibold text-white">
                      {new Date(selectedTransaction.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Cashier</p>
                    <p className="font-semibold text-white">{selectedTransaction.cashier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p className="font-semibold text-white">
                      {selectedTransaction.customer?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-white mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item) => (
                    <div key={item.id} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{item.product.name}</p>
                          <p className="text-sm text-gray-400">SKU: {item.product.sku}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity} {item.product.unit} × {formatCurrency(item.price)}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-sm text-yellow-400">
                              Discount: -{formatCurrency(item.discount)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                {selectedTransaction.tax > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Paid Amount</span>
                  <span>{formatCurrency(selectedTransaction.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Change</span>
                  <span>{formatCurrency(selectedTransaction.changeAmount)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="font-semibold text-white mb-3">Payment Methods</h4>
                <div className="space-y-2">
                  {selectedTransaction.payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-900 rounded-lg p-3 flex justify-between">
                      <span className="text-gray-400 capitalize">{payment.method}</span>
                      <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrint(selectedTransaction)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer size={20} />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
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
                <h1 className="text-2xl font-bold text-white">Transaction History</h1>
                <p className="text-sm text-gray-400">View all sales transactions</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              Export
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
                <p className="text-sm text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-900 rounded-lg">
                <Receipt size={24} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-900 rounded-lg">
                <CreditCard size={24} className="text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Average Transaction</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totalTransactions > 0 ? totalRevenue / totalTransactions : 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-900 rounded-lg">
                <User size={24} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice, cashier, or customer..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <Receipt size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400">Try adjusting your search or date range</p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Invoice</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cashier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Items</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{transaction.invoiceNo}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                        <br />
                        <span className="text-xs">
                          {new Date(transaction.createdAt).toLocaleTimeString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">{transaction.cashier.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {transaction.customer?.name || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {transaction.items.length} item(s)
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400 capitalize">
                        {transaction.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-white">
                        {formatCurrency(transaction.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-900 text-green-300'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(transaction)}
                            className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg"
                            title="View Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrint(transaction)}
                            className="p-2 text-green-400 hover:bg-gray-700 rounded-lg"
                            title="Print Receipt"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {filteredTransactions.length} of {pagination.total} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-gray-800 text-white rounded-lg">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
