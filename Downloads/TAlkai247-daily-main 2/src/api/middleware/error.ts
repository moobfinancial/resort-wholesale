import { Response, NextFunction, Request } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
            details: error,
          },
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: error,
          },
        });
      default:
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
            details: error,
          },
        });
    }
  }
  next(error);
}