import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = express.Router();

// TODO: Move to environment variables
const JWT_SECRET = 'your-secret-key';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Temporary admin user for testing
const ADMIN_USER = {
  id: '1',
  email: 'admin@example.com',
  password: 'admin123', // In production, this would be hashed
  role: 'admin',
};

router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // In production, you would:
    // 1. Get the user from the database
    // 2. Compare password hashes
    // 3. Check if user has admin role
    if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
      const token = jwt.sign(
        { 
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          role: ADMIN_USER.role,
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        token,
        user: {
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          role: ADMIN_USER.role,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export default router;
