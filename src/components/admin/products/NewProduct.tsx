import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from './ProductForm';
import { Product } from '../../../types/product';
import { useProductStore } from '../../../stores/productStore';
import toast from 'react-hot-toast';

export default function NewProduct() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createProduct, loading } = useProductStore();

  const handleSubmit = async (productData: Partial<Product>) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Create a clean JSON object without any undefined values
      const jsonData: Record<string, any> = {
        ...productData,
        isFeatured: productData.isFeatured || productData.featured,
        featured: undefined
      };
      
      // Handle image file
      if (productData.imageUrl && typeof productData.imageUrl === 'object') {
        formData.append('image', productData.imageUrl, productData.imageUrl.name || 'product_image.jpg');
        console.log('Appending image file to form data:', productData.imageUrl.name || 'product_image.jpg');
        
        // When sending image as a file, remove imageUrl from JSON data
        delete jsonData.imageUrl;
      } 
      // Handle image URL (could be base64 or path)
      else if (productData.imageUrl) {
        console.log('Using imageUrl from form:', typeof productData.imageUrl);
        // If it's a relative path, ensure it's properly formatted
        if (typeof productData.imageUrl === 'string' && !productData.imageUrl.startsWith('data:') && !productData.imageUrl.startsWith('/')) {
          jsonData.imageUrl = `/images/products/${productData.imageUrl}`;
        }
      }
      
      formData.append('data', JSON.stringify(jsonData));
      
      console.log('Submitting new product with data:', {
        ...jsonData,
        imageUrl: jsonData.imageUrl ? (typeof jsonData.imageUrl === 'string' && jsonData.imageUrl.length > 100 ? 'base64 image data' : jsonData.imageUrl) : 'No image URL'
      });
      
      // Use the create product function from the store
      await createProduct(formData);
      toast.success('Product created successfully');
      navigate('/admin/products');
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
      toast.error('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Add New Product</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new product to add to your inventory
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ProductForm 
          onSave={handleSubmit}
          isSubmitting={submitting || loading}
        />
      </div>
    </div>
  );
}
