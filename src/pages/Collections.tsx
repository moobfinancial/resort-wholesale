import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { Collection } from '../types/index';
import CollectionCard from '../components/CollectionCard';

const Collections = () => {
  const collections = useLoaderData() as Collection[] | null;

  if (!collections) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (collections.length === 0) {
    return <div className="text-center py-10">No collections found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Collections</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard 
            key={collection.id} 
            collection={{
              id: collection.id,
              name: collection.name,
              description: collection.description || '',
              imageUrl: collection.imageUrl,
              productCount: collection._count?.products || 0
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Collections;

// Modified loader to handle the API response format
export const loader = async () => {
  try {
    // Use the correct endpoint with /api prefix for direct fetch calls
    const response = await fetch('/api/collections/active');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Collections loader data:', data);
    
    // Handle different response formats based on the API
    if (data.status === 'success') {
      if (Array.isArray(data.data)) {
        // Format collection images
        return data.data.map((collection: any) => ({
          ...collection,
          imageUrl: formatCollectionImageUrl(collection)
        }));
      } else if (data.data && Array.isArray(data.data.collections)) {
        // Format collection images
        return data.data.collections.map((collection: any) => ({
          ...collection,
          imageUrl: formatCollectionImageUrl(collection)
        }));
      } else {
        console.error('Unexpected data structure:', data);
        return [];
      }
    } else {
      console.error('API request failed:', data);
      return [];
    }
  } catch (error) {
    console.error('Error loading collections:', error);
    return [];
  }
};

// Helper function to format collection image URLs
const formatCollectionImageUrl = (collection: any): string => {
  if (!collection || !collection.imageUrl) {
    return '/images/categories/placeholder.jpg';
  }
  
  const imageUrl = collection.imageUrl;
  
  // If imageUrl already has a proper path format, leave it as is
  if (imageUrl.startsWith('http') || imageUrl.startsWith('https://')) {
    return imageUrl;
  } 
  
  // Handle paths with /uploads/ prefix (from backend)
  if (imageUrl.includes('/uploads/collections/')) {
    // Convert /uploads/collections/ to /images/categories/
    return imageUrl.replace('/uploads/collections/', '/images/categories/');
  }
  
  // Handle relative image paths that don't have a leading slash
  if (imageUrl.startsWith('images/') || imageUrl.startsWith('uploads/')) {
    return `/${imageUrl}`;
  }
  
  // If it's just a filename, add the proper path
  if (!imageUrl.includes('/')) {
    return `/images/categories/${imageUrl}`;
  }
  
  return imageUrl;
};
