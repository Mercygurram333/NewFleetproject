import React from 'react'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/adminStore'

const DebugPanel: React.FC = () => {
  const { user } = useAuthStore()
  const { drivers, deliveries } = useAdminStore()

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">Debug Panel</h3>
      <div className="text-xs space-y-1">
        <p><strong>Current User:</strong> {user?.email || 'Not logged in'}</p>
        <p><strong>User Role:</strong> {user?.role || 'None'}</p>
        <p><strong>Total Drivers:</strong> {drivers.length}</p>
        <p><strong>Total Deliveries:</strong> {deliveries.length}</p>
        
        <div className="mt-2">
          <p><strong>Available Drivers:</strong></p>
          <ul className="ml-2">
            {drivers.map(d => (
              <li key={d.id} className="text-xs">
                {d.name} ({d.email})
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-2">
          <p><strong>Driver Match:</strong></p>
          <p className="text-xs">
            {drivers.find(d => d.email === user?.email) ? 'Found' : 'Not Found'}
          </p>
        </div>
        
        <button
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
        >
          Clear & Reload
        </button>
      </div>
    </div>
  )
}

export default DebugPanel
