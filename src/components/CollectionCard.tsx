import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
}

interface CollectionCardProps {
  collection: Collection;
  className?: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const placeholderImageUrl = '/images/categories/placeholder.jpg';

  // Log image URL for debugging
  console.log('Collection image URL:', collection.imageUrl);

  return (
    <Link 
      to={`/collections/${collection.id}`}
      className={`group block ${className}`}
    >
      <div className="aspect-w-3 aspect-h-2 w-full overflow-hidden rounded-lg bg-gray-200">
        {(collection.imageUrl && !imageError) ? (
          <img
            src={collection.imageUrl}
            alt={collection.name}
            className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`Failed to load image for collection: ${collection.name}`, collection.imageUrl);
              
              // Try different paths before giving up
              if (!target.src.includes('/images/categories/') && !target.src.includes('placeholder')) {
                const filename = collection.imageUrl?.split('/').pop();
                target.src = `/images/categories/${filename || 'placeholder.jpg'}`;
                console.log('Trying with /images/categories/ path:', target.src);
                return;
              }
              
              // If we've already tried the categories path or that failed too
              if (!target.src.includes('/uploads/collections/') && !target.src.includes('placeholder')) {
                const filename = collection.imageUrl?.split('/').pop();
                target.src = `/uploads/collections/${filename || 'placeholder.jpg'}`;
                console.log('Trying with /uploads/collections/ path:', target.src);
                return;
              }
              
              // If all else fails, use the placeholder
              setImageError(true);
              target.src = placeholderImageUrl;
              console.log('Using placeholder image');
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-teal-100">
            {imageError ? (
              <img
                src={placeholderImageUrl}
                alt={collection.name}
                className="h-full w-full object-cover object-center"
                onError={() => {
                  console.error('Even placeholder image failed to load');
                }}
              />
            ) : (
              <span className="text-gray-700 text-lg font-medium">{collection.name}</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {collection.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
        </p>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {collection.description}
        </p>
      </div>
    </Link>
  );
};

export default CollectionCard;
