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
            // If the image fails to load, try loading from the uploads directory
            const target = e.target as HTMLImageElement;
            if (!target.src.startsWith('/uploads')) {
              target.src = `/uploads/products/${imageUrl}`;
            }
          }}
        />
      </div>
    </div>
  );
}
