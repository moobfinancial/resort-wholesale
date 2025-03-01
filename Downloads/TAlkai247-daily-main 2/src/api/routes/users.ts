import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validateUser } from '../../lib/validation';
import type { User } from '../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../types/schema';
import { Prisma, UserRole } from '@prisma/client';
import { z } from 'zod';

// Define the ValidationResult type to match what's in validation/index.ts
type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
};

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

// Map Prisma enum values to schema string literals
const mapUserRole = (role: UserRole): 'admin' | 'user' => {
  const roleMap: Record<UserRole, 'admin' | 'user'> = {
    [UserRole.ADMIN]: 'admin',
    [UserRole.USER]: 'user'
  };
  return roleMap[role];
};

// Get paginated users
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.UserWhereInput = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: String(search), mode: 'insensitive' as Prisma.QueryMode } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<User>> = {
      success: true,
      data: {
        items: users.map(user => {
          // Create a properly typed user object
          const typedUser: User = {
            ...user,
            company: user.company || undefined,
            phoneNumber: user.phoneNumber || undefined,
            role: mapUserRole(user.role),
            settings: {
              defaultTransparencyLevel: user.settings && typeof user.settings === 'object' && 'defaultTransparencyLevel' in user.settings
                ? String(user.settings.defaultTransparencyLevel) === 'full' ? 'full' 
                : String(user.settings.defaultTransparencyLevel) === 'partial' ? 'partial' 
                : 'none'
                : 'none',
              defaultAssistant: user.settings && typeof user.settings === 'object' && 'defaultAssistant' in user.settings
                ? String(user.settings.defaultAssistant || '') || undefined
                : undefined,
              recordingEnabled: user.settings && typeof user.settings === 'object' && 'recordingEnabled' in user.settings
                ? Boolean(user.settings.recordingEnabled)
                : false,
              webSearchEnabled: user.settings && typeof user.settings === 'object' && 'webSearchEnabled' in user.settings
                ? Boolean(user.settings.webSearchEnabled)
                : false,
              preferredVoice: user.settings && typeof user.settings === 'object' && 'preferredVoice' in user.settings
                ? String(user.settings.preferredVoice) === 'female' ? 'female' : 'male'
                : 'male'
            }
          };
          
          return typedUser;
        }),
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users',
        details: error,
      },
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user',
        details: error,
      },
    });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    // Use type assertion to ensure TypeScript knows the shape of validation
    const validation = validateUser(req.body) as ValidationResult<any>;
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: validation.errors,
        },
      });
    }

    const user = await prisma.user.create({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
        details: error,
      },
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    // Use type assertion to ensure TypeScript knows the shape of validation
    const validation = validateUser(req.body) as ValidationResult<any>;
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: validation.errors,
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
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
        message: 'Failed to update user',
        details: error,
      },
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
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
        message: 'Failed to delete user',
        details: error,
      },
    });
  }
});

export default router;