import React, { useState, useEffect } from 'react';
import { Image, Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ProductImage } from '../../types/product';

const GalleryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const MainImageContainer = styled.div`
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  img {
    width: 100%;
    height: 400px;
    object-fit: contain;
    background-color: #f5f5f5;
  }
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 8px 0;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Thumbnail = styled.div<{ selected: boolean }>`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  opacity: ${props => props.selected ? 1 : 0.6};
  border: ${props => props.selected ? '2px solid #1890ff' : '2px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CarouselButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrevButton = styled(CarouselButton)`
  left: 16px;
`;

const NextButton = styled(CarouselButton)`
  right: 16px;
`;

interface ProductImageGalleryProps {
  productImages: ProductImage[];
  defaultImage?: string;
  variantImages?: ProductImage[];
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  productImages, 
  defaultImage, 
  variantImages = [] 
}) => {
  console.log('ProductImageGallery rendering with:', {
    productImagesCount: productImages.length,
    variantImagesCount: variantImages.length,
    defaultImage: defaultImage ? 'provided' : 'not provided'
  });
  
  // Prioritize variant images when available, otherwise use product images
  const allImages = variantImages.length > 0 
    ? [...variantImages] 
    : [...productImages];
  
  // Default to the first image if no images are provided
  const defaultImageUrl = defaultImage || 
    (allImages.length > 0 ? allImages[0].url : '/placeholder-product.png');
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Reset selected image when images change
  useEffect(() => {
    console.log('Images changed:', {
      allImagesLength: allImages.length,
      variantImagesLength: variantImages.length
    });
    
    if (allImages.length > 0) {
      // Try to find the default image from the variant or product
      const defaultImageIndex = allImages.findIndex(img => img.isDefault);
      setSelectedImageIndex(defaultImageIndex >= 0 ? defaultImageIndex : 0);
    }
  }, [allImages, variantImages]);
  
  // If we have no images, use the default image
  if (allImages.length === 0) {
    console.log('No images available, using default image:', defaultImage);
    return (
      <GalleryContainer>
        <MainImageContainer>
          <Image
            src={defaultImage || '/placeholder-product.png'}
            alt="Product"
            preview={false}
            style={{ width: '100%', height: '400px', objectFit: 'contain' }}
            fallback="/placeholder-product.png"
          />
        </MainImageContainer>
      </GalleryContainer>
    );
  }
  
  const handlePrev = () => {
    setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  const handleNext = () => {
    setSelectedImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : prev));
  };
  
  return (
    <GalleryContainer>
      <MainImageContainer>
        <Image
          src={allImages.length > 0 ? allImages[selectedImageIndex].url : defaultImageUrl}
          alt={allImages.length > 0 ? (allImages[selectedImageIndex].altText || "Product image") : "Product image"}
          preview={{ visible: false }}
          onClick={() => setPreviewVisible(true)}
          fallback="/placeholder-product.png"
        />
        
        {allImages.length > 1 && (
          <>
            <PrevButton onClick={handlePrev} disabled={selectedImageIndex === 0}>
              <LeftOutlined />
            </PrevButton>
            <NextButton onClick={handleNext} disabled={selectedImageIndex === allImages.length - 1}>
              <RightOutlined />
            </NextButton>
          </>
        )}
      </MainImageContainer>
      
      {allImages.length > 1 && (
        <ThumbnailsContainer>
          {allImages.map((image, index) => (
            <Thumbnail
              key={image.id || index}
              selected={index === selectedImageIndex}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img 
                src={image.url} 
                alt={image.altText || "Thumbnail"} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                }}
              />
            </Thumbnail>
          ))}
        </ThumbnailsContainer>
      )}
      
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            onVisibleChange: (vis) => setPreviewVisible(vis),
            current: selectedImageIndex,
          }}
        >
          {allImages.map((image) => (
            <Image
              key={image.id}
              src={image.url}
              alt={image.altText || "Product image"}
              fallback="/placeholder-product.png"
            />
          ))}
          {allImages.length === 0 && defaultImage && (
            <Image
              src={defaultImage}
              alt="Product image"
              fallback="/placeholder-product.png"
            />
          )}
        </Image.PreviewGroup>
      </div>
    </GalleryContainer>
  );
};

export default ProductImageGallery;
