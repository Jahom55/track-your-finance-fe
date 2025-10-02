import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { realEstateApi } from '../services/api'
import { ModelsProperty, ModelsCreatePropertyRequest } from '../generated'

interface PropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  property: ModelsProperty | null
}

export default function PropertyModal({ 
  isOpen, 
  onClose, 
  onSave, 
  property
}: PropertyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    buy_price: '',
    current_value: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    remaining_debt: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (property) {
        console.log('Editing property:', property)
        setFormData({
          name: property.name || '',
          address: property.address || '',
          buy_price: property.buy_price?.toString() || '',
          current_value: property.current_value?.toString() || '',
          purchase_date: property.purchase_date ? property.purchase_date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
          remaining_debt: property.remaining_debt?.toString() || '',
          description: property.description || ''
        })
      } else {
        setFormData({
          name: '',
          address: '',
          buy_price: '',
          current_value: '',
          purchase_date: format(new Date(), 'yyyy-MM-dd'),
          remaining_debt: '',
          description: ''
        })
      }
      setError('')
    }
  }, [isOpen, property])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Property name is required')
      }
      if (!formData.address.trim()) {
        throw new Error('Address is required')
      }
      if (!formData.buy_price || parseFloat(formData.buy_price) <= 0) {
        throw new Error('Purchase price must be greater than 0')
      }
      if (!formData.current_value || parseFloat(formData.current_value) <= 0) {
        throw new Error('Current value must be greater than 0')
      }

      const fullDateTime = new Date(formData.purchase_date + 'T12:00:00.000Z').toISOString()
      
      const propertyData: ModelsCreatePropertyRequest = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        buy_price: parseFloat(formData.buy_price),
        current_value: parseFloat(formData.current_value),
        purchase_date: fullDateTime,
        remaining_debt: formData.remaining_debt ? parseFloat(formData.remaining_debt) : undefined,
        description: formData.description.trim() || undefined
      }

      if (property && property.id) {
        await realEstateApi.properties.update(property.id, propertyData)
      } else {
        await realEstateApi.properties.create(propertyData)
      }

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save property:', err)
      
      let errorMessage = 'Failed to save property'
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

  const handleNumberChange = (field: string, value: string) => {
    const regex = /^\d*\.?\d*$/
    if (regex.test(value)) {
      setFormData({ ...formData, [field]: value })
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
                  {property ? 'Edit Property' : 'Add New Property'}
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
                    Property Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Downtown Apartment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., 123 Main St, City, State"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="buy_price" className="block text-sm font-medium text-gray-700">
                    Purchase Price * ($)
                  </label>
                  <input
                    type="text"
                    id="buy_price"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    value={formData.buy_price}
                    onChange={(e) => handleNumberChange('buy_price', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="current_value" className="block text-sm font-medium text-gray-700">
                    Current Value * ($)
                  </label>
                  <input
                    type="text"
                    id="current_value"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    value={formData.current_value}
                    onChange={(e) => handleNumberChange('current_value', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    id="purchase_date"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="remaining_debt" className="block text-sm font-medium text-gray-700">
                    Remaining Debt ($)
                  </label>
                  <input
                    type="text"
                    id="remaining_debt"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    value={formData.remaining_debt}
                    onChange={(e) => handleNumberChange('remaining_debt', e.target.value)}
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
                    placeholder="Optional property description..."
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
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : property ? 'Update' : 'Create'}
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