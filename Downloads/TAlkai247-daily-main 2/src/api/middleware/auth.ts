import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required',
      },
    });
  }

  try {
    // Verify token and get user
    const user = await prisma.user.findUnique({
      where: { id: 'user_id_from_token' }, // Replace with actual token verification
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
        },
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token',
        details: error,
      },
    });
  }
}