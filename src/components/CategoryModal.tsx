import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { categoriesApi } from '../services/api'
import { 
  ModelsCategory,
  ModelsCategoryType,
  ModelsCreateCategoryRequest,
  ModelsUpdateCategoryRequest
} from '../generated'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  category: ModelsCategory | null
}

// Predefined color options
const colorOptions = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#6B7280', '#374151', '#1F2937'
]

// Icon options (using Heroicons names)
const iconOptions = [
  { name: 'folder', label: 'Folder' },
  { name: 'tag', label: 'Tag' },
  { name: 'home', label: 'Home' },
  { name: 'car', label: 'Car' },
  { name: 'shopping-cart', label: 'Shopping' },
  { name: 'heart', label: 'Health' },
  { name: 'academic-cap', label: 'Education' },
  { name: 'briefcase', label: 'Work' },
  { name: 'gift', label: 'Gift' },
  { name: 'coffee', label: 'Food & Drink' },
  { name: 'film', label: 'Entertainment' },
  { name: 'currency-dollar', label: 'Money' },
  { name: 'banknotes', label: 'Bills' },
  { name: 'calculator', label: 'Finance' },
  { name: 'building-office', label: 'Business' },
  { name: 'chart-bar', label: 'Investment' }
]

export default function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as ModelsCategoryType,
    color: colorOptions[0],
    icon: iconOptions[0].name,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode - populate with existing data
        setFormData({
          name: category.name || '',
          description: category.description || '',
          type: (category.type as ModelsCategoryType) || 'EXPENSE',
          color: category.color || colorOptions[0],
          icon: category.icon || iconOptions[0].name,
          is_active: category.is_active !== undefined ? category.is_active : true
        })
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          description: '',
          type: 'EXPENSE',
          color: colorOptions[0],
          icon: iconOptions[0].name,
          is_active: true
        })
      }
      setError('')
    }
  }, [isOpen, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Category name is required')
      }

      if (category) {
        // Update existing category
        const updateData: ModelsUpdateCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          icon: formData.icon,
          is_active: formData.is_active
        }
        await categoriesApi.update(category.id!, updateData)
      } else {
        // Create new category
        const createData: ModelsCreateCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          color: formData.color,
          icon: formData.icon
        }
        await categoriesApi.create(createData)
      }

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save category:', err)
      
      let errorMessage = 'Failed to save category'
      if (err.message) {
        errorMessage = err.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {category ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="INCOME"
                        checked={formData.type === 'INCOME'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsCategoryType })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        disabled={!!category} // Can't change type when editing
                      />
                      <span className="ml-2 text-sm text-gray-700">Income</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="EXPENSE"
                        checked={formData.type === 'EXPENSE'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsCategoryType })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        disabled={!!category} // Can't change type when editing
                      />
                      <span className="ml-2 text-sm text-gray-700">Expense</span>
                    </label>
                  </div>
                  {category && (
                    <p className="mt-1 text-xs text-gray-500">
                      Category type cannot be changed when editing
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Salary, Groceries, Entertainment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Optional description for this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          formData.color === color ? 'border-gray-800 ring-2 ring-indigo-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center">
                    <div
                      className="w-6 h-6 rounded-full mr-2"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm text-gray-600">Selected: {formData.color}</span>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon.name} value={icon.name}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Status (only for editing) */}
                {category && (
                  <div>
                    <div className="flex items-center">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                        Active category
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Inactive categories won't appear in transaction forms
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : category ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}