import { useState, useEffect, FormEvent } from 'react'
import { inspectionsApi } from '../services/api'
import { ModelsInspection, ModelsCreateInspectionRequest, ModelsProperty } from '../generated'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface InspectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  inspection: ModelsInspection | null
  properties: ModelsProperty[]
}

export default function InspectionModal({ isOpen, onClose, onSave, inspection, properties }: InspectionModalProps) {
  const [formData, setFormData] = useState<ModelsCreateInspectionRequest>({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    physically_check: false,
    property_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (inspection) {
      setFormData({
        date: inspection.date ? format(new Date(inspection.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        description: inspection.description || '',
        physically_check: inspection.physically_check,
        property_id: inspection.property_id
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        physically_check: false,
        property_id: properties[0]?.id || ''
      })
    }
    setError(null)
  }, [inspection, isOpen, properties])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert date string to ISO datetime format
      const requestData = {
        ...formData,
        date: formData.date
          ? new Date(formData.date + 'T12:00:00.000Z').toISOString()
          : new Date().toISOString(),
      }

      if (inspection?.id) {
        await inspectionsApi.update(inspection.id, requestData)
      } else {
        await inspectionsApi.create(requestData)
      }
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Failed to save inspection:', err)
      setError(err.response?.data?.error || 'Failed to save inspection')
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
                {inspection ? 'Edit Inspection' : 'Add Inspection'}
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
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Inspection Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter inspection notes, findings, or issues discovered..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="physically_check"
                    checked={formData.physically_check}
                    onChange={(e) => setFormData({ ...formData, physically_check: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="physically_check" className="ml-2 block text-sm text-gray-900">
                    Physical inspection completed
                  </label>
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
