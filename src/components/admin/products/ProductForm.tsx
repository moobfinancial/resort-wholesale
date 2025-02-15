import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductStore } from '../../../stores/productStore';
import ProductCapture from './ProductCapture';
import type { Product, BulkPricing } from '../../../types/product';

interface FormState {
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  stock: number;
  sku: string;
  minOrder: number;
  bulkPricing: BulkPricing[];
  imageUrl: string;
  isActive: boolean;
}

const initialState: FormState = {
  name: '',
  description: '',
  category: '',
  tags: [],
  price: '0.00',
  stock: 0,
  sku: '',
  minOrder: 1,
  bulkPricing: [],
  imageUrl: '',
  isActive: true
};

export default function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(
    product
      ? {
          name: product.name,
          description: product.description,
          category: product.category,
          tags: product.tags || [],
          price: typeof product.price === 'number' ? product.price.toFixed(2) : product.price,
          stock: product.stock,
          sku: product.sku,
          minOrder: product.minOrder,
          bulkPricing: product.bulkPricing || [],
          imageUrl: product.imageUrl,
          isActive: product.isActive
        }
      : initialState
  );
  const [showCamera, setShowCamera] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalysisConfirm, setShowAnalysisConfirm] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProduct, updateProduct, analyzeImage } = useProductStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Convert form data
      const productData = {
        name: formState.name,
        description: formState.description,
        category: formState.category,
        tags: formState.tags,
        price: parseFloat(formState.price),
        sku: formState.sku,
        minOrder: parseInt(formState.minOrder.toString()),
        bulkPricing: formState.bulkPricing.map(pricing => ({
          minQuantity: parseInt(pricing.minQuantity.toString()),
          price: parseFloat(pricing.price.toString())
        })),
        isActive: formState.isActive
      };

      if (!product) {
        // Only include stock when creating a new product
        productData.stock = parseInt(formState.stock.toString());
      }

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('data', JSON.stringify(productData));
      
      // If we have a new image (not a URL), append it
      if (formState.imageUrl && formState.imageUrl.startsWith('data:')) {
        // Convert base64 to File
        const base64Data = formState.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const file = new File(byteArrays, 'product-image.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      }

      if (product) {
        await updateProduct(product.id, formData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formData);
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmImageDelete = () => {
    setFormState(prev => ({ ...prev, imageUrl: '' }));
    setShowDeleteConfirm(false);
  };

  const handleImageUpload = async (imageUrl: string, skipAnalysis: boolean = false) => {
    if (!skipAnalysis && product) {
      setPendingImageUrl(imageUrl);
      setShowAnalysisConfirm(true);
      return;
    }

    setFormState(prev => ({ ...prev, imageUrl }));
    
    if (!skipAnalysis) {
      // Convert base64 URL to File object for analysis
      const base64Data = imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const file = new File(byteArrays, 'analysis-image.jpg', { type: 'image/jpeg' });
      
      await toast.promise(
        (async () => {
          try {
            const result = await analyzeImage(file);
            
            // Update form with analysis results
            setFormState(prev => ({
              ...prev,
              name: result.name || prev.name,
              category: result.category || prev.category,
              description: result.description || prev.description,
              tags: [...new Set([...prev.tags, ...(result.suggestedTags || [])])].filter(tag => tag.length > 0)
            }));

            setShowCamera(false);
          } catch (error) {
            console.error('Image analysis error:', error);
            setShowCamera(false);
            
            if (!(error instanceof Error && error.message.includes('503'))) {
              throw error;
            }
            toast.error('Image analysis is temporarily unavailable. Your image has been saved, but you\'ll need to fill in the details manually.');
          }
        })(),
        {
          loading: 'Analyzing image...',
          success: 'Image analyzed successfully',
          error: (err) => err instanceof Error ? err.message : 'Failed to analyze image'
        }
      );
    } else {
      setShowCamera(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleImageUpload(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleImageCapture = async (imageUrl: string) => {
    try {
      // Convert base64 URL to File object for analysis
      const base64Data = imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const file = new File(byteArrays, 'camera-capture.jpg', { type: 'image/jpeg' });
      
      // Set the image URL first
      setFormState(prev => ({ ...prev, imageUrl }));
      
      // Then analyze the image
      await toast.promise(
        (async () => {
          try {
            // Create FormData and append the file
            const formData = new FormData();
            formData.append('image', file);
            
            // Call the API directly
            const response = await fetch('/api/admin/inventory/products/analyze', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Failed to analyze image');
            }
            
            const { data: result } = await response.json();
            
            // Update form with analysis results
            setFormState(prev => ({
              ...prev,
              name: result.name || prev.name,
              category: result.category || prev.category,
              description: result.description || prev.description,
              tags: [...new Set([...prev.tags, ...(result.suggestedTags || [])])].filter(tag => tag.length > 0)
            }));
          } catch (error) {
            console.error('Image analysis error:', error);
            
            if (!(error instanceof Error && error.message.includes('503'))) {
              throw error;
            }
            toast.error('Image analysis is temporarily unavailable. Your image has been saved, but you\'ll need to fill in the details manually.');
          }
        })(),
        {
          loading: 'Analyzing image...',
          success: 'Image analyzed successfully',
          error: (err) => err instanceof Error ? err.message : 'Failed to analyze image'
        }
      );
      
      setShowCamera(false);
    } catch (error) {
      console.error('Image capture error:', error);
      toast.error('Failed to process image');
      setShowCamera(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Image Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Product Image</label>
          <div className="flex items-center space-x-4">
            {formState.imageUrl ? (
              <div className="relative w-32 h-32">
                <img
                  src={formState.imageUrl}
                  alt="Product"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.startsWith('/uploads')) {
                      target.src = `/uploads/products/${formState.imageUrl}`;
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <span className="sr-only">Remove image</span>
                  ×
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              value={formState.category}
              onChange={e => setFormState(prev => ({ ...prev, category: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formState.description}
              onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formState.price}
                onChange={e => setFormState(prev => ({ ...prev, price: e.target.value }))}
                className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              type="text"
              value={formState.sku}
              onChange={e => setFormState(prev => ({ ...prev, sku: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Leave blank to auto-generate"
            />
          </div>

          {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={formState.stock}
                onChange={e => setFormState(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Order
            </label>
            <input
              type="number"
              min="1"
              value={formState.minOrder}
              onChange={e => setFormState(prev => ({ ...prev, minOrder: parseInt(e.target.value) || 1 }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <input
              type="text"
              value={formState.tags.join(', ')}
              onChange={e => setFormState(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>

      {showCamera && (
        <ProductCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Delete Image Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Delete Product Image
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this image? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmImageDelete}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Confirmation Modal */}
      {showAnalysisConfirm && pendingImageUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Analyze New Image
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Would you like to analyze this new image with AI? This will update the product name, description, category, and tags based on the new image.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    handleImageUpload(pendingImageUrl, false);
                    setShowAnalysisConfirm(false);
                    setPendingImageUrl(null);
                  }}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                >
                  Analyze Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleImageUpload(pendingImageUrl, true);
                    setShowAnalysisConfirm(false);
                    setPendingImageUrl(null);
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Keep Current Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
