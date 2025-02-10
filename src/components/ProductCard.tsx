import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product, PricingMode } from '../types';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number;
  image: string;
  minWholesaleQty: number;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
  pricingMode: PricingMode;
}

export default function ProductCard({ product, pricingMode }: ProductCardProps) {
  const displayPrice = pricingMode === 'retail' ? product.price : product.wholesalePrice;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <Heart className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-xl font-bold text-blue-900">${displayPrice.toFixed(2)}</p>
            {pricingMode === 'wholesale' && (
              <p className="text-sm text-gray-600">
                Min. Order: {product.minWholesaleQty} units
              </p>
            )}
          </div>
          
          <button className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
            <ShoppingCart className="h-5 w-5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}