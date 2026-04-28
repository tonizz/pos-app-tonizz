'use client'

import { useState } from 'react'
import { X, Clock, DollarSign } from 'lucide-react'

interface OpenShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onOpen: (openAmount: number) => Promise<void>
  cashierName: string
}

export default function OpenShiftModal({
  isOpen,
  onClose,
  onOpen,
  cashierName
}: OpenShiftModalProps) {
  const [openAmount, setOpenAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = parseFloat(openAmount)
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await onOpen(amount)
      setOpenAmount('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to open shift')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" suppressHydrationWarning>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Open Shift</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            Welcome, <span className="font-bold">{cashierName}</span>!
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Please enter your opening cash amount to start your shift.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Cash Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                value={openAmount}
                onChange={(e) => setOpenAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right text-lg font-semibold"
                placeholder="0"
                required
                autoFocus
                min="0"
                step="1000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the total cash in your register at the start of shift
            </p>
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
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Opening...' : 'Open Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
