import { TransportType, PassType } from '@prisma/client'
import prisma from '../../config/database'
import { AppError } from '../../middleware/error.middleware'

export const validateRide = async (cardNumber: string, transport: TransportType) => {
  const card = await prisma.card.findUnique({
    where: { cardNumber },
    include: { pass: true },
  })

  if (!card) throw new AppError(404, 'Card not found')

  const pass = card.pass

  // Нет проездного
  if (!pass) throw new AppError(403, 'No active pass on this card')

  // Абонемент истёк
  if (pass.type === PassType.SUBSCRIPTION && pass.expiresAt! < new Date()) {
    await prisma.pass.delete({ where: { cardId: card.id } })
    throw new AppError(403, 'Subscription has expired')
  }

  // Поездки: проверяем тип транспорта
  if (pass.type === PassType.TRIPS) {
    const allowed =
      pass.transport === TransportType.ALL || pass.transport === transport

    if (!allowed) {
      throw new AppError(403, `This pass is valid for ${pass.transport} only`)
    }

    if (pass.tripsLeft === 0) {
      throw new AppError(403, 'No trips remaining')
    }

    // Списываем поездку
    await prisma.$transaction([
      prisma.pass.update({
        where: { cardId: card.id },
        data: { tripsLeft: { decrement: 1 } },
      }),
      prisma.ride.create({
        data: { cardId: card.id, transport },
      }),
    ])

    return {
      allowed: true,
      message: 'Access granted',
      tripsLeft: pass.tripsLeft! - 1,
    }
  }

  // Абонемент: проверяем тип транспорта
  if (pass.type === PassType.SUBSCRIPTION) {
    const allowed =
      pass.transport === TransportType.ALL || pass.transport === transport

    if (!allowed) {
      throw new AppError(403, `This subscription is valid for ${pass.transport} only`)
    }

    await prisma.ride.create({
      data: { cardId: card.id, transport },
    })

    return {
      allowed: true,
      message: 'Access granted',
      subscriptionExpiresAt: pass.expiresAt,
    }
  }

  throw new AppError(403, 'Invalid pass')
}
