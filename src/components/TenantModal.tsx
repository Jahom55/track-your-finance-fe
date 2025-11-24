import { useState, useEffect, FormEvent } from 'react'
import { tenantsApi } from '../services/api'
import { ModelsTenant, ModelsCreateTenantRequest, ModelsProperty } from '../generated'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface TenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  tenant: ModelsTenant | null
  properties: ModelsProperty[]
}

export default function TenantModal({ isOpen, onClose, onSave, tenant, properties }: TenantModalProps) {
  const [formData, setFormData] = useState<ModelsCreateTenantRequest>({
    name: '',
    address: '',
    contact: '',
    deposit_amount: 0,
    agreement_from_date: '',
    agreement_to_date: '',
    property_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        address: tenant.address || '',
        contact: tenant.contact || '',
        deposit_amount: tenant.deposit_amount,
        agreement_from_date: tenant.agreement_from_date
          ? tenant.agreement_from_date.split('T')[0]
          : '',
        agreement_to_date: tenant.agreement_to_date
          ? tenant.agreement_to_date.split('T')[0]
          : '',
        property_id: tenant.property_id
      })
    } else {
      setFormData({
        name: '',
        address: '',
        contact: '',
        deposit_amount: 0,
        agreement_from_date: '',
        agreement_to_date: '',
        property_id: properties[0]?.id || ''
      })
    }
    setError(null)
  }, [tenant, isOpen, properties])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert date strings to ISO datetime format
      const requestData = {
        ...formData,
        agreement_from_date: formData.agreement_from_date
          ? new Date(formData.agreement_from_date + 'T12:00:00.000Z').toISOString()
          : undefined,
        agreement_to_date: formData.agreement_to_date
          ? new Date(formData.agreement_to_date + 'T12:00:00.000Z').toISOString()
          : undefined,
      }

      if (tenant?.id) {
        await tenantsApi.update(tenant.id, requestData)
      } else {
        await tenantsApi.create(requestData)
      }
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save tenant:', err)
      setError(err.response?.data?.error || 'Failed to save tenant')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {tenant ? 'Edit Tenant' : 'Add Tenant'}
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
                    Property *
                  </label>
                  <select
                    id="property_id"
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Contact (Email/Phone)
                  </label>
                  <input
                    type="text"
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Tenant Address
                  </label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700">
                    Deposit Amount
                  </label>
                  <input
                    type="number"
                    id="deposit_amount"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="agreement_from_date" className="block text-sm font-medium text-gray-700">
                      Agreement From
                    </label>
                    <input
                      type="date"
                      id="agreement_from_date"
                      value={formData.agreement_from_date}
                      onChange={(e) => setFormData({ ...formData, agreement_from_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="agreement_to_date" className="block text-sm font-medium text-gray-700">
                      Agreement To
                    </label>
                    <input
                      type="date"
                      id="agreement_to_date"
                      value={formData.agreement_to_date}
                      onChange={(e) => setFormData({ ...formData, agreement_to_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
