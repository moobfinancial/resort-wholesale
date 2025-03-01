import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validateContact } from '../../lib/validation';
import type { Contact } from '../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../types/schema';
import { Prisma, ContactType, TransparencyLevel } from '@prisma/client';
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
const mapContactType = (type: ContactType): 'personal' | 'business' => {
  const typeMap: Record<ContactType, 'personal' | 'business'> = {
    [ContactType.PERSONAL]: 'personal',
    [ContactType.BUSINESS]: 'business'
  };
  return typeMap[type];
};

// Map Prisma enum values to schema string literals
const mapTransparencyLevel = (level: TransparencyLevel): 'full' | 'partial' | 'none' => {
  const levelMap: Record<TransparencyLevel, 'full' | 'partial' | 'none'> = {
    [TransparencyLevel.FULL]: 'full',
    [TransparencyLevel.PARTIAL]: 'partial',
    [TransparencyLevel.NONE]: 'none'
  };
  return levelMap[level];
};

// Get paginated contacts
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, type, campaignId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.ContactWhereInput = {
      ...(req.user?.id && { userId: req.user.id }),
      ...(type && { type: type as ContactType }),
      ...(campaignId && { campaignId: String(campaignId) }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search) } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: true,
          calls: {
            orderBy: { startTime: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Contact>> = {
      success: true,
      data: {
        items: contacts.map(contact => ({
          ...contact,
          type: mapContactType(contact.type),
          transparencyLevel: mapTransparencyLevel(contact.transparencyLevel),
          lastContactedAt: contact.lastContactedAt || undefined,
          subcategory: contact.subcategory || undefined,
          customSubcategory: contact.customSubcategory || undefined,
          notes: contact.notes || undefined,
          campaignId: contact.campaignId || undefined
        })),
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
        message: 'Failed to fetch contacts',
        details: error,
      },
    });
  }
});

// Get contact by ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: true,
        calls: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...contact,
        type: mapContactType(contact.type),
        transparencyLevel: mapTransparencyLevel(contact.transparencyLevel),
        lastContactedAt: contact.lastContactedAt || undefined
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contact',
        details: error,
      },
    });
  }
});

// Create new contact
router.post('/', async (req, res) => {
  try {
    // Use type assertion to ensure TypeScript knows the shape of validation
    const validation = validateContact(req.body) as ValidationResult<any>;
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact data',
          details: validation.errors,
        },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        ...req.body,
        userId: req.user?.id,
      },
      include: {
        campaign: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...contact,
        type: mapContactType(contact.type),
        transparencyLevel: mapTransparencyLevel(contact.transparencyLevel),
        lastContactedAt: contact.lastContactedAt || undefined
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create contact',
        details: error,
      },
    });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    // Use type assertion to ensure TypeScript knows the shape of validation
    const validation = validateContact(req.body) as ValidationResult<any>;
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact data',
          details: validation.errors,
        },
      });
    }

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        campaign: true,
      },
    });

    res.json({
      success: true,
      data: {
        ...contact,
        type: mapContactType(contact.type),
        transparencyLevel: mapTransparencyLevel(contact.transparencyLevel),
        lastContactedAt: contact.lastContactedAt || undefined
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update contact',
        details: error,
      },
    });
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contact.delete({
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
        message: 'Failed to delete contact',
        details: error,
      },
    });
  }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
  const { operation, contactIds, data } = req.body;

  try {
    switch (operation) {
      case 'delete':
        await prisma.contact.deleteMany({
          where: {
            id: { in: contactIds },
            userId: req.user?.id,
          },
        });
        break;

      case 'update':
        await prisma.contact.updateMany({
          where: {
            id: { in: contactIds },
            userId: req.user?.id,
          },
          data,
        });
        break;

      case 'assignCampaign':
        await prisma.contact.updateMany({
          where: {
            id: { in: contactIds },
            userId: req.user?.id,
          },
          data: {
            campaignId: data.campaignId,
          },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Invalid bulk operation',
          },
        });
    }

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform bulk operation',
        details: error,
      },
    });
  }
});

export default router;