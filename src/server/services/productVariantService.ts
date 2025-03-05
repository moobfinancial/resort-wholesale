import { prisma } from '../../lib/prisma';
import type { ProductVariant } from '@prisma/client';
import crypto from 'crypto';

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
      return await prisma.productVariant.create({
        data: {
          id: crypto.randomUUID(), // Generate a unique ID
          productId: data.productId,
          sku: data.sku,
          price: data.price,
          stock: data.stock,
          attributes: data.attributes,
          imageUrl: data.imageUrl,
          updatedAt: new Date(), // Add updatedAt field
        }
      });
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
      return await prisma.productVariant.update({
        where: { id: data.id },
        data: {
          sku: data.sku,
          price: data.price,
          stock: data.stock,
          attributes: data.attributes,
          imageUrl: data.imageUrl,
          updatedAt: new Date(), // Add updatedAt field
        }
      });
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
                price: variant.price,
                stock: variant.stock,
                attributes: variant.attributes,
                imageUrl: variant.imageUrl,
                updatedAt: new Date(), // Add updatedAt field
              }
            });
          } else {
            // Create new variant
            await tx.productVariant.create({
              data: {
                id: crypto.randomUUID(), // Generate a unique ID
                productId,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                attributes: variant.attributes,
                imageUrl: variant.imageUrl,
                updatedAt: new Date(), // Add updatedAt field
              }
            });
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating variants for product ${productId}:`, error);
      return false;
    }
  }
};
