import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as purchaseService from './purchase.service'

export const createPurchase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await purchaseService.createPurchase(req.userId!, req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    await purchaseService.handleStripeWebhook(req.body as Buffer, signature)
    res.json({ received: true })
  } catch (err) {
    next(err)
  }
}

export const getPurchaseHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cardId } = req.query
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const result = await purchaseService.getPurchaseHistory(
      req.userId!,
      page,
      limit,
      cardId as string | undefined,
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}
