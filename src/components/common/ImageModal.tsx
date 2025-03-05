import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 text-white hover:text-gray-300 focus:outline-none"
        >
          <X className="w-6 h-6" />
          <span className="sr-only">Close</span>
        </button>
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            // If the image fails to load, try loading from the images directory
            const target = e.target as HTMLImageElement;
            const currentSrc = target.src;
            console.log('Image load failed in modal, current src:', currentSrc);
            
            // Prevent infinite loop - if already trying to load placeholder, stop
            if (currentSrc.includes('placeholder')) {
              console.log('Already using placeholder, stopping error handling');
              return;
            }
            
            if (!currentSrc.includes('/images/products/')) {
              console.log('Trying with /images/products/ path');
              // Try to get just the filename if it's a path
              const filename = imageUrl.split('/').pop();
              if (filename) {
                target.src = `/images/products/${filename}`;
                console.log('New modal image path:', target.src);
                return; // Exit early to give this a chance to load
              }
            } else if (!currentSrc.includes('placeholder')) {
              // If image is already using the correct path format but still failing, 
              // try the uploads directory as a fallback
              console.log('Modal image with correct path still failing, trying uploads directory');
              const filename = imageUrl.split('/').pop();
              if (filename) {
                target.src = `/uploads/products/${filename}`;
                return; // Exit early to give this a chance to load
              }
            }
            
            // Fallback to placeholder image
            console.log('Using placeholder image for modal:', imageUrl);
            target.src = '/images/products/placeholder.jpg';
          }}
        />
      </div>
    </div>
  );
}
