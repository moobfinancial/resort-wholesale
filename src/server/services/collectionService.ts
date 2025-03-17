import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

type CollectionResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: string;
};

interface CreateCollectionInput {
  name: string;
  description?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export const collectionService = {
  // Test database connection
  async testConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },

  // List collections with pagination
  async listCollections({ 
    page = 1, 
    limit = 10,
    orderBy = { createdAt: 'desc' } as Prisma.CollectionOrderByWithRelationInput
  }): Promise<CollectionResponse<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable',
          data: {
            items: [],
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        };
      }

      const skip = (page - 1) * limit;
      
      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          skip,
          take: limit,
          orderBy,
          include: {
            _count: {
              select: { Products: true }
            }
          }
        }),
        prisma.collection.count()
      ]);

      // Format collections with product count
      const formattedCollections = collections.map(collection => ({
        ...collection,
        productCount: collection._count.Products,
        _count: undefined
      }));

      return {
        status: 'success',
        data: {
          items: formattedCollections,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error listing collections:', error);
      return {
        status: 'error',
        message: 'Failed to list collections',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }
  },

  // Get active collections
  async getActiveCollections(): Promise<CollectionResponse<{
    items: any[];
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable',
          data: {
            items: []
          }
        };
      }

      const collections = await prisma.collection.findMany({
        where: {
          isActive: true
        },
        include: {
          _count: {
            select: { Products: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Format collections with product count
      const formattedCollections = collections.map(collection => ({
        ...collection,
        productCount: collection._count.Products,
        _count: undefined
      }));

      return {
        status: 'success',
        data: {
          items: formattedCollections
        }
      };
    } catch (error) {
      console.error('Error getting active collections:', error);
      return {
        status: 'error',
        message: 'Failed to get active collections',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          items: []
        }
      };
    }
  },

  // Get a single collection
  async getCollection(id: string): Promise<CollectionResponse<{
    item: any | null;
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable',
          data: {
            item: null
          }
        };
      }

      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          _count: {
            select: { Products: true }
          }
        }
      });

      if (!collection) {
        return {
          status: 'error',
          message: 'Collection not found',
          data: {
            item: null
          }
        };
      }

      // Format collection with product count
      const formattedCollection = {
        ...collection,
        productCount: collection._count.Products,
        _count: undefined
      };

      return {
        status: 'success',
        data: {
          item: formattedCollection
        }
      };
    } catch (error) {
      console.error('Error getting collection:', error);
      return {
        status: 'error',
        message: 'Failed to get collection',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          item: null
        }
      };
    }
  },

  // Create a new collection
  async createCollection({ name, description, imageUrl, isActive }: CreateCollectionInput): Promise<CollectionResponse<{
    item: any;
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable'
        };
      }

      const collection = await prisma.collection.create({
        data: {
          name,
          description,
          imageUrl,
          isActive: isActive ?? true,
          id: crypto.randomUUID()
        },
        include: {
          _count: {
            select: { Products: true }
          }
        }
      });

      // Format collection with product count
      const formattedCollection = {
        ...collection,
        productCount: collection._count.Products,
        _count: undefined
      };

      return {
        status: 'success',
        data: {
          item: formattedCollection
        }
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      return {
        status: 'error',
        message: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Update a collection
  async updateCollection(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string | null;
    isActive?: boolean;
  }): Promise<CollectionResponse<{
    item: any;
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable'
        };
      }

      const collection = await prisma.collection.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { Products: true }
          }
        }
      });

      // Format collection with product count
      const formattedCollection = {
        ...collection,
        productCount: collection._count.Products,
        _count: undefined
      };

      return {
        status: 'success',
        data: {
          item: formattedCollection
        }
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      return {
        status: 'error',
        message: 'Failed to update collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Delete a collection
  async deleteCollection(id: string): Promise<CollectionResponse<null>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable'
        };
      }

      await prisma.collection.delete({
        where: { id }
      });

      return {
        status: 'success',
        data: null
      };
    } catch (error) {
      console.error('Error deleting collection:', error);
      return {
        status: 'error',
        message: 'Failed to delete collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get products in a collection
  async getCollectionProducts(collectionId: string): Promise<CollectionResponse<{
    items: any[];
  }>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable',
          data: {
            items: []
          }
        };
      }

      const products = await prisma.product.findMany({
        where: {
          collectionId
        },
        include: {
          BulkPricing: true,
          Variants: true
        }
      });

      return {
        status: 'success',
        data: {
          items: products
        }
      };
    } catch (error) {
      console.error('Error getting collection products:', error);
      return {
        status: 'error',
        message: 'Failed to get collection products',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: {
          items: []
        }
      };
    }
  },

  // Add products to a collection
  async addProductsToCollection(collectionId: string, productIds: string[]): Promise<CollectionResponse<null>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable'
        };
      }

      // Verify the collection exists
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId }
      });
      
      if (!collection) {
        return {
          status: 'error',
          message: 'Collection not found'
        };
      }
      
      // Update each product's collectionId field
      const updatePromises = productIds.map(productId => 
        prisma.product.update({
          where: { id: productId },
          data: { collectionId }
        })
      );
      
      await Promise.all(updatePromises);

      return {
        status: 'success',
        data: null
      };
    } catch (error) {
      console.error('Error adding products to collection:', error);
      return {
        status: 'error',
        message: 'Failed to add products to collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Remove product from a collection
  async removeProductFromCollection(collectionId: string, productId: string): Promise<CollectionResponse<null>> {
    try {
      // Check database connection first
      const dbConnected = await this.testConnection();
      
      if (!dbConnected) {
        return {
          status: 'error',
          message: 'Database unavailable'
        };
      }

      // Verify the collection exists
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId }
      });
      
      if (!collection) {
        return {
          status: 'error',
          message: 'Collection not found'
        };
      }
      
      // Set product's collectionId to null
      await prisma.product.update({
        where: { id: productId },
        data: { collectionId: null }
      });

      return {
        status: 'success',
        data: null
      };
    } catch (error) {
      console.error('Error removing product from collection:', error);
      return {
        status: 'error',
        message: 'Failed to remove product from collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
