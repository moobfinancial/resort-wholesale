import { prisma } from '../../lib/prisma';
import { BulkPricing } from '@prisma/client';
import crypto from 'crypto';

interface BulkPricingInput {
  id?: string;
  minQuantity: number;
  price: number;
}

export const bulkPricingService = {
  /**
   * Get all bulk pricing tiers for a product
   */
  getByProductId: async (productId: string): Promise<BulkPricing[]> => {
    try {
      return await prisma.bulkPricing.findMany({
        where: { productId },
        orderBy: { minQuantity: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching bulk pricing tiers:', error);
      return [];
    }
  },

  /**
   * Update bulk pricing tiers for a product
   * This replaces all existing tiers with the new ones
   */
  updateProductTiers: async (productId: string, tiers: BulkPricingInput[]): Promise<boolean> => {
    try {
      // Start a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Delete all existing tiers for this product
        await tx.bulkPricing.deleteMany({
          where: { productId },
        });

        // Create the new tiers
        if (tiers.length > 0) {
          await tx.bulkPricing.createMany({
            data: tiers.map(tier => ({
              productId,
              minQuantity: tier.minQuantity,
              price: tier.price,
              updatedAt: new Date(), // Add updatedAt field
            })),
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating bulk pricing tiers:', error);
      return false;
    }
  },

  /**
   * Add a single bulk pricing tier
   */
  addTier: async (productId: string, tier: BulkPricingInput): Promise<BulkPricing | null> => {
    try {
      return await prisma.bulkPricing.create({
        data: {
          id: crypto.randomUUID(), // Generate a unique ID
          productId,
          minQuantity: tier.minQuantity,
          price: tier.price,
          updatedAt: new Date(), // Add updatedAt field
        },
      });
    } catch (error) {
      console.error('Error adding bulk pricing tier:', error);
      return null;
    }
  },

  /**
   * Update a single bulk pricing tier
   */
  updateTier: async (tierId: string, data: Partial<BulkPricingInput>): Promise<BulkPricing | null> => {
    try {
      return await prisma.bulkPricing.update({
        where: { id: tierId },
        data: {
          minQuantity: data.minQuantity,
          price: data.price,
          updatedAt: new Date(), // Add updatedAt field
        },
      });
    } catch (error) {
      console.error('Error updating bulk pricing tier:', error);
      return null;
    }
  },

  /**
   * Delete a single bulk pricing tier
   */
  deleteTier: async (tierId: string): Promise<boolean> => {
    try {
      await prisma.bulkPricing.delete({
        where: { id: tierId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting bulk pricing tier:', error);
      return false;
    }
  },

  /**
   * Get the price for a product based on quantity
   * Returns the base price if no bulk pricing matches
   */
  getPriceForQuantity: async (productId: string, quantity: number): Promise<number | null> => {
    try {
      // Get the product first to get the base price
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true },
      });

      if (!product) {
        return null;
      }

      // Get applicable bulk pricing tier
      const tier = await prisma.bulkPricing.findFirst({
        where: {
          productId,
          minQuantity: {
            lte: quantity,
          },
        },
        orderBy: {
          minQuantity: 'desc', // Get the highest tier that's still below the quantity
        },
      });

      // If no tier found, return base price
      if (!tier) {
        return Number(product.price);
      }

      return Number(tier.price);
    } catch (error) {
      console.error('Error calculating bulk price:', error);
      return null;
    }
  },

  /**
   * Calculate price for a given quantity
   * This is a public-facing method that returns a fallback price if there's an error
   */
  calculatePriceForQuantity: async (productId: string, quantity: number): Promise<number> => {
    try {
      const price = await bulkPricingService.getPriceForQuantity(productId, quantity);
      
      if (price === null) {
        // Get the base product price if bulk pricing calculation fails
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { price: true },
        });
        
        return product ? Number(product.price) : 0;
      }
      
      return price;
    } catch (error) {
      console.error('Error in calculatePriceForQuantity:', error);
      
      // Attempt to get the base product price as a fallback
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { price: true },
        });
        
        return product ? Number(product.price) : 0;
      } catch (fallbackError) {
        console.error('Error getting fallback price:', fallbackError);
        return 0;
      }
    }
  },
};
