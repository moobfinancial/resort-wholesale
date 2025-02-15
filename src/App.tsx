import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import { PricingMode } from './types';

const FEATURED_PRODUCTS = [
  {
    id: 'featured-1',
    name: 'Handwoven Jamaican Basket',
    description: 'Traditional handwoven basket made from local materials',
    price: 79.99,
    imageUrl: '/images/products/basket.jpg',
    category: 'Handicrafts',
    tags: ['handmade', 'basket', 'traditional'],
    stock: 50,
    sku: 'HWB-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-2',
    name: 'Seashell Necklace',
    description: 'Handcrafted necklace with authentic Caribbean seashells',
    price: 45.99,
    imageUrl: '/images/products/necklace.jpg',
    category: 'Jewelry',
    tags: ['handmade', 'seashell', 'necklace'],
    stock: 20,
    sku: 'SN-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-3',
    name: 'Jamaican Art Print',
    description: 'Limited edition print by local Jamaican artist',
    price: 129.99,
    imageUrl: '/images/products/art.jpg',
    category: 'Art',
    tags: ['print', 'art', 'limited edition'],
    stock: 10,
    sku: 'JAP-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-4',
    name: 'Beach Hat Collection',
    description: 'Set of handwoven beach hats in various styles',
    price: 89.99,
    imageUrl: '/images/products/hats.jpg',
    category: 'Fashion',
    tags: ['handmade', 'beach hat', 'collection'],
    stock: 30,
    sku: 'BHC-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-5',
    name: 'Tropical Sandals',
    description: 'Handmade leather sandals with tropical designs',
    price: 59.99,
    imageUrl: '/images/products/sandals.jpg',
    category: 'Footwear',
    tags: ['handmade', 'leather', 'sandals'],
    stock: 25,
    sku: 'TS-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-6',
    name: 'Island Jewelry Box',
    description: 'Hand-carved wooden jewelry box with mother of pearl inlay',
    price: 149.99,
    imageUrl: '/images/products/jewelry-box.jpg',
    category: 'Home Decor',
    tags: ['handmade', 'wooden', 'jewelry box'],
    stock: 15,
    sku: 'IJB-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-7',
    name: 'Beach Towel Set',
    description: 'Set of 2 premium cotton beach towels with tropical prints',
    price: 69.99,
    imageUrl: '/images/products/towels.jpg',
    category: 'Home Goods',
    tags: ['beach towel', 'tropical print', 'set'],
    stock: 40,
    sku: 'BTS-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  },
  {
    id: 'featured-8',
    name: 'Shell Wind Chimes',
    description: 'Handcrafted wind chimes made with local shells',
    price: 39.99,
    imageUrl: '/images/products/shell-chimes.jpg',
    category: 'Home Decor',
    tags: ['handmade', 'shell', 'wind chimes'],
    stock: 35,
    sku: 'SWC-001',
    minOrder: 1,
    bulkPricing: [],
    isActive: true
  }
];

function App() {
  const [pricingMode, setPricingMode] = useState<PricingMode>('retail');

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <Header 
        pricingMode={pricingMode} 
        setPricingMode={setPricingMode}
      />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

export default App;