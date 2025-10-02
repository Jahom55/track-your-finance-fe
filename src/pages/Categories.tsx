import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon, TagIcon } from '@heroicons/react/24/outline'
import { categoriesApi } from '../services/api'
import { ModelsCategory } from '../generated'
import CategoryModal from '../components/CategoryModal'

export default function Categories() {
  const [categories, setCategories] = useState<ModelsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE')
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ModelsCategory | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ModelsCategory | null>(null)

  useEffect(() => {
    loadCategories()
  }, [typeFilter, activeFilter])

  const loadCategories = async () => {
    try {
      setLoading(true)
      
      const params: any = {}
      
      if (typeFilter !== 'ALL') {
        params.type = typeFilter
      }
      
      if (activeFilter !== 'ALL') {
        params.active = activeFilter === 'ACTIVE'
      }

      const categoriesData = await categoriesApi.list(params)
      setCategories(categoriesData)
      setError('')
    } catch (err) {
      console.error('Failed to load categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (category: ModelsCategory) => {
    try {
      await categoriesApi.delete(category.id!)
      loadCategories() // Refresh list
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
    } catch (err: any) {
      console.error('Failed to delete category:', err)
      // Show more specific error message
      let errorMessage = 'Failed to delete category'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      setError(errorMessage)
    }
  }

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    )
  }

  const getTypeBadge = (type?: string) => {
    const colorClass = type === 'INCOME' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {type}
      </span>
    )
  }

  const resetFilters = () => {
    setTypeFilter('ALL')
    setActiveFilter('ACTIVE')
  }

  // Group categories by type for better organization
  const incomeCategories = categories.filter(cat => cat.type === 'INCOME')
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your income and expense categories for better transaction organization
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4 mb-4">
          <TagIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Categories organized by type */}
      {typeFilter === 'ALL' || typeFilter === 'INCOME' ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <h2 className="text-lg font-medium text-gray-900">Income Categories ({incomeCategories.length})</h2>
          </div>
          
          {incomeCategories.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              No income categories found. Create your first income category!
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {incomeCategories.map((category) => (
                  <li key={category.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-4"
                          style={{ backgroundColor: category.color }}
                        >
                          <FolderIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          {getTypeBadge(category.type)}
                          {getStatusBadge(category.is_active)}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category)
                              setShowCategoryModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category)
                              setShowDeleteConfirm(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {typeFilter === 'ALL' || typeFilter === 'EXPENSE' ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <h2 className="text-lg font-medium text-gray-900">Expense Categories ({expenseCategories.length})</h2>
          </div>
          
          {expenseCategories.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              No expense categories found. Create your first expense category!
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {expenseCategories.map((category) => (
                  <li key={category.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-4"
                          style={{ backgroundColor: category.color }}
                        >
                          <FolderIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-2">
                          {getTypeBadge(category.type)}
                          {getStatusBadge(category.is_active)}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(category)
                              setShowCategoryModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category)
                              setShowDeleteConfirm(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the category "{categoryToDelete.name}"? 
                        {categoryToDelete.is_active 
                          ? ' If it has associated transactions, it will be deactivated instead of deleted.'
                          : ' This action cannot be undone.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(categoryToDelete)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setCategoryToDelete(null)
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setEditingCategory(null)
        }}
        onSave={() => {
          loadCategories()
        }}
        category={editingCategory}
      />
    </div>
  )
}