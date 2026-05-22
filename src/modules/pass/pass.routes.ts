import { Router } from 'express'
import * as passController from './pass.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.get('/', passController.getPass)
router.get('/check', passController.checkCanPurchase)

export default router
