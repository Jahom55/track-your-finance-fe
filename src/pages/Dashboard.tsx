import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { statsApi } from '../services/api'

export default function Dashboard() {
  const [monthlyStats, setMonthlyStats] = useState<any>(null)
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentMonthStats()
  }, [])

  const loadCurrentMonthStats = async () => {
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      // Load monthly stats
      const stats = await statsApi.monthly(currentYear, currentMonth)
      setMonthlyStats(stats)
      
      // Load category stats for current month
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
      const endDate = new Date(currentYear, currentMonth, 0).getDate()
      const endDateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endDate.toString().padStart(2, '0')}`
      
      const categoryData = await statsApi.categories(startDate, endDateStr)
      setCategoryStats(categoryData)
      
    } catch (error) {
      console.error('Failed to load monthly stats:', error)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your financial activity for {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      {monthlyStats && (
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>

          {categoryStats.length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Categories Breakdown
                  </h3>
                  <div className="space-y-3">
                    {categoryStats.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {category.percentage?.toFixed(1)}%
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ${category.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}