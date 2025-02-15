import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProductStore } from '../stores/frontendProductStore';
import ProductGrid from '../components/products/ProductGrid';
import { toast } from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    currentProduct, 
    relatedProducts, 
    loading, 
    error,
    fetchProduct 
  } = useProductStore();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
          <div className="h-32 bg-gray-200 rounded mb-8" />
        </div>
      </div>
    );
  }

  if (error) {
    toast.error(error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <p>Product not found</p>
      </div>
    );
  }

  // Format prices safely
  const formatPrice = (price: number | null | undefined) => {
    if (typeof price !== 'number') return '0.00';
    return price.toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product Image */}
        <div className="relative">
          <img
            src={currentProduct.imageUrl}
            alt={currentProduct.name}
            className="w-full h-auto rounded-lg shadow-lg"
          />
          {currentProduct.isNew && (
            <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              New Arrival
            </span>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentProduct.name}
          </h1>
          
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-2xl font-bold text-gray-900">
              ${formatPrice(currentProduct.wholesalePrice || currentProduct.price)}
            </span>
            {currentProduct.wholesalePrice && currentProduct.price && currentProduct.wholesalePrice < currentProduct.price && (
              <span className="text-lg text-gray-500 line-through">
                ${formatPrice(currentProduct.price)}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-8">
            {currentProduct.description}
          </p>

          {currentProduct.tags && currentProduct.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {currentProduct.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Product Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{currentProduct.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                <dd className="mt-1 text-sm text-gray-900">{currentProduct.sku}</dd>
              </div>
              {currentProduct.minOrder && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Minimum Order</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentProduct.minOrder} units</dd>
                </div>
              )}
              {currentProduct.stock !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stock</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentProduct.stock} units</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
          <ProductGrid products={relatedProducts} loading={false} />
        </div>
      )}
    </div>
  );
}
