import { PassType, TransportType } from '@prisma/client'
import { CreatePurchaseDtoType } from './purchase.dto'

// Цены в копейках (для Stripe)
export const PRICES: Record<PassType, Record<TransportType, number>> = {
  [PassType.TRIPS]: {
    [TransportType.METRO]: 90,    // 0.90 BYN за поездку
    [TransportType.GROUND]: 80,
    [TransportType.ALL]: 95,
  },
  [PassType.SUBSCRIPTION]: {
    [TransportType.METRO]: 3500,  // 35.00 BYN/мес
    [TransportType.GROUND]: 3000,
    [TransportType.ALL]: 5500,
  },
}

export const calculateAmount = (dto: CreatePurchaseDtoType): number => {
  const pricePerUnit = PRICES[dto.passType][dto.transport]
  if (dto.passType === PassType.TRIPS) {
    return pricePerUnit * dto.tripsAmount
  }
  // абонемент: цена за 30 дней * количество дней
  return Math.round((pricePerUnit * dto.durationDays) / 30)
}
