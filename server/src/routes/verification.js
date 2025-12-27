import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import User from '../models/User.js'
import { verifyBusiness } from '../services/kyc.js'
import { sendOtp, verifyOtp } from '../services/otp.js'

const router = Router()

// Public endpoint for business verification during signup (no auth required)
router.post('/business/verify', async (req, res, next) => {
  try {
    const { type, id } = req.body
    
    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' })
    }
    
    if (!['GST', 'PAN'].includes(type)) {
      return res.status(400).json({ error: 'Type must be GST or PAN' })
    }
    
    // Validate GST format (15 characters)
    if (type === 'GST' && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(id)) {
      return res.status(400).json({ error: 'Invalid GST format' })
    }
    
    // Validate PAN format (10 characters)
    if (type === 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(id)) {
      return res.status(400).json({ error: 'Invalid PAN format' })
    }
    
    const result = await verifyBusiness(type, id)
    res.json(result)
  } catch (err) {
    console.error('Business verification error:', err)
    res.status(500).json({ 
      error: 'Verification failed. Please check the number and try again.',
      details: err.message 
    })
  }
})

// Authenticated endpoint for updating user's business info
router.post('/gst-pan', authRequired, async (req, res, next) => {
  try {
    const { type, id } = req.body
    if (!type || !id) return res.status(400).json({ error: 'type and id are required' })
    const result = await verifyBusiness(type, id)

    await User.findByIdAndUpdate(req.user.id, {
      business: {
        verified: result.verified,
        verificationType: type,
        verificationId: id,
        companyName: result.companyName,
        businessType: result.businessType,
        address: result.address
      }
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/otp/send', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    
    const result = await sendOtp(email)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/otp/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' })
    const ok = await verifyOtp(email, code)
    res.json({ verified: ok })
  } catch (err) {
    next(err)
  }
})

export default router

