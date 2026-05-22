import { Request, Response, NextFunction } from 'express'
import { TransportType } from '@prisma/client'
import { AppError } from '../../middleware/error.middleware'
import * as validateService from './validate.service'

export const validateRide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cardNumber, transport } = req.body

    if (!cardNumber || !transport) {
      return next(new AppError(400, 'cardNumber and transport are required'))
    }

    if (!Object.values(TransportType).includes(transport as TransportType)) {
      return next(new AppError(400, `transport must be one of: ${Object.values(TransportType).join(', ')}`))
    }

    const result = await validateService.validateRide(cardNumber, transport as TransportType)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
