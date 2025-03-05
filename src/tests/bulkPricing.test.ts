import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bulkPricingService } from '../server/services/bulkPricingService';
import { prisma } from '../server/db';

// Mock Prisma client
vi.mock('../server/db', () => ({
  prisma: {
    bulkPricing: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => await callback(prisma)),
  },
}));

describe('Bulk Pricing Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getByProductId', () => {
    it('should return bulk pricing tiers for a product', async () => {
      const mockTiers = [
        { id: '1', productId: 'product123', minQuantity: 10, price: 9.5 },
        { id: '2', productId: 'product123', minQuantity: 25, price: 9.0 },
        { id: '3', productId: 'product123', minQuantity: 50, price: 8.5 },
      ];

      vi.mocked(prisma.bulkPricing.findMany).mockResolvedValue(mockTiers);

      const result = await bulkPricingService.getByProductId('product123');
      
      expect(prisma.bulkPricing.findMany).toHaveBeenCalledWith({
        where: { productId: 'product123' },
        orderBy: { minQuantity: 'asc' },
      });
      
      expect(result).toEqual(mockTiers);
    });

    it('should return empty array on error', async () => {
      vi.mocked(prisma.bulkPricing.findMany).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.getByProductId('product123');
      
      expect(result).toEqual([]);
    });
  });

  describe('updateProductTiers', () => {
    it('should update all tiers for a product and return true', async () => {
      const productId = 'product123';
      const tiers = [
        { minQuantity: 10, price: 9.5 },
        { minQuantity: 25, price: 9.0 },
      ];

      vi.mocked(prisma.bulkPricing.deleteMany).mockResolvedValue({ count: 3 });
      vi.mocked(prisma.bulkPricing.createMany).mockResolvedValue({ count: 2 });

      const result = await bulkPricingService.updateProductTiers(productId, tiers);
      
      expect(prisma.bulkPricing.deleteMany).toHaveBeenCalledWith({
        where: { productId },
      });
      
      expect(prisma.bulkPricing.createMany).toHaveBeenCalledWith({
        data: tiers.map(tier => ({
          productId,
          minQuantity: tier.minQuantity,
          price: tier.price,
        })),
      });
      
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(prisma.bulkPricing.deleteMany).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.updateProductTiers('product123', []);
      
      expect(result).toBe(false);
    });
  });

  describe('addTier', () => {
    it('should add a new tier and return it', async () => {
      const productId = 'product123';
      const tier = { minQuantity: 100, price: 8.0 };
      
      const mockCreatedTier = { 
        id: '4', 
        productId, 
        minQuantity: 100, 
        price: 8.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.bulkPricing.create).mockResolvedValue(mockCreatedTier);

      const result = await bulkPricingService.addTier(productId, tier);
      
      expect(prisma.bulkPricing.create).toHaveBeenCalledWith({
        data: {
          productId,
          minQuantity: tier.minQuantity,
          price: tier.price,
        },
      });
      
      expect(result).toEqual(mockCreatedTier);
    });

    it('should return null on error', async () => {
      vi.mocked(prisma.bulkPricing.create).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.addTier('product123', { minQuantity: 10, price: 9.0 });
      
      expect(result).toBeNull();
    });
  });

  describe('updateTier', () => {
    it('should update a tier and return it', async () => {
      const tierId = '1';
      const data = { minQuantity: 15, price: 9.25 };
      
      const mockUpdatedTier = { 
        id: tierId, 
        productId: 'product123', 
        minQuantity: 15, 
        price: 9.25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.bulkPricing.update).mockResolvedValue(mockUpdatedTier);

      const result = await bulkPricingService.updateTier(tierId, data);
      
      expect(prisma.bulkPricing.update).toHaveBeenCalledWith({
        where: { id: tierId },
        data: {
          minQuantity: data.minQuantity,
          price: data.price,
        },
      });
      
      expect(result).toEqual(mockUpdatedTier);
    });

    it('should return null on error', async () => {
      vi.mocked(prisma.bulkPricing.update).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.updateTier('1', { price: 10 });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteTier', () => {
    it('should delete a tier and return true', async () => {
      vi.mocked(prisma.bulkPricing.delete).mockResolvedValue({ id: '1' } as any);

      const result = await bulkPricingService.deleteTier('1');
      
      expect(prisma.bulkPricing.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(prisma.bulkPricing.delete).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.deleteTier('1');
      
      expect(result).toBe(false);
    });
  });

  describe('getPriceForQuantity', () => {
    it('should return the appropriate bulk price for a quantity', async () => {
      const productId = 'product123';
      const quantity = 30;
      
      // Mock the product lookup
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        price: 10.0,
      } as any);
      
      // Mock the tier lookup - this is the tier that applies (25-49 units)
      vi.mocked(prisma.bulkPricing.findFirst).mockResolvedValue({
        id: '2',
        productId,
        minQuantity: 25,
        price: 9.0,
      } as any);

      const result = await bulkPricingService.getPriceForQuantity(productId, quantity);
      
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        select: { price: true },
      });
      
      expect(prisma.bulkPricing.findFirst).toHaveBeenCalledWith({
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
      
      expect(result).toBe(9.0);
    });

    it('should return the base product price when no tier applies', async () => {
      const productId = 'product123';
      const quantity = 5; // Below any tier
      
      // Mock the product lookup
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        price: 10.0,
      } as any);
      
      // No applicable tier found
      vi.mocked(prisma.bulkPricing.findFirst).mockResolvedValue(null);

      const result = await bulkPricingService.getPriceForQuantity(productId, quantity);
      
      expect(result).toBe(10.0);
    });

    it('should return null if product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const result = await bulkPricingService.getPriceForQuantity('nonexistent', 10);
      
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(prisma.product.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await bulkPricingService.getPriceForQuantity('product123', 10);
      
      expect(result).toBeNull();
    });
  });
});
