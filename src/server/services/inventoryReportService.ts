import { prisma } from '../../lib/prisma';
import { ProductVariant } from '@prisma/client';

interface LowStockVariant {
  id: string;
  sku: string;
  stock: number;
  attributes: Record<string, string>;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category: string;
  price: number;
  type: string;
  lowStockVariants: LowStockVariant[];
}

/**
 * Service for generating inventory-related reports and tracking stock movements
 */
export const inventoryReportService = {
  /**
   * Get a report of all products with low stock (below specified threshold)
   */
  getLowStockProducts: async (threshold: number = 10): Promise<LowStockProduct[]> => {
    try {
      // Get regular products with low stock
      const lowStockProducts = await prisma.product.findMany({
        where: {
          stock: {
            lte: threshold,
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          category: true,
          price: true,
        },
        orderBy: {
          stock: 'asc',
        },
      });

      // Get variants with low stock in separate query
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          stock: {
            lte: threshold
          }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });

      // Group variants by product ID
      const variantsByProduct = new Map<string, LowStockVariant[]>();
      
      lowStockVariants.forEach((variant: ProductVariant & { product: { id: string, name: string, category: string } }) => {
        const productId = variant.productId;
        if (!variantsByProduct.has(productId)) {
          variantsByProduct.set(productId, []);
        }
        
        variantsByProduct.get(productId)?.push({
          id: variant.id,
          sku: variant.sku,
          stock: variant.stock,
          attributes: variant.attributes as Record<string, string>,
        });
      });

      // Format the results
      const results = lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        category: product.category || 'Uncategorized',
        price: Number(product.price),
        type: 'product',
        lowStockVariants: variantsByProduct.get(product.id) || [],
      }));

      return results;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  },

  /**
   * Get inventory valuation report - total value of current inventory
   */
  getInventoryValuation: async (): Promise<{
    totalValue: number;
    productCount: number;
    variantCount: number;
    categoryBreakdown: { category: string; value: number; itemCount: number }[];
  }> => {
    try {
      // Get all active products
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          price: true,
          stock: true,
          category: true,
        },
      });

      // Get all variants in a separate query
      const variants = await prisma.productVariant.findMany({
        select: {
          id: true,
          price: true,
          stock: true,
          productId: true,
        },
        where: {
          product: {
            isActive: true
          }
        }
      });

      // Create a map of product IDs to their categories
      const productCategories = new Map<string, string>();
      products.forEach(product => {
        productCategories.set(product.id, product.category || 'Uncategorized');
      });

      // Calculate product values
      let totalValue = 0;
      const categoryMap = new Map<string, { value: number; itemCount: number }>();

      // Process products
      products.forEach(product => {
        // Calculate main product value
        const productValue = Number(product.price) * product.stock;
        totalValue += productValue;

        // Update category breakdown
        const category = product.category || 'Uncategorized';
        const categoryData = categoryMap.get(category) || { value: 0, itemCount: 0 };
        categoryData.value += productValue;
        categoryData.itemCount += 1;
        categoryMap.set(category, categoryData);
      });

      // Process variants
      variants.forEach(variant => {
        const variantValue = Number(variant.price) * variant.stock;
        totalValue += variantValue;
        
        // Get category from the product map
        const category = productCategories.get(variant.productId) || 'Uncategorized';
        const categoryData = categoryMap.get(category) || { value: 0, itemCount: 0 };
        categoryData.value += variantValue;
        categoryMap.set(category, categoryData);
      });

      // Format the category breakdown
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        value: data.value,
        itemCount: data.itemCount,
      }));

      return {
        totalValue,
        productCount: products.length,
        variantCount: variants.length,
        categoryBreakdown,
      };
    } catch (error) {
      console.error('Error getting inventory valuation:', error);
      return {
        totalValue: 0,
        productCount: 0,
        variantCount: 0,
        categoryBreakdown: [],
      };
    }
  },

  /**
   * Get inventory turnover report - how quickly products are selling
   * Based on orders in a given date range
   */
  getInventoryTurnover: async (
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<{
    topSellingProducts: { id: string; name: string; sku: string; soldQuantity: number }[];
    turnoverRate: number;
  }> => {
    try {
      // Get orders in the date range
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // Calculate product sales
      const productSales = new Map<string, { id: string; name: string; sku: string; soldQuantity: number }>();
      
      orders.forEach(order => {
        order.items.forEach(item => {
          const productId = item.productId;
          const existing = productSales.get(productId) || {
            id: productId,
            name: item.product.name,
            sku: item.product.sku,
            soldQuantity: 0,
          };
          
          existing.soldQuantity += item.quantity;
          productSales.set(productId, existing);
        });
      });

      // Get top selling products
      const topSellingProducts = Array.from(productSales.values())
        .sort((a, b) => b.soldQuantity - a.soldQuantity)
        .slice(0, 10);

      // Calculate inventory turnover rate
      // Formula: Cost of Goods Sold / Average Inventory Value
      // For simplicity, we're using sold quantity / current inventory quantity
      const totalSold = Array.from(productSales.values()).reduce((sum, item) => sum + item.soldQuantity, 0);
      
      // Get current inventory total
      const currentInventory = await prisma.product.aggregate({
        _sum: {
          stock: true,
        },
      });
      
      const turnoverRate = currentInventory._sum.stock 
        ? totalSold / currentInventory._sum.stock 
        : 0;

      return {
        topSellingProducts,
        turnoverRate,
      };
    } catch (error) {
      console.error('Error getting inventory turnover:', error);
      return {
        topSellingProducts: [],
        turnoverRate: 0,
      };
    }
  },
};
