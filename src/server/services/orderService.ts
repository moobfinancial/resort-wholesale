import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

interface OrderItem {
  productId: string;
  variantId?: string;  // Optional variant ID
  quantity: number;
  price: Prisma.Decimal;
  total: Prisma.Decimal;
}

export const orderService = {
  /**
   * Updates stock levels for both regular products and product variants when an order is placed
   * This method doesn't require schema changes and works with the current database structure
   */
  updateInventoryLevels: async (orderItems: OrderItem[]): Promise<boolean> => {
    try {
      // Process each item one by one (not using a transaction to avoid schema issues)
      for (const item of orderItems) {
        // If there's a variant ID, update the variant stock
        if (item.variantId) {
          try {
            // Use direct SQL query to avoid schema constraints
            await prisma.$executeRaw`
              UPDATE "ProductVariant" 
              SET "stock" = "stock" - ${item.quantity} 
              WHERE "id" = ${item.variantId}
            `;
          } catch (error) {
            console.error(`Failed to update variant stock for variant ${item.variantId}:`, error);
          }
        } 
        
        // Always update the main product stock for proper inventory tracking
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
            updatedAt: new Date(), // Add updatedAt field
          },
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating inventory levels:', error);
      return false;
    }
  },

  /**
   * Validates stock availability for both products and product variants
   * Works with the current database schema
   */
  validateStockAvailability: async (items: { productId: string; variantId?: string; quantity: number }[]): Promise<{ productId: string; variantId?: string; name: string; available: number; requested: number }[]> => {
    const insufficientItems = [];

    for (const item of items) {
      if (item.variantId) {
        // Check variant stock
        const variantResult = await prisma.$queryRaw`
          SELECT id, stock, sku FROM "ProductVariant" WHERE id = ${item.variantId}
        `;
        
        const variant = variantResult[0] as { id: string; stock: number; sku: string } | undefined;

        if (!variant || variant.stock < item.quantity) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true },
          });

          insufficientItems.push({
            productId: item.productId,
            variantId: item.variantId,
            name: product ? `${product.name} (${Object.values(variant?.attributes).join(', ')})` : 'Unknown Variant',
            available: variant ? variant.stock : 0,
            requested: item.quantity,
          });
        }
      } else {
        // Check product stock
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.stock < item.quantity) {
          insufficientItems.push({
            productId: item.productId,
            name: product ? product.name : 'Unknown Product',
            available: product ? product.stock : 0,
            requested: item.quantity,
          });
        }
      }
    }

    return insufficientItems;
  },

  /**
   * Retrieves pricing information for an order item based on quantity and variant
   */
  getItemPrice: async (productId: string, variantId: string | undefined, quantity: number): Promise<{ price: Prisma.Decimal; total: Prisma.Decimal }> => {
    let price: Prisma.Decimal;

    // If there's a variant, use its price
    if (variantId) {
      const variantResult = await prisma.$queryRaw`
        SELECT price FROM "ProductVariant" WHERE id = ${variantId}
      `;
      
      const variant = variantResult[0] as { price: Prisma.Decimal } | undefined;

      if (!variant) {
        throw new Error(`Variant not found: ${variantId}`);
      }

      price = variant.price;
    } else {
      // Otherwise, check for bulk pricing
      const bulkPricing = await prisma.bulkPricing.findFirst({
        where: {
          productId,
          minQuantity: {
            lte: quantity,
          },
        },
        orderBy: {
          minQuantity: 'desc',
        },
      });

      // If no bulk pricing applies, use the standard price
      if (!bulkPricing) {
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        price = product.price;
      } else {
        price = bulkPricing.price;
      }
    }

    // Calculate the total price
    const total = price.mul(quantity);
    
    return { price, total };
  },
};
