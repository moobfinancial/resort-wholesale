import React from 'react';
import ProductCollage from './ProductCollage';

export default function WelcomeSection() {
  return (
    <section className="py-16 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-blue-900">
              Welcome to Jamaica's Premier Wholesale Tourist Merchandise
            </h2>
            <p className="text-lg text-gray-600">
              For over two decades, we've been the trusted source for authentic Jamaican merchandise,
              serving resorts, gift shops, and retailers worldwide with our curated collection of
              high-quality products.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-900 mb-1">20+</div>
                <div className="text-sm text-gray-600">Years of Excellence</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-900 mb-1">5000+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-900 mb-1">1000+</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-900 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <ProductCollage />
            </div>
            <div 
              className="absolute bottom-0 right-0 bg-blue-900 text-white p-6 rounded-lg shadow-xl z-20 transform translate-y-1/4"
            >
              <p className="text-lg font-semibold whitespace-nowrap">Trusted by</p>
              <p className="text-3xl font-bold whitespace-nowrap">200+ Resorts</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
