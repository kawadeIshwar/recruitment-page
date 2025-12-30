import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import axios from 'axios'
import ProgressiveCreateAccount from './ProgressiveCreateAccount'
import Toast from './Toast'
import API_BASE_URL from '../config/api'

const taglines = [
  {
    title: 'Recruitment, Finally Under Your Control',
    description: 'Manage the entire hiring lifecycle from sourcing to closure in one intelligent system without chaos, spreadsheets, or follow-ups slipping through.'
  },
  {
    title: 'Less Chasing. More Closures. Faster Hiring.',
    description: 'Automate screening, interviews, resumes, emails, and reports so recruiters focus on decisions and placements, not repetitive coordination.'
  },
  {
    title: 'Built for Recruiters Who Scale, Not Struggle',
    description: 'Track recruiter performance, brand resumes, nurture talent pools, and integrate job boards to grow your recruitment firm with confidence.'
  }
]

const HeroSection = () => {
  const [currentTagline, setCurrentTagline] = useState(0)
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [forgotPasswordStep, setForgotPasswordStep] = useState(null) // null, 'email', 'otp', 'reset'
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const otpIntervalRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const handleLoginClick = () => setShowLoginForm(true)
  const handleBackToSignup = () => setShowLoginForm(false)
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    if (!loginEmail.trim()) {
      showToast('Please enter your email', 'error')
      return
    }
    
    if (!loginPassword) {
      showToast('Please enter your password', 'error')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginEmail)) {
      showToast('Please enter a valid email address', 'error')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword
      })
      
      setLoading(false)
      
      // Store JWT token in localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('userEmail', loginEmail.toLowerCase().trim())
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const clearForgotPasswordState = () => {
    setForgotPasswordStep(null)
    setForgotEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setOtpTimer(0)
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current)
    }
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

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showToast('Please enter your email', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: forgotEmail.toLowerCase().trim(),
      })
      setLoading(false)
      setForgotPasswordStep('otp')
      startOtpTimer()
      showToast(response.data.message || 'OTP sent successfully!', 'success')
    } catch (error) {
      setLoading(false)
      const errorMessage = error.response?.data?.error || 'Failed to send OTP. Please try again.'
      showToast(errorMessage, 'error')
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
        code: otp,
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
        newPassword,
      })

      setLoading(false)
      showToast(response.data.message || 'Password changed successfully!', 'success')
      setTimeout(() => {
        clearForgotPasswordState()
      }, 1500)
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

  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'signup') {
        setShowLoginForm(false)
      } else if (e.detail === 'login') {
        setShowLoginForm(true)
      }
    }
    window.addEventListener('hero-toggle', handler)
    return () => window.removeEventListener('hero-toggle', handler)
  }, [])

  useEffect(() => {
    return () => {
      if (otpIntervalRef.current) {
        clearInterval(otpIntervalRef.current)
      }
    }
  }, [])

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-[#e3f2ff] via-[#d6e9ff] to-[#c3ddff] text-slate-900 min-h-screen"
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="absolute inset-0">
        <div className="absolute -left-12 -top-20 h-64 w-64 rounded-full bg-[#5ca8ff]/20 blur-3xl" />
        <div className="absolute right-4 top-12 h-72 w-72 rounded-full bg-[#60c3ff]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.6),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(96,195,255,0.28),transparent_25%)]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8 md:gap-10 px-4 sm:px-6 pb-16 sm:pb-20 md:pb-28 pt-12 sm:pt-16 lg:flex-row lg:items-start lg:pt-20 lg:pb-28">
        {/* Left: dynamic tagline + highlights */}
        <div className="lg:w-7/12">
          

          <div className="relative rounded-3xl py-3 sm:py-4 text-[#0d2b53]">
            <div className="relative min-h-[140px] sm:min-h-[160px] md:min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTagline}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="space-y-3 sm:space-y-4 absolute top-0 left-0 right-0"
                >
                  <h1
                    className="text-balance text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-[#0a2a4a] lg:text-[2.7rem]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {currentTagline === 2
                      ? 'Built for Recruiters Who Scale, Not Struggle'
                      : taglines[currentTagline].title}
                  </h1>
                  <p className="max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-700">
                    {taglines[currentTagline].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-[#0d2b53] shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px]"
                onClick={() => setShowLoginForm(false)}
              >
                Get started free
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
              
            </div>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 text-[#0d2b53] shadow-sm">
              <p className="text-sm text-[#1d7bff]">Resume branding</p>
              <p className="text-2xl font-semibold">+62%</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 text-[#0d2b53] shadow-sm">
              <p className="text-sm text-[#1d7bff]">Faster closures</p>
              <p className="text-2xl font-semibold">2.4x</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-4 text-[#0d2b53] shadow-sm">
              <p className="text-sm text-[#1d7bff]">Less manual work</p>
              <p className="text-2xl font-semibold">-24 hrs/wk</p>
            </div>
          </div>
        </div>

        {/* Right: onboarding card */}
        <div className="lg:w-5/12">
            <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-8rem)] flex flex-col">
            <div className="absolute inset-x-8 top-0 h-24 bg-gradient-to-b from-[#e6f2ff] to-transparent blur-2xl pointer-events-none -z-10" />
            <div className="relative py-4 sm:py-6 md:p-7 flex-1 flex flex-col min-h-0 px-4 sm:px-6 md:px-7">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0d2b53]">
                    {showLoginForm ? 'Login to continue' : 'Create your workspace'}
                  </h2>
                </div>
                
              </div>

               {showLoginForm ? (
                 forgotPasswordStep === null ? (
                   <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">Password</label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.023 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs sm:text-sm font-semibold text-primary hover:underline"
                        onClick={() => {
                          setForgotEmail(loginEmail)
                          setForgotPasswordStep('email')
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px]"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={handleBackToSignup}
                        className="text-xs sm:text-sm text-slate-600"
                      >
                        Don't have an account? <span className="text-primary font-semibold hover:underline">Sign Up</span>
                      </button>
                    </div>
                  </form>
                ) : forgotPasswordStep === 'email' ? (
                  <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="rounded-lg bg-primary px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px] disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Generate OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={clearForgotPasswordState}
                        className="text-xs sm:text-sm text-slate-600"
                      >
                        Back to login
                      </button>
                    </div>
                  </div>
                ) : forgotPasswordStep === 'otp' ? (
                  <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-center tracking-[0.35em] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                      />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {otpTimer > 0 ? (
                        <p className="text-xs sm:text-sm text-slate-500">Resend OTP in {otpTimer}s</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="text-xs sm:text-sm font-semibold text-primary hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordStep('email')
                          setOtp('')
                        }}
                        className="text-xs sm:text-sm font-semibold text-slate-600 hover:underline"
                      >
                        Back
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px] disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
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
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700">Confirm password</label>
                      <div className="relative">
                        <input
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
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
                      className="w-full rounded-lg bg-primary px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px] disabled:opacity-50"
                    >
                      {loading ? 'Changing...' : 'Change password'}
                    </button>
                    <button
                      type="button"
                      onClick={clearForgotPasswordState}
                      className="text-xs sm:text-sm text-slate-600"
                    >
                      Back to login
                    </button>
                  </div>
                )
              ) : (
                <ProgressiveCreateAccount onSwitchToLogin={handleLoginClick} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
