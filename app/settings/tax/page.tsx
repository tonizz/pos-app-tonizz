'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { Calculator, ArrowLeft, Save, Info } from 'lucide-react'

export default function TaxSettingsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxRate, setTaxRate] = useState('0')
  const [taxInclusive, setTaxInclusive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchTaxSettings()
  }, [])

  const fetchTaxSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/tax', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tax settings')
      }

      const data = await response.json()
      setTaxRate(data.taxRate.toString())
      setTaxInclusive(data.taxInclusive)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const rate = parseFloat(taxRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tax rate must be between 0 and 100')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/settings/tax', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taxRate: rate,
          taxInclusive
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tax settings')
      }

      toast.success('Tax settings updated successfully')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const calculateExample = () => {
    const rate = parseFloat(taxRate) || 0
    const basePrice = 100000

    if (taxInclusive) {
      // Tax inclusive: price already includes tax
      const taxAmount = basePrice - (basePrice / (1 + rate / 100))
      const netPrice = basePrice - taxAmount
      return {
        basePrice,
        taxAmount,
        total: basePrice,
        netPrice
      }
    } else {
      // Tax exclusive: tax added on top
      const taxAmount = basePrice * (rate / 100)
      const total = basePrice + taxAmount
      return {
        basePrice,
        taxAmount,
        total,
        netPrice: basePrice
      }
    }
  }

  const example = calculateExample()

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Tax Settings</h1>
              <p className="text-sm text-gray-400">Configure tax calculation for transactions</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Tax Rate */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
                  <Calculator size={24} className="text-blue-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Tax Rate</h2>
                  <p className="text-sm text-gray-400">Set the default tax rate (e.g., PPN/VAT)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  />
                  <span className="absolute right-4 top-3 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Common rates: 11% (PPN Indonesia), 10% (VAT), 0% (No tax)
                </p>
              </div>
            </div>

            {/* Tax Mode */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Tax Calculation Mode</h2>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={!taxInclusive}
                    onChange={() => setTaxInclusive(false)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">Tax Exclusive</p>
                    <p className="text-sm text-gray-400">Tax is added on top of the price</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Example: Rp 100,000 + 11% tax = Rp 111,000
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="taxMode"
                    checked={taxInclusive}
                    onChange={() => setTaxInclusive(true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">Tax Inclusive</p>
                    <p className="text-sm text-gray-400">Price already includes tax</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Example: Rp 100,000 (includes 11% tax) = Net Rp 90,090 + Tax Rp 9,910
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Example Calculation</h2>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {taxInclusive ? 'Total Price (incl. tax):' : 'Base Price:'}
                  </span>
                  <span className="text-white font-semibold">
                    Rp {example.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>

                {taxInclusive && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Net Price:</span>
                    <span className="text-white">
                      Rp {Math.round(example.netPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax ({taxRate}%):</span>
                  <span className="text-blue-400">
                    Rp {Math.round(example.taxAmount).toLocaleString('id-ID')}
                  </span>
                </div>

                {!taxInclusive && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-600">
                    <span className="text-gray-300 font-semibold">Total:</span>
                    <span className="text-white font-bold">
                      Rp {Math.round(example.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> This tax rate will be applied automatically to all transactions in the POS system.
                  You can override tax rates per category or product if needed.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
