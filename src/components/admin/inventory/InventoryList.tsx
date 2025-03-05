import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { useProductStore } from '../../../stores/productStore';
import toast from 'react-hot-toast';

export default function InventoryList() {
  const { products, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage stock levels, track inventory, and handle stock adjustments
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mt-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by product name or SKU..."
            />
          </div>
        </div>
        <div className="w-64">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SKU
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Current Stock
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Min Stock
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock <= (product.minOrder || 0);
                    return (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            {product.imageUrl && (
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={product.imageUrl}
                                  alt={product.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const currentSrc = target.src;
                                    console.log('Image load failed initially in inventory list:', product.imageUrl);
                                    
                                    // Prevent infinite loop - if already trying to load placeholder, stop
                                    if (currentSrc.includes('placeholder') || currentSrc.includes('data:image')) {
                                      console.log('Already using placeholder, stopping error handling');
                                      return;
                                    }
                                    
                                    // Step 1: Make sure the URL has the proper format
                                    if (!currentSrc.includes('/images/products/')) {
                                      console.log('Trying with /images/products/ path');
                                      // Try to get just the filename if it's a path
                                      const filename = product.imageUrl.split('/').pop();
                                      if (filename) {
                                        target.src = `/images/products/${filename}`;
                                        console.log('New image path:', target.src);
                                        return; // Exit early to give this a chance to load
                                      }
                                    } 
                                    // Step 2: If still failing with images/products path, try uploads path
                                    else if (!currentSrc.includes('placeholder')) {
                                      console.log('Image with correct path still failing, trying uploads directory');
                                      const filename = product.imageUrl.split('/').pop();
                                      if (filename) {
                                        target.src = `/uploads/products/${filename}`;
                                        return; // Exit early to give this a chance to load
                                      }
                                    }
                                    
                                    // Fallback to placeholder image
                                    console.log('Using placeholder image for:', product.imageUrl);
                                    target.src = '/images/products/placeholder.jpg';
                                  }}
                                />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-gray-500">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.minOrder || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isLowStock
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isLowStock ? (
                              <>
                                <AlertTriangle className="mr-1 h-4 w-4" />
                                Low Stock
                              </>
                            ) : (
                              'In Stock'
                            )}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/inventory/adjust/${product.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <span className="inline-flex items-center">
                                Adjust Stock
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
