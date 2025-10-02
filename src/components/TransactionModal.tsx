import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { transactionsApi } from '../services/api'
import { 
  ModelsTransaction,
  ModelsCategory,
  ModelsTransactionType,
  ModelsCreateTransactionRequest,
  ModelsUpdateTransactionRequest
} from '../generated'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  transaction: ModelsTransaction | null
  categories: ModelsCategory[]
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  transaction, 
  categories 
}: TransactionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    type: 'EXPENSE' as ModelsTransactionType
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Edit mode - populate with existing data
        setFormData({
          name: transaction.name || '',
          amount: transaction.amount?.toString() || '',
          description: transaction.description || '',
          transaction_date: transaction.transaction_date 
            ? transaction.transaction_date.split('T')[0] 
            : format(new Date(), 'yyyy-MM-dd'),
          category_id: transaction.category_id || '',
          type: (transaction.type as ModelsTransactionType) || 'EXPENSE'
        })
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          amount: '',
          description: '',
          transaction_date: format(new Date(), 'yyyy-MM-dd'),
          category_id: '',
          type: 'EXPENSE'
        })
      }
      setError('')
    }
  }, [isOpen, transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0')
      }
      if (!formData.category_id) {
        throw new Error('Category is required')
      }

      const amount = parseFloat(formData.amount)

      // Convert date to full datetime (ISO format with time set to noon UTC)
      const fullDateTime = new Date(formData.transaction_date + 'T12:00:00.000Z').toISOString()

      if (transaction) {
        // Update existing transaction
        const updateData: ModelsUpdateTransactionRequest = {
          name: formData.name.trim(),
          amount,
          description: formData.description.trim() || undefined,
          transaction_date: fullDateTime,
          category_id: formData.category_id
        }
        await transactionsApi.update(transaction.id!, updateData)
      } else {
        // Create new transaction
        const createData: ModelsCreateTransactionRequest = {
          name: formData.name.trim(),
          amount,
          description: formData.description.trim() || undefined,
          transaction_date: fullDateTime,
          category_id: formData.category_id,
          type: formData.type
        }
        await transactionsApi.create(createData)
      }

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save transaction:', err)
      
      let errorMessage = 'Failed to save transaction'
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

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const regex = /^\d*\.?\d*$/
    if (regex.test(value)) {
      setFormData({ ...formData, amount: value })
    }
  }

  // Filter categories based on selected type
  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  // Set first category as default when type changes
  useEffect(() => {
    if (formData.type && !transaction) {
      const availableCategories = categories.filter(cat => cat.type === formData.type)
      if (availableCategories.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: availableCategories[0].id || '' }))
      }
    }
  }, [formData.type, categories, transaction])

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
                  {transaction ? 'Edit Transaction' : 'Add New Transaction'}
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
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="INCOME"
                        checked={formData.type === 'INCOME'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsTransactionType, category_id: '' })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        disabled={!!transaction} // Can't change type when editing
                      />
                      <span className="ml-2 text-sm text-gray-700">Income</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="EXPENSE"
                        checked={formData.type === 'EXPENSE'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsTransactionType, category_id: '' })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        disabled={!!transaction} // Can't change type when editing
                      />
                      <span className="ml-2 text-sm text-gray-700">Expense</span>
                    </label>
                  </div>
                  {transaction && (
                    <p className="mt-1 text-xs text-gray-500">
                      Transaction type cannot be changed when editing
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
                    placeholder="e.g., Salary, Groceries, Coffee"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount * ($)
                  </label>
                  <input
                    type="text"
                    id="amount"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category_id"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {filteredCategories.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No categories available for {formData.type.toLowerCase()}. Please create some categories first.
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="transaction_date"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
                    placeholder="Optional description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
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
                disabled={loading || filteredCategories.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : transaction ? 'Update' : 'Create'}
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