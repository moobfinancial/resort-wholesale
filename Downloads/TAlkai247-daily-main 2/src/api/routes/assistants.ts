import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { validateAssistant } from '../../lib/validation';
import type { Assistant, AssistantTool } from '../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../types/schema';
import type { AssistantWhereInput } from '../../types/schema';

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

// Get paginated assistants
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, userId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: AssistantWhereInput = {
      ...(userId && { userId: String(userId) }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' as 'default' | 'insensitive' } },
          { systemPrompt: { contains: String(search), mode: 'insensitive' as 'default' | 'insensitive' } },
        ],
      }),
    };

    const [assistants, total] = await Promise.all([
      prisma.assistant.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assistant.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Assistant>> = {
      success: true,
      data: {
        items: assistants.map(assistant => ({
          ...assistant,
          modes: assistant.modes as ('web' | 'voice')[],
          tools: (assistant.tools as any) || [] as AssistantTool[],
          voice: (assistant.voice as any) || {
            provider: '',
            voiceId: '',
            settings: {
              speed: 1,
              pitch: 1,
              stability: 0.75
            }
          }
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
        message: 'Failed to fetch assistants',
        details: error,
      },
    });
  }
});

// Get assistant by ID
router.get('/:id', async (req, res) => {
  try {
    const assistant = await prisma.assistant.findUnique({
      where: { id: req.params.id },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found',
        },
      });
    }

    res.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch assistant',
        details: error,
      },
    });
  }
});

// Create new assistant
router.post('/', async (req, res) => {
  try {
    const validation = validateAssistant(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid assistant data',
          details: validation.errors,
        },
      });
    }

    const assistant = await prisma.assistant.create({
      data: {
        ...req.body,
        modes: req.body.modes as ('web' | 'voice')[],
      },
    });

    res.status(201).json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create assistant',
        details: error,
      },
    });
  }
});

// Update assistant
router.put('/:id', async (req, res) => {
  try {
    const validation = validateAssistant(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid assistant data',
          details: validation.errors,
        },
      });
    }

    const assistant = await prisma.assistant.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        modes: req.body.modes as ('web' | 'voice')[],
      },
    });

    res.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update assistant',
        details: error,
      },
    });
  }
});

// Delete assistant
router.delete('/:id', async (req, res) => {
  try {
    await prisma.assistant.delete({
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
        message: 'Failed to delete assistant',
        details: error,
      },
    });
  }
});

export default router;