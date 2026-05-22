import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as cardsService from './cards.service'

export const getCards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cards = await cardsService.getCards(req.userId!)
    res.json(cards)
  } catch (err) {
    next(err)
  }
}

export const getCardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const card = await cardsService.getCardById(req.userId!, req.params['id']!)
    res.json(card)
  } catch (err) {
    next(err)
  }
}

export const addCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const card = await cardsService.addCard(req.userId!, req.body)
    res.status(201).json(card)
  } catch (err) {
    next(err)
  }
}

export const updateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const card = await cardsService.updateCard(req.userId!, req.params['id']!, req.body)
    res.json(card)
  } catch (err) {
    next(err)
  }
}

export const deleteCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await cardsService.deleteCard(req.userId!, req.params['id']!)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
