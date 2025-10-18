import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, Key, Send } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'success'>('email')
  const [showSuccess, setShowSuccess] = useState(false)

  const { 
    forgotPassword, 
    resetPassword,
    isLoading, 
    error, 
    clearError 
  } = useAuthStore()

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    clearError()
  }, [clearError])

  /**
   * Handle email input change
   */
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (error) {
      clearError()
    }
  }

  /**
   * Handle forgot password form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      return
    }
    
    const success = await forgotPassword(email)
    
    if (success) {
      setStep('success')
      setShowSuccess(true)
    }
  }

  /**
   * Simulate password reset (for demo purposes)
   */
  const handleDemoReset = async () => {
    // In a real app, this would be handled via email link
    // For demo, we'll simulate the reset process
    const demoToken = 'demo-reset-token-123'
    const newPassword = 'NewPassword123'
    
    const success = await resetPassword(demoToken, newPassword)
    
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        // Redirect to login page
        window.location.href = '/login'
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {step === 'email' ? 'Reset Password' : 'Check Your Email'}
          </h2>
          <p className="mt-3 text-gray-600 font-medium">
            {step === 'email' 
              ? 'Enter your email to receive reset instructions'
              : 'We\'ve sent password reset instructions to your email'
            }
          </p>
        </div>
        
        {step === 'email' ? (
          /* Email Step */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="form-input-enhanced pl-14 h-12 text-gray-900 placeholder-gray-400 shadow-sm"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2 animate-slide-up">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending Instructions...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Send Reset Instructions</span>
                  </div>
                )}
              </button>
            </div>

            {/* Navigation Links */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Link 
                  to="/login" 
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
                <span className="text-gray-300">|</span>
                <Link 
                  to="/register" 
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  Create Account
                </Link>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Demo Mode</p>
                <p>Password reset emails are simulated in development</p>
              </div>
            </div>
          </form>
        ) : (
          /* Success Step */
          <div className="mt-8 space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Instructions Sent!</h3>
              <p className="text-sm">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm mt-2">
                Please check your email and follow the link to reset your password.
              </p>
            </div>

            {/* Demo Section */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <h4 className="font-medium mb-2">Demo Mode - Simulate Reset</h4>
              <p className="text-sm mb-3">
                In development mode, you can simulate the password reset process:
              </p>
              <button
                onClick={handleDemoReset}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resetting...</span>
                  </div>
                ) : (
                  'Simulate Password Reset'
                )}
              </button>
            </div>

            {/* Success Notification */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2 animate-slide-up">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Password reset successful! Redirecting to login...</span>
              </div>
            )}

            {/* Navigation Links */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Link 
                  to="/login" 
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Didn't receive the email? Check your spam folder or</p>
                <button 
                  onClick={() => setStep('email')}
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  try again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordForm
