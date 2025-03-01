import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all assistants
router.get('/', async (req, res) => {
  try {
    const assistants = await prisma.assistant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: assistants });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch assistants',
        details: error.message,
      },
    });
  }
});

// Create assistant
router.post('/', async (req, res) => {
  try {
    console.log('Creating assistant:', req.body);
    
    // First, get a valid user from the database
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_USER_FOUND',
          message: 'No user found in the database. Please create a user first.'
        }
      });
    }

    // Extract only the fields that are in the Prisma schema
    const {
      name,
      modes,
      firstMessage,
      systemPrompt,
      provider,
      model,
      tools,
      voice,
      // Remove fields not in schema
      template,
      voiceProvider,
      voiceId,
      volume,
      ...rest
    } = req.body;
    
    // Validate required fields
    if (!name || !firstMessage || !systemPrompt || !provider || !model) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields',
          details: 'name, firstMessage, systemPrompt, provider, and model are required'
        }
      });
    }
    
    const assistant = await prisma.assistant.create({
      data: {
        userId: user.id,
        name,
        modes: modes || ['web'],
        firstMessage,
        systemPrompt,
        provider,
        model,
        tools: tools || [],
        voice: voice || {},
        isActive: true
      }
    });

    console.log('Assistant created successfully:', assistant);
    res.json({ success: true, data: assistant });
  } catch (error) {
    console.error('Error creating assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create assistant',
        details: error.message,
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

    res.json({ success: true, data: assistant });
  } catch (error) {
    console.error('Error fetching assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch assistant',
        details: error.message,
      },
    });
  }
});

// Update assistant
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating assistant:', req.params.id, req.body);
    
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

    // Extract only the fields that are in the Prisma schema
    const {
      name,
      modes,
      firstMessage,
      systemPrompt,
      provider,
      model,
      tools,
      voice,
      isActive,
      // Remove fields not in schema
      template,
      voiceProvider,
      voiceId,
      volume,
      ...rest
    } = req.body;
    
    // Validate required fields
    if (!name || !firstMessage || !systemPrompt || !provider || !model) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields',
          details: 'name, firstMessage, systemPrompt, provider, and model are required'
        }
      });
    }

    const updatedAssistant = await prisma.assistant.update({
      where: { id: req.params.id },
      data: {
        name,
        modes: modes || ['web'],
        firstMessage,
        systemPrompt,
        provider,
        model,
        tools: tools || [],
        voice: voice || {},
        isActive: isActive ?? true
      }
    });

    console.log('Assistant updated successfully:', updatedAssistant);
    res.json({ success: true, data: updatedAssistant });
  } catch (error) {
    console.error('Error updating assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update assistant',
        details: error.message,
      },
    });
  }
});

// Delete assistant
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting assistant:', req.params.id);
    const assistant = await prisma.assistant.findUnique({
      where: { id: req.params.id },
    });

    if (!assistant) {
      console.log('Assistant not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assistant not found',
        },
      });
    }

    await prisma.assistant.delete({
      where: { id: req.params.id },
    });

    console.log('Assistant deleted successfully:', req.params.id);
    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete assistant',
        details: error.message,
      },
    });
  }
});

export default router;
