import React, { useState, useEffect } from 'react';
import { useLoaderData, useParams, Link } from 'react-router-dom';
import { Product } from '../types/product';
import { formatPrice } from '../utils/formatters';

const CollectionDetail: React.FC = () => {
  const { id } = useParams();
  const products = useLoaderData() as Product[];
  const [collectionName, setCollectionName] = useState<string>('Collection');
  
  useEffect(() => {
    // Fetch the collection name
    if (id) {
      fetch(`/api/collections/${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            setCollectionName(data.data.name || 'Collection');
          }
        })
        .catch(error => {
          console.error('Error fetching collection:', error);
        });
    }
  }, [id]);

  if (!products) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{collectionName}</h1>
        <p className="mb-6">No products found in this collection.</p>
        <Link to="/collections" className="text-blue-600 hover:text-blue-800">
          ← Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{collectionName} Products</h1>
        <Link to="/collections" className="text-blue-600 hover:text-blue-800">
          ← Back to Collections
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link 
            to={`/products/${product.id}`} 
            key={product.id}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden group-hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                <img 
                  src={product.imageUrl || '/images/products/placeholder.jpg'} 
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // First try loading with /images/products/ path if not already there
                    if (!target.src.includes('/images/products/') && !target.src.includes('placeholder')) {
                      const filename = target.src.split('/').pop();
                      target.src = `/images/products/${filename || 'placeholder.jpg'}`;
                    } 
                    // If that fails, try with /uploads/products/ path
                    else if (!target.src.includes('/uploads/products/') && !target.src.includes('placeholder')) {
                      const filename = target.src.split('/').pop();
                      target.src = `/uploads/products/${filename || 'placeholder.jpg'}`;
                    }
                    // Finally, use the placeholder
                    else if (!target.src.includes('placeholder')) {
                      target.src = '/images/products/placeholder.jpg';
                    }
                  }}
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {product.description}
                </p>
                <p className="mt-2 text-lg font-medium text-gray-900">
                  ${typeof product.price === 'number' ? formatPrice(product.price) : formatPrice(0)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CollectionDetail;

export const loader = async ({ params }: { params: { id: string } }) => {
  try {
    // According to our API conventions, we should include the /api prefix for direct fetch calls
    const response = await fetch(`/api/collections/${params.id}/products`);
    
    if (!response.ok) {
      console.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    console.log('Collection products response:', data);
    
    // Handle different response formats based on the API structure
    if (data.status === 'success') {
      let products = [];
      
      if (Array.isArray(data.data)) {
        products = data.data;
      } else if (data.data && Array.isArray(data.data.products)) {
        products = data.data.products;
      } else {
        console.error('Unexpected data structure:', data);
        return [];
      }
      
      // Format product data, especially image URLs
      return products.map((product: any) => ({
        ...product,
        imageUrl: formatProductImage(product.imageUrl),
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
      }));
    } else {
      console.error('API request failed:', data);
      return [];
    }
  } catch (error) {
    console.error('Error loading collection products:', error);
    return [];
  }
};

const formatProductImage = (imageUrl: string | null): string => {
  if (!imageUrl) return '/images/products/placeholder.jpg';
  
  // If imageUrl already has a proper URL format, return it directly
  if (imageUrl.startsWith('http') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Handle relative paths
  if (!imageUrl.startsWith('/')) {
    return `/images/products/${imageUrl}`;
  }
  
  return imageUrl;
};
