import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;
    
    // Check for token in cookie first (for admin panel)
    const cookieToken = req.cookies.admin_token;
    if (cookieToken) {
      token = cookieToken;
    } 
    // Then check for Bearer token (for API clients)
    else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    // Check if admin
    if (payload.role === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true },
      });

      if (!admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }

      req.user = { ...admin, role: 'admin' };
    } 
    // Check if customer (when no role specified, it's a customer token)
    else if (!payload.role) {
      const customer = await prisma.Customer.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true },
      });

      if (!customer) {
        return res.status(401).json({ message: 'Customer not found' });
      }

      req.user = { ...customer, role: 'customer' };
    }
    // Check if regular user (other roles)
    else {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
