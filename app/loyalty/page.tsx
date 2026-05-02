'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { Gift, Users, TrendingUp, Award, Search, Plus, ArrowLeft } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  points: number
  memberTier: string
  totalSpent: number
  referralCode: string
  birthday: string | null
}

interface PointTransaction {
  id: string
  type: string
  points: number
  description: string
  reference: string | null
  createdAt: string
}

interface LoyaltySummary {
  customer: Customer
  pointsBalance: number
  memberTier: string
  tierDiscount: number
  totalEarned: number
  totalRedeemed: number
  recentTransactions: PointTransaction[]
}

export default function LoyaltyPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltySummary | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
    referredBy: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchCustomers()
  }, [isAuthenticated])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()
      setCustomers(data)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const fetchLoyaltySummary = async (customerId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/loyalty/summary?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch loyalty summary')

      const data = await response.json()
      setLoyaltySummary(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    fetchLoyaltySummary(customer.id)
  }

  const handleRedeemPoints = async () => {
    if (!selectedCustomer) return

    const points = parseInt(redeemPoints)
    if (isNaN(points) || points < 100) {
      toast.error('Minimum 100 points to redeem')
      return
    }

    if (points > selectedCustomer.points) {
      toast.error('Insufficient points')
      return
    }

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          points
        })
      })

      if (!response.ok) throw new Error('Failed to redeem points')

      const data = await response.json()
      toast.success(`Redeemed ${points} points for ${formatCurrency(data.discount)} discount!`)
      setRedeemPoints('')
      fetchLoyaltySummary(selectedCustomer.id)
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCustomer.name) {
      toast.error('Name is required')
      return
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCustomer)
      })

      if (!response.ok) throw new Error('Failed to create customer')

      const data = await response.json()
      toast.success('Customer created successfully!')
      setShowAddCustomer(false)
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        birthday: '',
        referredBy: ''
      })
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'text-orange-600 bg-orange-100'
      case 'SILVER': return 'text-gray-600 bg-gray-100'
      case 'GOLD': return 'text-yellow-600 bg-yellow-100'
      case 'PLATINUM': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EARN': return 'text-green-600 bg-green-100'
      case 'REDEEM': return 'text-red-600 bg-red-100'
      case 'BONUS': return 'text-blue-600 bg-blue-100'
      case 'EXPIRE': return 'text-gray-600 bg-gray-100'
      case 'ADJUST': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
                <p className="text-sm text-gray-500">Manage customer points and rewards</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customers</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchCustomers()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{customer.name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(customer.memberTier)}`}>
                      {customer.memberTier}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Points:</span>
                    <span className="text-sm font-semibold text-blue-600">{customer.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCustomer && loyaltySummary ? (
              <>
                {/* Customer Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{loyaltySummary.customer.name}</h2>
                      <p className="text-gray-600">{loyaltySummary.customer.email}</p>
                      <p className="text-gray-600">{loyaltySummary.customer.phone}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getTierColor(loyaltySummary.memberTier)}`}>
                      {loyaltySummary.memberTier} - {loyaltySummary.tierDiscount}% Discount
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gift className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">Points Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{loyaltySummary.pointsBalance}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ≈ {formatCurrency(Math.floor(loyaltySummary.pointsBalance / 100) * 10000)} discount
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">Total Earned</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{loyaltySummary.totalEarned}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-gray-600">Total Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(loyaltySummary.customer.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Referral Code</p>
                        <p className="text-lg font-mono font-bold">{loyaltySummary.customer.referralCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(loyaltySummary.customer.referralCode)
                          toast.success('Referral code copied!')
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Redeem Points */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Redeem Points</h3>
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      placeholder="Enter points (min 100)"
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="100"
                      step="100"
                    />
                    <button
                      onClick={handleRedeemPoints}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Redeem
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    100 points = {formatCurrency(10000)} discount
                  </p>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Point Transaction History</h3>
                  <div className="space-y-3">
                    {loyaltySummary.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(transaction.type)}`}>
                              {transaction.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(transaction.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-sm">{transaction.description}</p>
                          {transaction.reference && (
                            <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                          )}
                        </div>
                        <div className={`text-lg font-bold ${
                          transaction.type === 'REDEEM' || transaction.type === 'EXPIRE'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}>
                          {transaction.type === 'REDEEM' || transaction.type === 'EXPIRE' ? '-' : '+'}
                          {transaction.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a customer to view loyalty details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birthday</label>
                <input
                  type="date"
                  value={newCustomer.birthday}
                  onChange={(e) => setNewCustomer({ ...newCustomer, birthday: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Referred By (Referral Code)</label>
                <input
                  type="text"
                  value={newCustomer.referredBy}
                  onChange={(e) => setNewCustomer({ ...newCustomer, referredBy: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter referral code (optional)"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
