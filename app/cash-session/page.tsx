'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import {
  DollarSign,
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Calendar
} from 'lucide-react'

interface CashSession {
  id: string
  code: string
  openAmount: number
  actualAmount: number | null
  expectedAmount: number | null
  totalSales: number | null
  totalCash: number | null
  difference: number | null
  status: string
  openedAt: string
  closedAt: string | null
  notes: string | null
  cashier: {
    id: string
    name: string
    email: string
  }
  transactions?: any[]
}

export default function CashSessionPage() {
  const router = useRouter()
  const { token, isAuthenticated, user } = useAuthStore()
  const [activeShift, setActiveShift] = useState<CashSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [openAmount, setOpenAmount] = useState('')
  const [actualAmount, setActualAmount] = useState('')
  const [closeNotes, setCloseNotes] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchActiveShift()
  }, [])

  const fetchActiveShift = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shift', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shift')
      }

      const data = await response.json()
      setActiveShift(data.shift)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenShift = async () => {
    if (!openAmount || parseFloat(openAmount) < 0) {
      toast.error('Please enter a valid opening amount')
      return
    }

    try {
      const response = await fetch('/api/shift', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          openAmount: parseFloat(openAmount)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to open shift')
      }

      toast.success('Shift opened successfully')
      setShowOpenModal(false)
      setOpenAmount('')
      fetchActiveShift()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCloseShift = async () => {
    if (!activeShift) return

    if (!actualAmount || parseFloat(actualAmount) < 0) {
      toast.error('Please enter a valid actual amount')
      return
    }

    try {
      const response = await fetch('/api/shift/close', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shiftId: activeShift.id,
          actualAmount: parseFloat(actualAmount),
          notes: closeNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to close shift')
      }

      toast.success('Shift closed successfully')
      setShowCloseModal(false)
      setActualAmount('')
      setCloseNotes('')
      fetchActiveShift()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const calculateDifference = () => {
    if (!activeShift || !actualAmount) return 0
    const actual = parseFloat(actualAmount)
    const expected = activeShift.expectedAmount || 0
    return actual - expected
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Open Shift</h3>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Cashier</p>
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Date & Time</p>
                <p className="font-semibold text-white">
                  {new Date().toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opening Cash Amount *
                </label>
                <input
                  type="number"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter opening cash amount"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Amount of cash in the register at the start of shift
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleOpenShift}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Open Shift
                </button>
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Close Shift</h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Opening Amount</span>
                  <span className="text-white">{formatCurrency(activeShift.openAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Sales</span>
                  <span className="text-white">{formatCurrency(activeShift.totalSales || 0)}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold">
                  <span>Expected Amount</span>
                  <span>{formatCurrency(activeShift.expectedAmount || 0)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Actual Cash Amount *
                </label>
                <input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Count and enter actual cash"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Count all cash in the register
                </p>
              </div>

              {actualAmount && (
                <div className={`bg-gray-900 rounded-lg p-4 ${
                  calculateDifference() === 0
                    ? 'border border-green-700'
                    : calculateDifference() > 0
                    ? 'border border-blue-700'
                    : 'border border-red-700'
                }`}>
                  <p className="text-sm text-gray-400 mb-1">Difference</p>
                  <p className={`text-2xl font-bold ${
                    calculateDifference() === 0
                      ? 'text-green-400'
                      : calculateDifference() > 0
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {calculateDifference() > 0 ? '+' : ''}{formatCurrency(calculateDifference())}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {calculateDifference() === 0
                      ? 'Perfect! Cash matches expected amount'
                      : calculateDifference() > 0
                      ? 'Cash over - more than expected'
                      : 'Cash short - less than expected'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any notes about this shift..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseShift}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Close Shift
                </button>
                <button
                  onClick={() => setShowCloseModal(false)}
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
                <h1 className="text-2xl font-bold text-white">Cash Session Management</h1>
                <p className="text-sm text-gray-400">Open and close cashier shifts</p>
              </div>
            </div>
            {!activeShift && !loading && (
              <button
                onClick={() => setShowOpenModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Clock size={20} />
                Open Shift
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : activeShift ? (
          <div className="space-y-6">
            {/* Active Shift Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Active Shift</h2>
                  <p className="text-sm text-gray-400">{activeShift.code}</p>
                </div>
                <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm font-semibold flex items-center gap-2">
                  <CheckCircle size={16} />
                  Open
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Cashier</p>
                  <p className="font-semibold text-white">{activeShift.cashier.name}</p>
                  <p className="text-sm text-gray-400">{activeShift.cashier.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Opened At</p>
                  <p className="font-semibold text-white">
                    {new Date(activeShift.openedAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Opening Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(activeShift.openAmount)}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(activeShift.totalSales || 0)}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Expected Amount</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(activeShift.expectedAmount || 0)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Close Shift
              </button>
            </div>

            {/* Shift Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Transactions</p>
                    <p className="text-2xl font-bold text-white">
                      {activeShift.transactions?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-900 rounded-lg">
                    <TrendingUp size={24} className="text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.floor((new Date().getTime() - new Date(activeShift.openedAt).getTime()) / 1000 / 60)} min
                    </p>
                  </div>
                  <div className="p-3 bg-purple-900 rounded-lg">
                    <Clock size={24} className="text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Transaction</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        activeShift.transactions?.length
                          ? (activeShift.totalSales || 0) / activeShift.transactions.length
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-900 rounded-lg">
                    <DollarSign size={24} className="text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <Clock size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Shift</h3>
            <p className="text-gray-400 mb-6">Open a shift to start accepting transactions</p>
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Open Shift
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
