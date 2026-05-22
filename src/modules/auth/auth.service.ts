import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../config/database'
import { AppError } from '../../middleware/error.middleware'
import { RegisterDtoType, LoginDtoType } from './auth.dto'

const SALT_ROUNDS = 10

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  })
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES ?? '30d',
  })
  return { accessToken, refreshToken }
}

export const register = async (dto: RegisterDtoType) => {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } })
  if (existing) throw new AppError(409, 'Email already registered')

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { email: dto.email, password: hashedPassword, name: dto.name },
    select: { id: true, email: true, name: true },
  })

  const { accessToken, refreshToken } = generateTokens(user.id)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  })

  return { user, accessToken, refreshToken }
}

export const login = async (dto: LoginDtoType) => {
  const user = await prisma.user.findUnique({ where: { email: dto.email } })
  if (!user) throw new AppError(401, 'Invalid credentials')

  const isValid = await bcrypt.compare(dto.password, user.password)
  if (!isValid) throw new AppError(401, 'Invalid credentials')

  const { accessToken, refreshToken } = generateTokens(user.id)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  })

  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
  }
}

export const refresh = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId)

    await prisma.refreshToken.delete({ where: { token } })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.refreshToken.create({
      data: { userId: payload.userId, token: newRefreshToken, expiresAt },
    })

    return { accessToken, refreshToken: newRefreshToken }
  } catch {
    throw new AppError(401, 'Invalid refresh token')
  }
}

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } })
}
