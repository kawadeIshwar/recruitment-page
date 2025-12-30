import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    firstName: String,
    lastName: String,
    phone: String,
    designation: String,
    otpCode: String,
    otpExpiresAt: Date,
    refreshToken: String,
    refreshTokenExpires: Date,
    business: {
      verified: { type: Boolean, default: false },
      verificationType: { type: String, enum: ['GST', 'PAN'], default: 'GST' },
      verificationId: String,
      companyName: String,
      businessType: String,
      businessAddress: String,
      registeredAddress: String,
      website: String
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)

