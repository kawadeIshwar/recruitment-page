import { useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Toast from './Toast'
import { sanitizeInput, debounce } from '../utils/sanitize'

const businessTypes = ['Private Ltd', 'Partnership', 'Proprietorship', 'LLP', 'Other']

const getFieldError = (name, value, helpers) => {
  const { gstPanType, hasWebsite, otpSent, otpVerified, passwordRules } = helpers
  switch (name) {
    case 'firstName':
      return value.trim() ? '' : 'First name is required'
    case 'lastName':
      return value.trim() ? '' : 'Last name is required'
    case 'phoneNumber':
      if (!value.trim()) return 'Business phone number is required'
      return /^\d{10}$/.test(value) ? '' : 'Enter a valid 10-digit number'
    case 'designation':
      return value.trim() ? '' : 'Designation is required'
    case 'gstPanType':
      return value ? '' : 'Please select GST or PAN'
    case 'gstPanNumber': {
      if (!value.trim()) return `${gstPanType} number is required`
      if (gstPanType === 'GST') {
        return /^(?=.{15}$)[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value)
          ? ''
          : 'Enter a valid 15-character GSTIN'
      }
      return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value) ? '' : 'Enter a valid 10-character PAN'
    }
    case 'businessType':
      return value ? '' : 'Business type is required'
    case 'businessName':
      return value.trim() ? '' : 'Business name is required'
    case 'businessAddress':
      return value.trim() ? '' : 'Business address is required'
    case 'websiteUrl':
      if (hasWebsite === 'yes' && !value.trim()) return 'Website URL is required'
      return ''
    case 'businessEmail':
      if (!value.trim()) return 'Business email is required'
      return /\S+@\S+\.\S+/.test(value) ? '' : 'Enter a valid email address'
    case 'otp':
      if (!otpSent) return 'Please send OTP first'
      if (!value.trim()) return 'OTP is required'
      if (value.trim().length !== 6) return 'OTP must be 6 digits'
      return ''
    case 'password':
      if (!otpVerified) return ''
      if (!value) return 'Password is required'
      return Object.values(passwordRules).every(Boolean) ? '' : 'Password does not meet all requirements'
    case 'confirmPassword':
      if (!otpVerified) return ''
      if (!value) return 'Please confirm your password'
      return value === helpers.password ? '' : 'Password And Confirm Password Not Matched.'
    default:
      return ''
  }
}

const ProgressiveCreateAccount = ({ onSwitchToLogin }) => {
  const scrollContainerRef = useRef(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    designation: '',
    gstPanType: 'GST',
    gstPanNumber: '',
    businessType: '',
    businessName: '',
    businessAddress: '',
    registeredAddress: '',
    hasWebsite: 'no',
    websiteUrl: '',
    businessEmail: '',
    otp: '',
    password: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('idle') // idle | pending | success | error
  const [autoFillLocked, setAutoFillLocked] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [callbackStatus, setCallbackStatus] = useState('idle') // idle | pending | sent
  const [toast, setToast] = useState(null)

  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }
  const allPasswordRulesMet = Object.values(passwordRules).every(Boolean)

  const formatHint =
    formData.gstPanType === 'GST'
      ? 'Format: 15-character GSTIN (e.g., 22ABCDE1234F1Z5)'
      : 'Format: 10-character PAN (e.g., ABCDE1234F)'

  const sanitizeValue = (name, value) => {
    if (name === 'phoneNumber') return value.replace(/\D/g, '').slice(0, 10)
    if (name === 'gstPanNumber') return value.toUpperCase().replace(/\s/g, '').slice(0, 15)
    return value
  }

  const validateField = (name, value) => {
    const message = getFieldError(name, value, {
      gstPanType: formData.gstPanType,
      hasWebsite: formData.hasWebsite,
      otpSent,
      otpVerified,
      passwordRules,
      password: formData.password
    })
    setErrors((prev) => ({ ...prev, [name]: message }))
    return !message
  }

  const handleChange = (e) => {
    const { name } = e.target
    const value = sanitizeValue(name, e.target.value)
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'hasWebsite' && value === 'no' ? { websiteUrl: '' } : {})
    }))

    validateField(name, value)

    if ((name === 'password' || name === 'confirmPassword') && errors.confirmPassword) {
      validateField('confirmPassword', name === 'confirmPassword' ? value : formData.confirmPassword)
    }
  }

  const validateStep1 = () => {
    const targets = ['firstName', 'lastName', 'phoneNumber', 'designation']
    const results = targets.map((field) => validateField(field, formData[field]))
    return results.every(Boolean)
  }

  const validateStep2 = () => {
    const targets = ['gstPanType', 'gstPanNumber', 'businessType', 'businessName', 'businessAddress']
    if (formData.hasWebsite === 'yes') targets.push('websiteUrl')
    const results = targets.map((field) => validateField(field, formData[field]))

    if (verificationStatus !== 'success') {
      setErrors((prev) => ({
        ...prev,
        gstPanNumber: prev.gstPanNumber || 'Verify your GST/PAN to continue'
      }))
      return false
    }
    return results.every(Boolean)
  }

  const validateStep3 = () => {
    if (!otpVerified) {
      setErrors((prev) => ({ ...prev, otp: 'Please verify OTP before continuing' }))
      return false
    }
    const targets = ['businessEmail', 'otp', 'password', 'confirmPassword']
    const results = targets.map((field) => validateField(field, formData[field]))
    return results.every(Boolean)
  }

  const handleNext = () => {
    const canProceed = currentStep === 1 ? validateStep1() : validateStep2()
    if (!canProceed) return

    setCurrentStep((prev) => prev + 1)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep === 1) return
    setCurrentStep((prev) => prev - 1)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Debounced version to prevent spam clicks
  const handleVerifyBusinessDebounced = useCallback(
    debounce(async () => {
    const typeValid = validateField('gstPanType', formData.gstPanType)
    const numberValid = validateField('gstPanNumber', formData.gstPanNumber)
    if (!typeValid || !numberValid) return

    setVerificationStatus('pending')
    setAutoFillLocked(false)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE_URL}/verification/business/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.gstPanType,
          id: formData.gstPanNumber.toUpperCase().trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setVerificationStatus('error')
        setAutoFillLocked(false)
        setErrors((prev) => ({
          ...prev,
          gstPanNumber: data.error || `Invalid ${formData.gstPanType} number`
        }))
        return
      }

      // Successfully verified - autofill business details
      setVerificationStatus('success')
      setAutoFillLocked(true)
      setFormData((prev) => ({
        ...prev,
        businessName: data.companyName || '',
        businessType: data.businessType || '',
        businessAddress: data.address || '',
        registeredAddress: data.address || ''
      }))
      setErrors((prev) => ({ ...prev, gstPanNumber: '', businessName: '', businessType: '', businessAddress: '' }))
    } catch (error) {
      setVerificationStatus('error')
      setAutoFillLocked(false)
      setErrors((prev) => ({
        ...prev,
        gstPanNumber: 'Failed to verify. Please check your connection and try again.'
      }))
    }
    }, 1000),
    [formData.gstPanType, formData.gstPanNumber, verificationStatus]
  )

  const handleVerifyBusiness = () => {
    const typeValid = validateField('gstPanType', formData.gstPanType)
    const numberValid = validateField('gstPanNumber', formData.gstPanNumber)
    if (!typeValid || !numberValid) return
    
    if (verificationStatus === 'pending') return // Prevent double clicks
    handleVerifyBusinessDebounced()
  }

  // Debounced OTP send to prevent spam
  const handleSendOtpDebounced = useCallback(
    debounce(async () => {
      const emailValid = validateField('businessEmail', formData.businessEmail)
      if (!emailValid) return

      setIsSubmitting(true)
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
        const response = await fetch(`${API_BASE_URL}/verification/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.businessEmail })
        })

        const data = await response.json()

        if (!response.ok) {
          setErrors(prev => ({ ...prev, businessEmail: data.error || 'Failed to send OTP. Please try again.' }))
          setIsSubmitting(false)
          return
        }

        setOtpSent(true)
        setIsSubmitting(false)
      } catch (error) {
        setErrors(prev => ({ ...prev, businessEmail: 'Network error. Please check your connection and try again.' }))
        setIsSubmitting(false)
      }
    }, 2000),
    [formData.businessEmail, isSubmitting]
  )

  const handleSendOtp = () => {
    if (isSubmitting || otpSent) return
    handleSendOtpDebounced()
  }

  // Debounced OTP verification
  const handleVerifyOtpDebounced = useCallback(
    debounce(async () => {
    // Basic validation without circular dependency
    if (!formData.otp.trim()) {
      setErrors(prev => ({ ...prev, otp: 'Please enter OTP' }))
      return
    }
    if (formData.otp.trim().length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'OTP must be 6 digits' }))
      return
    }

    setIsSubmitting(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE_URL}/verification/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.businessEmail,
          code: formData.otp 
        })
      })

      const data = await response.json()

      if (!response.ok || !data.verified) {
        setErrors(prev => ({ ...prev, otp: data.error || 'Invalid or expired OTP. Please try again.' }))
        setIsSubmitting(false)
        return
      }

      setOtpVerified(true)
      setErrors((prev) => ({ ...prev, otp: '' }))
      setIsSubmitting(false)
    } catch (error) {
      setErrors(prev => ({ ...prev, otp: 'Network error. Please try again.' }))
      setIsSubmitting(false)
    }
    }, 1000),
    [formData.businessEmail, formData.otp, isSubmitting, otpVerified]
  )

  const handleVerifyOtp = () => {
    if (isSubmitting || otpVerified) return
    
    if (!formData.otp.trim()) {
      setErrors(prev => ({ ...prev, otp: 'Please enter OTP' }))
      return
    }
    
    handleVerifyOtpDebounced()
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return

    setIsSubmitting(true)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.businessEmail,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phoneNumber,
          designation: formData.designation,
          gstPanType: formData.gstPanType,
          gstPanNumber: formData.gstPanNumber,
          businessType: formData.businessType,
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          registeredAddress: formData.registeredAddress,
          website: formData.hasWebsite === 'yes' ? formData.websiteUrl : null
        })
      })

      const data = await response.json()
      setIsSubmitting(false)

      if (!response.ok) {
        showToast(data.error || 'Failed to create account. Please try again.', 'error')
        return
      }

      // Success!
      showToast('Account created successfully! 🎉', 'success')
      
      // Reset form after 2 seconds
      setTimeout(() => {
        // You can redirect to login or dashboard here
      }, 2000)
      
    } catch (error) {
      setIsSubmitting(false)
      showToast('Network error. Please check your connection and try again.', 'error')
    }
  }

  const handleRequestCallback = () => {
    // ensure personal details valid before sending
    const personalValid = validateStep1()
    if (!personalValid) {
      setCurrentStep(1)
      return
    }

    setCallbackStatus('pending')
    setTimeout(() => {
      setCallbackStatus('sent')
    }, 900)
  }

  const step1Ready = ['firstName', 'lastName', 'phoneNumber', 'designation'].every(
    (field) =>
      !getFieldError(field, formData[field], {
        gstPanType: formData.gstPanType,
        hasWebsite: formData.hasWebsite,
        otpSent,
        otpVerified,
        passwordRules,
        password: formData.password
      })
  )

  const step2Ready =
    verificationStatus === 'success' &&
    ['gstPanType', 'gstPanNumber', 'businessType', 'businessName', 'businessAddress'].every(
      (field) =>
        !getFieldError(field, formData[field], {
          gstPanType: formData.gstPanType,
          hasWebsite: formData.hasWebsite,
          otpSent,
          otpVerified,
          passwordRules,
          password: formData.password
        })
    ) &&
    (formData.hasWebsite === 'no' ||
      !getFieldError('websiteUrl', formData.websiteUrl, {
        gstPanType: formData.gstPanType,
        hasWebsite: formData.hasWebsite,
        otpSent,
        otpVerified,
        passwordRules,
        password: formData.password
      }))

  const step3Ready =
    otpVerified &&
    !getFieldError('businessEmail', formData.businessEmail, {
      gstPanType: formData.gstPanType,
      hasWebsite: formData.hasWebsite,
      otpSent,
      otpVerified,
      passwordRules,
      password: formData.password
    }) &&
    allPasswordRulesMet &&
    formData.password === formData.confirmPassword

  const stepVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden p-1 m-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-5 px-3 sm:px-4 py-1 sm:py-2 pb-8 sm:pb-10 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 #F1F5F9'
          }}
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="personal"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4 sm:space-y-5 pb-4 sm:pb-5"
              >
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">Personal Details</p>
                  <p className="text-xs sm:text-sm text-slate-500">Help us personalize your workspace.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Alex"
                      className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    />
                    {errors.firstName && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Rivera"
                      className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    />
                    {errors.lastName && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      Business Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                      className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.phoneNumber
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    />
                    {errors.phoneNumber && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Talent Lead, HRBP, Founder"
                      className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.designation
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    />
                    {errors.designation && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.designation}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="business"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 pb-4 sm:pb-5"
              >
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">Business Details</p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Start with verification so we can prefill and protect your account.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">Business Verification</p>
                      <p className="text-xs text-slate-500">How would you like to verify your business?</p>
                    </div>
                    {verificationStatus === 'success' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {['GST', 'PAN'].map((option) => (
                      <label key={option} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gstPanType"
                          value={option}
                          checked={formData.gstPanType === option}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary focus:ring-primary flex-shrink-0"
                        />
                        <span className="whitespace-nowrap">{option === 'GST' ? 'GST Number' : 'Business PAN Number'}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gstPanType && <p className="text-xs text-red-500">{errors.gstPanType}</p>}

                  <div className="space-y-2 sm:space-y-2.5">
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      {formData.gstPanType} Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <input
                          name="gstPanNumber"
                          value={formData.gstPanNumber}
                          onChange={handleChange}
                          placeholder={formData.gstPanType === 'GST' ? '22ABCDE1234F1Z5' : 'ABCDE1234F'}
                          className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                            errors.gstPanNumber || verificationStatus === 'error'
                              ? 'border-red-500 focus:ring-red-200'
                              : verificationStatus === 'success'
                              ? 'border-green-500 focus:ring-green-200 bg-green-50'
                              : 'border-slate-200 focus:ring-primary/30'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyBusiness}
                        disabled={verificationStatus === 'pending' || !formData.gstPanNumber}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                      >
                        {verificationStatus === 'pending' ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    {errors.gstPanNumber && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.gstPanNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs font-medium text-slate-700">
                      Type of Business <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.businessType
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    >
                      <option value="">Select</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <label className="text-xs font-medium text-slate-700">
                      Business / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Northbridge Talent Pvt Ltd"
                      className={`w-full rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                        errors.businessName
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:ring-primary/30'
                      }`}
                    />
                    {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                  <label className="text-xs font-medium text-slate-700">
                    Business Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Enter your business address"
                    rows={2}
                    className={`w-full rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition resize-none ${
                      errors.businessAddress
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-primary/30'
                    }`}
                  />
                  {errors.businessAddress && <p className="text-xs text-red-500 mt-1">{errors.businessAddress}</p>}
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  <p className="text-xs font-medium text-slate-700">Do you have a business website?</p>
                  <div className="flex gap-3 sm:gap-4">
                    {['yes', 'no'].map((choice) => (
                      <label key={choice} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="hasWebsite"
                          value={choice}
                          checked={formData.hasWebsite === choice}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary focus:ring-primary flex-shrink-0"
                        />
                        <span className="whitespace-nowrap">{choice === 'yes' ? 'Yes' : 'No'}</span>
                      </label>
                    ))}
                  </div>
                  {formData.hasWebsite === 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 min-w-0"
                    >
                      <label className="text-xs font-medium text-slate-700">Website URL</label>
                      <input
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        placeholder="https://company.com"
                        className={`w-full rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                          errors.websiteUrl
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-slate-200 focus:ring-primary/30'
                        }`}
                      />
                      {errors.websiteUrl && <p className="text-xs text-red-500 mt-1">{errors.websiteUrl}</p>}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="account"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 pb-4 sm:pb-5"
              >
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">Email Verification & Password</p>
                  <p className="text-xs sm:text-sm text-slate-500">Verify your email and set a secure password.</p>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  <label className="text-xs sm:text-sm font-medium text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1">
                      <input
                        name="businessEmail"
                        value={formData.businessEmail}
                        onChange={handleChange}
                        disabled={otpSent}
                        placeholder="name@company.com"
                        className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                          errors.businessEmail
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-slate-200 focus:ring-primary/30'
                        } ${otpSent ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSent || isSubmitting}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                    >
                      {otpSent ? 'OTP Sent' : isSubmitting ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                  {errors.businessEmail && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.businessEmail}</p>}
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="text-xs sm:text-sm font-medium text-slate-700">
                      OTP <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <input
                          name="otp"
                          value={formData.otp}
                          maxLength={6}
                          onChange={handleChange}
                          disabled={otpVerified}
                          placeholder="6-digit code"
                          className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm text-center tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                            errors.otp
                              ? 'border-red-500 focus:ring-red-200'
                              : otpVerified
                              ? 'border-green-500 bg-green-50 focus:ring-green-200'
                              : 'border-slate-200 focus:ring-primary/30'
                          } ${otpVerified ? 'cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpVerified || !formData.otp}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                      >
                        {otpVerified ? 'Verified ✓' : 'Verify OTP'}
                      </button>
                    </div>
                    {errors.otp && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.otp}</p>}
                    {otpVerified && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Email verified successfully
                      </p>
                    )}
                  </motion.div>
                )}

                {otpVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 mb-4"
                  >
                    <div className="space-y-4 sm:space-y-5">
                      <div className="space-y-1.5 sm:space-y-2 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-slate-700">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm pr-10 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                              errors.password
                                ? 'border-red-500 focus:ring-red-200'
                                : 'border-slate-200 focus:ring-primary/30'
                            }`}
                            placeholder="Minimum 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        {errors.password && <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.password}</p>}
                      </div>

                      <div className="space-y-1.5 sm:space-y-2 min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-slate-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base shadow-sm pr-10 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-offset-0 transition ${
                              errors.confirmPassword
                                ? 'border-red-500 focus:ring-red-200'
                                : 'border-slate-200 focus:ring-primary/30'
                            }`}
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? (
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
                        {errors.confirmPassword && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2 w-full">
                      <div className={`flex items-center gap-2 transition-colors min-w-0 ${
                        passwordRules.minLength ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span
                          className={`h-5 w-5 flex-shrink-0 inline-flex items-center justify-center rounded-full text-[11px] transition-colors ${
                            passwordRules.minLength ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {passwordRules.minLength ? '✓' : '✗'}
                        </span>
                        <span className="truncate">Minimum 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-colors min-w-0 ${
                        passwordRules.hasUpperCase ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span
                          className={`h-5 w-5 flex-shrink-0 inline-flex items-center justify-center rounded-full text-[11px] transition-colors ${
                            passwordRules.hasUpperCase ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {passwordRules.hasUpperCase ? '✓' : '✗'}
                        </span>
                        <span className="truncate">At least one uppercase</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-colors min-w-0 ${
                        passwordRules.hasLowerCase ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span
                          className={`h-5 w-5 flex-shrink-0 inline-flex items-center justify-center rounded-full text-[11px] transition-colors ${
                            passwordRules.hasLowerCase ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {passwordRules.hasLowerCase ? '✓' : '✗'}
                        </span>
                        <span className="truncate">At least one lowercase</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-colors min-w-0 ${
                        passwordRules.hasNumber ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span
                          className={`h-5 w-5 flex-shrink-0 inline-flex items-center justify-center rounded-full text-[11px] transition-colors ${
                            passwordRules.hasNumber ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {passwordRules.hasNumber ? '✓' : '✗'}
                        </span>
                        <span className="truncate">At least one number</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-colors min-w-0 ${
                        passwordRules.hasSpecialChar ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span
                          className={`h-5 w-5 flex-shrink-0 inline-flex items-center justify-center rounded-full text-[11px] transition-colors ${
                            passwordRules.hasSpecialChar
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {passwordRules.hasSpecialChar ? '✓' : '✗'}
                        </span>
                        <span className="truncate">At least one special char</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-200 bg-white flex-shrink-0 px-3 sm:px-4">
          {currentStep === 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestCallback}
                disabled={!step1Ready || callbackStatus === 'pending'}
                className="rounded-lg border border-primary/70 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary transition hover:-translate-y-[1px] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {callbackStatus === 'pending' ? 'Requesting...' : 'Request Callback'}
              </button>
              {callbackStatus === 'sent' && (
                <span className="text-xs sm:text-sm font-semibold text-green-600">Sent to admin</span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="rounded-lg border border-slate-300 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(currentStep === 1 && !step1Ready) || (currentStep === 2 && !step2Ready)}
              className="rounded-lg bg-primary px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!step3Ready || isSubmitting}
              className="rounded-lg bg-primary px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          )}
        </div>

        <div className="text-center pt-3 sm:pt-4 pb-2 sm:pb-3 text-xs sm:text-sm text-slate-600 bg-white flex-shrink-0 px-3 sm:px-4">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary hover:underline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
    </>
  )
}

export default ProgressiveCreateAccount

