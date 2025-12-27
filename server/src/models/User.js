import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    otpCode: String,
    otpExpiresAt: Date,
    business: {
      verified: { type: Boolean, default: false },
      verificationType: { type: String, enum: ['GST', 'PAN'], default: 'GST' },
      verificationId: String,
      companyName: String,
      businessType: String,
      address: String
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)

