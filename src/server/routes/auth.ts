import express from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';

const router = express.Router();

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Use auth service for login
    const result = await authService.loginAdmin(email, password);
    
    if (result.status === 'error') {
      return res.status(401).json(result);
    }

    // Set token in cookie for web clients
    if (result.data?.token) {
      res.cookie('admin_token', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Return admin info and token in response body following standard format
    return res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid input data', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      data: null
    });
  }
});

// Development backdoor login - FOR DEVELOPMENT ONLY
router.post('/dev-login', async (_req, res) => {
  try {
    // Use auth service for dev login
    const result = authService.createDevLoginToken();
    
    if (result.status === 'error') {
      return res.status(process.env.NODE_ENV === 'production' ? 404 : 400).json(result);
    }

    // Set token in cookie for web clients
    if (result.data?.token) {
      res.cookie('admin_token', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    // Return admin info and token in response body following standard format
    return res.json(result);
  } catch (error) {
    console.error('Dev login error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      data: null
    });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('admin_token');
  res.json({ 
    status: 'success',
    data: { 
      message: 'Logged out successfully' 
    }
  });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.admin_token || 
                 (req.headers.authorization?.startsWith('Bearer ') && 
                  req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Not authenticated',
        data: null
      });
    }
    
    // Verify token with auth service
    const decoded = await authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid or expired token',
        data: null
      });
    }
    
    // For development backdoor tokens, skip database check
    if (process.env.NODE_ENV !== 'production' && decoded.email === 'admin@resortfresh.com') {
      return res.json({
        status: 'success',
        data: {
          admin: {
            id: decoded.id,
            email: decoded.email,
            name: 'Development Admin',
            role: decoded.role || 'ADMIN'
          }
        }
      });
    }
    
    try {
      // In production, validate admin exists in database
      if (process.env.NODE_ENV === 'production') {
        const isValidAdmin = await authService.validateAdmin(decoded.id);
        
        if (!isValidAdmin) {
          return res.status(401).json({ 
            status: 'error', 
            message: 'Invalid admin account',
            data: null
          });
        }
      }
      
      // Return admin info in response
      return res.json({
        status: 'success',
        data: {
          admin: {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'ADMIN'
          }
        }
      });
    } catch (dbError: unknown) {
      console.error('Database error in /me endpoint:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Database error occurred',
        details: process.env.NODE_ENV !== 'production' ? 
          (dbError instanceof Error ? dbError.message : 'Unknown error') : 
          'Unknown database error',
        data: null
      });
    }
  } catch (error: unknown) {
    console.error('Auth check error:', error);
    return res.status(401).json({ 
      status: 'error', 
      message: 'Authentication failed',
      details: process.env.NODE_ENV !== 'production' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        undefined,
      data: null
    });
  }
});

export default router;
