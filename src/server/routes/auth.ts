import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get JWT_SECRET from environment variable or use default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Get the admin from the database
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set token in cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return admin info
    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.admin_token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string, role: string };
    
    // Get admin from database
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    
    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
