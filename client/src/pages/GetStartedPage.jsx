import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Toast from '../components/Toast'

const GetStartedPage = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Step 1: Personal Details
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [designation, setDesignation] = useState('')

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [hasWebsite, setHasWebsite] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Step 3: GST/PAN Verification
  const [verificationType, setVerificationType] = useState('')
  const [gstPanNumber, setGstPanNumber] = useState('')
  const [isValidated, setIsValidated] = useState(false)

  // Step 4: Email Verification
  const [businessEmail, setBusinessEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !designation) {
        showToast('Please fill all fields', 'error')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!businessName || !businessPhone || !businessType) {
        showToast('Please fill all required fields', 'error')
        return
      }
      if (hasWebsite && !websiteUrl) {
        showToast('Please enter website URL', 'error')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!verificationType || !gstPanNumber) {
        showToast('Please fill all fields', 'error')
        return
      }
      if (!isValidated) {
        showToast('Please validate your GST/PAN number first', 'error')
        return
      }
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleValidateGSTPAN = async () => {
    if (!gstPanNumber) {
      showToast('Please enter GST/PAN number', 'error')
      return
    }

    setLoading(true)
    
    // Simulate API call to FynamicsGST
    setTimeout(() => {
      setLoading(false)
      // Demo validation - in production, call actual API
      if (gstPanNumber.length >= 10) {
        setIsValidated(true)
        showToast(`${verificationType} validated successfully!`, 'success')
      } else {
        setIsValidated(false)
        showToast('Invalid ' + verificationType + ' number', 'error')
      }
    }, 1500)
  }

  const handleSendOTP = async () => {
    if (!businessEmail) {
      showToast('Please enter business email', 'error')
      return
    }

    setLoading(true)
    
    // Simulate OTP generation
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
      setOtpTimer(60)
      showToast('OTP sent successfully!', 'success')
      
      // Start timer
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1000)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error')
      return
    }

    setLoading(true)
    
    // Simulate OTP verification
    setTimeout(() => {
      setLoading(false)
      if (otp === '123456') { // Demo OTP
        showToast('Account created successfully!', 'success')
        // In production, redirect to dashboard
      } else {
        showToast('Invalid OTP. Please try again.', 'error')
      }
    }, 1000)
  }

  const handleResendOTP = () => {
    if (otpTimer > 0) return
    handleSendOTP()
  }

  const steps = [
    { number: 1, title: 'Personal Details' },
    { number: 2, title: 'Business Details' },
    { number: 3, title: 'GST/PAN Verification' },
    { number: 4, title: 'Email Verification' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s.number
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > s.number ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  <span className="mt-2 text-xs text-gray-600 hidden sm:block">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      step > s.number ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Details</h2>
                <p className="text-sm text-gray-600 mb-8">Tell us about yourself</p>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      id="designation"
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g., HR Manager, Recruiter"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      disabled={!firstName || !lastName || !designation}
                      className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Details</h2>
                <p className="text-sm text-gray-600 mb-8">Tell us about your business</p>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name / Company Name *
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter business name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone Number *
                    </label>
                    <input
                      id="businessPhone"
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Business *
                    </label>
                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select business type</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="LLP">LLP</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasWebsite}
                        onChange={(e) => {
                          setHasWebsite(e.target.checked)
                          if (!e.target.checked) setWebsiteUrl('')
                        }}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Do you have a Business Website?
                      </span>
                    </label>
                  </div>

                  {hasWebsite && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Website URL *
                      </label>
                      <input
                        id="websiteUrl"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="https://example.com"
                      />
                    </motion.div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!businessName || !businessPhone || !businessType || (hasWebsite && !websiteUrl)}
                      className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">GST / PAN Verification</h2>
                <p className="text-sm text-gray-600 mb-8">Verify your business credentials</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Do you have GST or Business PAN? *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="verificationType"
                          value="GST Number"
                          checked={verificationType === 'GST Number'}
                          onChange={(e) => {
                            setVerificationType(e.target.value)
                            setGstPanNumber('')
                            setIsValidated(false)
                          }}
                          className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">GST Number</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="verificationType"
                          value="PAN Number"
                          checked={verificationType === 'PAN Number'}
                          onChange={(e) => {
                            setVerificationType(e.target.value)
                            setGstPanNumber('')
                            setIsValidated(false)
                          }}
                          className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">PAN Number</span>
                      </label>
                    </div>
                  </div>

                  {verificationType && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label htmlFor="gstPanNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        {verificationType} *
                      </label>
                      <div className="flex space-x-3">
                        <input
                          id="gstPanNumber"
                          type="text"
                          value={gstPanNumber}
                          onChange={(e) => {
                            setGstPanNumber(e.target.value.toUpperCase())
                            setIsValidated(false)
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder={`Enter ${verificationType}`}
                          disabled={isValidated}
                        />
                        <button
                          onClick={handleValidateGSTPAN}
                          disabled={loading || !gstPanNumber || isValidated}
                          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {loading ? 'Validating...' : isValidated ? '✓ Validated' : 'Validate'}
                        </button>
                      </div>
                      {isValidated && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 text-sm text-green-600 flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verified successfully</span>
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!verificationType || !gstPanNumber || !isValidated}
                      className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Email Verification</h2>
                <p className="text-sm text-gray-600 mb-8">Verify your business email address</p>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email *
                    </label>
                    <div className="flex space-x-3">
                      <input
                        id="businessEmail"
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter business email"
                        disabled={otpSent}
                      />
                      <button
                        onClick={handleSendOTP}
                        disabled={loading || !businessEmail || otpSent}
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {loading ? 'Sending...' : otpSent ? 'OTP Sent' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                          Enter OTP *
                        </label>
                        <input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-2xl tracking-widest"
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
                    </motion.div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={loading || !otpSent || otp.length !== 6}
                      className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Complete Registration'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default GetStartedPage

