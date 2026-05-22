import { PassType, TransportType } from '@prisma/client'
import prisma from '../../config/database'
import { AppError } from '../../middleware/error.middleware'

export const getPass = async (userId: string, cardId: string) => {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
    include: { pass: true },
  })
  if (!card) throw new AppError(404, 'Card not found')

  // если абонемент истёк — убираем его автоматически
  if (card.pass?.type === PassType.SUBSCRIPTION && card.pass.expiresAt! < new Date()) {
    await prisma.pass.delete({ where: { cardId } })
    return { status: 'EMPTY', pass: null }
  }

  if (!card.pass) return { status: 'EMPTY', pass: null }

  return { status: 'ACTIVE', pass: card.pass }
}

export const checkCanPurchase = async (
  userId: string,
  cardId: string,
  passType: PassType,
  transport: TransportType,
): Promise<{ canBuy: boolean; reason?: string }> => {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
    include: { pass: true },
  })
  if (!card) throw new AppError(404, 'Card not found')

  const pass = card.pass

  if (!pass) return { canBuy: true }

  // абонемент истёк — можно покупать
  if (pass.type === PassType.SUBSCRIPTION && pass.expiresAt! < new Date()) {
    await prisma.pass.delete({ where: { cardId } })
    return { canBuy: true }
  }

  // есть активный абонемент → нельзя купить поездки
  if (pass.type === PassType.SUBSCRIPTION && passType === PassType.TRIPS) {
    return {
      canBuy: false,
      reason: `You have an active subscription (${pass.transport}) until ${pass.expiresAt?.toLocaleDateString('ru-BY')}`,
    }
  }

  // есть поездки → нельзя купить абонемент
  if (pass.type === PassType.TRIPS && passType === PassType.SUBSCRIPTION) {
    return {
      canBuy: false,
      reason: `You have ${pass.tripsLeft} trips remaining on your card. Use them before buying a subscription`,
    }
  }

  return { canBuy: true }
}
