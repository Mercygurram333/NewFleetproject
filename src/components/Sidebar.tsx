import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Truck, Users, Settings, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Sidebar: React.FC = () => {
  const { user } = useAuthStore()

  if (!user) return null

  const getNavItems = () => {
    const baseItems = [
      {
        to: `/${user.role}`,
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
    ]

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { to: '/admin/drivers', icon: Users, label: 'Drivers' },
          { to: '/admin/customers', icon: Users, label: 'Customers' },
          { to: '/admin/fleet', icon: Truck, label: 'Fleet Management' },
          { to: '/admin/settings', icon: Settings, label: 'Settings' },
        ]
      case 'driver':
        return [
          ...baseItems,
          { to: '/driver/trips', icon: Truck, label: 'My Trips' },
          { to: '#', icon: User, label: 'Profile' }, // Profile stays within dashboard
        ]
      case 'customer':
        return [
          ...baseItems,
          { to: '/customer/bookings', icon: Truck, label: 'My Bookings' },
          { to: '#', icon: Settings, label: 'Profile' }, // Profile stays within dashboard
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    // Special handling for profile links in dashboard context
    if (item.label === 'Profile' && window.location.pathname.includes('/dashboard')) {
      e.preventDefault()
      const currentPath = window.location.pathname
      const newUrl = `${currentPath}?tab=profile`
      window.history.pushState({}, '', newUrl)
      // Trigger a custom event to update the dashboard tab
      window.dispatchEvent(new CustomEvent('dashboardTabChange', { detail: 'profile' }))
    }
  }

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-gray-200/50 h-screen">
      <div className="p-6">
        <nav className="space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => handleNavClick(item, e)}
              className={({ isActive }) =>
                `nav-item ${
                  isActive
                    ? 'nav-item-active bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                } rounded-xl transition-all duration-200 transform hover:scale-105`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
