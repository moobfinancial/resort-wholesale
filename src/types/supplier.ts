export interface Supplier {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  productVariants?: Array<{
    id: string;
    sku: string;
    price: number;
  }>;
  bulkPricing?: Array<{
    minQuantity: number;
    price: number;
  }>;
}
