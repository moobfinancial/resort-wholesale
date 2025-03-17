import { prisma } from '../../lib/prisma';
import type { ProductVariant } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

/**
 * Utility function to normalize image URLs to ensure consistent path formats
 */
const normalizeImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return '/images/products/placeholder.svg';
  
  // If URL is already properly formatted, return it
  if (imageUrl.startsWith('/images/products/') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If URL is a relative path starting with images/ but missing the leading slash
  if (imageUrl.startsWith('images/products/')) {
    return '/' + imageUrl;
  }
  
  // If URL is from the old uploads path format
  if (imageUrl.startsWith('/uploads/products/') || imageUrl.startsWith('uploads/products/')) {
    const filename = imageUrl.split('/').pop();
    return `/images/products/${filename || 'placeholder.svg'}`;
  }
  
  // If URL is just a filename or a non-standard path
  const filename = imageUrl.split('/').pop();
  return `/images/products/${filename || 'placeholder.svg'}`;
};

type ProductVariantInput = {
  id?: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, any>;
  imageUrl?: string;
};

type ProductVariantUpdateInput = Partial<ProductVariantInput> & {
  id: string;
};

export const productVariantService = {
  /**
   * Get all variants for a product
   */
  async getByProductId(productId: string): Promise<ProductVariant[]> {
    try {
      return await prisma.productVariant.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching product variants:', error);
      return [];
    }
  },

  /**
   * Get a single variant by ID
   */
  async getById(id: string): Promise<ProductVariant | null> {
    try {
      return await prisma.productVariant.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error(`Error fetching product variant with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new product variant
   */
  async create(data: ProductVariantInput): Promise<ProductVariant | null> {
    try {
      const variant = await prisma.productVariant.create({
        data: {
          id: crypto.randomUUID(),
          productId: data.productId,
          sku: data.sku,
          price: new Decimal(data.price.toString()),
          stock: data.stock,
          attributes: data.attributes,
          imageUrl: normalizeImageUrl(data.imageUrl),
          updatedAt: new Date(),
        }
      });

      return variant;
    } catch (error) {
      console.error('Error creating product variant:', error);
      return null;
    }
  },

  /**
   * Update an existing product variant
   */
  async update(data: ProductVariantUpdateInput): Promise<ProductVariant | null> {
    try {
      const variant = await prisma.productVariant.update({
        where: { id: data.id },
        data: {
          ...(data.sku && { sku: data.sku }),
          ...(data.price && { price: new Decimal(data.price.toString()) }),
          ...(data.stock && { stock: data.stock }),
          ...(data.attributes && { attributes: data.attributes }),
          ...(data.imageUrl && { imageUrl: normalizeImageUrl(data.imageUrl) }),
          updatedAt: new Date(),
        }
      });

      return variant;
    } catch (error) {
      console.error(`Error updating product variant with ID ${data.id}:`, error);
      return null;
    }
  },

  /**
   * Delete a product variant
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.productVariant.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error(`Error deleting product variant with ID ${id}:`, error);
      return false;
    }
  },

  /**
   * Create or update multiple product variants in a transaction
   */
  async updateProductVariants(
    productId: string,
    variants: ProductVariantInput[]
  ): Promise<boolean> {
    try {
      // Get existing variants for this product
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true }
      });
      
      const existingIds = new Set(existingVariants.map(v => v.id));
      const updatedIds = new Set(
        variants.filter(v => v.id).map(v => v.id as string)
      );
      
      // Find IDs to delete (existing but not in updated)
      const idsToDelete = [...existingIds].filter(id => !updatedIds.has(id));
      
      // Start transaction to update all variants at once
      await prisma.$transaction(async (tx) => {
        // Delete variants that are no longer needed
        if (idsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: idsToDelete } }
          });
        }
        
        // Update or create variants
        for (const variant of variants) {
          if (variant.id) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                sku: variant.sku,
                price: new Decimal(variant.price.toString()),
                stock: variant.stock,
                attributes: variant.attributes,
                imageUrl: normalizeImageUrl(variant.imageUrl),
                updatedAt: new Date(),
              }
            });
          } else {
            // Create new variant
            await tx.productVariant.create({
              data: {
                id: crypto.randomUUID(),
                productId,
                sku: variant.sku,
                price: new Decimal(variant.price.toString()),
                stock: variant.stock,
                attributes: variant.attributes,
                imageUrl: normalizeImageUrl(variant.imageUrl),
                updatedAt: new Date(),
              }
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating product variants:', error);
      return false;
    }
  }
};
