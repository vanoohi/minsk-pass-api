import { calculateAmount } from './purchase.utils'
import { PassType, TransportType } from '@prisma/client'

describe('calculateAmount', () => {
  describe('TRIPS', () => {
    it('should calculate metro trips correctly', () => {
      const result = calculateAmount({
        cardId: 'any',
        passType: PassType.TRIPS,
        transport: TransportType.METRO,
        tripsAmount: 10,
      })
      expect(result).toBe(900) // 10 * 90 копеек
    })

    it('should calculate ground trips correctly', () => {
      const result = calculateAmount({
        cardId: 'any',
        passType: PassType.TRIPS,
        transport: TransportType.GROUND,
        tripsAmount: 5,
      })
      expect(result).toBe(400) // 5 * 80 копеек
    })

    it('should return 0 for 0 trips', () => {
      const result = calculateAmount({
        cardId: 'any',
        passType: PassType.TRIPS,
        transport: TransportType.METRO,
        tripsAmount: 0,
      })
      expect(result).toBe(0)
    })
  })

  describe('SUBSCRIPTION', () => {
    it('should calculate 30-day metro subscription correctly', () => {
      const result = calculateAmount({
        cardId: 'any',
        passType: PassType.SUBSCRIPTION,
        transport: TransportType.METRO,
        durationDays: 30,
      })
      expect(result).toBe(3500) // 3500 * 30 / 30
    })

    it('should calculate 15-day subscription as half price', () => {
      const result = calculateAmount({
        cardId: 'any',
        passType: PassType.SUBSCRIPTION,
        transport: TransportType.METRO,
        durationDays: 15,
      })
      expect(result).toBe(1750) // 3500 * 15 / 30
    })
  })
})
