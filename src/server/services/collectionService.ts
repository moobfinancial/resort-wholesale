import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

type CreateCollectionInput = {
  name: string;
  description: string;
  imageUrl?: string;
  isActive?: boolean;
};

export const collectionService = {
  async createCollection(data: CreateCollectionInput) {
    const collectionData: Prisma.CollectionCreateInput = {
      ...data,
      id: crypto.randomUUID(), // Generate a unique ID
      isActive: data.isActive ?? true,
      updatedAt: new Date(), // Add the updatedAt field with current date
    };

    return prisma.collection.create({
      data: collectionData,
    });
  },

  async getCollection(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        Product: true,
      },
    });
  },

  async updateCollection(id: string, data: Partial<CreateCollectionInput>) {
    return prisma.collection.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  async listCollections(params?: {
    where?: Prisma.CollectionWhereInput;
    orderBy?: Prisma.CollectionOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 10 } = params || {};
    
    const skip = (page - 1) * limit;
    
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.collection.count({ where }),
    ]);

    // Manually calculate product counts since the relation may not be available in the schema
    const formattedCollections = collections.map(collection => ({
      ...collection,
      productCount: collection.Product ? collection.Product.length : 0,
    }));

    return {
      collections: formattedCollections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getActiveCollections() {
    try {
      const collections = await prisma.collection.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              Product: true
            }
          }
        }
      });

      // Format collections to include product count
      return collections.map(collection => ({
        ...collection,
        productCount: collection._count.Product
      }));
    } catch (error) {
      console.error('Error fetching active collections:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  async getCollectionProducts(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        Product: {
          include: {
            BulkPricing: true,
            Supplier: true,
          },
        },
      },
    });

    return collection?.Product || [];
  },

  async addProductsToCollection(collectionId: string, productIds: string[]) {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        Product: {
          connect: productIds.map(id => ({ id })),
        },
        updatedAt: new Date(),
      },
    });
  },

  async removeProductFromCollection(collectionId: string, productId: string) {
    return prisma.collection.update({
      where: { id: collectionId },
      data: {
        Product: {
          disconnect: { id: productId },
        },
        updatedAt: new Date(),
      },
    });
  },

  async deleteCollection(id: string) {
    return prisma.collection.delete({
      where: { id },
    });
  },
};
