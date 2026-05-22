import prisma from '../../config/database'
import { AppError } from '../../middleware/error.middleware'
import { AddCardDtoType, UpdateCardDtoType } from './cards.dto'

export const getCards = async (userId: string) => {
  return prisma.card.findMany({
    where: { userId },
    include: { pass: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const getCardById = async (userId: string, cardId: string) => {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
    include: {
      pass: true,
      purchases: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!card) throw new AppError(404, 'Card not found')
  return card
}

export const addCard = async (userId: string, dto: AddCardDtoType) => {
  const existing = await prisma.card.findUnique({
    where: { cardNumber: dto.cardNumber },
  })
  if (existing) throw new AppError(409, 'This card is already registered in the system')

  return prisma.card.create({
    data: { userId, cardNumber: dto.cardNumber, alias: dto.alias },
    include: { pass: true },
  })
}

export const updateCard = async (userId: string, cardId: string, dto: UpdateCardDtoType) => {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } })
  if (!card) throw new AppError(404, 'Card not found')

  return prisma.card.update({
    where: { id: cardId },
    data: { alias: dto.alias },
    include: { pass: true },
  })
}

export const deleteCard = async (userId: string, cardId: string) => {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } })
  if (!card) throw new AppError(404, 'Card not found')

  await prisma.card.delete({ where: { id: cardId } })
}
