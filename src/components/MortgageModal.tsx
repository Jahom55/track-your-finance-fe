import { useState, useEffect, FormEvent } from 'react'
import { mortgagesApi } from '../services/api'
import { ModelsMortgage, ModelsCreateMortgageRequest, ModelsProperty } from '../generated'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface MortgageModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  mortgage: ModelsMortgage | null
  properties: ModelsProperty[]
}

export default function MortgageModal({ isOpen, onClose, onSave, mortgage, properties }: MortgageModalProps) {
  const [formData, setFormData] = useState<ModelsCreateMortgageRequest>({
    property_id: '',
    lender_name: '',
    interest_rate: 0,
    monthly_payment: 0,
    principal_amount: 0,
    start_date: format(new Date(), 'yyyy-MM-dd') as any,
    end_date: '' as any,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mortgage) {
      setFormData({
        property_id: mortgage.property_id || '',
        lender_name: mortgage.lender_name || '',
        interest_rate: mortgage.interest_rate || 0,
        monthly_payment: mortgage.monthly_payment || 0,
        principal_amount: mortgage.principal_amount || 0,
        start_date: mortgage.start_date
          ? mortgage.start_date.toString().split('T')[0] as any
          : format(new Date(), 'yyyy-MM-dd') as any,
        end_date: mortgage.end_date
          ? mortgage.end_date.toString().split('T')[0] as any
          : '' as any,
        notes: mortgage.notes || ''
      })
    } else {
      setFormData({
        property_id: properties[0]?.id || '',
        lender_name: '',
        interest_rate: 0,
        monthly_payment: 0,
        principal_amount: 0,
        start_date: format(new Date(), 'yyyy-MM-dd') as any,
        end_date: '' as any,
        notes: ''
      })
    }
    setError(null)
  }, [mortgage, isOpen, properties])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert date strings to ISO datetime format
      const requestData = {
        ...formData,
        start_date: formData.start_date
          ? new Date(formData.start_date + 'T12:00:00.000Z').toISOString() as any
          : undefined as any,
        end_date: formData.end_date
          ? new Date(formData.end_date + 'T12:00:00.000Z').toISOString() as any
          : undefined as any,
      }

      if (mortgage?.id) {
        await mortgagesApi.update(mortgage.id, requestData)
      } else {
        await mortgagesApi.create(requestData)
      }
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save mortgage:', err)
      setError(err.response?.data?.error || 'Failed to save mortgage')
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
                {mortgage ? 'Edit Mortgage' : 'Add Mortgage'}
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
                  <label htmlFor="lender_name" className="block text-sm font-medium text-gray-700">
                    Lender Name *
                  </label>
                  <input
                    type="text"
                    id="lender_name"
                    value={formData.lender_name}
                    onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Bank of America"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700">
                      Interest Rate (%) *
                    </label>
                    <input
                      type="number"
                      id="interest_rate"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      max="100"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="monthly_payment" className="block text-sm font-medium text-gray-700">
                      Monthly Payment ($) *
                    </label>
                    <input
                      type="number"
                      id="monthly_payment"
                      value={formData.monthly_payment}
                      onChange={(e) => setFormData({ ...formData, monthly_payment: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="principal_amount" className="block text-sm font-medium text-gray-700">
                    Principal Amount ($) *
                  </label>
                  <input
                    type="number"
                    id="principal_amount"
                    value={formData.principal_amount}
                    onChange={(e) => setFormData({ ...formData, principal_amount: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={formData.start_date?.toString().split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      value={formData.end_date?.toString().split('T')[0] || ''}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Any additional information about the mortgage..."
                  />
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
