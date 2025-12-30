import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import User from '../models/User.js'
import { verifyBusiness } from '../services/kyc.js'
import { sendOtp, verifyOtp } from '../services/otp.js'

const router = Router()

/**
 * PUBLIC – Used only during signup
 * Should be rate-limited at middleware / gateway level
 */
router.post('/business/verify', async (req, res) => {
  try {
    const { type, id } = req.body

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' })
    }

    if (!['GST', 'PAN'].includes(type)) {
      return res.status(400).json({ error: 'Type must be GST or PAN' })
    }

    if (
      type === 'GST' &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(id)
    ) {
      return res.status(400).json({ error: 'Invalid GST format' })
    }

    if (
      type === 'PAN' &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(id)
    ) {
      return res.status(400).json({ error: 'Invalid PAN format' })
    }

    const result = await verifyBusiness(type, id)

    if (!result.verified) {
      return res.status(422).json({
        error: 'Verification failed',
        reason: result.reason || 'Unable to verify details'
      })
    }

    res.json(result)
  } catch (err) {
    console.error('Business verification error:', err.message)

    const status =
      err.message.includes('not found') ? 404 :
      err.message.includes('authentication') ? 401 :
      502

    res.status(status).json({
      error: err.message
    })
  }
})

/**
 * AUTHENTICATED – Save verified business info
 */
router.post('/gst-pan', authRequired, async (req, res) => {
  try {
    const { type, id } = req.body

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required' })
    }

    const result = await verifyBusiness(type, id)

    if (!result.verified) {
      return res.status(422).json({
        error: 'Business verification failed'
      })
    }

    await User.findByIdAndUpdate(req.user.id, {
      business: {
        verified: true,
        verificationType: type,
        verificationId: id,
        companyName: result.companyName,
        businessType: result.businessType,
        address: result.address,
        verifiedAt: new Date()
      }
    })

    res.json(result)
  } catch (err) {
    console.error('GST/PAN save error:', err.message)
    res.status(500).json({ error: 'Unable to save business details' })
  }
})

/**
 * OTP – Send
 */
router.post('/otp/send', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  await sendOtp(email)
  res.json({ sent: true })
})

/**
 * OTP – Verify
 */
router.post('/otp/verify', async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' })
  }

  const verified = await verifyOtp(email, code)

  if (!verified) {
    return res.status(401).json({ verified: false })
  }

  res.json({ verified: true })
})

export default router


