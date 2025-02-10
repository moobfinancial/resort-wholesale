import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import FeaturedCategories from './components/FeaturedCategories';
import ProductCard from './components/ProductCard';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import JustArrived from './components/JustArrived';
import Dashboard from './components/dashboard/Dashboard';
import { PricingMode } from './types';
import { ArrowRight } from 'lucide-react';

const FEATURED_PRODUCTS = [
  {
    id: 'featured-1',
    name: 'Handwoven Jamaican Basket',
    description: 'Traditional handwoven basket made from local materials',
    price: 79.99,
    wholesalePrice: 59.99,
    image: '/images/products/basket.jpg'
  },
  {
    id: 'featured-2',
    name: 'Seashell Necklace',
    description: 'Handcrafted necklace with authentic Caribbean seashells',
    price: 45.99,
    wholesalePrice: 35.99,
    image: '/images/products/necklace.jpg'
  },
  {
    id: 'featured-3',
    name: 'Jamaican Art Print',
    description: 'Limited edition print by local Jamaican artist',
    price: 129.99,
    wholesalePrice: 99.99,
    image: '/images/products/art.jpg'
  },
  {
    id: 'featured-4',
    name: 'Beach Hat Collection',
    description: 'Set of handwoven beach hats in various styles',
    price: 89.99,
    wholesalePrice: 69.99,
    image: '/images/products/hats.jpg'
  },
  {
    id: 'featured-5',
    name: 'Tropical Sandals',
    description: 'Handmade leather sandals with tropical designs',
    price: 59.99,
    wholesalePrice: 44.99,
    image: '/images/products/sandals.jpg'
  },
  {
    id: 'featured-6',
    name: 'Island Jewelry Box',
    description: 'Hand-carved wooden jewelry box with mother of pearl inlay',
    price: 149.99,
    wholesalePrice: 119.99,
    image: '/images/products/jewelry-box.jpg'
  },
  {
    id: 'featured-7',
    name: 'Beach Towel Set',
    description: 'Set of 2 premium cotton beach towels with tropical prints',
    price: 69.99,
    wholesalePrice: 54.99,
    image: '/images/products/towels.jpg'
  },
  {
    id: 'featured-8',
    name: 'Shell Wind Chimes',
    description: 'Handcrafted wind chimes made with local shells',
    price: 39.99,
    wholesalePrice: 29.99,
    image: '/images/products/shell-chimes.jpg'
  }
];

function App() {
  const [pricingMode, setPricingMode] = useState<PricingMode>('retail');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const HomePage = () => (
    <>
      <Hero />
      <WelcomeSection />
      <FeaturedCategories />
      <JustArrived pricingMode={pricingMode} />
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <a 
              href="#" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              View all products
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                pricingMode={pricingMode}
              />
            ))}
          </div>
        </div>
      </section>
      <Testimonials />
      <Newsletter />
    </>
  );

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header 
          pricingMode={pricingMode} 
          setPricingMode={setPricingMode}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/dashboard/*" 
              element={
                isLoggedIn ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;