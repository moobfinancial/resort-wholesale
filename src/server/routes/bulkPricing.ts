import express from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { bulkPricingService } from '../services/bulkPricingService';

const router = express.Router();

// Schema for bulk pricing tier
const BulkPricingTierSchema = z.object({
  id: z.string().optional(),
  minQuantity: z.number().int().min(1, "Minimum quantity must be at least 1"),
  price: z.number().min(0, "Price cannot be negative")
});

// Schema for updating pricing tiers
const UpdateBulkPricingSchema = z.object({
  tiers: z.array(BulkPricingTierSchema)
});

// GET /api/products/:productId/bulk-pricing
router.get('/:productId/bulk-pricing', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    const tiers = await bulkPricingService.getByProductId(productId);
    
    return res.json({ 
      status: 'success',
      data: { tiers } 
    });
  } catch (error) {
    console.error('Error fetching bulk pricing tiers:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error fetching bulk pricing tiers' 
    });
  }
});

// POST /api/products/:productId/bulk-pricing
router.post('/:productId/bulk-pricing', requireAuth, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Parse and validate input
    const { tiers } = UpdateBulkPricingSchema.parse(req.body);
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Update pricing tiers
    const success = await bulkPricingService.updateProductTiers(productId, tiers);
    
    if (!success) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to update bulk pricing tiers' 
      });
    }
    
    // Get updated tiers to return
    const updatedTiers = await bulkPricingService.getByProductId(productId);
    
    return res.json({ 
      status: 'success',
      data: {
        message: 'Bulk pricing tiers updated successfully',
        tiers: updatedTiers
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid input data', 
        details: error.errors 
      });
    }
    
    console.error('Error updating bulk pricing tiers:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error updating bulk pricing tiers' 
    });
  }
});

// POST /api/products/:productId/bulk-pricing/tier
router.post('/:productId/bulk-pricing/tier', requireAuth, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Parse and validate input
    const tierData = BulkPricingTierSchema.parse(req.body);
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Check if a tier with this minimum quantity already exists
    const existingTier = await prisma.bulkPricing.findFirst({
      where: {
        productId,
        minQuantity: tierData.minQuantity
      }
    });
    
    if (existingTier) {
      return res.status(400).json({ 
        status: 'error',
        message: 'A pricing tier with this minimum quantity already exists' 
      });
    }
    
    // Add new tier
    const tier = await bulkPricingService.addTier(productId, tierData);
    
    if (!tier) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to add pricing tier' 
      });
    }
    
    return res.status(201).json({
      status: 'success',
      data: tier
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid input data', 
        details: error.errors 
      });
    }
    
    console.error('Error adding pricing tier:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error adding pricing tier' 
    });
  }
});

// PUT /api/products/:productId/bulk-pricing/tier/:tierId
router.put('/:productId/bulk-pricing/tier/:tierId', requireAuth, async (req, res) => {
  try {
    const { productId, tierId } = req.params;
    
    // Parse and validate input
    const tierData = BulkPricingTierSchema.parse(req.body);
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Verify tier exists and belongs to the product
    const existingTier = await prisma.bulkPricing.findFirst({
      where: { 
        id: tierId,
        productId,
      },
    });
    
    if (!existingTier) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Pricing tier not found or does not belong to this product' 
      });
    }
    
    // Check if changing to a minimum quantity that already exists
    if (tierData.minQuantity !== existingTier.minQuantity) {
      const duplicateTier = await prisma.bulkPricing.findFirst({
        where: {
          productId,
          minQuantity: tierData.minQuantity,
          id: { not: tierId }
        }
      });
      
      if (duplicateTier) {
        return res.status(400).json({ 
          status: 'error',
          message: 'A pricing tier with this minimum quantity already exists' 
        });
      }
    }
    
    // Update tier
    const tier = await bulkPricingService.updateTier(tierId, tierData);
    
    if (!tier) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to update pricing tier' 
      });
    }
    
    return res.json({
      status: 'success',
      data: tier
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid input data', 
        details: error.errors 
      });
    }
    
    console.error('Error updating pricing tier:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error updating pricing tier' 
    });
  }
});

// DELETE /api/products/:productId/bulk-pricing/tier/:tierId
router.delete('/:productId/bulk-pricing/tier/:tierId', requireAuth, async (req, res) => {
  try {
    const { productId, tierId } = req.params;
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Verify tier exists and belongs to the product
    const existingTier = await prisma.bulkPricing.findFirst({
      where: { 
        id: tierId,
        productId,
      },
    });
    
    if (!existingTier) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Pricing tier not found or does not belong to this product' 
      });
    }
    
    // Delete tier
    const result = await bulkPricingService.deleteTier(tierId);
    
    if (!result) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to delete pricing tier' 
      });
    }
    
    return res.json({
      status: 'success',
      data: { message: 'Pricing tier deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting pricing tier:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error deleting pricing tier' 
    });
  }
});

// GET /api/products/:productId/price - Get price for a specific quantity
router.get('/:productId/price', async (req, res) => {
  try {
    const productId = req.params.productId;
    const quantity = parseInt(req.query.quantity as string, 10);
    
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid quantity. Must be a positive number.' 
      });
    }
    
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Calculate price based on bulk pricing tiers
    const price = await bulkPricingService.calculatePriceForQuantity(productId, quantity);
    
    return res.json({
      status: 'success',
      data: { price }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Error calculating price' 
    });
  }
});

export default router;
