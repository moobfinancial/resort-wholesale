import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import WelcomeSection from '../components/WelcomeSection';
import FeaturedCategories from '../components/FeaturedCategories';
import JustArrived from '../components/JustArrived';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import { useProductStore } from '../stores/frontendProductStore';
import { ArrowRight } from 'lucide-react';

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
    fetchFeaturedProducts();
    fetchNewArrivals();
  }, [fetchFeaturedProducts, fetchNewArrivals]);
  
  return (
    <>
      <Hero />
      <WelcomeSection />
      <FeaturedCategories />
      
      {/* New Arrivals */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Just Arrived</h2>
            <Link 
              to="/products?sort=newest" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              View all new arrivals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading...</div>
            ) : error ? (
              <div className="col-span-full text-center py-12 text-red-600">{error}</div>
            ) : newArrivals?.length > 0 ? (
              newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  pricingMode="wholesale"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">No new arrivals found</div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link 
              to="/products" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              View all products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading...</div>
            ) : error ? (
              <div className="col-span-full text-center py-12 text-red-600">{error}</div>
            ) : featuredProducts?.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  pricingMode="wholesale"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">No featured products found</div>
            )}
          </div>
        </div>
      </section>
      
      <Testimonials />
      <Newsletter />
    </>
  );
}
