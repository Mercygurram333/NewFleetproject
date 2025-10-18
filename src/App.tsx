import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import ForgotPasswordForm from './components/ForgotPasswordForm'
import ProtectedRoute, { PublicOnlyRoute, AdminRoute, DriverRoute, CustomerRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import DashboardTest from './pages/DashboardTest'
import './utils/resetStorage' // Import to make resetStorage available globally

// Dashboard Redirect Component
const DashboardRedirect: React.FC = () => {
  const { user } = useAuthStore()
  
  if (user) {
    return <Navigate to={`/${user.role}`} replace />
  }
  
  return <Navigate to="/login" replace />
}

// App Component with Authentication Routes

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* Public Authentication Routes */}
        <Route 
          path="/login" 
          element={
            <PublicOnlyRoute>
              <LoginForm />
            </PublicOnlyRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicOnlyRoute>
              <RegisterForm />
            </PublicOnlyRoute>
          } 
        />
        
        <Route 
          path="/forgot-password" 
          element={
            <PublicOnlyRoute>
              <ForgotPasswordForm />
            </PublicOnlyRoute>
          } 
        />
        
        {/* Dashboard Test Route */}
        <Route 
          path="/test" 
          element={<DashboardTest />} 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Default redirect based on user role */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Admin Routes */}
          <Route 
            path="admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Driver Routes */}
          <Route 
            path="driver" 
            element={
              <DriverRoute>
                <DriverDashboard />
              </DriverRoute>
            } 
          />
          
          {/* Customer Routes */}
          <Route 
            path="customer" 
            element={
              <CustomerRoute>
                <CustomerDashboard />
              </CustomerRoute>
            } 
          />
          
          {/* Generic dashboard route that redirects based on role */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}


export default App
