import React, { useState, useEffect } from 'react';

// Default placeholder images
const DEFAULT_PLACEHOLDER = '/images/products/placeholder.jpg';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  alt: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * A component that handles image loading with fallbacks when images fail to load.
 * It attempts multiple paths before defaulting to a placeholder.
 */
const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  alt,
  onLoad,
  onError,
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(normalizeImagePath(src));
  const [errorCount, setErrorCount] = useState<number>(0);
  
  // Reset error count when src changes
  useEffect(() => {
    setCurrentSrc(normalizeImagePath(src));
    setErrorCount(0);
  }, [src]);
  
  // Normalize image path to handle various formats
  function normalizeImagePath(imagePath: string): string {
    if (!imagePath) return fallbackSrc;
    
    // If it's an HTTP URL, use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's just a filename with no path, prepend the correct path
    if (!imagePath.includes('/')) {
      return `/images/products/${imagePath}`;
    }
    
    // If it has a path but no leading slash, add it
    if (!imagePath.startsWith('/')) {
      return `/${imagePath}`;
    }
    
    return imagePath;
  }
  
  // Try different image paths based on the error count
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Call the original onError if provided
    if (onError) {
      onError(e);
    }
    
    // Keep track of attempts to prevent infinite loops
    const nextErrorCount = errorCount + 1;
    setErrorCount(nextErrorCount);
    
    const currentUrl = currentSrc;
    let nextUrl = fallbackSrc;
    
    // Max 3 attempts to find an alternative source
    if (nextErrorCount < 3) {
      if (currentUrl.includes('/uploads/products/')) {
        // If it's in /uploads/products/, try /images/products/
        const fileName = currentUrl.split('/').pop();
        nextUrl = `/images/products/${fileName}`;
      } else if (currentUrl.includes('/images/products/')) {
        // If it's already in /images/products/, go straight to fallback
        nextUrl = fallbackSrc;
      } else if (!currentUrl.includes('/')) {
        // If it's just a filename, try with the proper path
        nextUrl = `/images/products/${currentUrl}`;
      } else {
        // For any other case, use the fallback
        nextUrl = fallbackSrc;
      }
    }
    
    // Prevent infinite loops by checking if we've tried this URL before
    if (nextUrl !== currentUrl) {
      setCurrentSrc(nextUrl);
    } else {
      // We've already tried this URL, go straight to fallback
      setCurrentSrc(fallbackSrc);
    }
  };
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Reset error count on successful load
    setErrorCount(0);
    
    // Call the original onLoad if provided
    if (onLoad) {
      onLoad(e);
    }
  };
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      {...rest}
    />
  );
};

export default ImageWithFallback;
