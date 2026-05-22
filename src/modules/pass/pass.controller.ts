import { Response, NextFunction } from 'express'
import { PassType, TransportType } from '@prisma/client'
import { AuthRequest } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error.middleware'
import * as passService from './pass.service'

export const getPass = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await passService.getPass(req.userId!, req.params['cardId'] as string)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const checkCanPurchase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, transport } = req.query

    if (!type || !transport) {
      return next(new AppError(400, 'type and transport query params are required'))
    }

    if (!Object.values(PassType).includes(type as PassType)) {
      return next(new AppError(400, `type must be one of: ${Object.values(PassType).join(', ')}`))
    }

    if (!Object.values(TransportType).includes(transport as TransportType)) {
      return next(new AppError(400, `transport must be one of: ${Object.values(TransportType).join(', ')}`))
    }

    const result = await passService.checkCanPurchase(
      req.userId!,
      req.params['cardId'] as string,
      type as PassType,
      transport as TransportType,
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
}
