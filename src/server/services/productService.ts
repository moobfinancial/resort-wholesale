import { Prisma } from '@prisma/client';
import prisma from './db';

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  imageUrl: string;
  sku: string;
  stock?: number;
  minOrder?: number;
  bulkPricing?: {
    minQuantity: number;
    price: number;
  }[];
}

export const productService = {
  async createProduct(data: CreateProductInput) {
    const { bulkPricing, ...productData } = data;
    
    try {
      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = await this.generateSKU(productData.category);
      } else {
        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku: productData.sku }
        });
        if (existingProduct) {
          throw new Error('A product with this SKU already exists');
        }
      }

      // Validate price
      if (typeof productData.price !== 'number' || isNaN(productData.price)) {
        throw new Error('Invalid price value');
      }

      const createData: Prisma.ProductCreateInput = {
        ...productData,
        price: new Prisma.Decimal(productData.price.toString()),
        bulkPricing: bulkPricing ? {
          create: bulkPricing.map(pricing => {
            if (typeof pricing.price !== 'number' || isNaN(pricing.price)) {
              throw new Error('Invalid bulk pricing value');
            }
            return {
              minQuantity: pricing.minQuantity,
              price: new Prisma.Decimal(pricing.price.toString())
            };
          })
        } : undefined
      };

      return prisma.product.create({
        data: createData,
        include: {
          bulkPricing: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('A product with this SKU already exists');
        }
      }
      throw error;
    }
  },

  async generateSKU(category: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
      // Get count of products in this category
      const count = await prisma.product.count({
        where: { category }
      });
      
      // Generate SKU: First 3 letters of category + sequential number
      const categoryPrefix = category.slice(0, 3).toUpperCase();
      const sequentialNumber = (count + attempts + 1).toString().padStart(4, '0');
      const sku = `${categoryPrefix}${sequentialNumber}`;
      
      // Check if SKU exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      });
      
      if (!existingProduct) {
        return sku;
      }
      
      attempts++;
    }
    
    throw new Error('Unable to generate unique SKU after multiple attempts');
  },

  async getProduct(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        bulkPricing: true
      }
    });
  },

  async updateProduct(id: string, data: Partial<CreateProductInput>) {
    const { bulkPricing, ...productData } = data;

    // If price is provided, validate and convert it
    let priceUpdate = undefined;
    if (productData.price !== undefined) {
      if (typeof productData.price !== 'number' || isNaN(productData.price)) {
        throw new Error('Invalid price value');
      }
      priceUpdate = new Prisma.Decimal(productData.price.toString());
    }

    // Update the product
    const updateData: Prisma.ProductUpdateInput = {
      ...productData,
      price: priceUpdate,
      bulkPricing: bulkPricing ? {
        deleteMany: { productId: id },
        create: bulkPricing.map(pricing => ({
          minQuantity: pricing.minQuantity,
          price: new Prisma.Decimal(pricing.price.toString())
        }))
      } : undefined
    };

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        bulkPricing: true
      }
    });
  },

  async listProducts(params: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const skip = params.page && params.limit ? (params.page - 1) * params.limit : params.where?.skip;
    const take = params.limit || params.where?.take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: params.where,
        skip,
        take,
        include: {
          bulkPricing: true
        },
        orderBy: params.orderBy || {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where: params.where })
    ]);

    return {
      products,
      total,
      hasMore: take ? total > (skip || 0) + take : false
    };
  },

  async getCategories() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        category: true
      },
      distinct: ['category']
    });

    return products.map((product, index) => ({
      id: product.category,
      name: product.category,
      count: 0  // We'll update this in a separate query
    }));
  },

  async getCategoryCount(category: string) {
    return prisma.product.count({
      where: {
        category,
        isActive: true
      }
    });
  },

  async deleteProduct(id: string) {
    await prisma.product.delete({
      where: { id }
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
  }
};
