import 'dotenv/config'
import express from 'express'
import path from 'path'
import authRoutes from './modules/auth/auth.routes'
import cardsRoutes from './modules/cards/cards.routes'
import passRoutes from './modules/pass/pass.routes'
import purchaseRoutes from './modules/purchase/purchase.routes'
import validateRoutes from './modules/validate/validate.routes'
import { errorMiddleware } from './middleware/error.middleware'

const app = express()

// Stripe webhook needs raw body — MUST be before express.json()
app.use('/api/v1/purchase/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/cards', cardsRoutes)
app.use('/api/v1/cards/:cardId/pass', passRoutes)
app.use('/api/v1/purchase', purchaseRoutes)
app.use('/api/v1/validate', validateRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve React frontend in production
const publicDir = path.join(process.cwd(), 'public')
console.log(`Static files dir: ${publicDir}`)
import fs from 'fs'
try {
  console.log(`Public dir exists: ${fs.existsSync(publicDir)}, files: ${fs.existsSync(publicDir) ? fs.readdirSync(publicDir).slice(0, 5).join(', ') : 'none'}`)
} catch (e) { console.log('Error checking public dir:', e) }
app.use(express.static(publicDir))
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html')
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: 'Not found' })
  })
})

// Global error handler — always last
app.use(errorMiddleware)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`MinskPass API running on port ${PORT}`)
})

export default app
