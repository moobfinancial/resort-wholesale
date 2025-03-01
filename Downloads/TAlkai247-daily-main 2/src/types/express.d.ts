import { Request } from 'express';
import { AuthUser } from '@/lib/auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser; // Add user property to Request interface
    }
  }
}
