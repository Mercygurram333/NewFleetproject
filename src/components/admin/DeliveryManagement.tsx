import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Package, Search, MapPin, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminStore } from '../../store/adminStore'
import type { Delivery } from '../../types'
import SimpleDeliveryMap from './SimpleDeliveryMap'

const deliverySchema = z.object({
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffAddress: z.string().min(1, 'Dropoff address is required'),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  estimatedTime: z.number().min(1, 'Estimated time must be greater than 0'),
  priority: z.enum(['low', 'medium', 'high']),
  scheduledAt: z.string().min(1, 'Scheduled time is required'),
})

type DeliveryFormData = z.infer<typeof deliverySchema>

const DeliveryManagement: React.FC = () => {
  const { deliveries, drivers, vehicles, addDelivery, updateDelivery, deleteDelivery, getAvailableVehicles, getAvailableDrivers } = useAdminStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
  })

  const filteredDeliveries = deliveries.filter(delivery => {
    const pickupAddress = delivery.pickup?.address || delivery.pickupLocation?.address || ''
    const dropoffAddress = delivery.delivery?.address || delivery.dropoffLocation?.address || ''
    
    return delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const onSubmit = (data: DeliveryFormData) => {
    const deliveryData = {
      pickup: {
        address: data.pickupAddress,
        coordinates: { lat: data.pickupLat, lng: data.pickupLng },
        scheduledTime: data.scheduledAt,
      },
      delivery: {
        address: data.dropoffAddress,
        coordinates: { lat: data.dropoffLat, lng: data.dropoffLng },
        scheduledTime: data.scheduledAt,
      },
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
      package: {
        description: 'Package delivery',
        weight: 1,
      },
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      estimatedTime: data.estimatedTime,
      priority: data.priority,
      scheduledAt: data.scheduledAt,
      status: 'pending' as const,
    }

    if (editingDelivery) {
      updateDelivery(editingDelivery.id, deliveryData)
    } else {
      addDelivery(deliveryData)
    }
    handleCloseForm()
  }

  const handleEdit = (delivery: Delivery) => {
    setEditingDelivery(delivery)
    
    const pickupLocation = delivery.pickup || delivery.pickupLocation
    const dropoffLocation = delivery.delivery || delivery.dropoffLocation
    
    // Handle both new and legacy data structures
    const pickupLat = pickupLocation?.coordinates?.lat || (pickupLocation as any)?.lat || 0
    const pickupLng = pickupLocation?.coordinates?.lng || (pickupLocation as any)?.lng || 0
    const dropoffLat = dropoffLocation?.coordinates?.lat || (dropoffLocation as any)?.lat || 0
    const dropoffLng = dropoffLocation?.coordinates?.lng || (dropoffLocation as any)?.lng || 0
    
    reset({
      pickupAddress: pickupLocation?.address || '',
      pickupLat,
      pickupLng,
      dropoffAddress: dropoffLocation?.address || '',
      dropoffLat,
      dropoffLng,
      customerName: delivery.customer.name,
      customerEmail: delivery.customer.email,
      customerPhone: delivery.customer.phone,
      vehicleId: delivery.vehicleId || '',
      driverId: delivery.driverId || '',
      estimatedTime: delivery.estimatedTime || 30,
      priority: delivery.priority || 'medium',
      scheduledAt: delivery.scheduledAt?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      deleteDelivery(id)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingDelivery(null)
    reset()
  }

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in-transit':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Delivery['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId)
    return driver ? driver.name : 'Unknown'
  }

  const getVehicleNumber = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? vehicle.vehicleNumber : 'Unknown'
  }

  // Mock geocoding function - in real app, use Google Maps Geocoding API
  const handleAddressSelect = (field: 'pickup' | 'dropoff', address: string) => {
    // Mock coordinates for demo purposes
    const mockCoordinates = {
      'Downtown Office Complex': { lat: 40.7128, lng: -74.0060 },
      'Airport Terminal 2': { lat: 40.7589, lng: -73.9851 },
      'Shopping Mall': { lat: 40.7505, lng: -73.9934 },
      'Brooklyn Heights': { lat: 40.6782, lng: -73.9442 },
    }

    const coords = mockCoordinates[address as keyof typeof mockCoordinates] || { lat: 40.7128, lng: -74.0060 }
    
    if (field === 'pickup') {
      setValue('pickupLat', coords.lat)
      setValue('pickupLng', coords.lng)
    } else {
      setValue('dropoffLat', coords.lat)
      setValue('dropoffLng', coords.lng)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delivery Management</h2>
          <p className="text-gray-600">Manage deliveries and track routes</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Delivery</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search deliveries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Map View */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Route Visualization</h3>
        <SimpleDeliveryMap 
          deliveries={filteredDeliveries} 
          selectedDelivery={selectedDelivery}
          onDeliverySelect={setSelectedDelivery}
        />
      </div>

      {/* Delivery Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDelivery ? 'Edit Delivery' : 'Create New Delivery'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Address</label>
                  <select
                    {...register('pickupAddress')}
                    onChange={(e) => {
                      register('pickupAddress').onChange(e)
                      handleAddressSelect('pickup', e.target.value)
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select pickup location</option>
                    <option value="Downtown Office Complex">Downtown Office Complex</option>
                    <option value="Airport Terminal 2">Airport Terminal 2</option>
                    <option value="Shopping Mall">Shopping Mall</option>
                    <option value="Brooklyn Heights">Brooklyn Heights</option>
                  </select>
                  {errors.pickupAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.pickupAddress.message}</p>
                  )}
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropoff Address</label>
                  <select
                    {...register('dropoffAddress')}
                    onChange={(e) => {
                      register('dropoffAddress').onChange(e)
                      handleAddressSelect('dropoff', e.target.value)
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select dropoff location</option>
                    <option value="Downtown Office Complex">Downtown Office Complex</option>
                    <option value="Airport Terminal 2">Airport Terminal 2</option>
                    <option value="Shopping Mall">Shopping Mall</option>
                    <option value="Brooklyn Heights">Brooklyn Heights</option>
                  </select>
                  {errors.dropoffAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.dropoffAddress.message}</p>
                  )}
                </div>

                {/* Hidden coordinate fields */}
                <input type="hidden" {...register('pickupLat', { valueAsNumber: true })} />
                <input type="hidden" {...register('pickupLng', { valueAsNumber: true })} />
                <input type="hidden" {...register('dropoffLat', { valueAsNumber: true })} />
                <input type="hidden" {...register('dropoffLng', { valueAsNumber: true })} />

                {/* Customer Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    {...register('customerName')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                  <input
                    {...register('customerEmail')}
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.doe@email.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                  <input
                    {...register('customerPhone')}
                    type="tel"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1-555-0123"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>

                {/* Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                  <select
                    {...register('vehicleId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select vehicle</option>
                    {getAvailableVehicles().map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} - {vehicle.type} ({vehicle.capacity}kg)
                      </option>
                    ))}
                  </select>
                  {errors.vehicleId && (
                    <p className="text-red-500 text-sm mt-1">{errors.vehicleId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver</label>
                  <select
                    {...register('driverId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select driver</option>
                    {getAvailableDrivers().map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.rating}★
                      </option>
                    ))}
                  </select>
                  {errors.driverId && (
                    <p className="text-red-500 text-sm mt-1">{errors.driverId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time (minutes)</label>
                  <input
                    {...register('estimatedTime', { valueAsNumber: true })}
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="45"
                  />
                  {errors.estimatedTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.estimatedTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    {...register('priority')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {errors.priority && (
                    <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                  <input
                    {...register('scheduledAt')}
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.scheduledAt && (
                    <p className="text-red-500 text-sm mt-1">{errors.scheduledAt.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingDelivery ? 'Update' : 'Create'} Delivery
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDeliveries.map((delivery) => (
              <tr 
                key={delivery.id} 
                className={`hover:bg-gray-50 cursor-pointer ${selectedDelivery?.id === delivery.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{delivery.customer.name}</div>
                      <div className="text-sm text-gray-500">{delivery.customer.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-3 w-3 text-green-500 mr-1" />
                      <span className="truncate max-w-xs">
                        {delivery.pickup?.address || delivery.pickupLocation?.address || 'Unknown pickup'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 text-red-500 mr-1" />
                      <span className="truncate max-w-xs">
                        {delivery.delivery?.address || delivery.dropoffLocation?.address || 'Unknown delivery'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getDriverName(delivery.driverId)}</div>
                  <div className="text-sm text-gray-500">{getVehicleNumber(delivery.vehicleId)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="h-4 w-4 mr-1" />
                    {delivery.estimatedTime}m
                  </div>
                  <div className="text-sm text-gray-500">
                    {delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(delivery.priority)}`}>
                      {delivery.priority}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(delivery)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(delivery.id)
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDeliveries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No deliveries found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryManagement
