import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return response in consistent format
    res.json({
      status: 'success',
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input',
        details: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({
    status: 'success',
    data: null
  });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      email: string;
      role: string;
    };

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    // Return response in consistent format
    res.json({
      status: 'success',
      data: {
        admin,
        token
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
