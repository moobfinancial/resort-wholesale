import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define user interface for request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// Middleware to require authentication
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      email: string;
      role?: string;
    };

    // Set user in request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};

// Middleware to optionally authenticate
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue as guest
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      // No token, continue as guest
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      email: string;
      role?: string;
    };

    // Set user in request
    req.user = decoded;

    next();
  } catch (error) {
    // Invalid token, continue as guest
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Middleware to require admin role
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First require authentication, then check admin role
  // res is used when passed to requireAuth
  requireAuth(req, res, () => {
    // Check if user has admin role
    if (!req.user || !req.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      });
    }

    next();
  });
};
