import { z } from 'zod'

export const RegisterDto = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const LoginDto = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RegisterDtoType = z.infer<typeof RegisterDto>
export type LoginDtoType = z.infer<typeof LoginDto>
export type RefreshDtoType = z.infer<typeof RefreshDto>
