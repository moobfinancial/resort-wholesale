import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.assistantTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { type: 'system' },
          { createdBy: req.user?.id } // Show system templates and user's own templates
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch templates',
        details: error.message,
      },
    });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.assistantTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Check if user has access to this template
    if (template.type !== 'system' && template.createdBy !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch template',
        details: error.message,
      },
    });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const template = await prisma.assistantTemplate.create({
      data: {
        ...req.body,
        createdBy: req.user?.id,
        type: 'user', // User-created templates are always type 'user'
      },
    });
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create template',
        details: error.message,
      },
    });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const template = await prisma.assistantTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Only allow updating user's own templates
    if (template.createdBy !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot update system templates or templates created by other users',
        },
      });
    }

    const updatedTemplate = await prisma.assistantTemplate.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update template',
        details: error.message,
      },
    });
  }
});

// Delete template (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const template = await prisma.assistantTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
    }

    // Only allow deleting user's own templates
    if (template.createdBy !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete system templates or templates created by other users',
        },
      });
    }

    // Soft delete by setting isActive to false
    const deletedTemplate = await prisma.assistantTemplate.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, data: deletedTemplate });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete template',
        details: error.message,
      },
    });
  }
});

export default router;
