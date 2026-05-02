'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { Settings as SettingsIcon, Store, Gift, Receipt, ArrowLeft, Save } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('store')

  const [settings, setSettings] = useState({
    // Store Settings
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_logo: '',
    store_npwp: '',
    store_currency: 'IDR',

    // Loyalty Settings
    loyalty_points_per_amount: 1000,
    loyalty_points_value: 1,
    loyalty_redeem_points: 100,
    loyalty_redeem_value: 10000,
    loyalty_bronze_threshold: 0,
    loyalty_silver_threshold: 5000000,
    loyalty_gold_threshold: 20000000,
    loyalty_platinum_threshold: 50000000,
    loyalty_birthday_bonus: 200,
    loyalty_referrer_bonus: 100,
    loyalty_referee_bonus: 50,

    // Receipt Settings
    receipt_template: '80mm',
    receipt_show_logo: true,
    receipt_footer: 'Thank you for your purchase!\nPlease come again',
    receipt_auto_print: false,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 403) {
        toast.error('You do not have permission to view settings')
        router.push('/dashboard')
        return
      }

      const data = await response.json()
      setSettings({ ...settings, ...data })
    } catch (error) {
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to save settings')
        return
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
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
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-400">Configure your application</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeTab === 'store'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Store size={20} />
              Store Settings
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeTab === 'loyalty'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gift size={20} />
              Loyalty Settings
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeTab === 'receipt'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Receipt size={20} />
              Receipt Settings
            </button>
          </div>
        </div>

        {/* Store Settings */}
        {activeTab === 'store' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Store Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Store Name *</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Currency</label>
                  <select
                    value={settings.store_currency}
                    onChange={(e) => handleChange('store_currency', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IDR">IDR (Indonesian Rupiah)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Address</label>
                <textarea
                  value={settings.store_address}
                  onChange={(e) => handleChange('store_address', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={settings.store_phone}
                    onChange={(e) => handleChange('store_phone', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => handleChange('store_email', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">NPWP / Tax ID</label>
                  <input
                    type="text"
                    value={settings.store_npwp}
                    onChange={(e) => handleChange('store_npwp', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Logo URL</label>
                  <input
                    type="text"
                    value={settings.store_logo}
                    onChange={(e) => handleChange('store_logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Settings */}
        {activeTab === 'loyalty' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Loyalty Program Configuration</h2>

            <div className="space-y-6">
              {/* Points Earning */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Points Earning</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Amount per Point (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_points_per_amount}
                      onChange={(e) => handleChange('loyalty_points_per_amount', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Customer earns 1 point for every Rp {settings.loyalty_points_per_amount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points Redemption */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Points Redemption</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Points Required
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_redeem_points}
                      onChange={(e) => handleChange('loyalty_redeem_points', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Discount Value (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_redeem_value}
                      onChange={(e) => handleChange('loyalty_redeem_value', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {settings.loyalty_redeem_points} points = Rp {settings.loyalty_redeem_value.toLocaleString('id-ID')} discount
                </p>
              </div>

              {/* Member Tiers */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Member Tier Thresholds</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Bronze (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_bronze_threshold}
                      onChange={(e) => handleChange('loyalty_bronze_threshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Silver (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_silver_threshold}
                      onChange={(e) => handleChange('loyalty_silver_threshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Gold (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_gold_threshold}
                      onChange={(e) => handleChange('loyalty_gold_threshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Platinum (Rp)
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_platinum_threshold}
                      onChange={(e) => handleChange('loyalty_platinum_threshold', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Bonuses */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bonus Points</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Birthday Bonus
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_birthday_bonus}
                      onChange={(e) => handleChange('loyalty_birthday_bonus', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Referrer Bonus
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_referrer_bonus}
                      onChange={(e) => handleChange('loyalty_referrer_bonus', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Referee Bonus
                    </label>
                    <input
                      type="number"
                      value={settings.loyalty_referee_bonus}
                      onChange={(e) => handleChange('loyalty_referee_bonus', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Settings */}
        {activeTab === 'receipt' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Receipt Configuration</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Receipt Template
                  </label>
                  <select
                    value={settings.receipt_template}
                    onChange={(e) => handleChange('receipt_template', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="58mm">Thermal 58mm</option>
                    <option value="80mm">Thermal 80mm</option>
                    <option value="A4">A4 Paper</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.receipt_show_logo}
                    onChange={(e) => handleChange('receipt_show_logo', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Show logo on receipt</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.receipt_auto_print}
                    onChange={(e) => handleChange('receipt_auto_print', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Auto-print after transaction</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Receipt Footer Message
                </label>
                <textarea
                  value={settings.receipt_footer}
                  onChange={(e) => handleChange('receipt_footer', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Thank you for your purchase!"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This message will appear at the bottom of every receipt
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
