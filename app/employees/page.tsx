'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { Users, Plus, Edit, Trash2, Search, LogOut } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Employee {
  id: string
  name: string
  email: string
  nrp: string | null
  phone: string | null
  department: string | null
  position: string | null
  role: string
  isActive: boolean
  joinDate: string | null
  createdAt: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const { token, isAuthenticated, logout } = useAuthStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }

      const data = await response.json()
      setEmployees(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete employee')
      }

      toast.success('Employee deleted successfully')
      fetchEmployees()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.nrp?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole
    return matchesSearch && matchesRole
  })

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Employee Management</h1>
              <p className="text-sm text-gray-400">Manage employee data and information</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-4 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or NRP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="SALES">Sales</option>
            </select>
          </div>
          <button
            onClick={() => router.push('/employees/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-white mt-1">{employees.length}</p>
              </div>
              <div className="bg-blue-900 p-3 rounded-lg">
                <Users className="text-blue-400" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {employees.filter(e => e.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Sales Team</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {employees.filter(e => e.role === 'SALES').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {employees.filter(e => e.role === 'SUPER_ADMIN' || e.role === 'ADMIN').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">NRP</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Position</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-white font-semibold">
                      {employee.nrp || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{employee.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{employee.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{employee.position || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{employee.department || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-300">
                        {employee.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        employee.isActive
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/employees/${employee.id}`)}
                          className="p-2 text-blue-400 hover:bg-blue-900/50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-2 text-red-400 hover:bg-red-900/50 rounded"
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
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No employees found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
