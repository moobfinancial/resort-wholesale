import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import WelcomeSection from '../components/WelcomeSection';
import FeaturedCategories from '../components/FeaturedCategories';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import { useProductStore } from '../stores/frontendProductStore';
import { ArrowRight } from 'lucide-react';
import type { Product } from '../types/product';

export default function Home() {
  const { 
    featuredProducts,
    newArrivals,
    loading,
    error,
    fetchFeaturedProducts,
    fetchNewArrivals
  } = useProductStore();

  useEffect(() => {
    console.log('Home component mounted, fetching products...');
    fetchFeaturedProducts();
    fetchNewArrivals();
  }, [fetchFeaturedProducts, fetchNewArrivals]);
  
  useEffect(() => {
    console.log('Featured products updated:', featuredProducts);
    console.log('New arrivals updated:', newArrivals);
  }, [featuredProducts, newArrivals]);
  
  return (
    <>
      <Hero />
      <WelcomeSection />
      
      {/* Categories/Collections Section */}
      <FeaturedCategories />
      
      <div className="bg-white">
        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">New Arrivals</h2>
              <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {newArrivals.map((product) => {
                  console.log('Rendering new arrival:', product.id, product.name, product.imageUrl);
                  return (
                    <ProductCard 
                      key={`new-arrival-${product.id}`} 
                      product={product} 
                      pricingMode="wholesale" 
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Featured Products</h2>
              <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {featuredProducts.map((product) => {
                  console.log('Rendering featured product:', product.id, product.name, product.imageUrl);
                  return (
                    <ProductCard 
                      key={`featured-${product.id}`} 
                      product={product} 
                      pricingMode="wholesale" 
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      <Testimonials />
      <Newsletter />
    </>
  );
}
