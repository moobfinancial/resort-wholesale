import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  minOrder?: number;
  bulkPricing?: Array<{
    minQuantity: number;
    price: number;
  }>;
}

interface ProductCardProps {
  product: Product;
  pricingMode: 'retail' | 'wholesale';
}

export default function ProductCard({ product, pricingMode }: ProductCardProps) {
  const lowestBulkPrice = product.bulkPricing?.reduce((min, pricing) => 
    pricing.price < min ? pricing.price : min, 
    product.price
  );

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-center object-cover group-hover:opacity-75"
        />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <h3 className="text-sm text-gray-700">{product.name}</h3>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(product.price)}
          </p>
        </div>
        {pricingMode === 'wholesale' && lowestBulkPrice && lowestBulkPrice < product.price && (
          <p className="text-sm text-blue-600">
            As low as {formatCurrency(lowestBulkPrice)} in bulk
          </p>
        )}
        <p className="text-sm text-gray-500">{product.category}</p>
        {pricingMode === 'wholesale' && product.minOrder && product.minOrder > 1 && (
          <p className="text-sm text-gray-500">
            Min. order: {product.minOrder} units
          </p>
        )}
      </div>
    </Link>
  );
}