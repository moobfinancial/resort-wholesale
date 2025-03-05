import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import productVariantService from '../server/services/productVariantService';
import { prisma } from '../server/db';

// Mock Prisma client
vi.mock('../server/db', () => ({
  prisma: {
    productVariant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Product Variant Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductVariants', () => {
    it('should return variants for a product', async () => {
      const mockVariants = [
        { id: '1', sku: 'TEST-RED-M', price: 10, stock: 5, attributes: { color: 'Red', size: 'M' } },
        { id: '2', sku: 'TEST-BLUE-L', price: 10, stock: 3, attributes: { color: 'Blue', size: 'L' } },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValue(mockVariants);

      const result = await productVariantService.getProductVariants('product123');
      
      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { productId: 'product123' },
        orderBy: { createdAt: 'asc' },
      });
      
      expect(result).toEqual(mockVariants);
    });

    it('should return empty array on error', async () => {
      vi.mocked(prisma.productVariant.findMany).mockRejectedValue(new Error('Database error'));

      const result = await productVariantService.getProductVariants('product123');
      
      expect(result).toEqual([]);
    });
  });

  describe('getVariantById', () => {
    it('should return a variant by id', async () => {
      const mockVariant = { 
        id: '1', 
        sku: 'TEST-RED-M', 
        price: 10, 
        stock: 5, 
        attributes: { color: 'Red', size: 'M' } 
      };

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(mockVariant);

      const result = await productVariantService.getVariantById('1');
      
      expect(prisma.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      
      expect(result).toEqual(mockVariant);
    });

    it('should return null if variant not found', async () => {
      vi.mocked(prisma.productVariant.findUnique).mockResolvedValue(null);

      const result = await productVariantService.getVariantById('nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('createVariant', () => {
    it('should create and return a new variant', async () => {
      const variantData = {
        productId: 'product123',
        sku: 'TEST-GREEN-S',
        price: 15,
        stock: 10,
        attributes: { color: 'Green', size: 'S' },
      };

      const mockCreatedVariant = { 
        id: '3', 
        ...variantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productVariant.create).mockResolvedValue(mockCreatedVariant);

      const result = await productVariantService.createVariant(variantData);
      
      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: variantData,
      });
      
      expect(result).toEqual(mockCreatedVariant);
    });

    it('should return null on error', async () => {
      const variantData = {
        productId: 'product123',
        sku: 'TEST-GREEN-S',
        price: 15,
        stock: 10,
        attributes: { color: 'Green', size: 'S' },
      };

      vi.mocked(prisma.productVariant.create).mockRejectedValue(new Error('Database error'));

      const result = await productVariantService.createVariant(variantData);
      
      expect(result).toBeNull();
    });
  });

  describe('updateVariant', () => {
    it('should update and return a variant', async () => {
      const variantId = '1';
      const updateData = {
        sku: 'TEST-RED-M-UPDATED',
        price: 12,
        stock: 8,
      };

      const mockUpdatedVariant = { 
        id: variantId, 
        productId: 'product123',
        ...updateData,
        attributes: { color: 'Red', size: 'M' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productVariant.update).mockResolvedValue(mockUpdatedVariant);

      const result = await productVariantService.updateVariant(variantId, updateData);
      
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: variantId },
        data: updateData,
      });
      
      expect(result).toEqual(mockUpdatedVariant);
    });

    it('should return null on error', async () => {
      vi.mocked(prisma.productVariant.update).mockRejectedValue(new Error('Database error'));

      const result = await productVariantService.updateVariant('1', { price: 20 });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteVariant', () => {
    it('should delete a variant and return true', async () => {
      vi.mocked(prisma.productVariant.delete).mockResolvedValue({ id: '1' } as any);

      const result = await productVariantService.deleteVariant('1');
      
      expect(prisma.productVariant.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      vi.mocked(prisma.productVariant.delete).mockRejectedValue(new Error('Database error'));

      const result = await productVariantService.deleteVariant('1');
      
      expect(result).toBe(false);
    });
  });
});
