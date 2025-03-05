import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../../../stores/productStore';
import { Edit } from 'lucide-react';
import ImageModal from '../../common/ImageModal';
import { CameraIcon } from 'lucide-react';

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProduct, getProduct, setSelectedProduct } = useProductStore();
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (id) {
      getProduct(id).catch(console.error);
    }
    // Cleanup
    return () => {
      setSelectedProduct(null);
    };
  }, [id, getProduct, setSelectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{selectedProduct.name}</h1>
          <p className="mt-2 text-sm text-gray-700">SKU: {selectedProduct.sku}</p>
        </div>
        <button
          onClick={() => navigate(`/admin/products/${id}/edit`, { state: { product: selectedProduct } })}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Edit className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Edit Product
        </button>
      </div>

      <div className="mt-8 border-t border-gray-200">
        <dl className="divide-y divide-gray-200">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedProduct.description}
            </dd>
          </div>

          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedProduct.category}
            </dd>
          </div>

          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Price</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              ${typeof selectedProduct.price === 'number' 
                ? selectedProduct.price.toFixed(2)
                : typeof selectedProduct.price === 'string'
                  ? parseFloat(selectedProduct.price).toFixed(2)
                  : typeof selectedProduct.price === 'object' && selectedProduct.price !== null
                    ? String(selectedProduct.price)
                    : '0.00'
              }
            </dd>
          </div>

          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Stock</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedProduct.stock}
            </dd>
          </div>

          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Minimum Order</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedProduct.minOrder}
            </dd>
          </div>

          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {selectedProduct.isActive ? 'Active' : 'Inactive'}
            </dd>
          </div>

          {selectedProduct.imageUrl && (
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Product Image</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="flex items-start">
                  <div 
                    className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-md cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setShowImageModal(true)}
                  >
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load initially:', selectedProduct.imageUrl);
                          
                          // If the image fails to load, try the formatted path
                          const target = e.target as HTMLImageElement;
                          const currentSrc = target.src;
                          
                          // Prevent infinite loop - if already trying to load placeholder, stop
                          if (currentSrc.includes('placeholder')) {
                            console.log('Already using placeholder, stopping error handling');
                            return;
                          }
                          
                          // Log the current source to help debug
                          console.log('Current image src:', currentSrc);
                          
                          // Check if image path needs to be fixed
                          if (!currentSrc.includes('/images/products/')) {
                            // Extract the filename from the URL
                            const filename = selectedProduct.imageUrl.split('/').pop();
                            if (filename) {
                              console.log('Trying with /images/products/ path for filename:', filename);
                              target.src = `/images/products/${filename}`;
                              console.log('New image path:', target.src);
                              return; // Exit early to give this a chance to load
                            }
                          } else if (!currentSrc.includes('placeholder')) {
                            // If image is already using the correct path format but still failing, 
                            // try the uploads directory as a fallback
                            console.log('Image with correct path still failing, trying uploads directory');
                            const filename = selectedProduct.imageUrl.split('/').pop();
                            if (filename) {
                              target.src = `/uploads/products/${filename}`;
                              return; // Exit early to give this a chance to load
                            }
                          }
                          
                          // Final fallback - use an embedded data URL for a simple icon
                          console.log('Using placeholder image as final fallback');
                          target.src = '/images/products/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-100">
                        <CameraIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </dd>
            </div>
          )}

          {selectedProduct.tags && selectedProduct.tags.length > 0 && (
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {showImageModal && selectedProduct.imageUrl && (
        <ImageModal
          imageUrl={selectedProduct.imageUrl}
          alt={selectedProduct.name}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}
