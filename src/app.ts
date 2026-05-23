import 'dotenv/config'
import express from 'express'
import path from 'path'
import fs from 'fs'
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
const indexPath = path.join(publicDir, 'index.html')

console.log(`CWD: ${process.cwd()}`)
console.log(`Public dir: ${publicDir} — exists: ${fs.existsSync(publicDir)}`)
console.log(`Index.html exists: ${fs.existsSync(indexPath)}`)

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.use((req, res) => {
    res.sendFile(indexPath)
  })
}

// Global error handler — always last
app.use(errorMiddleware)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`MinskPass API running on port ${PORT}`)
})

export default app
