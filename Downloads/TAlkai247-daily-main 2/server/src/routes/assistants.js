import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all assistants
router.get('/', async (req, res) => {
  try {
    // Get the default user
    const defaultUser = await prisma.user.findFirst({
      where: { email: 'default@example.com' }
    });

    if (!defaultUser) {
      return res.json({
        success: true,
        data: []
      });
    }

    const assistants = await prisma.assistant.findMany({
      where: { userId: defaultUser.id },
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
router.get('/:id', async (req, res) => {
  try {
    const assistant = await prisma.assistant.findUnique({
      where: { id: req.params.id }
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
router.post('/', async (req, res) => {
  try {
    // First, ensure we have a default user
    let defaultUser = await prisma.user.findFirst({
      where: { email: 'default@example.com' }
    });

    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User',
          password: 'default',
          settings: {}
        }
      });
    }

    const assistant = await prisma.assistant.create({
      data: {
        name: req.body.name,
        firstMessage: req.body.firstMessage,
        systemPrompt: req.body.systemPrompt,
        provider: req.body.provider,
        model: req.body.model,
        tools: req.body.tools || [],
        voice: req.body.voice || null,
        modes: req.body.modes || [],
        userId: defaultUser.id
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
router.put('/:id', async (req, res) => {
  try {
    const assistant = await prisma.assistant.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        firstMessage: req.body.firstMessage,
        systemPrompt: req.body.systemPrompt,
        provider: req.body.provider,
        model: req.body.model,
        tools: req.body.tools || [],
        voice: req.body.voice || null,
        modes: req.body.modes || []
      }
    });

    res.json({
      success: true,
      data: assistant
    });
  } catch (error) {
    console.error('Error updating assistant:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }
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
router.delete('/:id', async (req, res) => {
  try {
    await prisma.assistant.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }
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
