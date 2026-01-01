import { Router } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendOtp, verifyOtp } from '../services/otp.js'

const router = Router()

const hashPassword = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey.toString('hex'))
    })
  })

router.post('/signup', async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      designation,
      gstPanType,
      gstPanNumber,
      businessType,
      businessName,
      businessAddress,
      registeredAddress,
      website
    } = req.body
    
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = await hashPassword(password, salt)

    const user = await User.create({ 
      email, 
      passwordHash, 
      salt,
      firstName,
      lastName,
      phone,
      designation,
      emailVerified: true,
      business: {
        verified: true,
        verificationType: gstPanType,
        verificationId: gstPanNumber,
        companyName: businessName,
        businessType,
        businessAddress,
        registeredAddress,
        website
      }
    })
    
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' })
    
    res.status(201).json({ token })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const passwordHash = await hashPassword(password, user.salt)
    if (passwordHash !== user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })

    // Remember Me: 7 days, otherwise 1 day
    const expiresIn = rememberMe ? '7d' : (process.env.JWT_EXPIRES_IN || '1d')
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn })
    
    // Generate refresh token if remember me is enabled
    if (rememberMe) {
      const refreshToken = crypto.randomBytes(32).toString('hex')
      const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      user.refreshToken = refreshToken
      user.refreshTokenExpires = refreshExpires
      await user.save()
      res.json({ token, refreshToken, emailVerified: user.emailVerified })
    } else {
      res.json({ token, emailVerified: user.emailVerified })
    }
  } catch (err) {
    next(err)
  }
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists in database
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ 
        error: "You don't have an account with this email. Please sign up first." 
      })
    }

    // Send OTP for password reset
    try {
      await sendOtp(normalizedEmail, 'password-reset')
      res.json({ sent: true, message: 'OTP sent to your email successfully' })
    } catch (emailError) {
      console.error('Failed to send password reset OTP:', emailError)
      
      // Provide specific error message based on email error
      let errorMessage = 'Failed to send OTP. Please try again later.'
      if (emailError.message && emailError.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address. Please check and try again.'
      }
      
      res.status(500).json({ error: errorMessage })
    }
  } catch (err) {
    next(err)
  }
})

router.post('/verify-reset-otp', async (req, res, next) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'Email and OTP code are required' })

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const isValid = await verifyOtp(email.toLowerCase().trim(), code)
    if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' })

    res.json({ verified: true, message: 'OTP verified successfully' })
  } catch (err) {
    next(err)
  }
})

// Refresh token route
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' })

    const user = await User.findOne({
      refreshToken,
      refreshTokenExpires: { $gt: new Date() }
    })

    if (!user) return res.status(401).json({ error: 'Invalid or expired refresh token' })

    // Generate new access token
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1d' })
    
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Verify OTP first
    const isValid = await verifyOtp(email.toLowerCase().trim(), code)
    if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' })

    // Check if new password is same as old password
    const oldPasswordHash = await hashPassword(newPassword, user.salt)
    if (oldPasswordHash === user.passwordHash) {
      return res.status(400).json({ error: 'New password cannot be the same as your current password. Please choose a different password.' })
    }

    // Generate new salt and hash password
    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = await hashPassword(newPassword, salt)

    // Update user password
    user.passwordHash = passwordHash
    user.salt = salt
    await user.save()

    res.json({ success: true, message: 'Password reset successfully!' })
  } catch (err) {
    next(err)
  }
})

export default router

