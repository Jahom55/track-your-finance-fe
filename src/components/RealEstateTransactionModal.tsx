import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { realEstateApi } from '../services/api'
import { ModelsProperty, ModelsRealEstateTransaction, ModelsCreateRealEstateTransactionRequest, ModelsRealEstateTransactionType } from '../generated'

interface RealEstateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  transaction: ModelsRealEstateTransaction | null
  properties: ModelsProperty[]
}

export default function RealEstateTransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  transaction,
  properties
}: RealEstateTransactionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    property_id: '',
    type: ModelsRealEstateTransactionType.RealEstateExpense,
    amount: '',
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd')
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setFormData({
          name: transaction.name || '',
          property_id: transaction.property_id || '',
          type: transaction.type || ModelsRealEstateTransactionType.RealEstateExpense,
          amount: transaction.amount?.toString() || '',
          description: transaction.description || '',
          transaction_date: transaction.transaction_date 
            ? transaction.transaction_date.split('T')[0] 
            : format(new Date(), 'yyyy-MM-dd')
        })
      } else {
        setFormData({
          name: '',
          property_id: properties.length > 0 ? properties[0].id || '' : '',
          type: ModelsRealEstateTransactionType.RealEstateExpense,
          amount: '',
          description: '',
          transaction_date: format(new Date(), 'yyyy-MM-dd')
        })
      }
      setError('')
    }
  }, [isOpen, transaction, properties])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Transaction name is required')
      }
      if (!formData.property_id) {
        throw new Error('Property is required')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const amount = parseFloat(formData.amount)
      const fullDateTime = new Date(formData.transaction_date + 'T12:00:00.000Z').toISOString()

      const transactionData: ModelsCreateRealEstateTransactionRequest = {
        name: formData.name.trim(),
        property_id: formData.property_id,
        type: formData.type,
        amount,
        description: formData.description.trim() || undefined,
        transaction_date: fullDateTime
      }

      if (transaction) {
        await realEstateApi.transactions.update(transaction.id, transactionData)
      } else {
        await realEstateApi.transactions.create(transactionData)
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
    const regex = /^\d*\.?\d*$/
    if (regex.test(value)) {
      setFormData({ ...formData, amount: value })
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
                  {transaction ? 'Edit Real Estate Transaction' : 'Add New Real Estate Transaction'}
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
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Transaction Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Monthly Rent, Plumbing Repair, Property Tax"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
                    Property *
                  </label>
                  <select
                    id="property_id"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                  {properties.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No properties available. Please add a property first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value={ModelsRealEstateTransactionType.RealEstateIncome}
                        checked={formData.type === ModelsRealEstateTransactionType.RealEstateIncome}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsRealEstateTransactionType })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Income (Rent, Sale, etc.)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value={ModelsRealEstateTransactionType.RealEstateExpense}
                        checked={formData.type === ModelsRealEstateTransactionType.RealEstateExpense}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelsRealEstateTransactionType })}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Expense (Maintenance, Tax, etc.)</span>
                    </label>
                  </div>
                </div>

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

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Monthly rent payment, Plumbing repair, Property tax..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700">
                    Transaction Date *
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
                disabled={loading || properties.length === 0}
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