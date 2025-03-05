import React from 'react';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product, PricingMode } from '../types';

interface JustArrivedProps {
  pricingMode: PricingMode;
}

const NEW_ARRIVALS: Product[] = [
  {
    id: 'new-1',
    name: 'Blue Mountain Coffee - Limited Edition',
    description: 'Premium roasted Jamaican Blue Mountain coffee in a collector\'s tin',
    price: 49.99,
    wholesalePrice: 39.99,
    image: '/images/products/blue-mountain-coffee.jpg',
    isNew: true
  },
  {
    id: 'new-2',
    name: 'Handmade Straw Beach Bag',
    description: 'Artisanal woven straw beach bag with leather handles',
    price: 89.99,
    wholesalePrice: 69.99,
    image: '/images/products/straw-bag.jpg',
    isNew: true
  },
  {
    id: 'new-3',
    name: 'Island Spice Gift Set',
    description: 'Collection of authentic Jamaican spices and seasonings',
    price: 34.99,
    wholesalePrice: 24.99,
    image: '/images/products/spice-set.jpg',
    isNew: true
  },
  {
    id: 'new-4',
    name: 'Bamboo Wind Chimes',
    description: 'Hand-crafted bamboo wind chimes with tropical motifs',
    price: 29.99,
    wholesalePrice: 19.99,
    image: '/images/products/wind-chimes.jpg',
    isNew: true
  }
];

export default function JustArrived({ pricingMode }: JustArrivedProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Just Arrived</h2>
          <a 
            href="#" 
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            View all new arrivals
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {NEW_ARRIVALS.map((product) => (
            <div key={product.id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  New
                </span>
              </div>
              <ProductCard
                product={product}
                pricingMode={pricingMode}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
