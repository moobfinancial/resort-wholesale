import express from 'express';
import { DocumentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get pending documents for a customer
router.get('/customer/documents/pending', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.id;

    const pendingDocuments = await prisma.requiredDocument.findMany({
      where: {
        customerId,
        status: DocumentStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(pendingDocuments);
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    res.status(500).json({ 
      message: 'Error fetching pending documents',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
