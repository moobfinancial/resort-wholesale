import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validateCampaign } from '../../lib/validation';
import type { Campaign } from '../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../types/schema';
import { Prisma, CampaignStatus } from '@prisma/client';

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
const mapCampaignStatus = (status: CampaignStatus): 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled' => {
  const statusMap: Record<CampaignStatus, 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'> = {
    [CampaignStatus.DRAFT]: 'draft',
    [CampaignStatus.SCHEDULED]: 'scheduled',
    [CampaignStatus.ACTIVE]: 'active',
    [CampaignStatus.COMPLETED]: 'completed',
    [CampaignStatus.CANCELLED]: 'cancelled'
  };
  return statusMap[status];
};

// Get paginated campaigns
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.CampaignWhereInput = {
      userId: req.user?.id,
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: String(search), mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
      ...(status && { status: status as CampaignStatus }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: true,
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Campaign>> = {
      success: true,
      data: {
        items: campaigns.map(campaign => {
          // Create a properly typed campaign object
          const typedCampaign: Campaign = {
            id: campaign.id,
            userId: campaign.userId,
            name: campaign.name,
            description: campaign.description || undefined,
            startDate: campaign.startDate,
            endDate: campaign.endDate || undefined,
            status: mapCampaignStatus(campaign.status),
            contacts: campaign.contacts ? campaign.contacts.map(contact => contact.id) : [],
            goals: Array.isArray(campaign.goals) ? 
              campaign.goals.map((goal: any) => ({
                id: String(goal?.id || ''),
                title: String(goal?.title || ''),
                target: Number(goal?.target || 0),
                progress: Number(goal?.progress || 0),
                completed: Boolean(goal?.completed)
              })) : [],
            metrics: {
              totalCalls: Number((campaign.metrics as Record<string, any>)?.totalCalls || 0),
              successfulCalls: Number((campaign.metrics as Record<string, any>)?.successfulCalls || 0),
              failedCalls: Number((campaign.metrics as Record<string, any>)?.failedCalls || 0),
              averageDuration: Number((campaign.metrics as Record<string, any>)?.averageDuration || 0),
              averageSentiment: Number((campaign.metrics as Record<string, any>)?.averageSentiment || 0)
            },
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
          };
          
          return typedCampaign;
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
        message: 'Failed to fetch campaigns',
        details: error,
      },
    });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      include: {
        contacts: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaign',
        details: error,
      },
    });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const validation = validateCampaign(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid campaign data',
          details: validation.errors,
        },
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...req.body,
        userId: req.user?.id,
        status: 'DRAFT',
      },
      include: {
        contacts: true,
      },
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create campaign',
        details: error,
      },
    });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const validation = validateCampaign(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid campaign data',
          details: validation.errors,
        },
      });
    }

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: req.body,
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update campaign',
        details: error,
      },
    });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    await prisma.campaign.delete({
      where: {
        id: req.params.id,
        userId: req.user?.id,
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
        message: 'Failed to delete campaign',
        details: error,
      },
    });
  }
});

// Add contacts to campaign
router.post('/:id/contacts', async (req, res) => {
  try {
    const { contactIds } = req.body;

    // First, verify the campaign belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      include: {
        contacts: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: {
        contacts: {
          connect: contactIds.map((id: string) => ({ id })),
        },
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add contacts to campaign',
        details: error,
      },
    });
  }
});

// Remove contacts from campaign
router.delete('/:id/contacts', async (req, res) => {
  try {
    const { contactIds } = req.body;

    // First, verify the campaign belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      include: {
        contacts: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: {
        contacts: {
          disconnect: contactIds.map((id: string) => ({ id })),
        },
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove contacts from campaign',
        details: error,
      },
    });
  }
});

export default router;