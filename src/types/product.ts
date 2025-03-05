export interface BulkPricing {
  id?: string;
  productId: string;
  minQuantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductVariant {
  id?: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, any>;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageFile?: File;
  category: string;
  tags: string[];
  sku: string;
  stock: number;
  minOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew?: boolean;
  supplierId?: string;
  supplier?: Supplier;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariant[];
  bulkPricing?: BulkPricing[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: any;
  website?: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  category: string;
  subcategory?: string;
  paymentTerms: string;
  documents: string[];
}

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
