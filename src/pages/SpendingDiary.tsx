import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { transactionsApi, categoriesApi, statsApi } from '../services/api'
import TransactionModal from '../components/TransactionModal'
import {
  ModelsTransaction,
  ModelsCategory,
  ModelsMonthlyStats,
  ModelsCategoryStats
} from '../generated'

export default function SpendingDiary() {
  const [transactions, setTransactions] = useState<ModelsTransaction[]>([])
  const [categories, setCategories] = useState<ModelsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [limit] = useState(10)
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ModelsTransaction | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  
  // Monthly statistics
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthlyStats, setMonthlyStats] = useState<ModelsMonthlyStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<ModelsCategoryStats[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [page, typeFilter, categoryFilter, dateFromFilter, dateToFilter])
  
  useEffect(() => {
    loadMonthlyStats()
  }, [currentMonth, currentYear])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load transactions with filters
      const params: any = {
        limit,
        offset: (page - 1) * limit,
      }
      
      if (typeFilter !== 'ALL') {
        params.type = typeFilter
      }
      if (categoryFilter) {
        params.categoryId = categoryFilter
      }
      if (dateFromFilter) {
        params.fromDate = dateFromFilter
      }
      if (dateToFilter) {
        params.toDate = dateToFilter
      }

      const [transactionsResponse, categoriesResponse] = await Promise.all([
        transactionsApi.list(params),
        categoriesApi.list()
      ])
      
      setTransactions(transactionsResponse.transactions || [])
      setTotalTransactions(transactionsResponse.total || 0)
      setCategories(categoriesResponse)
      setError('')
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id)
      loadData() // Refresh list
      loadMonthlyStats() // Refresh stats
      setShowDeleteConfirm(false)
      setTransactionToDelete(null)
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      setError('Failed to delete transaction')
    }
  }

  const loadMonthlyStats = async () => {
    try {
      setStatsLoading(true)
      
      // Load monthly stats
      console.log('Loading monthly stats for:', currentYear, currentMonth)
      const stats = await statsApi.monthly(currentYear, currentMonth)
      console.log('Monthly stats response:', stats)
      setMonthlyStats(stats)
      
      // Load category stats for the month
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const endDate = new Date(currentYear, currentMonth, 0).getDate()
      const endDateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endDate.toString().padStart(2, '0')}`
      
      console.log('Loading category stats for date range:', startDate, 'to', endDateStr)
      const categoryData = await statsApi.categories(startDate, endDateStr)
      console.log('Category stats response:', categoryData)
      setCategoryStats(categoryData)
      
    } catch (err) {
      console.error('Failed to load monthly stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    setCurrentMonth(now.getMonth() + 1)
    setCurrentYear(now.getFullYear())
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Unknown'
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown'
  }

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#gray-500'
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#gray-500'
  }

  const formatAmount = (amount?: number, type?: string) => {
    if (!amount) return '$0.00'
    const sign = type === 'INCOME' ? '+' : '-'
    const colorClass = type === 'INCOME' ? 'text-green-600' : 'text-red-600'
    return (
      <span className={colorClass}>
        {sign}${Math.abs(amount).toFixed(2)}
      </span>
    )
  }

  const resetFilters = () => {
    setTypeFilter('ALL')
    setCategoryFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Spending Diary</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your income and expenses with detailed categorization
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null)
              setShowTransactionModal(true)
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </h2>
              {(currentMonth !== new Date().getMonth() + 1 || currentYear !== new Date().getFullYear()) && (
                <button
                  onClick={goToCurrentMonth}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Go to current month
                </button>
              )}
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Monthly Overview</span>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : monthlyStats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">↗</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">Total Income</p>
                    <p className="text-lg font-semibold text-green-700">
                      ${monthlyStats?.total_income?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold">↙</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">Total Expenses</p>
                    <p className="text-lg font-semibold text-red-700">
                      ${monthlyStats?.total_expense?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      <span className={`font-semibold ${
                        monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? '=' : '≠'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? 'text-blue-900' : 'text-orange-900'
                    }`}>
                      Net Amount
                    </p>
                    <p className={`text-lg font-semibold ${
                      monthlyStats?.net_amount && monthlyStats?.net_amount >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      ${monthlyStats?.net_amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">#</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Transactions</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {monthlyStats?.transaction_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {categoryStats.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Category Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryStats.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">
                            {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          category.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${category.amount?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.percentage?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No statistics available for this month</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No transactions found. Create your first transaction!
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.transaction_date 
                            ? format(parseISO(transaction.transaction_date), 'MMM dd, yyyy')
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                            />
                            {getCategoryName(transaction.category_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatAmount(transaction.amount, transaction.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingTransaction(transaction)
                                setShowTransactionModal(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTransactionToDelete(transaction.id!)
                                setShowDeleteConfirm(true)
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalTransactions > limit && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= totalTransactions}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(page - 1) * limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, totalTransactions)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalTransactions}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {page} of {Math.ceil(totalTransactions / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= totalTransactions}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
                      Delete Transaction
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this transaction? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => transactionToDelete && handleDeleteTransaction(transactionToDelete)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setEditingTransaction(null)
        }}
        onSave={() => {
          loadData()
          loadMonthlyStats()
        }}
        transaction={editingTransaction}
        categories={categories}
      />
    </div>
  )
}