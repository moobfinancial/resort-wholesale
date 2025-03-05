import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { productVariantService } from '../services/productVariantService';
import { prisma } from '../../lib/prisma';

const router = Router();

// Schema for product variant validation
const ProductVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  attributes: z.record(z.string()),
  imageUrl: z.string().optional(),
});

// Get all variants for a product
router.get('/:productId/variants', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // First check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found',
        variants: [] 
      });
    }
    
    const variants = await productVariantService.getByProductId(productId);
    
    // Always return a successful response with variants (even if empty)
    return res.status(200).json({ 
      status: 'success',
      variants 
    });
  } catch (error) {
    console.error('Error fetching product variants:', error);
    // Return empty array instead of error for better frontend experience
    return res.status(200).json({ 
      status: 'success',
      variants: [] 
    });
  }
});

// Get a specific variant
router.get('/:productId/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await productVariantService.getById(variantId);
    
    if (!variant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }
    
    return res.status(200).json(variant);
  } catch (error) {
    console.error('Error fetching product variant:', error);
    return res.status(500).json({ error: 'Failed to fetch product variant' });
  }
});

// Create a new variant
router.post('/:productId/variants', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate request body
    const validatedData = ProductVariantSchema.parse(req.body);
    
    // Create the variant
    const newVariant = await productVariantService.createVariant({
      ...validatedData,
      productId,
    });
    
    return res.status(201).json(newVariant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error creating product variant:', error);
    return res.status(500).json({ error: 'Failed to create product variant' });
  }
});

// Update a variant
router.put('/:productId/variants/:variantId', requireAuth, async (req, res) => {
  try {
    const { variantId } = req.params;
    
    // Validate request body
    const validatedData = ProductVariantSchema.parse(req.body);
    
    // Check if variant exists
    const existingVariant = await productVariantService.getVariantById(variantId);
    
    if (!existingVariant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }
    
    // Update the variant
    const updatedVariant = await productVariantService.updateVariant(variantId, validatedData);
    
    return res.status(200).json(updatedVariant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error updating product variant:', error);
    return res.status(500).json({ error: 'Failed to update product variant' });
  }
});

// Delete a variant
router.delete('/:productId/variants/:variantId', requireAuth, async (req, res) => {
  try {
    const { variantId } = req.params;
    
    // Check if variant exists
    const existingVariant = await productVariantService.getVariantById(variantId);
    
    if (!existingVariant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }
    
    // Delete the variant
    await productVariantService.deleteVariant(variantId);
    
    return res.status(200).json({ message: 'Product variant deleted successfully' });
  } catch (error) {
    console.error('Error deleting product variant:', error);
    return res.status(500).json({ error: 'Failed to delete product variant' });
  }
});

export default router;
