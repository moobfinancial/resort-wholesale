import React from 'react';

const categories = [
  {
    title: 'Handcrafted Souvenirs',
    image: '/images/categories/handcrafted.jpg',
    description: 'Authentic Jamaican crafts and artworks'
  },
  {
    title: 'Local Delicacies',
    image: '/images/categories/delicacies.jpg',
    description: 'Traditional foods and spices'
  },
  {
    title: 'Beach Essentials',
    image: '/images/categories/beach.jpg',
    description: 'Everything needed for the perfect beach day'
  },
  {
    title: 'Cultural Items',
    image: '/images/categories/cultural.jpg',
    description: 'Celebrate Jamaican heritage'
  }
];

export default function FeaturedCategories() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Explore Our Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <div key={category.title} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-lg h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
