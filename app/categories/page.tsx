'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import { FolderTree, Plus, Edit, Trash2, Search, ArrowLeft, X, FolderPlus } from 'lucide-react'

interface Category {
  id: string
  name: string
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: Category[]
  _count?: { products: number }
}

type ModalMode = 'add-parent' | 'add-child' | 'edit' | null

export default function CategoriesPage() {
  const router = useRouter()
  const { token, isAuthenticated, _hasHydrated } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', parentId: '' })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!isAuthenticated()) { router.push('/login'); return }
    fetchCategories()
  }, [_hasHydrated])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }

  const openAddParent = () => {
    setEditingCategory(null)
    setFormData({ name: '', parentId: '' })
    setModalMode('add-parent')
  }

  const openAddChild = (parent?: Category) => {
    setEditingCategory(null)
    setFormData({ name: '', parentId: parent?.id || '' })
    setModalMode('add-child')
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, parentId: cat.parentId || '' })
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingCategory(null)
    setFormData({ name: '', parentId: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error('Nama kategori wajib diisi'); return }
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name.trim(), parentId: formData.parentId || null })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editingCategory ? 'Kategori diperbarui' : 'Kategori ditambahkan')
      closeModal()
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Kategori dihapus')
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const parentCategories = categories.filter(c => !c.parentId)

  const buildHierarchy = () => {
    if (searchQuery) {
      return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    const result: Category[] = []
    parentCategories.forEach(parent => {
      result.push(parent)
      categories.filter(c => c.parentId === parent.id).forEach(child => result.push(child))
    })
    return result
  }

  if (!mounted) return null

  const modalTitle = modalMode === 'add-parent' ? 'Tambah Kategori Utama'
    : modalMode === 'add-child' ? 'Tambah Sub-Kategori'
    : 'Edit Kategori'

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalMode === 'add-parent' && (
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-3 text-sm text-blue-300">
                  Kategori utama adalah kelompok besar produk, contoh: <b>Elektronik</b>, <b>Makanan</b>, <b>Mainan</b>
                </div>
              )}
              {modalMode === 'add-child' && (
                <div className="bg-purple-900 border border-purple-700 rounded-lg p-3 text-sm text-purple-300">
                  Sub-kategori adalah bagian dari kategori utama, contoh: <b>Mainan Remote</b> di bawah <b>Mainan</b>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {modalMode === 'add-parent' ? 'Nama Kategori Utama'
                    : modalMode === 'add-child' ? 'Nama Sub-Kategori'
                    : 'Nama Kategori'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={modalMode === 'add-parent' ? 'contoh: Mainan, Elektronik' : 'contoh: Mainan Remote, Mainan Edukasi'}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  autoFocus
                  required
                />
              </div>
              {(modalMode === 'add-child' || modalMode === 'edit') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategori Utama (Parent) *
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={modalMode === 'add-child'}
                  >
                    <option value="">— Pilih Kategori Utama —</option>
                    {parentCategories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  {editingCategory ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Kategori Produk</h1>
                <p className="text-sm text-gray-400">Kelola kategori dan sub-kategori produk</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAddChild()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <FolderPlus size={20} />
                Tambah Sub-Kategori
              </button>
              <button onClick={openAddParent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={20} />
                Tambah Kategori
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : buildHierarchy().length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <FolderTree size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Belum ada kategori</h3>
            <p className="text-gray-400 mb-4">Mulai dengan menambahkan kategori utama</p>
            <button onClick={openAddParent}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={20} /> Tambah Kategori
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Nama Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Tipe</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Produk</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Sub-Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {buildHierarchy().map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3" style={{ paddingLeft: cat.parentId ? '1.5rem' : '0' }}>
                        {cat.parentId && <span className="text-gray-500">└</span>}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.parentId ? 'bg-purple-900' : 'bg-blue-900'}`}>
                          <FolderTree size={18} className={cat.parentId ? 'text-purple-300' : 'text-blue-300'} />
                        </div>
                        <span className="font-medium text-white">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cat.parentId
                        ? <span className="text-xs bg-purple-800 text-purple-300 px-2 py-1 rounded-full">Sub-Kategori</span>
                        : <span className="text-xs bg-blue-800 text-blue-300 px-2 py-1 rounded-full">Kategori Utama</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{cat._count?.products || 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{cat.children?.length || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {!cat.parentId && (
                          <button onClick={() => openAddChild(cat)}
                            className="p-2 text-purple-400 hover:bg-gray-700 rounded-lg"
                            title="Tambah Sub-Kategori">
                            <FolderPlus size={16} />
                          </button>
                        )}
                        <button onClick={() => openEdit(cat)}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(cat)}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
