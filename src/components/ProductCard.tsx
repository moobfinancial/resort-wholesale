import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  imageUrl: string;
  category: string;
  minOrder?: number;
  bulkPricing?: Array<{
    minQuantity: number;
    price: number | string;
  }>;
}

interface ProductCardProps {
  product: Product;
  pricingMode?: 'retail' | 'wholesale';
}

export default function ProductCard({ product, pricingMode = 'retail' }: ProductCardProps) {
  // Convert prices to numbers for comparison
  const getNumericPrice = (price: number | string): number => {
    if (typeof price === 'number') return price;
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  };

  const productPrice = getNumericPrice(product.price);
  
  const lowestBulkPrice = product.bulkPricing?.reduce((min, pricing) => {
    const currentPrice = getNumericPrice(pricing.price);
    return currentPrice < min ? currentPrice : min;
  }, productPrice);

  return (
    <Link to={`/products/${product.id}`} className="group h-80">
      <div className="w-full h-64 aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        <img
          src={product.imageUrl || '/images/products/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-center object-cover group-hover:opacity-75"
          onError={(e) => {
            console.log('Image failed to load in ProductCard:', product.imageUrl);
            const target = e.target as HTMLImageElement;
            const currentSrc = target.src;
            
            // Prevent infinite loop - if already trying to load placeholder, stop
            if (currentSrc.includes('placeholder')) {
              console.log('Already using placeholder, stopping error handling');
              return;
            }
            
            // Try different image paths in sequence
            if (product.imageUrl) {
              const filename = product.imageUrl.split('/').pop();
              if (filename) {
                // Try with /uploads/products/ path first
                if (!currentSrc.includes('/uploads/products/')) {
                  console.log('Trying with /uploads/products/ path');
                  target.src = `/uploads/products/${filename}`;
                  return; // Exit early to give this a chance to load
                }
                // Then try with /images/products/ path 
                else if (!currentSrc.includes('/images/products/')) {
                  console.log('Trying with /images/products/ path');
                  target.src = `/images/products/${filename}`;
                  return; // Exit early to give this a chance to load
                }
              }
            }
            
            // Fallback to placeholder image
            console.log('Using placeholder image as final fallback');
            target.src = '/images/products/placeholder.svg';
          }}
        />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <h3 className="text-sm text-gray-700">{product.name}</h3>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(product.price)}
          </p>
        </div>
        {pricingMode === 'wholesale' && lowestBulkPrice && lowestBulkPrice < productPrice && (
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