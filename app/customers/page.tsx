'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { Users, Plus, Edit, Trash2, Search, ArrowLeft, Award } from 'lucide-react'

export default function CustomersPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchCustomers()
  }, [])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/customers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setCustomers(data || [])
    } catch (error) {
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-800'
      case 'GOLD': return 'bg-yellow-100 text-yellow-800'
      case 'SILVER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
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
                <h1 className="text-2xl font-bold text-white">Customers</h1>
                <p className="text-sm text-gray-400">Manage your customers & members</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/loyalty')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Customer
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, phone, or email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customers Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-12 text-center">
            <Users size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No customers found</h3>
            <p className="text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Member Tier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Points</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Total Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-blue-400 font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.address || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-300">{customer.phone || '-'}</p>
                        <p className="text-xs text-gray-500">{customer.email || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-semibold ${getTierColor(customer.memberTier)}`}>
                          <Award size={12} />
                          {customer.memberTier}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-blue-400">{customer.points} pts</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gray-300">{formatCurrency(customer.totalSpent)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push('/loyalty')}
                            className="p-2 text-blue-400 hover:bg-gray-600 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => toast('Delete feature coming soon!')}
                            className="p-2 text-red-400 hover:bg-gray-600 rounded-lg"
                          >
                            <Trash2 size={16} />
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

        {/* Summary */}
        {!loading && customers.length > 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
