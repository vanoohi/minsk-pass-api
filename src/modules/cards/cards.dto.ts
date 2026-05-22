import { z } from 'zod'

export const AddCardDto = z.object({
  cardNumber: z
    .string()
    .min(6, 'Card number must be at least 6 characters')
    .max(20, 'Card number too long')
    .regex(/^[0-9]+$/, 'Card number must contain only digits'),
  alias: z.string().max(50).optional(),
})

export const UpdateCardDto = z.object({
  alias: z.string().max(50, 'Alias too long'),
})

export type AddCardDtoType = z.infer<typeof AddCardDto>
export type UpdateCardDtoType = z.infer<typeof UpdateCardDto>
