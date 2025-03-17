import express, { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// Debug endpoint to directly check for product variants in the database
router.get('/variants/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log(`[DEBUG] Directly querying variants for product ${productId}`);
    
    // Direct database query to check what's in the database
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`[DEBUG] Found ${variants.length} variants in the database:`, variants);
    
    // Return in standardized format as specified in MEMORIES
    return res.json({
      status: 'success',
      data: {
        items: variants,
        total: variants.length
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error querying variants:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to query variants',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
