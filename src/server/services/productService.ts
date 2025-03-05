import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

type CreateProductInput = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number | string;
  imageUrl: string;
  sku: string;
  stock?: number;
  minOrder?: number;
  status?: ProductStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  supplierId?: string;
  supplierName?: string;
  bulkPricing?: Array<{
    minQuantity: number;
    price: number;
  }>;
};

export const productService = {
  async createProduct(data: CreateProductInput) {
    const { price, bulkPricing, sku, supplierId, supplierName, ...rest } = data;

    // Generate a unique SKU if not provided
    const generatedSku = sku?.trim?.() || `${rest.name.replace(/\s+/g, '-').toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: generatedSku },
    });

    if (existingProduct) {
      throw new Error(`A product with SKU "${generatedSku}" already exists.`);
    }

    const productData: Prisma.ProductCreateInput = {
      ...rest,
      id: crypto.randomUUID(),  // Generate a unique ID
      sku: generatedSku,
      price: new Prisma.Decimal(price.toString()),
      isActive: data.isActive ?? true,
      status: data.status || ProductStatus.DRAFT,
      updatedAt: new Date(),
      Supplier: supplierId ? {
        connect: { id: supplierId }
      } : undefined,
      BulkPricing: bulkPricing ? {
        create: bulkPricing.map(bp => ({
          id: crypto.randomUUID(),
          minQuantity: bp.minQuantity,
          price: new Prisma.Decimal(bp.price.toString()),
          updatedAt: new Date(),
        })),
      } : undefined,
    };

    return prisma.product.create({
      data: productData,
      include: {
        BulkPricing: true,
      },
    });
  },

  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        BulkPricing: true,
        Supplier: true,
      },
    });
  },

  async updateProduct(id: string, data: Partial<CreateProductInput>) {
    const { price, bulkPricing, supplierId, supplierName, ...rest } = data;
    const updateData: Prisma.ProductUpdateInput = {
      ...rest,
      updatedAt: new Date(),
      ...(price !== undefined && {
        price: new Prisma.Decimal(price.toString()),
      }),
      ...(supplierId !== undefined && {
        Supplier: supplierId ? {
          connect: { id: supplierId }
        } : { disconnect: true }
      }),
      ...(bulkPricing && {
        BulkPricing: {
          deleteMany: {},
          create: bulkPricing.map(bp => ({
            id: crypto.randomUUID(),
            minQuantity: bp.minQuantity,
            price: new Prisma.Decimal(bp.price.toString()),
            updatedAt: new Date(),
          })),
        },
      }),
    };

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        BulkPricing: true,
      },
    });
  },

  async listProducts(params: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where = {}, orderBy = { createdAt: 'desc' }, page = 1, limit = 10 } = params;

    const skip = (page - 1) * limit;
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          BulkPricing: true,
          Supplier: true,
        },
      }),
    ]);

    const hasMore = total > page * limit;

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      hasMore,
    };
  },

  async getFeaturedProducts() {
    try {
      // First try to get products that are specifically marked as featured
      const featuredProducts = await prisma.product.findMany({
        where: {
          isFeatured: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
        include: {
          BulkPricing: true,
        },
      });
      
      // If no featured products, fall back to most recent products
      if (featuredProducts.length === 0) {
        console.log('No featured products found, falling back to recent products');
        return prisma.product.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 4,
          include: {
            BulkPricing: true,
          },
        });
      }
      
      return featuredProducts;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  async getNewArrivals() {
    try {
      // Get products created in the last 30 days first
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
        include: {
          BulkPricing: true,
        },
      });
      
      // If not enough recent products, just return most recent products regardless of date
      if (recentProducts.length < 4) {
        console.log('Not enough new arrivals, falling back to most recent products');
        return prisma.product.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
          include: {
            BulkPricing: true,
          },
        });
      }
      
      return recentProducts;
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  },

  async testConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },

  async getCategories() {
    return prisma.product.findMany({
      distinct: ['category'],
      select: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      }
    }).then(result => result.map(item => item.category));
  },

  async getCategoryCount(categoryId: string) {
    return prisma.product.count({
      where: {
        category: categoryId,
      },
    });
  },

  /**
   * Get price for a product based on quantity, taking bulk pricing into account
   */
  async getPriceForQuantity(productId: string, quantity: number) {
    try {
      // First check if the product has bulk pricing
      const bulkPricing = await prisma.bulkPricing.findMany({
        where: {
          productId,
        },
        orderBy: {
          minQuantity: 'desc', // Order by min quantity descending to find the highest applicable tier
        },
      });

      if (bulkPricing.length === 0) {
        // No bulk pricing, return the product's base price
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { price: true },
        });
        return product?.price ?? null;
      }

      // Find the applicable bulk pricing tier based on quantity
      const applicableTier = bulkPricing.find(tier => quantity >= tier.minQuantity);
      
      if (!applicableTier) {
        // No applicable tier found, return the product's base price
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { price: true },
        });
        return product?.price ?? null;
      }

      return applicableTier.price;
    } catch (error) {
      console.error(`Error getting price for product ${productId} and quantity ${quantity}:`, error);
      return null;
    }
  },
};
