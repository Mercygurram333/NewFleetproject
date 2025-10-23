import React, { useState, useEffect } from 'react'
import { 
  Plus, Users, Truck, Package, MapPin, BarChart3, Clock, CheckCircle, AlertCircle, 
  Navigation, Filter, Calendar, Zap, DollarSign, Bell, Settings, Activity, 
  TrendingUp, Eye, Edit, Trash2, Search, Download, Upload, RefreshCw,
  Shield, Globe, Wifi, WifiOff, MessageSquare, Star, Award, Target, Home,
  FileText, AlertTriangle, ChevronRight, Menu, X, Phone
} from 'lucide-react'
import { useAdminStore } from '../store/adminStore'
import { useRealtimeStore } from '../store/realtimeStore'
import VehicleManagement from '../components/admin/VehicleManagement'
import DriverManagement from '../components/admin/DriverManagement'
import DeliveryManagement from '../components/admin/DeliveryManagement'
import PendingDeliveryRequests from '../components/admin/PendingDeliveryRequests'
import UniversalMap from '../components/maps/UniversalMap'
import RoutePlanner from '../components/route/RoutePlanner'
import VehicleTrackingDashboard from '../components/tracking/VehicleTrackingDashboard'
import AdminDeliveryTrackingMap from '../components/AdminDeliveryTrackingMap'

type SectionType = 'dashboard' | 'fleet' | 'drivers' | 'deliveries' | 'tracking' | 'vehicle-tracking' | 'reports' | 'settings'

// Dashboard Overview Component
const DashboardOverview: React.FC<{
  stats: any
  vehicles: any[]
  drivers: any[]
  deliveries: any[]
}> = ({ stats, vehicles, drivers, deliveries }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">{stats.availableVehicles} available</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalDrivers} total</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveriesInProgress}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">{stats.deliveriesToday} today</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemAlerts}</p>
              <p className="text-xs text-red-600 mt-1 font-medium">{stats.pendingRequests} pending</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Fleet Status - Redesigned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Delivery completed</p>
                  <p className="text-xs text-gray-600 mt-0.5">John Smith delivered to Downtown · 5 min ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">New delivery assigned</p>
                  <p className="text-xs text-gray-600 mt-0.5">Sarah Johnson · Airport pickup · 12 min ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Vehicle maintenance</p>
                  <p className="text-xs text-gray-600 mt-0.5">FL-003 scheduled for service · 1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Fleet Status</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Available Vehicles</span>
                <span className="text-sm font-semibold text-green-600">
                  {vehicles.filter(v => v.status === 'available').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">In Use</span>
                <span className="text-sm font-semibold text-blue-600">
                  {vehicles.filter(v => v.status === 'in-use').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Maintenance</span>
                <span className="text-sm font-semibold text-yellow-600">
                  {vehicles.filter(v => v.status === 'maintenance').length}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Driver Utilization</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round((stats.activeDrivers / stats.totalDrivers) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Fleet Management Section Component
const FleetManagementSection: React.FC<{
  vehicles: any[]
  drivers: any[]
  stats: any
}> = ({ vehicles, drivers, stats }) => {
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  
  return (
    <div className="space-y-6">
      {/* Header with Add Vehicle Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fleet Management</h2>
          <p className="text-gray-600">Manage vehicles and assign drivers</p>
        </div>
        <button
          onClick={() => setShowAddVehicle(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Available Vehicles</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.availableVehicles}</p>
          <p className="text-sm text-gray-500">Ready for assignment</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">In Use</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {vehicles.filter(v => v.status === 'in-use').length}
          </p>
          <p className="text-sm text-gray-500">Currently on deliveries</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Maintenance</h3>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Settings className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {vehicles.filter(v => v.status === 'maintenance').length}
          </p>
          <p className="text-sm text-gray-500">Under maintenance</p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vehicle Fleet</h3>
        </div>
        <div className="p-6">
          <VehicleManagement />
        </div>
      </div>
    </div>
  )
}

// Drivers Section Component
const DriversSection: React.FC<{
  drivers: any[]
  deliveries: any[]
  stats: any
}> = ({ drivers, deliveries, stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">Manage drivers and track performance</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Available</span>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {drivers.filter(d => d.status === 'available').length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Busy</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {drivers.filter(d => d.status === 'busy').length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Offline</span>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {drivers.filter(d => d.status === 'offline').length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Rating</span>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : '0.0'}
          </p>
        </div>
      </div>

      {/* Driver Management Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <DriverManagement />
        </div>
      </div>
    </div>
  )
}

// Deliveries Section Component
const DeliveriesSection: React.FC<{
  deliveries: any[]
  drivers: any[]
  vehicles: any[]
  stats: any
}> = ({ deliveries, drivers, vehicles, stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delivery Management</h2>
          <p className="text-gray-600">Track and manage all deliveries</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>New Delivery</span>
        </button>
      </div>

      {/* Delivery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', count: deliveries.filter(d => d.status === 'pending').length, color: 'gray' },
          { label: 'Assigned', count: deliveries.filter(d => d.status === 'assigned').length, color: 'blue' },
          { label: 'In Transit', count: deliveries.filter(d => d.status === 'in-transit').length, color: 'yellow' },
          { label: 'Delivered', count: deliveries.filter(d => d.status === 'delivered').length, color: 'green' },
          { label: 'Cancelled', count: deliveries.filter(d => d.status === 'cancelled').length, color: 'red' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      {stats.pendingRequests > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-red-500" />
              Pending Delivery Requests ({stats.pendingRequests})
            </h3>
          </div>
          <div className="p-6">
            <PendingDeliveryRequests />
          </div>
        </div>
      )}

      {/* All Deliveries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Deliveries</h3>
        </div>
        <div className="p-6">
          <DeliveryManagement />
        </div>
      </div>
    </div>
  )
}

// Reports Section Component
const ReportsSection: React.FC<{
  vehicles: any[]
  drivers: any[]
  deliveries: any[]
  stats: any
}> = ({ vehicles, drivers, deliveries, stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Performance insights and system analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Fleet Efficiency</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {Math.round((stats.activeDrivers / stats.totalDrivers) * 100)}%
          </p>
          <p className="text-sm text-gray-500">Driver utilization rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Success</h3>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {deliveries.length > 0 ? Math.round((deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-500">Successful deliveries</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Average Rating</h3>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : '0.0'}
          </p>
          <p className="text-sm text-gray-500">Driver performance</p>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Deliveries</span>
              <span className="text-sm font-medium text-gray-900">{deliveries.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed Today</span>
              <span className="text-sm font-medium text-gray-900">{stats.deliveriesToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Delivery Time</span>
              <span className="text-sm font-medium text-gray-900">42 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium text-gray-900">4.8/5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section Component
const SettingsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        <p className="text-gray-600">Configure system preferences and user profile</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue="admin@fleet.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                defaultValue="+1-555-0100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive email alerts for important events</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-assign Deliveries</p>
                <p className="text-xs text-gray-500">Automatically assign deliveries to available drivers</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Real-time Tracking</p>
                <p className="text-xs text-gray-500">Enable live GPS tracking for all vehicles</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Change Password</h4>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS Authentication</p>
                  <p className="text-xs text-gray-500">Receive codes via SMS</p>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Enable</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">App Authentication</p>
                  <p className="text-xs text-gray-500">Use authenticator app</p>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Setup</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Live Tracking Section Component
const LiveTrackingSection: React.FC<{
  deliveries: any[]
  drivers: any[]
  vehicles: any[]
  stats: any
}> = ({ deliveries, drivers, vehicles, stats }) => {
  const { driverLocations, initializeSocket } = useRealtimeStore()
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [trackingFilter, setTrackingFilter] = useState<string>('active')

  useEffect(() => {
    initializeSocket()
  }, [initializeSocket])

  const activeDeliveries = deliveries.filter(d => 
    ['assigned', 'accepted', 'started', 'in-transit', 'arrived'].includes(d.status)
  )

  const getFilteredDeliveries = () => {
    switch (trackingFilter) {
      case 'active': return activeDeliveries
      case 'in-transit': return deliveries.filter(d => d.status === 'in-transit')
      case 'started': return deliveries.filter(d => d.status === 'started')
      default: return activeDeliveries
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Tracking Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              Live Fleet Tracking
            </h2>
            <p className="text-gray-600">Real-time monitoring of all active deliveries</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </span>
            <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
              <Truck className="h-4 w-4" />
              <span>{activeDeliveries.length} Active</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">All Active ({activeDeliveries.length})</option>
              <option value="in-transit">In Transit ({deliveries.filter(d => d.status === 'in-transit').length})</option>
              <option value="started">Started ({deliveries.filter(d => d.status === 'started').length})</option>
            </select>
          </div>

          {/* Map Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedDelivery(null)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Eye className="h-4 w-4" />
              <span>View All</span>
            </button>
            {activeDeliveries.length > 0 && (
              <button
                onClick={() => setSelectedDelivery(activeDeliveries[0])}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Navigation className="h-4 w-4" />
                <span>Focus First</span>
              </button>
            )}
            <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Tracking Map */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-[600px]">
          <AdminDeliveryTrackingMap
            deliveries={getFilteredDeliveries()}
            drivers={drivers}
            selectedDelivery={selectedDelivery}
            onDeliverySelect={setSelectedDelivery}
            showAllDrivers={true}
          />
        </div>
      </div>

      {/* Active Deliveries List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Active Deliveries ({getFilteredDeliveries().length})
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {getFilteredDeliveries().map(delivery => (
              <div
                key={delivery.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedDelivery?.id === delivery.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{delivery.customer.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        delivery.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'started' ? 'bg-green-100 text-green-800' :
                        delivery.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {delivery.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      From: {delivery.pickup?.address || delivery.pickupLocation?.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      To: {delivery.delivery?.address || delivery.dropoffLocation?.address}
                    </p>
                    {delivery.driver && (
                      <p className="text-sm text-blue-600 mt-1">
                        Driver: {delivery.driver.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDelivery(delivery)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    {delivery.driver?.phone && (
                      <button className="text-green-600 hover:text-green-800">
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {getFilteredDeliveries().length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No active deliveries</h4>
              <p className="text-gray-600">No deliveries match the selected filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Request Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-red-500" />
            Pending Delivery Requests
          </h3>
        </div>
        <div className="p-6">
          <PendingDeliveryRequests />
        </div>
      </div>
    </div>
  )
}

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { vehicles, drivers, deliveries, initializeData, getPendingDeliveries } = useAdminStore()
  const { driverLocations } = useRealtimeStore()

  // Calculate real-time stats
  const stats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
    activeDrivers: drivers.filter(d => d.status === 'available' || d.status === 'busy').length,
    totalDrivers: drivers.length,
    deliveriesInProgress: deliveries.filter(d => 
      ['assigned', 'accepted', 'started', 'in-transit'].includes(d.status)
    ).length,
    deliveriesToday: deliveries.filter(d => {
      const today = new Date().toDateString()
      return new Date(d.createdAt || Date.now()).toDateString() === today
    }).length,
    pendingRequests: getPendingDeliveries().length,
    systemAlerts: 3 // Mock alerts for now
  }

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: 'dashboard' as SectionType,
      label: 'Fleet Management',
      icon: Home,
      description: ''
    },
    {
      id: 'fleet' as SectionType,
      label: 'Vehicles',
      icon: Truck,
      description: 'Manage vehicles and assignments',
      badge: stats.availableVehicles
    },
    {
      id: 'drivers' as SectionType,
      label: 'Drivers',
      icon: Users,
      description: 'Driver management and performance',
      badge: stats.activeDrivers
    },
    {
      id: 'deliveries' as SectionType,
      label: 'Deliveries',
      icon: Package,
      description: 'Track and manage deliveries',
      badge: stats.deliveriesInProgress
    },
    {
      id: 'tracking' as SectionType,
      label: 'Live Tracking',
      icon: MapPin,
      description: 'Real-time fleet monitoring',
      badge: stats.deliveriesInProgress
    },
    {
      id: 'vehicle-tracking' as SectionType,
      label: 'Vehicle Tracking',
      icon: Navigation,
      description: 'Real-time vehicle monitoring'
    },
    {
      id: 'reports' as SectionType,
      label: 'Reports',
      icon: FileText,
      description: 'Analytics and insights'
    },
    {
      id: 'settings' as SectionType,
      label: 'Settings',
      icon: Settings,
      description: 'System configuration'
    }
  ]

  useEffect(() => {
    initializeData()
  }, [])

  // Render content based on active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview stats={stats} vehicles={vehicles} drivers={drivers} deliveries={deliveries} />
      case 'fleet':
        return <FleetManagementSection vehicles={vehicles} drivers={drivers} stats={stats} />
      case 'drivers':
        return <DriversSection drivers={drivers} deliveries={deliveries} stats={stats} />
      case 'deliveries':
        return <DeliveriesSection deliveries={deliveries} drivers={drivers} vehicles={vehicles} stats={stats} />
      case 'tracking':
        return <LiveTrackingSection deliveries={deliveries} drivers={drivers} vehicles={vehicles} stats={stats} />
      case 'vehicle-tracking':
        return <VehicleTrackingDashboard />
      case 'reports':
        return <ReportsSection vehicles={vehicles} drivers={drivers} deliveries={deliveries} stats={stats} />
      case 'settings':
        return <SettingsSection />
      default:
        return <DashboardOverview stats={stats} vehicles={vehicles} drivers={drivers} deliveries={deliveries} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Redesigned */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-blue-600">Fleet Management</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5 text-gray-500" /> : <Menu className="h-5 w-5 text-gray-500" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                {sidebarOpen && (
                  <>
                    <div className="ml-3 flex-1 text-left">
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`ml-2 h-4 w-4 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 p-2.5 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">Admin User</div>
                <div className="text-xs text-gray-500 truncate">admin@fleet.com</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Redesigned */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>
          
          {/* Quick Stats in Header */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">{stats.activeDrivers} Active</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">{stats.deliveriesInProgress} In Progress</span>
            </div>
            {stats.pendingRequests > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Bell className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">{stats.pendingRequests} Pending</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area - Redesigned */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {renderSectionContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
