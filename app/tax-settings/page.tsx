'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Percent,
  Info
} from 'lucide-react'

interface TaxSetting {
  id: string
  name: string
  rate: number
  type: 'INCLUSIVE' | 'EXCLUSIVE'
  isActive: boolean
  applyToAll: boolean
  categories: string | null
  description: string | null
  createdAt: string
}

export default function TaxSettingsPage() {
  const router = useRouter()
  const { token, user, isAuthenticated } = useAuthStore()
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([])
  const [activeTax, setActiveTax] = useState<TaxSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    type: 'INCLUSIVE' as 'INCLUSIVE' | 'EXCLUSIVE',
    isActive: true,
    applyToAll: true,
    description: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
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

    fetchTaxSettings()
  }, [])

  const fetchTaxSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tax-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tax settings')
      }

      const data = await response.json()
      setTaxSettings(data.taxSettings || [])
      setActiveTax(data.activeTax)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (tax?: TaxSetting) => {
    if (tax) {
      setEditingTax(tax)
      setFormData({
        name: tax.name,
        rate: tax.rate.toString(),
        type: tax.type,
        isActive: tax.isActive,
        applyToAll: tax.applyToAll,
        description: tax.description || ''
      })
    } else {
      setEditingTax(null)
      setFormData({
        name: 'PPN',
        rate: '11',
        type: 'INCLUSIVE',
        isActive: true,
        applyToAll: true,
        description: 'Pajak Pertambahan Nilai'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTax(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTax
        ? `/api/tax-settings/${editingTax.id}`
        : '/api/tax-settings'

      const method = editingTax ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tax setting')
      }

      toast.success(`Tax setting ${editingTax ? 'updated' : 'created'} successfully`)
      handleCloseModal()
      fetchTaxSettings()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax setting?')) {
      return
    }

    try {
      const response = await fetch(`/api/tax-settings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tax setting')
      }

      toast.success('Tax setting deleted successfully')
      fetchTaxSettings()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleToggleActive = async (tax: TaxSetting) => {
    try {
      const response = await fetch(`/api/tax-settings/${tax.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !tax.isActive })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tax setting')
      }

      toast.success(`Tax setting ${!tax.isActive ? 'activated' : 'deactivated'}`)
      fetchTaxSettings()
    } catch (error: any) {
      toast.error(error.message)
    }
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
                <h1 className="text-2xl font-bold text-white">Tax Settings</h1>
                <p className="text-sm text-gray-400">Manage tax configuration</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Tax Setting
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Active Tax Info */}
        {activeTax && (
          <div className="mb-6 bg-blue-900 border border-blue-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Active Tax Configuration</h3>
                <p className="text-sm text-blue-200">
                  <strong>{activeTax.name}</strong> - {activeTax.rate}% ({activeTax.type})
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  {activeTax.type === 'INCLUSIVE'
                    ? 'Tax is included in product prices (recommended for retail)'
                    : 'Tax is added to the final price (recommended for B2B)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tax Settings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : taxSettings.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Percent size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">No tax settings found</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Default Tax Setting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taxSettings.map(tax => (
              <div
                key={tax.id}
                className={`bg-gray-800 border rounded-xl p-6 ${
                  tax.isActive ? 'border-blue-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Percent size={20} className="text-blue-400" />
                    <h3 className="font-semibold text-white">{tax.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(tax)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tax.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Rate:</span>
                    <span className="text-2xl font-bold text-blue-400">{tax.rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Type:</span>
                    <span className="text-sm text-white">{tax.type}</span>
                  </div>
                  {tax.description && (
                    <p className="text-xs text-gray-400 mt-2">{tax.description}</p>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <button
                    onClick={() => handleToggleActive(tax)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                      tax.isActive
                        ? 'bg-green-900 text-green-300'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {tax.isActive ? 'Active' : 'Inactive - Click to Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingTax ? 'Edit Tax Setting' : 'Add New Tax Setting'}
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
                  Tax Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., PPN, VAT, Sales Tax"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Tax Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="e.g., 11"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Tax Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCLUSIVE' | 'EXCLUSIVE' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="INCLUSIVE">Inclusive (Tax included in price)</option>
                  <option value="EXCLUSIVE">Exclusive (Tax added to price)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.type === 'INCLUSIVE'
                    ? 'Recommended for retail: Tax is already included in product prices'
                    : 'Recommended for B2B: Tax is added to the final price'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Pajak Pertambahan Nilai"
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                      Tax Status
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.isActive ? 'This tax will be applied to transactions' : 'This tax will not be applied'}
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
                  {editingTax ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
