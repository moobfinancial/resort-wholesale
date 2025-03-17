import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Define common Supplier interface based on our schema definition
export interface SupplierData {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: any;
  website?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderCount?: number;
}

// Define pagination params interface
export interface PaginationParams {
  page: number;
  limit: number;
}

// Define pagination result
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Supplier service with safe error handling for missing model
class SupplierService {
  // Get all suppliers with pagination
  async getAllSuppliers({ page, limit }: PaginationParams): Promise<PaginationResult<SupplierData>> {
    try {
      const skip = (page - 1) * limit;
      
      // Use try-catch to handle potential errors if the model doesn't exist
      try {
        // Get total count and suppliers with pagination
        const [totalCount, suppliers] = await Promise.all([
          prisma.$executeRaw`SELECT COUNT(*) FROM "Supplier"`.then(
            (result: any) => Number(result[0]?.count || 0)
          ),
          prisma.$queryRaw`
            SELECT * FROM "Supplier"
            ORDER BY "createdAt" DESC
            LIMIT ${limit} OFFSET ${skip}
          `
        ]);
        
        // Format suppliers
        const formattedSuppliers = Array.isArray(suppliers) 
          ? suppliers.map((supplier: any) => ({
              ...supplier,
              orderCount: 0
            }))
          : [];
        
        // Calculate pagination values
        const totalPages = Math.ceil(totalCount / limit);
        
        return {
          items: formattedSuppliers as SupplierData[],
          total: totalCount,
          page,
          limit,
          totalPages
        };
      } catch (error) {
        console.error('Error accessing supplier model:', error);
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    } catch (error) {
      console.error('Error fetching all suppliers:', error);
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }
  
  // Get a supplier by ID
  async getSupplierById(id: string): Promise<SupplierData | null> {
    try {
      // Use try-catch to handle potential errors if the model doesn't exist
      try {
        const result = await prisma.$queryRaw`
          SELECT * FROM "Supplier" WHERE id = ${id}
        `;
        
        const suppliers = Array.isArray(result) ? result : [];
        
        if (suppliers.length === 0) {
          return null;
        }
        
        return {
          ...suppliers[0],
          orderCount: 0
        } as SupplierData;
      } catch (error) {
        console.error('Error accessing supplier model:', error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      return null;
    }
  }
  
  // Create a new supplier
  async createSupplier(data: Omit<SupplierData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierData | null> {
    try {
      // Use try-catch to handle potential errors if the model doesn't exist
      try {
        const id = uuidv4();
        const now = new Date();
        
        await prisma.$executeRaw`
          INSERT INTO "Supplier" (
            id, name, "contactName", email, phone, address, website, notes, "isActive", "createdAt", "updatedAt"
          ) VALUES (
            ${id}, 
            ${data.name}, 
            ${data.contactName}, 
            ${data.email}, 
            ${data.phone}, 
            ${JSON.stringify(data.address)}, 
            ${data.website || null}, 
            ${data.notes || null}, 
            ${data.isActive || true}, 
            ${now}, 
            ${now}
          )
        `;
        
        const result = await prisma.$queryRaw`
          SELECT * FROM "Supplier" WHERE id = ${id}
        `;
        
        const suppliers = Array.isArray(result) ? result : [];
        
        if (suppliers.length === 0) {
          return null;
        }
        
        return suppliers[0] as SupplierData;
      } catch (error) {
        console.error('Error accessing supplier model:', error);
        throw new Error('Supplier model is not available');
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }
  
  // Update a supplier
  async updateSupplier(id: string, data: Partial<SupplierData>): Promise<SupplierData | null> {
    try {
      // Use try-catch to handle potential errors if the model doesn't exist
      try {
        // Build update query dynamically
        const now = new Date();
        let updateQuery = 'UPDATE "Supplier" SET "updatedAt" = $1';
        const params: any[] = [now];
        let paramIndex = 2;
        
        if (data.name) {
          updateQuery += `, name = $${paramIndex++}`;
          params.push(data.name);
        }
        
        if (data.contactName) {
          updateQuery += `, "contactName" = $${paramIndex++}`;
          params.push(data.contactName);
        }
        
        if (data.email) {
          updateQuery += `, email = $${paramIndex++}`;
          params.push(data.email);
        }
        
        if (data.phone) {
          updateQuery += `, phone = $${paramIndex++}`;
          params.push(data.phone);
        }
        
        if (data.address) {
          updateQuery += `, address = $${paramIndex++}`;
          params.push(JSON.stringify(data.address));
        }
        
        if (data.website !== undefined) {
          updateQuery += `, website = $${paramIndex++}`;
          params.push(data.website);
        }
        
        if (data.notes !== undefined) {
          updateQuery += `, notes = $${paramIndex++}`;
          params.push(data.notes);
        }
        
        if (data.isActive !== undefined) {
          updateQuery += `, "isActive" = $${paramIndex++}`;
          params.push(data.isActive);
        }
        
        updateQuery += ` WHERE id = $${paramIndex++} RETURNING *`;
        params.push(id);
        
        const result = await prisma.$queryRawUnsafe(updateQuery, ...params);
        
        const suppliers = Array.isArray(result) ? result : [];
        
        if (suppliers.length === 0) {
          return null;
        }
        
        return suppliers[0] as SupplierData;
      } catch (error) {
        console.error('Error accessing supplier model:', error);
        throw new Error('Supplier model is not available');
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }
  
  // Delete a supplier
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      // Use try-catch to handle potential errors if the model doesn't exist
      try {
        await prisma.$executeRaw`
          DELETE FROM "Supplier"
          WHERE id = ${id}
        `;
        
        return true;
      } catch (error) {
        console.error('Error accessing supplier model:', error);
        throw new Error('Supplier model is not available');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const supplierService = new SupplierService();
