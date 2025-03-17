import { Router } from 'express';
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
        message: 'Product not found'
      });
    }
    
    const variants = await productVariantService.getByProductId(productId);
    
    // Process variant images to ensure consistent paths
    const processedVariants = variants.map(variant => {
      let imageUrl = variant.imageUrl;
      
      // Process image URL for consistency
      if (imageUrl) {
        // If imageUrl is just a filename or doesn't have the proper prefix
        if (!imageUrl.startsWith('/images/products/') && !imageUrl.startsWith('http')) {
          // If it's a relative path starting with images/ but missing the leading slash
          if (imageUrl.startsWith('images/products/')) {
            imageUrl = '/' + imageUrl;
          } else if (imageUrl.startsWith('/uploads/products/') || 
                    imageUrl.startsWith('uploads/products/')) {
            // Handle old path format
            const filename = imageUrl.split('/').pop();
            imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
          } else {
            // Extract just the filename if it's a path
            const filename = imageUrl.split('/').pop();
            imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
          }
        }
      } else {
        // Set default placeholder if no image
        imageUrl = '/images/products/placeholder.svg';
      }
      
      return {
        ...variant,
        imageUrl
      };
    });
    
    // Return response following the standard format
    return res.status(200).json({ 
      status: 'success',
      data: {
        items: processedVariants
      }
    });
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch product variants'
    });
  }
});

// Get a specific variant
router.get('/:productId/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await productVariantService.getById(variantId);
    
    if (!variant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Variant not found' 
      });
    }
    
    // Process image URL for consistency
    let processedVariant = { ...variant };
    if (processedVariant.imageUrl) {
      // If imageUrl is just a filename or doesn't have the proper prefix
      if (!processedVariant.imageUrl.startsWith('/images/products/') && 
          !processedVariant.imageUrl.startsWith('http')) {
        // If it's a relative path starting with images/ but missing the leading slash
        if (processedVariant.imageUrl.startsWith('images/products/')) {
          processedVariant.imageUrl = '/' + processedVariant.imageUrl;
        } else if (processedVariant.imageUrl.startsWith('/uploads/products/') || 
                  processedVariant.imageUrl.startsWith('uploads/products/')) {
          // Handle old path format
          const filename = processedVariant.imageUrl.split('/').pop();
          processedVariant.imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
        } else {
          // Extract just the filename if it's a path
          const filename = processedVariant.imageUrl.split('/').pop();
          processedVariant.imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
        }
      }
    } else {
      // Set default placeholder if no image
      processedVariant.imageUrl = '/images/products/placeholder.svg';
    }
    
    return res.status(200).json({ 
      status: 'success',
      data: {
        item: processedVariant
      }
    });
  } catch (error) {
    console.error('Error fetching product variant:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch product variant' 
    });
  }
});

// Create a new variant
router.post('/:productId/variants', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate request body
    const validatedData = ProductVariantSchema.parse(req.body);
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found' 
      });
    }
    
    // Create the variant
    const newVariant = await productVariantService.create({
      ...validatedData,
      productId,
    });
    
    return res.status(201).json({ 
      status: 'success',
      data: {
        item: newVariant
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid variant data',
        details: error.errors
      });
    }
    
    console.error('Error creating product variant:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to create product variant' 
    });
  }
});

// Update a variant
router.put('/:productId/variants/:variantId', requireAuth, async (req, res) => {
  try {
    const { variantId } = req.params;
    
    // Validate request body
    const validatedData = ProductVariantSchema.parse(req.body);
    
    // Check if variant exists
    const existingVariant = await productVariantService.getById(variantId);
    
    if (!existingVariant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Variant not found' 
      });
    }
    
    // Update the variant
    const updatedVariant = await productVariantService.update({
      id: variantId,
      ...validatedData
    });
    
    if (!updatedVariant) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Failed to update variant' 
      });
    }
    
    // Process image URL for consistency
    let processedVariant = { ...updatedVariant };
    if (processedVariant.imageUrl) {
      // If imageUrl is just a filename or doesn't have the proper prefix
      if (!processedVariant.imageUrl.startsWith('/images/products/') && 
          !processedVariant.imageUrl.startsWith('http')) {
        // If it's a relative path starting with images/ but missing the leading slash
        if (processedVariant.imageUrl.startsWith('images/products/')) {
          processedVariant.imageUrl = '/' + processedVariant.imageUrl;
        } else if (processedVariant.imageUrl.startsWith('/uploads/products/') || 
                  processedVariant.imageUrl.startsWith('uploads/products/')) {
          // Handle old path format
          const filename = processedVariant.imageUrl.split('/').pop();
          processedVariant.imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
        } else {
          // Extract just the filename if it's a path
          const filename = processedVariant.imageUrl.split('/').pop();
          processedVariant.imageUrl = `/images/products/${filename || 'placeholder.svg'}`;
        }
      }
    }
    
    return res.status(200).json({ 
      status: 'success',
      data: {
        item: processedVariant
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid variant data',
        details: error.errors
      });
    }
    
    console.error('Error updating product variant:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to update product variant' 
    });
  }
});

// Delete a variant
router.delete('/:productId/variants/:variantId', requireAuth, async (req, res) => {
  try {
    const { variantId } = req.params;
    
    // Check if variant exists
    const existingVariant = await productVariantService.getById(variantId);
    
    if (!existingVariant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Variant not found' 
      });
    }
    
    // Delete the variant
    await productVariantService.delete(variantId);
    
    return res.status(200).json({ 
      status: 'success',
      data: {
        message: 'Variant deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting product variant:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to delete product variant' 
    });
  }
});

export default router;
