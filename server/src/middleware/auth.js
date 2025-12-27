import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.user = { id: payload.sub }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

