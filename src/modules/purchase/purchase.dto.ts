import { z } from 'zod'
import { PassType, TransportType } from '@prisma/client'

export const CreatePurchaseDto = z.discriminatedUnion('passType', [
  z.object({
    cardId: z.string().uuid('Invalid card ID'),
    passType: z.literal(PassType.TRIPS),
    transport: z.nativeEnum(TransportType),
    tripsAmount: z.number().int().min(1).max(100),
  }),
  z.object({
    cardId: z.string().uuid('Invalid card ID'),
    passType: z.literal(PassType.SUBSCRIPTION),
    transport: z.nativeEnum(TransportType),
    durationDays: z.number().int().min(30).max(365),
  }),
])

export type CreatePurchaseDtoType = z.infer<typeof CreatePurchaseDto>
