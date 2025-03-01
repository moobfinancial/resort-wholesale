import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { generateToken } from '../../lib/auth/jwt';
import { authenticate } from '../../lib/auth/middleware';
import { validateUser } from '../../lib/validation';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = generateToken(user as User);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          phoneNumber: user.phoneNumber,
          settings: user.settings,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
        details: error,
      },
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const validation = validateUser(req.body);
    if (typeof validation === 'boolean' ? !validation : !validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: typeof validation === 'boolean' ? null : validation.errors,
        },
      });
    }

    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: false,
          preferredVoice: 'male',
        },
      },
    });

    const token = generateToken(user as User);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Registration failed',
        details: error,
      },
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user data',
        details: error,
      },
    });
  }
});

// Update user settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        settings: req.body,
      },
      select: {
        settings: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user settings',
        details: error,
      },
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: req.body.name,
        company: req.body.company,
        phoneNumber: req.body.phoneNumber,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user profile',
        details: error,
      },
    });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !await bcrypt.compare(currentPassword, user.password)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
        details: error,
      },
    });
  }
});

// Logout (optional, since JWT is stateless)
router.post('/logout', authenticate, (_req, res) => {
  // Client should discard the token
  res.json({
    success: true,
    data: null,
  });
});

export default router;