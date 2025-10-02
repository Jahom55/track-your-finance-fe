import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { realEstateApi } from '../services/api'
import { PlusIcon, BuildingOfficeIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import PropertyModal from '../components/PropertyModal'
import RealEstateTransactionModal from '../components/RealEstateTransactionModal'
import { ModelsProperty, ModelsRealEstateTransaction, ModelsRealEstateMonthlyStats, ModelsRealEstateTransactionType } from '../generated'

export default function RealEstate() {
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'transactions' | 'stats'>('overview')
  const [properties, setProperties] = useState<ModelsProperty[]>([])
  const [transactions, setTransactions] = useState<ModelsRealEstateTransaction[]>([])
  const [monthlyStats, setMonthlyStats] = useState<ModelsRealEstateMonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<ModelsProperty | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<ModelsRealEstateTransaction | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'stats') {
      loadMonthlyStats()
    }
  }, [activeTab, selectedMonth, selectedYear, selectedProperty])

  const loadData = async () => {
    try {
      setLoading(true)
      const [propertiesData, transactionsData] = await Promise.all([
        realEstateApi.properties.list(),
        realEstateApi.transactions.list({ limit: 50 })
      ])
      setProperties(propertiesData)
      setTransactions(transactionsData.transactions)
    } catch (error) {
      console.error('Failed to load real estate data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePropertySave = () => {
    loadData()
    setEditingProperty(null)
  }

  const handleTransactionSave = () => {
    loadData()
    setEditingTransaction(null)
  }

  const handleEditProperty = (property: ModelsProperty) => {
    setEditingProperty(property)
    setShowPropertyModal(true)
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await realEstateApi.properties.delete(propertyId)
        loadData()
      } catch (error) {
        console.error('Failed to delete property:', error)
        alert('Failed to delete property')
      }
    }
  }

  const handleEditTransaction = (transaction: ModelsRealEstateTransaction) => {
    setEditingTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await realEstateApi.transactions.delete(transactionId)
        loadData()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        alert('Failed to delete transaction')
      }
    }
  }

  const loadMonthlyStats = async () => {
    try {
      const stats = await realEstateApi.stats.monthly(
        selectedYear, 
        selectedMonth, 
        selectedProperty || undefined
      )
      setMonthlyStats(stats)
    } catch (error) {
      console.error('Failed to load monthly stats:', error)
    }
  }

  const calculateTotalValue = () => {
    return properties.reduce((sum, property) => sum + (property.current_value || 0), 0)
  }

  const calculateMonthlyRent = () => {
    return properties.reduce((sum, property) => sum + ((property as any).monthly_rent || 0), 0)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'properties', name: 'Properties', icon: BuildingOfficeIcon },
    { id: 'transactions', name: 'Transactions', icon: CurrencyDollarIcon },
    { id: 'stats', name: 'Statistics', icon: ChartBarIcon }
  ]

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
          <h1 className="text-2xl font-semibold text-gray-900">Real Estate Portfolio</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your properties and track rental income, expenses, and ROI.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6">
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Properties
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {properties.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Value
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${calculateTotalValue().toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Monthly Rent
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${calculateMonthlyRent().toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Properties */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Properties
                </h3>
                {properties.length > 0 ? (
                  <div className="space-y-3">
                    {properties.slice(0, 5).map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{property.name}</h4>
                          <p className="text-sm text-gray-500">{property.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">${(property.current_value || 0).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">${((property as any).monthly_rent || 0)}/month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No properties added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Properties Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Properties ({properties.length})</h2>
              <button 
                onClick={() => setShowPropertyModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Property
              </button>
            </div>

            {/* Properties List */}
            <div className="bg-white shadow rounded-lg">
              {properties.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {properties.map((property) => (
                    <div key={property.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{property.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{property.address}</p>
                          {property.description && (
                            <p className="text-sm text-gray-600 mt-1 italic">{property.description}</p>
                          )}
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
                            <span>Purchase: ${(property.buy_price || 0).toLocaleString()}</span>
                            <span>Current: ${(property.current_value || 0).toLocaleString()}</span>
                            {property.purchase_date && (
                              <span>Purchased: {format(new Date(property.purchase_date), 'MMM dd, yyyy')}</span>
                            )}
                            {property.remaining_debt && property.remaining_debt > 0 && (
                              <span>Debt: ${property.remaining_debt.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditProperty(property)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                            Edit
                          </button>
                          <button
                            onClick={() => property.id && handleDeleteProperty(property.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first property.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Transactions Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Transactions ({transactions.length})</h2>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Transaction
              </button>
            </div>

            {/* Transactions List */}
            <div className="bg-white shadow rounded-lg">
              {transactions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                            <p className="text-sm text-gray-500 mt-1">{transaction.description || 'No description'}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span>Property: {properties.find(p => p.id === transaction.property_id)?.name || 'Unknown'}</span>
                              <span>Date: {transaction.transaction_date ? format(new Date(transaction.transaction_date), 'MMM dd, yyyy') : 'No date'}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                              Edit
                            </button>
                            <button
                              onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first transaction.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Controls */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-lg font-medium text-gray-900">Monthly Statistics</h2>
                <div className="flex space-x-4">
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {format(new Date(2023, i, 1), 'MMMM')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Monthly Stats Display */}
            {monthlyStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">↑</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Income
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            ${monthlyStats.total_income?.toFixed(2) || '0.00'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-lg">↓</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Expenses
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            ${monthlyStats.total_expense?.toFixed(2) || '0.00'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 ${(monthlyStats.net_amount || 0) >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-md flex items-center justify-center`}>
                          <span className="text-white text-lg">
                            {(monthlyStats.net_amount || 0) >= 0 ? '=' : '!'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Net Amount
                          </dt>
                          <dd className={`text-lg font-medium ${(monthlyStats.net_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${monthlyStats.net_amount?.toFixed(2) || '0.00'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Properties
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {(monthlyStats as any).property_count || properties.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PropertyModal
        isOpen={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false)
          setEditingProperty(null)
        }}
        onSave={handlePropertySave}
        property={editingProperty}
      />

      <RealEstateTransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setEditingTransaction(null)
        }}
        onSave={handleTransactionSave}
        transaction={editingTransaction}
        properties={properties}
      />
    </div>
  )
}