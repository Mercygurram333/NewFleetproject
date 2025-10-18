import React from 'react'
import { TrendingUp, Package, Clock, CheckCircle, XCircle, Star, Calendar, Award, Target } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

interface DriverAnalyticsProps {
  driverId: string
}

const DriverAnalytics: React.FC<DriverAnalyticsProps> = ({ driverId }) => {
  const { getDeliveryStats, drivers } = useAdminStore()
  const stats = getDeliveryStats(driverId)
  const driver = drivers.find(d => d.id === driverId)

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const acceptanceRate = stats.total > 0 ? Math.round(((stats.accepted + stats.inTransit + stats.completed) / stats.total) * 100) : 0

  const analyticsCards = [
    {
      title: 'Total Rides Completed',
      value: stats.completed.toString(),
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Deliveries',
      value: stats.pending.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      change: stats.pending > 0 ? `${stats.pending} waiting` : 'All clear',
      changeType: stats.pending > 0 ? 'neutral' as const : 'positive' as const
    },
    {
      title: 'Active Deliveries',
      value: (stats.accepted + stats.inTransit).toString(),
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      change: stats.inTransit > 0 ? `${stats.inTransit} in transit` : 'Ready for new',
      changeType: 'neutral' as const
    },
    {
      title: 'Driver Rating',
      value: driver?.rating?.toFixed(1) || '5.0',
      icon: Star,
      color: 'bg-purple-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-700',
      change: 'Excellent',
      changeType: 'positive' as const
    }
  ]

  const performanceMetrics = [
    {
      label: 'Completion Rate',
      value: completionRate,
      color: 'bg-green-500',
      icon: Target
    },
    {
      label: 'Acceptance Rate',
      value: acceptanceRate,
      color: 'bg-blue-500',
      icon: TrendingUp
    },
    {
      label: 'On-Time Delivery',
      value: 94, // Mock data
      color: 'bg-purple-500',
      icon: Clock
    }
  ]

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={card.title} 
              className={`stats-card animate-bounce-in bg-gradient-to-br ${card.bgColor} border-l-4 ${card.borderColor}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`stats-icon ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`stats-change ${card.changeType}`}>
                  {card.change}
                </div>
              </div>
              <div className={`stats-value ${card.textColor}`}>{card.value}</div>
              <div className={`stats-label ${card.textColor}`}>{card.title}</div>
            </div>
          )
        })}
      </div>

      {/* Performance Metrics */}
      <div className="card-elevated p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
            Performance Metrics
          </h3>
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
            <Award className="h-4 w-4" />
            <span>Top Performer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{metric.value}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${metric.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${metric.value}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {metric.value >= 90 ? 'Excellent' : metric.value >= 75 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="card-elevated p-6 animate-slide-up">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full mr-3"></div>
          Recent Activity
        </h3>
        
        <div className="space-y-4">
          {/* Mock recent activities */}
          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Delivery completed successfully</p>
              <p className="text-xs text-gray-600">Package delivered to Downtown Office - 2 hours ago</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Started delivery ride</p>
              <p className="text-xs text-gray-600">En route to pickup location - 4 hours ago</p>
            </div>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Accepted new delivery</p>
              <p className="text-xs text-gray-600">Pickup from Shopping Mall - 6 hours ago</p>
            </div>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200">
            View Full Activity History
          </button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{driver?.totalTrips || 0}</div>
          <div className="text-sm text-gray-600">Total Trips</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
          <div className="text-sm text-gray-600">In Transit</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>
    </div>
  )
}

export default DriverAnalytics
