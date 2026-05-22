import { Router } from 'express'
import * as authController from './auth.controller'
import { validate } from '../../middleware/validate.middleware'
import { RegisterDto, LoginDto, RefreshDto } from './auth.dto'

const router = Router()

router.post('/register', validate(RegisterDto), authController.register)
router.post('/login', validate(LoginDto), authController.login)
router.post('/refresh', validate(RefreshDto), authController.refresh)
router.post('/logout', validate(RefreshDto), authController.logout)

export default router
