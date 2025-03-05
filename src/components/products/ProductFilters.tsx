import React from 'react';
import { Category } from '../../types/product';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy
}: ProductFiltersProps) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`block w-full text-left px-3 py-2 rounded-lg transition ${
              selectedCategory === ''
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          {categories && categories.map((category) => (
            <button
              key={category.id || `category-${category.name}`}
              onClick={() => {
                setSelectedCategory(category.id === selectedCategory ? '' : category.id);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>
      </div>

      {/* Price Range Filter - Can be added later */}
      {/* <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1000"
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>$0</span>
            <span>$1000</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
