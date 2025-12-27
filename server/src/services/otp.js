import nodemailer from 'nodemailer'
import crypto from 'crypto'

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

// In-memory store for demo; replace with DB-backed when wiring CloudExter
const otpStore = new Map()

// Create SMTP transporter for CloudExter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

export const sendOtp = async (email, purpose = 'verification') => {
  const code = generateOtp()
  const expiresAt = Date.now() + 5 * 60 * 1000
  otpStore.set(email, { code, expiresAt, purpose })

  // Send OTP via SMTP (CloudExter)
  const transporter = createTransporter()
  if (!transporter) {
    // No SMTP configured - OTP is still stored for testing
    console.warn('SMTP not configured. OTP stored but not sent via email.')
    return { sent: false, code: process.env.NODE_ENV === 'development' ? code : undefined }
  }

  try {
    const isPasswordReset = purpose === 'password-reset'
    const subject = isPasswordReset ? 'Password Reset OTP' : 'Your OTP Verification Code'
    const title = isPasswordReset ? 'Password Reset Code' : 'OTP Verification Code'
    const description = isPasswordReset 
      ? 'Use this code to reset your password:' 
      : 'Your verification code is:'

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${title}</h2>
          <p>${description}</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `${title}\n\n${description} ${code}\n\nThis code will expire in 5 minutes.`
    })
    
    console.log(`OTP sent successfully to ${email}`)
    return { sent: true }
  } catch (error) {
    console.error('Failed to send OTP email:', error.message)
    
    // Remove OTP from store if email failed to send
    otpStore.delete(email)
    
    // Return detailed error
    const err = new Error('Failed to send OTP email. Please verify your email address is valid.')
    err.status = 500
    if (error.responseCode === 550) {
      err.message = 'Invalid email address. Please check and try again.'
      err.status = 400
    }
    throw err
  }
}

export const verifyOtp = async (email, code) => {
  const entry = otpStore.get(email)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email)
    return false
  }
  const match = crypto.timingSafeEqual(Buffer.from(entry.code), Buffer.from(code))
  if (match) otpStore.delete(email)
  return match
}

