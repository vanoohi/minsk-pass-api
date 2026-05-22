import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from './error.middleware'

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ')
      return next(new AppError(400, message))
    }

    req.body = result.data
    next()
  }
