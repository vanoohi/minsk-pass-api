import { Router } from 'express'
import * as validateController from './validate.controller'

const router = Router()

// Этот эндпоинт вызывает турникет/валидатор — без JWT
router.post('/', validateController.validateRide)

export default router
