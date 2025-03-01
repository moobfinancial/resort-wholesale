import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schema for assistant
const assistantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  firstMessage: z.string(),
  systemPrompt: z.string(),
  provider: z.string(),
  model: z.string(),
  tools: z.array(z.any()).optional().default([]),
  voice: z.object({
    provider: z.string(),
    voiceId: z.string(),
    settings: z.object({
      speed: z.number().min(0.5).max(2.0),
      pitch: z.number().min(0.5).max(2.0),
      stability: z.number().min(0).max(1),
      volume: z.number().min(0).max(100)
    })
  }).optional()
});

// Get all assistants
router.get('/', authenticate, async (req, res) => {
  try {
    const assistants = await prisma.assistant.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: assistants
    });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch assistants'
      }
    });
  }
});

// Get single assistant
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }

    res.json({
      success: true,
      data: assistant
    });
  } catch (error) {
    console.error('Error fetching assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch assistant'
      }
    });
  }
});

// Create assistant
router.post('/', authenticate, async (req, res) => {
  try {
    const validation = assistantSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.format()
        }
      });
    }

    const assistant = await prisma.assistant.create({
      data: {
        ...validation.data,
        userId: req.user.id,
        tools: validation.data.tools || [],
        modes: ['voice', 'chat']
      }
    });

    res.status(201).json({
      success: true,
      data: assistant
    });
  } catch (error) {
    console.error('Error creating assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create assistant'
      }
    });
  }
});

// Update assistant
router.put('/:id', authenticate, async (req, res) => {
  try {
    // First check if the assistant exists and belongs to the user
    const existingAssistant = await prisma.assistant.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingAssistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }

    const validation = assistantSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.format()
        }
      });
    }

    const updatedAssistant = await prisma.assistant.update({
      where: { id: req.params.id },
      data: {
        ...validation.data,
        tools: validation.data.tools || existingAssistant.tools,
        modes: ['voice', 'chat']
      }
    });

    res.json({
      success: true,
      data: updatedAssistant
    });
  } catch (error) {
    console.error('Error updating assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update assistant'
      }
    });
  }
});

// Delete assistant
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // First check if the assistant exists and belongs to the user
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }

    await prisma.assistant.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Assistant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete assistant'
      }
    });
  }
});

export default router;