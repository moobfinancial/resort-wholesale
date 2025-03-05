import React from 'react';
import { useParams } from 'react-router-dom';
import BulkPricingManager from '../../components/admin/products/BulkPricingManager';
import ProductStatusManager from '../../components/admin/products/ProductStatusManager';
import StockManager from '../../components/admin/inventory/StockManager';
import { Decimal } from 'decimal.js';

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: Decimal;
  imageUrl: string;
  sku: string;
  stock: number;
  minOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const BulkPricingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <BulkPricingManager
      productId={id || ''}
      onUpdate={async (tiers) => {
        // TODO: Implement bulk pricing update logic
        console.log('Updating bulk pricing tiers:', tiers);
      }}
    />
  );
};

export const ProductStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const mockProduct: Product = {
    id: id || '',
    name: 'Sample Product',
    description: 'Sample product description',
    category: 'Default',
    tags: [],
    price: new Decimal('0.00'),
    imageUrl: '/placeholder.jpg',
    sku: 'SAMPLE-001',
    stock: 0,
    minOrder: 1,
    isActive: false,
    isFeatured: false,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return (
    <ProductStatusManager
      product={mockProduct}
      statusHistory={[]}
      onStatusUpdate={async (status) => {
        // TODO: Implement status update logic
        console.log('Updating product status:', status);
      }}
    />
  );
};

export const StockManagementPage: React.FC = () => {
  return (
    <StockManager
      products={[]}
      onStockUpdate={async (updates) => {
        // TODO: Implement stock update logic
        console.log('Updating stock levels:', updates);
      }}
    />
  );
};
