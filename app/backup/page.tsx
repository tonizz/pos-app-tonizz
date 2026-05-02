'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { Download, Upload, Database, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function BackupRestorePage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)

  const handleBackup = async () => {
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Only Super Admin can create backups')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create backup')
      }

      const data = await response.json()

      // Download backup file
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Backup created successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/json') {
        toast.error('Please select a valid JSON backup file')
        return
      }
      setRestoreFile(file)
      toast.success('Backup file selected')
    }
  }

  const handleRestore = async () => {
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Only Super Admin can restore backups')
      return
    }

    if (!restoreFile) {
      toast.error('Please select a backup file first')
      return
    }

    const confirmed = window.confirm(
      '⚠️ WARNING: This will overwrite existing data!\n\n' +
      'Are you sure you want to restore from this backup?\n\n' +
      'This action cannot be undone.'
    )

    if (!confirmed) return

    setLoading(true)
    try {
      // Read file content
      const fileContent = await restoreFile.text()
      const backup = JSON.parse(fileContent)

      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backup })
      })

      if (!response.ok) {
        throw new Error('Failed to restore backup')
      }

      const data = await response.json()
      toast.success('Database restored successfully!')

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Backup & Restore</h1>
              <p className="text-sm text-gray-400">Manage database backups</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-yellow-200 font-semibold mb-1">Important Notice</h3>
              <p className="text-yellow-300 text-sm">
                Backup and restore operations should only be performed by Super Admin.
                Restoring a backup will overwrite all existing data. Make sure to create
                a backup before restoring to avoid data loss.
              </p>
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-900 p-3 rounded-lg">
              <Download className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Backup</h2>
              <p className="text-sm text-gray-400">Download a complete backup of your database</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Backup includes:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Users and authentication data</li>
                <li>• Products, categories, and inventory</li>
                <li>• Customers and suppliers</li>
                <li>• Transactions and sales history</li>
                <li>• Employees and attendance records</li>
                <li>• Promotions and settings</li>
              </ul>
            </div>

            <button
              onClick={handleBackup}
              disabled={loading || user?.role !== 'SUPER_ADMIN'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Database size={20} />
              {loading ? 'Creating Backup...' : 'Create Backup Now'}
            </button>

            {user?.role !== 'SUPER_ADMIN' && (
              <p className="text-red-400 text-sm text-center">
                Only Super Admin can create backups
              </p>
            )}
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-900 p-3 rounded-lg">
              <Upload className="text-orange-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Restore Backup</h2>
              <p className="text-sm text-gray-400">Upload and restore from a backup file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-red-200 font-semibold mb-1">Warning</h3>
                  <p className="text-red-300 text-sm">
                    Restoring will overwrite ALL existing data. This action cannot be undone.
                    Make sure you have a recent backup before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Backup File (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={loading || user?.role !== 'SUPER_ADMIN'}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
              {restoreFile && (
                <p className="text-green-400 text-sm mt-2">
                  Selected: {restoreFile.name}
                </p>
              )}
            </div>

            <button
              onClick={handleRestore}
              disabled={loading || !restoreFile || user?.role !== 'SUPER_ADMIN'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <Upload size={20} />
              {loading ? 'Restoring...' : 'Restore from Backup'}
            </button>

            {user?.role !== 'SUPER_ADMIN' && (
              <p className="text-red-400 text-sm text-center">
                Only Super Admin can restore backups
              </p>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3">Best Practices</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• Create regular backups (daily or weekly recommended)</li>
            <li>• Store backup files in a secure location</li>
            <li>• Test restore process periodically</li>
            <li>• Keep multiple backup versions</li>
            <li>• Always create a backup before major updates</li>
            <li>• Verify backup file integrity before restoring</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
