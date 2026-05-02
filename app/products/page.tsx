'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { formatCurrency } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'
import { Package, Plus, Edit, Trash2, Search, ArrowLeft, Camera } from 'lucide-react'
import EditProductModal from '../components/EditProductModal'
import AddProductModal from '../components/AddProductModal'
import BarcodeScanner from '../components/BarcodeScanner'

export default function ProductsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(delaySearch)
  }, [searchQuery, selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const categoryList = Array.isArray(data) ? data : []
      setCategories(categoryList)
    } catch (error) {
      toast.error('Failed to fetch categories')
      setCategories([])
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('categoryId', selectedCategory)

      const response = await fetch(`/api/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode)
    setShowAddModal(true)
    toast.success(`Barcode scanned: ${barcode}`)
  }

  const handleOpenAddModal = () => {
    setScannedBarcode('')
    setShowAddModal(true)
  }

  const handleCreateProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      toast.success('Product created successfully')
      setShowAddModal(false)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateProduct = async (updatedData: any) => {
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      toast.success('Product updated successfully')
      setShowEditModal(false)
      setEditingProduct(null)
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900" suppressHydrationWarning>
      <Toaster position="top-right" />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setScannedBarcode('')
        }}
        onCreate={handleCreateProduct}
        categories={categories}
        initialBarcode={scannedBarcode}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingProduct(null)
        }}
        onUpdate={handleUpdateProduct}
        product={editingProduct}
      />

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
                <h1 className="text-2xl font-bold text-white">Products</h1>
                <p className="text-sm text-gray-400">Manage your products</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Camera size={20} />
                Scan Barcode
              </button>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or barcode..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Buy Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Sell Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const totalStock = product.stocks?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0
                    const isLowStock = product.stocks?.some((s: any) => s.quantity <= s.minStock)

                    return (
                      <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.barcode || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">{product.sku}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">{product.category?.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">{formatCurrency(product.buyPrice)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-white">{formatCurrency(product.sellPrice)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-semibold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                            {totalStock} {product.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.isActive
                              ? 'bg-green-900 text-green-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && products.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
