import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { connectDb } from './config/db.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import verificationRouter from './routes/verification.js'
import errorHandler from './middleware/errorHandler.js'

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env'))
  ? path.resolve(process.cwd(), '.env')
  : path.resolve(process.cwd(), '.env.example')
dotenv.config({ path: envPath })

const app = express()

const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || ['*']

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
)
app.use(helmet())
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/verification', verificationRouter)

app.use(errorHandler)

const PORT = process.env.PORT || 4000

const start = async () => {
  await connectDb()
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  })
  app.listen(PORT, () => {
    console.log(`API running on :${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start server', err)
  process.exit(1)
})

