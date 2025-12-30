import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Toast from '../components/Toast'
import API_BASE_URL from '../config/api'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null) // null, 'email', 'otp', 'reset'
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailNotFound, setEmailNotFound] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const otpIntervalRef = useRef(null)

  useEffect(() => {
    return () => {
      if (otpIntervalRef.current) {
        clearInterval(otpIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    console.log('forgotPasswordStep changed to:', forgotPasswordStep)
  }, [forgotPasswordStep])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const startOtpTimer = () => {
    setOtpTimer(60)
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current)
    }
    otpIntervalRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(otpIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email.trim()) {
      showToast('Please enter your email', 'error')
      return
    }
    
    if (!password) {
      showToast('Please enter your password', 'error')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.toLowerCase().trim(),
        password: password
      })
      
      setLoading(false)
      
      // Store JWT token in localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userEmail', email.toLowerCase().trim())
      }
      
      // Show success message
      showToast('Login successful! Welcome back 🎉', 'success')
      
      // TODO: Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        console.log('Redirecting to dashboard...')
        // window.location.href = '/dashboard'  // Uncomment when dashboard is ready
      }, 1500)
      
    } catch (error) {
      setLoading(false)
      
      if (error.response?.status === 401) {
        showToast('Invalid email or password. Please try again.', 'error')
      } else {
        const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showToast('Please enter your email', 'error')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setLoading(true)
    setEmailNotFound(false)
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: forgotEmail.toLowerCase().trim()
      })
      
      setLoading(false)
      setForgotPasswordStep('otp')
      startOtpTimer()
      showToast(response.data.message || 'OTP sent successfully! Check your email.', 'success')
    } catch (error) {
      setLoading(false)
      
      // Handle different error cases
      if (error.response?.status === 404) {
        // User doesn't exist - provide clear message with signup option
        setEmailNotFound(true)
        showToast("You don't have an account with this email. Please sign up first.", 'error')
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to send OTP. Please try again.'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-reset-otp`, {
        email: forgotEmail.toLowerCase().trim(),
        code: otp
      })
      
      setLoading(false)
      setForgotPasswordStep('reset')
      showToast(response.data.message || 'OTP verified successfully!', 'success')
    } catch (error) {
      setLoading(false)
      const errorMessage = error.response?.data?.error || 'Invalid OTP. Please try again.'
      showToast(errorMessage, 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Please fill all fields', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: forgotEmail.toLowerCase().trim(),
        code: otp,
        newPassword
      })
      
      setLoading(false)
      showToast(response.data.message || 'Password changed successfully!', 'success')
      setTimeout(() => {
        setForgotPasswordStep(null)
        setForgotEmail('')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setOtpTimer(0)
        if (otpIntervalRef.current) {
          clearInterval(otpIntervalRef.current)
        }
      }, 2000)
    } catch (error) {
      setLoading(false)
      const errorMessage = error.response?.data?.error || 'Failed to reset password. Please try again.'
      showToast(errorMessage, 'error')
    }
  }

  const handleResendOTP = () => {
    if (otpTimer > 0) return
    handleForgotPassword()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8"
          key={forgotPasswordStep || 'login'}
        >
          {forgotPasswordStep === null ? (
            <>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Welcome Back</h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Login to your recruiter account</p>

              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Registered Email ID
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10 sm:pr-12 text-sm sm:text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-5 bg-primary hover:bg-primary-dark text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Forgot password clicked, current step:', forgotPasswordStep)
                    setForgotPasswordStep('email')
                  }}
                  className="text-sm text-action-link hover:text-primary transition-colors cursor-pointer underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : forgotPasswordStep === 'email' ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Forgot Password</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Enter your registered email to receive OTP</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value)
                        setEmailNotFound(false)
                      }}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your registered email"
                    />
                  </div>

                  {emailNotFound && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">Account Not Found</h3>
                          <p className="text-sm text-red-700 mb-2">
                            We couldn't find an account with this email address.
                          </p>
                          <p className="text-xs text-red-600">
                            Please check the email address or{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setForgotPasswordStep(null)
                                setEmailNotFound(false)
                                setForgotEmail('')
                              }}
                              className="underline font-semibold hover:text-red-800"
                            >
                              create a new account
                            </button>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordStep(null)
                        setEmailNotFound(false)
                      }}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 border border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back to Login
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-primary hover:bg-primary-dark text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Validating...' : 'Generate OTP'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : forgotPasswordStep === 'otp' ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Verify OTP</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">
                  Enter the 6-digit OTP sent to {forgotEmail}
                </p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-xl sm:text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-sm text-gray-600">
                        Resend OTP in {otpTimer}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="text-sm text-action-link hover:text-primary transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordStep('email')
                        setOtp('')
                      }}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 border border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-primary hover:bg-primary-dark text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">Reset Password</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Enter your new password</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div>
                    <label htmlFor="new-password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10 sm:pr-12 text-sm sm:text-base"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10 sm:pr-12 text-sm sm:text-base"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                      >
                        {showConfirmNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-5 bg-primary hover:bg-primary-dark text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage

