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
import { useAuthStore } from '../store/authStore'
import VehicleManagement from '../components/admin/VehicleManagement'
import DriverManagement from '../components/admin/DriverManagement'
import DeliveryManagement from '../components/admin/DeliveryManagement'
import PendingDeliveryRequests from '../components/admin/PendingDeliveryRequests'
import UniversalMap from '../components/maps/UniversalMap'
import RoutePlanner from '../components/route/RoutePlanner'
import VehicleTrackingDashboard from '../components/tracking/VehicleTrackingDashboard'
import AdminDeliveryTrackingMap from '../components/AdminDeliveryTrackingMap'

type SectionType = 'dashboard' | 'fleet' | 'drivers' | 'deliveries' | 'tracking' | 'vehicle-tracking' | 'reports' | 'settings'

// Dashboard Overview Component - REDESIGNED
const DashboardOverview: React.FC<{
  stats: any
  vehicles: any[]
  drivers: any[]
  deliveries: any[]
}> = ({ stats, vehicles, drivers, deliveries }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards - Improved Layout */}
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

      {/* Recent Activity and Fleet Status - REDESIGNED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
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

        {/* Fleet Status */}
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

// Keep all other section components (FleetManagementSection, DriversSection, etc.) the same
// ... [Previous section components remain unchanged]

// Main Admin Dashboard Component - REDESIGNED
const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { vehicles, drivers, deliveries, initializeData, getPendingDeliveries } = useAdminStore()
  const { user } = useAuthStore()
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
    systemAlerts: 3
  }

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: 'dashboard' as SectionType,
      label: 'Fleet Management',
      icon: Home,
      description: 'Overview and key metrics'
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
      // ... other cases remain the same
      default:
        return <DashboardOverview stats={stats} vehicles={vehicles} drivers={drivers} deliveries={deliveries} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* REDESIGNED Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0`}
      >
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
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@fleet.com'}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - REDESIGNED */}
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

        {/* Content Area - REDESIGNED */}
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
