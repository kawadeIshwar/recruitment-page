import mongoose from 'mongoose'

export const connectDb = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGO_URI is required')
  }
  await mongoose.connect(uri)
  console.log('Mongo connected')
}

