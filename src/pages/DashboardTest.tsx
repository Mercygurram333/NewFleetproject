import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/adminStore'
import AdminDashboard from './AdminDashboard'
import DriverDashboard from './DriverDashboard'
import CustomerDashboard from './CustomerDashboard'
import VehicleTrackingDashboard from '../components/tracking/VehicleTrackingDashboard'

const DashboardTest: React.FC = () => {
  const { login, logout, user } = useAuthStore()
  const { initializeData } = useAdminStore()
  const [currentDashboard, setCurrentDashboard] = useState<'admin' | 'driver' | 'customer' | 'tracking'>('admin')

  const handleLogin = async (role: 'admin' | 'driver' | 'customer') => {
    // Initialize sample data
    initializeData()
    
    // Login with test credentials
    const testCredentials = {
      admin: { email: 'admin@fleet.com', password: 'admin123' },
      driver: { email: 'driver@fleet.com', password: 'driver123' },
      customer: { email: 'customer@fleet.com', password: 'customer123' }
    }
    
    const creds = testCredentials[role]
    await login(creds.email, creds.password, role)
    setCurrentDashboard(role)
  }

  const renderDashboard = () => {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-center mb-6">Fleet Management Dashboard Test</h1>
            <div className="space-y-4">
              <button
                onClick={() => handleLogin('admin')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Admin Dashboard
              </button>
              <button
                onClick={() => handleLogin('driver')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Driver Dashboard
              </button>
              <button
                onClick={() => handleLogin('customer')}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test Customer Dashboard
              </button>
              <button
                onClick={() => {
                  initializeData()
                  setCurrentDashboard('tracking')
                }}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Test Vehicle Tracking
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Switcher */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Dashboard Test - {user.role.toUpperCase()}</h1>
              <span className="text-sm text-gray-500">({user.email})</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLogin('admin')}
                className={`px-3 py-1 rounded ${currentDashboard === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Admin
              </button>
              <button
                onClick={() => handleLogin('driver')}
                className={`px-3 py-1 rounded ${currentDashboard === 'driver' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Driver
              </button>
              <button
                onClick={() => handleLogin('customer')}
                className={`px-3 py-1 rounded ${currentDashboard === 'customer' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Customer
              </button>
              <button
                onClick={() => {
                  initializeData()
                  setCurrentDashboard('tracking')
                }}
                className={`px-3 py-1 rounded ${currentDashboard === 'tracking' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Tracking
              </button>
              <button
                onClick={logout}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto p-6">
          {currentDashboard === 'admin' && <AdminDashboard />}
          {currentDashboard === 'driver' && <DriverDashboard />}
          {currentDashboard === 'customer' && <CustomerDashboard />}
          {currentDashboard === 'tracking' && <VehicleTrackingDashboard />}
        </div>
      </div>
    )
  }

  return renderDashboard()
}

export default DashboardTest
