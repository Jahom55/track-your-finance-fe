import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  CurrencyDollarIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'

export default function Landing() {
  const location = useLocation()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check for navigation message
    if (location.state?.message) {
      setMessage(location.state.message)
      setShowLogin(true) // Auto-open login modal
      
      // Clear message after showing it
      setTimeout(() => setMessage(''), 5000)
    }
  }, [location])

  const features = [
    {
      name: 'Spending Diary',
      description: 'Track your income and expenses with detailed categorization and monthly statistics.',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Real Estate Portfolio',
      description: 'Monitor your property investments, rental income, and calculate ROI over time.',
      icon: BuildingOfficeIcon,
    },
    {
      name: 'Advanced Analytics',
      description: 'Get insights with monthly, yearly, and lifetime statistics across all your finances.',
      icon: ChartBarIcon,
    },
    {
      name: 'Secure & Private',
      description: 'Your financial data is encrypted and securely stored with industry-standard protection.',
      icon: ShieldCheckIcon,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Track Your Finance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Take Control of Your
              <span className="text-indigo-600"> Financial Future</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
              Comprehensive finance tracking for modern life. Monitor spending, manage real estate investments, 
              and gain insights with powerful analytics - all in one secure platform.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <button
                onClick={() => setShowRegister(true)}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Tracking Now
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-10"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 opacity-10"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to manage your finances
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              From daily expenses to real estate investments, track it all with precision and insight.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.name} className="relative">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-base text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-700">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to transform your financial tracking?
            </h2>
            <p className="mt-4 text-xl text-indigo-200">
              Join thousands of users who are already taking control of their finances.
            </p>
            <div className="mt-8">
              <button
                onClick={() => setShowRegister(true)}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Track Your Finance</span>
            </div>
            <p className="text-gray-600">
              Comprehensive financial tracking and real estate portfolio management.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              © 2025 Track Your Finance. Built with security and privacy in mind.
            </p>
          </div>
        </div>
      </footer>

      {/* Success Message */}
      {message && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
            <div className="flex">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-green-500 mr-4" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm">{message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginForm 
          onClose={() => {
            setShowLogin(false)
            setMessage('') // Clear message when closing
          }} 
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterForm 
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
      )}
    </div>
  )
}