import { Router } from 'express'
import * as cardsController from './cards.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AddCardDto, UpdateCardDto } from './cards.dto'

const router = Router()

router.use(authMiddleware)

router.get('/', cardsController.getCards)
router.post('/', validate(AddCardDto), cardsController.addCard)
router.get('/:id', cardsController.getCardById)
router.patch('/:id', validate(UpdateCardDto), cardsController.updateCard)
router.delete('/:id', cardsController.deleteCard)

export default router
