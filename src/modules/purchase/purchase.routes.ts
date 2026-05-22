import { Router } from 'express'
import * as purchaseController from './purchase.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { CreatePurchaseDto } from './purchase.dto'

const router = Router()

// Webhook не требует JWT, только подпись Stripe
router.post('/webhook', purchaseController.stripeWebhook)

router.use(authMiddleware)
router.post('/', validate(CreatePurchaseDto), purchaseController.createPurchase)
router.get('/history', purchaseController.getPurchaseHistory)

export default router
