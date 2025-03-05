import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../stores/frontendProductStore';
import { ArrowRight } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export default function FeaturedCategories() {
  const { collections, loading, error, fetchCollections } = useProductStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Only show up to 4 collections on the home page
  const featuredCollections = collections.slice(0, 4);
  
  // Fallback categories in case no collections are available
  const fallbackCategories = [
    {
      name: "Handcrafted Souvenirs",
      description: "Authentic Jamaican crafts and artworks",
      image: "/images/categories/handcrafted.jpg"
    },
    {
      name: "Beach Essentials",
      description: "Everything needed for the perfect beach day",
      image: "/images/categories/beach.jpg"
    },
    {
      name: "Resort Apparel",
      description: "Stylish and comfortable vacation wear",
      image: "/images/categories/apparel.jpg"
    },
    {
      name: "Jamaican Delicacies",
      description: "Taste the flavors of the island",
      image: "/images/categories/food.jpg"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Shop Our Collections
          </h2>
          <Link 
            to="/collections" 
            className="flex items-center text-primary-600 hover:text-primary-500 transition"
          >
            View all collections
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">Loading collections...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : featuredCollections.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Fallback to default categories if no collections are available */}
            {fallbackCategories.map((category, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg shadow-lg h-64">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCollections.map((collection: Collection) => (
              <Link 
                key={collection.id} 
                to={`/collections/${collection.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-lg shadow-lg h-64">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {collection.imageUrl ? (
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = '/images/categories/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-white/80 text-sm">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-white/70 text-xs mt-2">
                      {collection.productCount || 0} Products
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
