import bcrypt from 'bcrypt'
import * as authService from './auth.service'
import { AppError } from '../../middleware/error.middleware'

// Мокаем Prisma — не ходим в реальную БД
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

// Импортируем мок после jest.mock
import prisma from '../../config/database'

// Устанавливаем JWT секреты для тестов
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
})

// Очищаем моки между тестами
beforeEach(() => {
  jest.clearAllMocks()
})

describe('authService.login', () => {
  it('should return tokens when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Настраиваем мок — findUnique возвращает юзера
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Ivan',
      password: hashedPassword,
    })
    ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

    const result = await authService.login({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')
    expect(result.user.email).toBe('test@test.com')
  })

  it('should throw 401 when user not found', async () => {
    // findUnique возвращает null — юзер не найден
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      authService.login({ email: 'nobody@test.com', password: '123' })
    ).rejects.toThrow(AppError)

    await expect(
      authService.login({ email: 'nobody@test.com', password: '123' })
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('should throw 401 when password is wrong', async () => {
    const hashedPassword = await bcrypt.hash('correctpassword', 10)

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Ivan',
      password: hashedPassword,
    })

    await expect(
      authService.login({ email: 'test@test.com', password: 'wrongpassword' })
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})
