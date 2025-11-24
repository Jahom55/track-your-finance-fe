import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { realEstateApi, tenantsApi, inspectionsApi, mortgagesApi } from '../services/api'
import { ArrowLeftIcon, HomeIcon, CurrencyDollarIcon, ChartBarIcon, UserGroupIcon, ClipboardDocumentCheckIcon, PlusIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { ModelsProperty, ModelsTenant, ModelsInspection, ModelsRealEstateTransaction, ModelsRealEstateTransactionType, ModelsMortgage } from '../generated'
import TenantModal from '../components/TenantModal'
import InspectionModal from '../components/InspectionModal'
import RealEstateTransactionModal from '../components/RealEstateTransactionModal'
import MortgageModal from '../components/MortgageModal'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<ModelsProperty | null>(null)
  const [tenants, setTenants] = useState<ModelsTenant[]>([])
  const [inspections, setInspections] = useState<ModelsInspection[]>([])
  const [mortgages, setMortgages] = useState<ModelsMortgage[]>([])
  const [transactions, setTransactions] = useState<ModelsRealEstateTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [showMortgageModal, setShowMortgageModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<ModelsTenant | null>(null)
  const [editingInspection, setEditingInspection] = useState<ModelsInspection | null>(null)
  const [editingMortgage, setEditingMortgage] = useState<ModelsMortgage | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<ModelsRealEstateTransaction | null>(null)

  // Transaction filter dates
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')

  useEffect(() => {
    loadAllData()
  }, [id])

  const loadAllData = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [propertyData, tenantsData, inspectionsData, mortgagesData, transactionsData] = await Promise.all([
        realEstateApi.properties.get(id),
        tenantsApi.list({ property_id: id }),
        inspectionsApi.list({ property_id: id }),
        mortgagesApi.list({ property_id: id }),
        realEstateApi.transactions.list({ propertyId: id, limit: 100 })
      ])

      setProperty(propertyData)
      setTenants(tenantsData)
      setInspections(inspectionsData)
      setMortgages(mortgagesData)
      setTransactions(transactionsData.transactions)
    } catch (err) {
      console.error('Failed to load property details:', err)
      setError('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantSave = () => {
    loadAllData()
    setEditingTenant(null)
  }

  const handleInspectionSave = () => {
    loadAllData()
    setEditingInspection(null)
  }

  const handleMortgageSave = () => {
    loadAllData()
    setEditingMortgage(null)
  }

  const handleTransactionSave = () => {
    loadAllData()
    setEditingTransaction(null)
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await tenantsApi.delete(tenantId)
        loadAllData()
      } catch (error) {
        console.error('Failed to delete tenant:', error)
        alert('Failed to delete tenant')
      }
    }
  }

  const handleDeleteInspection = async (inspectionId: string) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      try {
        await inspectionsApi.delete(inspectionId)
        loadAllData()
      } catch (error) {
        console.error('Failed to delete inspection:', error)
        alert('Failed to delete inspection')
      }
    }
  }

  const handleDeleteMortgage = async (mortgageId: string) => {
    if (window.confirm('Are you sure you want to delete this mortgage?')) {
      try {
        await mortgagesApi.delete(mortgageId)
        loadAllData()
      } catch (error) {
        console.error('Failed to delete mortgage:', error)
        alert('Failed to delete mortgage')
      }
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await realEstateApi.transactions.delete(transactionId)
        loadAllData()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        alert('Failed to delete transaction')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/real-estate"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Real Estate
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Property not found'}</p>
        </div>
      </div>
    )
  }

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    if (!t.transaction_date) return true

    const transactionDate = new Date(t.transaction_date)
    const fromDate = filterFromDate ? new Date(filterFromDate) : null
    const toDate = filterToDate ? new Date(filterToDate) : null

    if (fromDate && transactionDate < fromDate) return false
    if (toDate && transactionDate > toDate) return false

    return true
  })

  // Calculate property metrics from ALL transactions (for cards at top)
  const totalIncome = transactions
    .filter(t => t.type === ModelsRealEstateTransactionType.RealEstateIncome)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === ModelsRealEstateTransactionType.RealEstateExpense)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  // Calculate filtered metrics (for display in transactions table)
  const filteredIncome = filteredTransactions
    .filter(t => t.type === ModelsRealEstateTransactionType.RealEstateIncome)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const filteredExpense = filteredTransactions
    .filter(t => t.type === ModelsRealEstateTransactionType.RealEstateExpense)
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const balance = totalIncome - totalExpense
  const remainingDebt = property.remaining_debt || 0
  const currentValue = property.current_value || 0
  const purchasePrice = property.purchase_price || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard/real-estate"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Real Estate
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-500 mt-1">{property.address}</p>
        </div>
      </div>

      {/* Property Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HomeIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${currentValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Remaining Debt</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${remainingDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-semibold text-green-600">
                ${totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-orange-600">
                ${totalExpense.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Property Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {property.property_type || 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
              <dd className="mt-1 text-sm text-gray-900">
                ${purchasePrice.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Monthly Rent</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {property.monthly_rent ? `$${property.monthly_rent.toLocaleString()}` : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fee Amount</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {property.fee_amount ? `$${property.fee_amount.toLocaleString()}` : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {property.purchase_date ? format(new Date(property.purchase_date), 'MMM dd, yyyy') : 'Not specified'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {property.description || 'No description provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Net Balance</dt>
              <dd className={`mt-1 text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${balance.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {property.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tenants Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Tenants ({tenants.length})</h2>
          </div>
          <button
            onClick={() => setShowTenantModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Tenant
          </button>
        </div>
        <div className="px-6 py-4">
          {tenants.length > 0 ? (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{tenant.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {tenant.contact && (
                      <p className="text-xs text-gray-500 mt-1">Contact: {tenant.contact}</p>
                    )}
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Deposit: ${(tenant.deposit_amount || 0).toLocaleString()}</span>
                      {tenant.agreement_from_date && (
                        <span>From: {format(new Date(tenant.agreement_from_date), 'MMM dd, yyyy')}</span>
                      )}
                      {tenant.agreement_to_date && (
                        <span>To: {format(new Date(tenant.agreement_to_date), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingTenant(tenant)
                        setShowTenantModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTenant(tenant.id!)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No tenants for this property</p>
          )}
        </div>
      </div>

      {/* Inspections Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Inspections ({inspections.length})</h2>
          </div>
          <button
            onClick={() => setShowInspectionModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Inspection
          </button>
        </div>
        <div className="px-6 py-4">
          {inspections.length > 0 ? (
            <div className="space-y-3">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {format(new Date(inspection.date!), 'MMM dd, yyyy')}
                      </h3>
                      {inspection.physically_check && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Physical Check
                        </span>
                      )}
                    </div>
                    {inspection.description && (
                      <p className="text-xs text-gray-600 mt-1 italic">{inspection.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingInspection(inspection)
                        setShowInspectionModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInspection(inspection.id!)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No inspections for this property</p>
          )}
        </div>
      </div>

      {/* Mortgages Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Mortgages ({mortgages.length})</h2>
          </div>
          <button
            onClick={() => setShowMortgageModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Mortgage
          </button>
        </div>
        <div className="px-6 py-4">
          {mortgages.length > 0 ? (
            <div className="space-y-3">
              {mortgages.map((mortgage) => (
                <div key={mortgage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{mortgage.lender_name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        mortgage.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mortgage.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                      <span>Rate: {mortgage.interest_rate}%</span>
                      <span>Monthly: ${mortgage.monthly_payment.toLocaleString()}</span>
                      <span>Principal: ${mortgage.principal_amount.toLocaleString()}</span>
                      {mortgage.start_date && mortgage.end_date && (
                        <span>
                          {format(new Date(mortgage.start_date), 'MMM yyyy')} - {format(new Date(mortgage.end_date), 'MMM yyyy')}
                        </span>
                      )}
                    </div>
                    {mortgage.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">{mortgage.notes}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingMortgage(mortgage)
                        setShowMortgageModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMortgage(mortgage.id!)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No mortgages for this property</p>
          )}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Transactions ({transactions.length})</h2>
          </div>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Transaction
          </button>
        </div>

        {/* Date Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterFromDate('')
                  setFilterToDate('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filtered Sums */}
          {(filterFromDate || filterToDate) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Filtered Income</p>
                <p className="mt-1 text-xl font-semibold text-green-600">
                  ${filteredIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Filtered Expense</p>
                <p className="mt-1 text-xl font-semibold text-red-600">
                  ${filteredExpense.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Filtered Balance</p>
                <p className={`mt-1 text-xl font-semibold ${filteredIncome - filteredExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(filteredIncome - filteredExpense).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === ModelsRealEstateTransactionType.RealEstateIncome
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900">
                        {transaction.name || 'Untitled'} - ${(transaction.amount || 0).toLocaleString()}
                      </h3>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Date: {transaction.transaction_date ? format(new Date(transaction.transaction_date), 'MMM dd, yyyy') : 'No date'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingTransaction(transaction)
                        setShowTransactionModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id!)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {transactions.length === 0
                ? 'No transactions for this property'
                : 'No transactions found for the selected date range'}
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <TenantModal
        isOpen={showTenantModal}
        onClose={() => {
          setShowTenantModal(false)
          setEditingTenant(null)
        }}
        onSave={handleTenantSave}
        tenant={editingTenant}
        properties={property ? [property] : []}
      />

      <InspectionModal
        isOpen={showInspectionModal}
        onClose={() => {
          setShowInspectionModal(false)
          setEditingInspection(null)
        }}
        onSave={handleInspectionSave}
        inspection={editingInspection}
        properties={property ? [property] : []}
      />

      <MortgageModal
        isOpen={showMortgageModal}
        onClose={() => {
          setShowMortgageModal(false)
          setEditingMortgage(null)
        }}
        onSave={handleMortgageSave}
        mortgage={editingMortgage}
        properties={property ? [property] : []}
      />

      <RealEstateTransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setEditingTransaction(null)
        }}
        onSave={handleTransactionSave}
        transaction={editingTransaction}
        properties={property ? [property] : []}
      />
    </div>
  )
}
