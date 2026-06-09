import { Router } from 'express'
import * as authController from './auth.controller'
import { validate } from '../../middleware/validate.middleware'
import { RegisterDto, LoginDto, RefreshDto } from './auth.dto'
import rateLimit from 'express-rate-limit'

const router = Router()

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,                  
  message: { error: 'Too many attempts, try again later' }
})

router.post('/register', limiter, validate(RegisterDto), authController.register)
router.post('/login',limiter, validate(LoginDto), authController.login)
router.post('/refresh', validate(RefreshDto), authController.refresh)
router.post('/logout', validate(RefreshDto), authController.logout)

export default router
