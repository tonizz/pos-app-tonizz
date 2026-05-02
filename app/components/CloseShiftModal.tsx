'use client'

import { useState } from 'react'
import { X, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CloseShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onCloseShift: (actualAmount: number, notes: string) => Promise<void>
  shift: {
    code: string
    openAmount: number
    totalSales: number
    expectedAmount: number
  }
}

export default function CloseShiftModal({
  isOpen,
  onClose,
  onCloseShift,
  shift
}: CloseShiftModalProps) {
  const [actualAmount, setActualAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const difference = actualAmount ? parseFloat(actualAmount) - shift.expectedAmount : 0
  const isDifferent = Math.abs(difference) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = parseFloat(actualAmount)
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await onCloseShift(amount, notes)
      setActualAmount('')
      setNotes('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to close shift')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" suppressHydrationWarning>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Close Shift</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shift Code:</span>
            <span className="font-semibold text-gray-900">{shift.code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Opening Amount:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(shift.openAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Sales:</span>
            <span className="font-semibold text-green-600">{formatCurrency(shift.totalSales)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-gray-600">Expected Amount:</span>
            <span className="font-bold text-blue-600">{formatCurrency(shift.expectedAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Cash Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-lg font-semibold text-gray-900 bg-white"
                placeholder="0"
                required
                autoFocus
                min="0"
                step="1000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Count all cash in your register and enter the total amount
            </p>
          </div>

          {isDifferent && actualAmount && (
            <div className={`border rounded-lg p-4 ${
              difference > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className={difference > 0 ? 'text-green-600' : 'text-red-600'} />
                <span className="font-semibold text-sm">
                  {difference > 0 ? 'Cash Over' : 'Cash Short'}
                </span>
              </div>
              <p className={`text-2xl font-bold ${
                difference > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {difference > 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Add any notes about this shift..."
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Closing...' : 'Close Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
