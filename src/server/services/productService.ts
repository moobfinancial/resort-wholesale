import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

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
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  bulkPricing?: {
    minQuantity: number;
    price: number;
  }[];
};

type ApiResponse<T> = {
  status: 'success' | 'error';
  data: T;
  message?: string;
  details?: string;
};

export const productService = {
  async createProduct(data: CreateProductInput): Promise<ApiResponse<{ item: any }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          data: { item: null },
          message: 'Database unavailable, cannot create product',
        };
      }

      const { price, bulkPricing, ...productRest } = data;
      const generatedSku = productRest.sku?.trim?.() || `${productRest.name.replace(/\s+/g, '-').toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;

      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: generatedSku },
      });

      if (existingProduct) {
        return {
          status: 'error',
          data: { item: null },
          message: `A product with SKU "${generatedSku}" already exists.`,
        };
      }

      const productData: Prisma.ProductCreateInput = {
        ...productRest,
        id: crypto.randomUUID(),  // Generate a unique ID
        sku: generatedSku,
        price: new Decimal(price.toString()),
        isActive: data.isActive ?? true,
        status: 'PUBLISHED', // Always set new products to PUBLISHED
        updatedAt: new Date(),
        BulkPricing: bulkPricing ? {
          create: bulkPricing.map(bp => ({
            id: crypto.randomUUID(),
            minQuantity: bp.minQuantity,
            price: new Decimal(bp.price.toString()),
            updatedAt: new Date(),
          })),
        } : undefined,
      };

      const product = await prisma.product.create({
        data: productData,
        include: {
          BulkPricing: true,
          Variants: true,
          CartItems: true,
          OrderItem: true
        },
      });

      return {
        status: 'success',
        data: { item: product },
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        status: 'error',
        data: { item: null },
        message: error instanceof Error ? error.message : 'Failed to create product',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getProductById(id: string, options?: { include?: any }): Promise<ApiResponse<{ item: any }>> {
    const includeOptions = {
      BulkPricing: true,
      Variants: true,
      CartItems: true,
      OrderItem: true,
      ...options?.include
    };
    
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: includeOptions
      });
      
      if (!product) {
        return {
          status: 'error',
          data: { item: null },
          message: `Product with ID ${id} not found`,
        };
      }

      return {
        status: 'success',
        data: { item: product },
      };
    } catch (error) {
      console.error('Get product by ID error:', error);
      return {
        status: 'error',
        data: { item: null },
        message: error instanceof Error ? error.message : 'Failed to fetch product',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async updateProduct(id: string, data: Partial<CreateProductInput>): Promise<ApiResponse<{ item: any }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          data: { item: null },
          message: 'Database unavailable, cannot update product',
        };
      }

      const { price, bulkPricing, status, ...productRest } = data;

      const updateData: any = {
        ...productRest,
        ...(price && {
          price: new Decimal(price.toString()),
        }),
        ...(bulkPricing && {
          BulkPricing: {
            deleteMany: {},
            create: bulkPricing.map(bp => ({
              id: crypto.randomUUID(),
              minQuantity: bp.minQuantity,
              price: new Decimal(bp.price.toString()),
              updatedAt: new Date(),
            })),
          },
        }),
        updatedAt: new Date(),
      };
      
      // Only add status if it's provided
      if (status) {
        updateData.status = status;
      }

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          BulkPricing: true,
          Variants: true,
          CartItems: true,
          OrderItem: true
        },
      });

      return {
        status: 'success',
        data: { item: product },
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        status: 'error',
        data: { item: null },
        message: error instanceof Error ? error.message : 'Failed to update product',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getProducts({ page = 1, limit = 24, search, category, sortBy, sortOrder, featured, minPrice, maxPrice }: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    featured?: boolean;
    minPrice?: number | string;
    maxPrice?: number | string;
  }): Promise<ApiResponse<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'success',
          data: {
            items: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      const where: Prisma.ProductWhereInput = {
        isActive: true,
        status: 'PUBLISHED',
      };

      if (category) {
        where.category = category;
      }

      if (featured !== undefined) {
        where.isFeatured = featured;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
          where.price.gte = new Decimal(minPrice);
        }
        if (maxPrice !== undefined) {
          where.price.lte = new Decimal(maxPrice);
        }
      }

      let orderByInput: Prisma.ProductOrderByWithRelationInput = {};
      if (sortBy) {
        orderByInput = {
          [sortBy]: sortOrder || 'asc'
        };
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: orderByInput,
          skip,
          take: limit,
          include: {
            BulkPricing: true,
            Variants: true,
          },
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        status: 'success',
        data: {
          items: products,
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        status: 'error',
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        message: error instanceof Error ? error.message : 'Failed to fetch products',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async listProducts(params: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      const { where = {}, orderBy = { createdAt: 'desc' }, page = 1, limit = 10 } = params;
      
      console.log('List products params:', params);
      
      // Build SQL query conditions based on where input
      let conditions: string[] = [];
      let sqlParams: any[] = [];
      let paramCount = 1;
      
      // Handle basic where conditions
      if (where.name) {
        conditions.push(`name ILIKE $${paramCount}`);
        sqlParams.push(`%${where.name}%`);
        paramCount++;
      }
      
      if (where.category) {
        conditions.push(`category = $${paramCount}`);
        sqlParams.push(where.category);
        paramCount++;
      }
      
      if (where.isActive !== undefined) {
        conditions.push(`"isActive" = $${paramCount}`);
        sqlParams.push(where.isActive);
        paramCount++;
      }
      
      if (where.isFeatured !== undefined) {
        conditions.push(`"isFeatured" = $${paramCount}`);
        sqlParams.push(where.isFeatured);
        paramCount++;
      }
      
      // Build WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Build ORDER BY clause
      let orderByField = 'createdAt';
      let orderDirection = 'DESC';
      
      if (orderBy) {
        // Handle various orderBy possibilities
        if (orderBy.createdAt === 'asc') {
          orderByField = 'createdAt';
          orderDirection = 'ASC';
        } else if (orderBy.name === 'asc') {
          orderByField = 'name';
          orderDirection = 'ASC';
        } else if (orderBy.name === 'desc') {
          orderByField = 'name';
          orderDirection = 'DESC';
        } else if (orderBy.price === 'asc') {
          orderByField = 'price';
          orderDirection = 'ASC';
        } else if (orderBy.price === 'desc') {
          orderByField = 'price';
          orderDirection = 'DESC';
        }
      }
      
      const orderByClause = `ORDER BY "${orderByField}" ${orderDirection}`;
      
      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const countQuery = `
        SELECT COUNT(*)::int as count 
        FROM "Product" 
        ${whereClause}
      `;
      
      // Get products with pagination
      const productsQuery = `
        SELECT 
          id, name, description, price, sku, stock, 
          "minOrder", category, tags, "imageUrl", 
          "isActive", "isFeatured", "createdAt", "updatedAt"
        FROM "Product"
        ${whereClause}
        ${orderByClause}
        LIMIT ${limit} OFFSET ${skip}
      `;
      
      // Execute queries
      const [countResult, products] = await Promise.all([
        prisma.$queryRawUnsafe(countQuery, ...sqlParams),
        prisma.$queryRawUnsafe(productsQuery, ...sqlParams)
      ]);
      
      const total = Array.isArray(countResult) && countResult.length > 0 
        ? (countResult[0] as any).count 
        : 0;
      
      // Get bulk pricing for each product
      const productsArray = products as any[] || [];
      for (const product of productsArray) {
        const bulkPricing = await prisma.bulkPricing.findMany({
          where: { productId: product.id }
        });
        
        product.bulkPricing = bulkPricing;
        
        // Ensure imageUrl has the correct format
        if (product.imageUrl) {
          if (!product.imageUrl.startsWith('/images/products/') && 
              !product.imageUrl.startsWith('http')) {
            // If it starts with images/ but missing the leading slash
            if (product.imageUrl.startsWith('images/products/')) {
              product.imageUrl = '/' + product.imageUrl;
            } else {
              // Extract just the filename if it's a path
              const filename = product.imageUrl.split('/').pop();
              product.imageUrl = `/images/products/${filename || product.imageUrl}`;
            }
          }
        }
      }
      
      return {
        status: 'success',
        data: {
          items: productsArray,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error listing products:', error);
      const { page = params.page || 1, limit = params.limit || 10 } = params;
      return {
        status: 'error',
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        message: error instanceof Error ? error.message : 'Failed to list products',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getFeaturedProducts(): Promise<ApiResponse<{ items: any[] }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'success',
          data: { items: [] },
        };
      }

      // Use Prisma query instead of raw SQL to ensure type safety
      const featuredProducts = await prisma.product.findMany({
        where: {
          isFeatured: true,
          isActive: true,
          status: 'PUBLISHED'
        },
        include: {
          BulkPricing: true,
          Variants: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // If no featured products, return empty array
      if (!featuredProducts || featuredProducts.length === 0) {
        return {
          status: 'success',
          data: { items: [] },
        };
      }

      // Format products for response
      const formattedProducts = featuredProducts.map((product: any) => ({
        ...product,
        imageUrl: this.formatImageUrl(product.imageUrl || '/images/products/placeholder.jpg')
      }));
      
      return {
        status: 'success',
        data: { items: formattedProducts },
      };
    } catch (error) {
      console.error('Error getting featured products:', error);
      return {
        status: 'error',
        data: { items: [] },
        message: error instanceof Error ? error.message : 'Failed to get featured products',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getNewArrivals(): Promise<ApiResponse<{ items: any[] }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'success',
          data: { items: [] },
        };
      }

      // Use Prisma query instead of raw SQL
      const recentProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          status: 'PUBLISHED'
        },
        include: {
          BulkPricing: true,
          Variants: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 8
      });
      
      if (!recentProducts || recentProducts.length === 0) {
        return {
          status: 'success',
          data: { items: [] },
        };
      }

      // Format products for response
      const formattedProducts = recentProducts.map((product: any) => ({
        ...product,
        imageUrl: this.formatImageUrl(product.imageUrl || '/images/products/placeholder.jpg')
      }));
      
      return {
        status: 'success',
        data: { items: formattedProducts },
      };
    } catch (error) {
      console.error('Error getting new arrivals:', error);
      return {
        status: 'error',
        data: { items: [] },
        message: error instanceof Error ? error.message : 'Failed to get new arrivals',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getProductImages(productId: string): Promise<ApiResponse<{ items: any[] }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          data: { items: [] },
          message: 'Database unavailable',
          details: 'Cannot connect to database'
        };
      }

      const images = await prisma.productImage.findMany({
        where: {
          productId
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return {
        status: 'success',
        data: { items: images }
      };
    } catch (error) {
      console.error('Error retrieving product images:', error);
      return {
        status: 'error',
        data: { items: [] },
        message: 'Error retrieving product images',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async deleteProduct(id: string): Promise<ApiResponse<{ item: any }>> {
    try {
      // First check if product exists with all related entities
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          Variants: {
            include: {
              images: true // Use the correct field name for variant images
            }
          },
          BulkPricing: true,
          ProductImages: true, // Correct field name for product images
          // Include any other related entities here
        }
      }) as any; // Type casting to avoid TypeScript errors
      
      if (!existingProduct) {
        return {
          status: 'error',
          data: { item: null },
          message: 'Product not found',
        };
      }
      
      console.log(`Preparing to delete product ${id} with name: ${existingProduct.name}`);
      
      // Get all image paths to delete after transaction
      const imagePaths: string[] = [];
      
      // Normalize image path for file location checking
      const normalizeImagePath = (imageUrl: string): string[] => {
        const paths: string[] = [];
        
        if (!imageUrl) return paths;
        
        // Extract filename regardless of path format
        const fileName = imageUrl.split('/').pop();
        if (!fileName) return paths;
        
        // Check all possible storage locations
        const potentialLocations = [
          path.join(__dirname, '../../../public/images/products', fileName),
          path.join(__dirname, '../../../uploads/products', fileName)
        ];
        
        potentialLocations.forEach(location => {
          if (fs.existsSync(location)) {
            paths.push(location);
            console.log(`Found image file to delete: ${location}`);
          }
        });
        
        return paths;
      };
      
      // Add main product image if it exists
      if (existingProduct.imageUrl) {
        const mainImagePaths = normalizeImagePath(existingProduct.imageUrl);
        imagePaths.push(...mainImagePaths);
      }
      
      // Add all product image paths from ProductImage table
      if (existingProduct.ProductImages && existingProduct.ProductImages.length > 0) {
        console.log(`Product has ${existingProduct.ProductImages.length} additional images`);
        existingProduct.ProductImages.forEach((image: any) => {
          if (image.url) {
            const additionalImagePaths = normalizeImagePath(image.url);
            imagePaths.push(...additionalImagePaths);
          }
        });
      }
      
      // Add variant images
      if (existingProduct.Variants && existingProduct.Variants.length > 0) {
        console.log(`Product has ${existingProduct.Variants.length} variants`);
        existingProduct.Variants.forEach((variant: any) => {
          // Variant main image
          if (variant.imageUrl) {
            const variantImagePaths = normalizeImagePath(variant.imageUrl);
            imagePaths.push(...variantImagePaths);
          }
          
          // Variant additional images
          if (variant.images && variant.images.length > 0) {
            console.log(`Variant ${variant.id} has ${variant.images.length} images`);
            variant.images.forEach((image: any) => {
              if (image.url) {
                const variantAdditionalImagePaths = normalizeImagePath(image.url);
                imagePaths.push(...variantAdditionalImagePaths);
              }
            });
          }
        });
      }
      
      console.log(`Found total of ${imagePaths.length} image files to delete`);
      
      // Begin a transaction to ensure all related data is deleted atomically
      const deletedProduct = await prisma.$transaction(async (tx) => {
        // Delete all product-related data from connected tables
        
        // 1. Delete variant images
        if (existingProduct.Variants && existingProduct.Variants.length > 0) {
          for (const variant of existingProduct.Variants) {
            if (variant.images && variant.images.length > 0) {
              console.log(`Deleting ${variant.images.length} images for variant ${variant.id}`);
              await tx.productImage.deleteMany({
                where: { variantId: variant.id }
              });
            }
          }
        }
        
        // 2. Delete product images
        if (existingProduct.ProductImages && existingProduct.ProductImages.length > 0) {
          console.log(`Deleting ${existingProduct.ProductImages.length} images for product ${id}`);
          await tx.productImage.deleteMany({
            where: { productId: id }
          });
        }
        
        // 3. Delete all variants
        if (existingProduct.Variants && existingProduct.Variants.length > 0) {
          console.log(`Deleting ${existingProduct.Variants.length} variants for product ${id}`);
          await tx.productVariant.deleteMany({
            where: { productId: id }
          });
        }
        
        // 4. Delete all bulk pricing
        if (existingProduct.BulkPricing && existingProduct.BulkPricing.length > 0) {
          console.log(`Deleting ${existingProduct.BulkPricing.length} bulk pricing rules for product ${id}`);
          await tx.bulkPricing.deleteMany({
            where: { productId: id }
          });
        }
        
        // 5. Delete any cart items that reference this product
        const deletedCartItems = await tx.cartItem.deleteMany({
          where: { productId: id }
        });
        if (deletedCartItems.count > 0) {
          console.log(`Deleted ${deletedCartItems.count} cart items referencing product ${id}`);
        }
        
        // 6. Delete order items that reference this product (if applicable)
        try {
          const deletedOrderItems = await tx.orderItem.deleteMany({
            where: { productId: id }
          });
          if (deletedOrderItems.count > 0) {
            console.log(`Deleted ${deletedOrderItems.count} order items referencing product ${id}`);
          }
        } catch (e) {
          console.log('Could not delete order items - they may be protected by foreign key constraints');
        }
        
        // Finally delete the product itself
        console.log(`Deleting product ${id}`);
        return tx.product.delete({
          where: { id }
        });
      });
      
      // Now delete the physical image files after DB transaction succeeds
      if (imagePaths.length > 0) {
        console.log(`Deleting ${imagePaths.length} physical image files`);
        let deletedCount = 0;
        let failedCount = 0;
        
        for (const filePath of imagePaths) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
            deletedCount++;
          } catch (fileError) {
            console.error(`Failed to delete file ${filePath}:`, fileError);
            failedCount++;
          }
        }
        
        console.log(`Successfully deleted ${deletedCount} files. Failed to delete ${failedCount} files.`);
      }
      
      return {
        status: 'success',
        data: { item: deletedProduct },
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      return {
        status: 'error',
        data: { item: null },
        message: error instanceof Error ? error.message : 'Failed to delete product',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async testConnection(): Promise<ApiResponse<{ connected: boolean }>> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'success',
        data: { connected: true },
      };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return {
        status: 'error',
        data: { connected: false },
        message: error instanceof Error ? error.message : 'Failed to test database connection',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getCategories(): Promise<ApiResponse<{ items: string[] }>> {
    try {
      const categories = await prisma.product.findMany({
        distinct: ['category'],
        select: {
          category: true,
        },
        orderBy: {
          category: 'asc',
        }
      }).then((result: any[]) => result.map((item: any) => item.category));
      
      return {
        status: 'success',
        data: { items: categories },
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        status: 'error',
        data: { items: [] },
        message: error instanceof Error ? error.message : 'Failed to get categories',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getCategoryCount(categoryId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const count = await prisma.product.count({
        where: {
          category: categoryId,
        },
      });
      
      return {
        status: 'success',
        data: { count },
      };
    } catch (error) {
      console.error('Error getting category count:', error);
      return {
        status: 'error',
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Failed to get category count',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  async getPriceForQuantity(productId: string, quantity: number): Promise<ApiResponse<{ price: number | null }>> {
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
        return {
          status: 'success',
          data: { price: product?.price ? Number(product.price) : null },
        };
      }

      // Find the applicable bulk pricing tier based on quantity
      const applicableTier = bulkPricing.find((tier: any) => quantity >= tier.minQuantity);
      
      if (!applicableTier) {
        // No applicable tier found, return the product's base price
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { price: true },
        });
        return {
          status: 'success',
          data: { price: product?.price ? Number(product.price) : null },
        };
      }

      return {
        status: 'success',
        data: { price: Number(applicableTier.price) },
      };
    } catch (error) {
      console.error(`Error getting price for product ${productId} and quantity ${quantity}:`, error);
      return {
        status: 'error',
        data: { price: null },
        message: error instanceof Error ? error.message : 'Failed to get price',
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  },

  // Helper function to format image URLs
  formatImageUrl(imageUrl: string): string {
    if (!imageUrl) return '/images/products/placeholder.jpg';
    
    if (imageUrl.startsWith('http')) return imageUrl;
    
    if (imageUrl.startsWith('/images/products/')) return imageUrl;
    
    if (imageUrl.startsWith('images/products/')) {
      return '/' + imageUrl;
    }
    
    // Extract just the filename if it's a path
    const filename = imageUrl.split('/').pop();
    return `/images/products/${filename || 'placeholder.jpg'}`;
  },
};
