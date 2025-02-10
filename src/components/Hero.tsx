import React from 'react';

export default function Hero() {
  return (
    <div className="relative h-[500px]">
      <img 
        src="/images/hero-beach.jpg" 
        alt="Tropical beach resort"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Authentic Jamaican<br />Tourist Merchandise
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Wholesale & Retail Solutions for Your Business
          </p>
          <div className="flex space-x-4">
            <button className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800">
              Shop Wholesale
            </button>
            <button className="bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100">
              Shop Retail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}