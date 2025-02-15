export interface BulkPricing {
  id?: string;
  minQuantity: number;
  price: number | string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number | string;
  stock: number;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number | string;
  imageUrl: string;
  sku: string;
  stock: number;
  minOrder: number;
  isActive: boolean;
  bulkPricing?: BulkPricing[];
  createdAt?: Date;
  updatedAt?: Date;
}
