import React from 'react'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Save, X, Star, Package } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAdminStore } from '../../store/adminStore'

const Profile: React.FC = () => {
  const { user, updateProfile, getProfile, isLoading: authLoading } = useAuthStore()
  const { drivers, updateDriver } = useAdminStore()
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: ''
  })
  const [localLoading, setLocalLoading] = React.useState(false)

  // Determine if user is driver or customer and get appropriate data
  const isDriver = user?.role === 'driver'
  const currentDriver = isDriver ? drivers.find(d => d.email === user?.email) : null
  const profileData = isDriver && currentDriver ? currentDriver : user

  // Load profile data on component mount
  React.useEffect(() => {
    if (user && !profileData) {
      getProfile()
    }
  }, [user, profileData, getProfile])

  React.useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: (profileData as any).phone || user?.phone || ''
      })
    }
  }, [profileData, user?.phone])

  const handleSave = async () => {
    setLocalLoading(true)
    try {
      const success = await updateProfile(formData.name, formData.phone)
      if (success) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: (profileData as any).phone || user?.phone || ''
      })
      setIsEditing(false)
    }
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading profile...</h3>
          <p className="text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className={`w-20 h-20 bg-gradient-to-br ${isDriver ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'} rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105`}>
                <User className="h-10 w-10 text-white" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 transition-colors duration-200">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your name"
                  />
                ) : (
                  profileData.name || 'User'
                )}
              </h1>
              <div className="flex items-center space-x-3">
                <p className={`text-sm font-medium px-3 py-1 rounded-full ${isDriver ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} transition-colors duration-200`}>
                  {isDriver ? 'Driver' : 'Customer'}
                </p>
                {isDriver && currentDriver && (
                  <p className="text-gray-600"> {currentDriver.rating?.toFixed(1) || '5.0'} </p>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center hover:text-gray-700 transition-colors duration-200">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {new Date(profileData.createdAt || user?.createdAt || Date.now()).toLocaleDateString()}
                </span>
                {isDriver && currentDriver && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    currentDriver.status === 'available' ? 'bg-green-100 text-green-800' :
                    currentDriver.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentDriver.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center space-x-2 hover:scale-105 transition-all duration-200"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-secondary flex items-center space-x-2 hover:scale-105 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={localLoading || authLoading}
                  className="btn-primary flex items-center space-x-2 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{localLoading ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:border-blue-400"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100">{profileData.name || 'Not specified'}</p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                {profileData.email || 'Not specified'}
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:border-blue-400"
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  {formData.phone || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Account Information
          </h3>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <p className={`text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center font-medium ${
                isDriver ? 'text-blue-700' : 'text-green-700'
              }`}>
                {isDriver ? 'Driver Account' : 'Customer Account'}
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                {new Date(profileData.createdAt || user?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${user?.isActive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                {user?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>

            {isDriver && currentDriver && (
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Status</label>
                <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200 group-hover:bg-gray-100 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${currentDriver.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                  {currentDriver.vehicleId ? `Vehicle Assigned (${currentDriver.status})` : 'No vehicle assigned'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {isDriver && currentDriver && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-600" />
            Performance Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-yellow-700 mb-2">{currentDriver.rating?.toFixed(1) || '5.0'}</div>
              <p className="text-sm text-yellow-600 font-medium">Customer Rating</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-blue-700 mb-2">{currentDriver.totalTrips || 0}</div>
              <p className="text-sm text-blue-600 font-medium">Total Trips</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-green-700 mb-2">{Math.floor((currentDriver.totalTrips || 0) * 0.95)}</div>
              <p className="text-sm text-green-600 font-medium">Successful Deliveries</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Statistics */}
      {!isDriver && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-green-600" />
            Delivery Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-green-700 mb-2">--</div>
              <p className="text-sm text-green-600 font-medium">Total Orders</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-blue-700 mb-2">--</div>
              <p className="text-sm text-blue-600 font-medium">Active Orders</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-3xl font-bold text-purple-700 mb-2">--</div>
              <p className="text-sm text-purple-600 font-medium">Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
