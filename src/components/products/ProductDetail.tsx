import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, Typography, Button, Divider, Spin, 
  Tag, Tabs, Select, InputNumber, message, notification
} from 'antd';
import { ShoppingCartOutlined, HeartOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { api } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  imageUrl: string;
  tags: string[];
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  imageUrl: string;
}

interface ProductImage {
  id: string;
  url: string;
}

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ProductDetailContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const ProductGallerySection = styled.div`
  flex: 1;
  
  @media (min-width: 768px) {
    max-width: 500px;
  }
`;

const ProductInfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 16px;
`;

const OriginalPrice = styled(Text)`
  text-decoration: line-through;
  color: #999;
`;

const CurrentPrice = styled(Title)`
  margin: 0 !important;
  color: #1890ff;
`;

const VariantSelect = styled(Select)`
  min-width: 200px;
`;

const AddToCartSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
`;

const ProductTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const ProductAction = styled(Button)`
  margin-top: 8px;
`;

function isSuccessResponse(response: any): response is { status: 'success'; data: unknown } {
  return response?.data?.status === 'success';
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [variantImages, setVariantImages] = useState<ProductImage[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`products/${productId}`);
        
        if (isSuccessResponse(response)) {
          const productData = response.data.data.item || response.data.data;
          setProduct(productData);
          
          // Set default variant if available
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
          
          // Fetch product images
          fetchProductImages(productId);
        } else {
          setError('Failed to fetch product details');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('An error occurred while fetching product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [productId]);
  
  // Fetch product images
  const fetchProductImages = async (productId: string) => {
    try {
      const response = await api.get(`products/${productId}/images`);
      
      if (isSuccessResponse(response)) {
        const images = response.data.data.items || response.data.data;
        setProductImages(images);
      }
    } catch (err) {
      console.error('Error fetching product images:', err);
    }
  };
  
  // Fetch variant images when a variant is selected
  useEffect(() => {
    const fetchVariantImages = async () => {
      if (!selectedVariant || !selectedVariant.id) return;
      
      try {
        const response = await api.get(`products/variants/${selectedVariant.id}/images`);
        
        if (isSuccessResponse(response)) {
          const images = response.data.data.items || response.data.data;
          setVariantImages(images);
        }
      } catch (err) {
        console.error('Error fetching variant images:', err);
      }
    };
    
    fetchVariantImages();
  }, [selectedVariant]);
  
  // Handle variant selection
  const handleVariantChange = (variantId: string) => {
    if (!product || !product.variants) return;
    
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = (value: number | null) => {
    if (value !== null) {
      setQuantity(value);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    const itemToAdd = {
      productId: product?.id,
      variantId: selectedVariant?.id,
      quantity,
      name: product?.name,
      variantName: selectedVariant?.name,
      price: selectedVariant?.price || product?.price,
      imageUrl: selectedVariant?.imageUrl || product?.imageUrl,
    };
    
    // Implement add to cart logic here
    console.log('Adding to cart:', itemToAdd);
    
    notification.success({
      message: 'Added to Cart',
      description: `${quantity} x ${product?.name} ${selectedVariant ? `(${selectedVariant.name})` : ''} added to your cart.`,
    });
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <Title level={3}>Error</Title>
        <Text>{error || 'Product not found'}</Text>
      </div>
    );
  }
  
  // Determine the current price (use variant price if a variant is selected)
  const currentPrice = selectedVariant?.price || product.price;
  const hasDiscount = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const originalPrice = selectedVariant?.compareAtPrice || product.compareAtPrice;
  
  return (
    <ProductDetailContainer>
      <ProductGallerySection>
        <ProductImageGallery
          productImages={productImages}
          defaultImage={product.imageUrl}
          variantImages={variantImages}
        />
      </ProductGallerySection>
      
      <ProductInfoSection>
        <Title level={2}>{product.name}</Title>
        
        <Text type="secondary">SKU: {selectedVariant?.sku || product.sku}</Text>
        
        <PriceContainer>
          <CurrentPrice level={3}>${currentPrice.toFixed(2)}</CurrentPrice>
          {hasDiscount && <OriginalPrice>${originalPrice?.toFixed(2)}</OriginalPrice>}
        </PriceContainer>
        
        {product.variants && product.variants.length > 0 && (
          <div>
            <Text strong>Options</Text>
            <div style={{ marginTop: 8 }}>
              <VariantSelect
                placeholder="Select a variant"
                onChange={handleVariantChange}
                defaultValue={product.variants[0].id}
              >
                {product.variants.map(variant => (
                  <Option key={variant.id} value={variant.id}>
                    {variant.name} - ${variant.price.toFixed(2)}
                  </Option>
                ))}
              </VariantSelect>
            </div>
          </div>
        )}
        
        <AddToCartSection>
          <div>
            <Text strong>Quantity</Text>
            <div style={{ marginTop: 8 }}>
              <InputNumber 
                min={1} 
                value={quantity} 
                onChange={handleQuantityChange} 
                style={{ width: 100 }} 
              />
            </div>
          </div>
          
          <div>
            <Button 
              type="primary" 
              size="large" 
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        </AddToCartSection>
        
        <Divider />
        
        <Tabs defaultActiveKey="description">
          <TabPane tab="Description" key="description">
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </TabPane>
          
          <TabPane tab="Specifications" key="specifications">
            <p>Product specifications will appear here.</p>
          </TabPane>
          
          <TabPane tab="Reviews" key="reviews">
            <p>Customer reviews will appear here.</p>
          </TabPane>
        </Tabs>
        
        {product.tags && product.tags.length > 0 && (
          <ProductTags>
            {product.tags.map((tag, index) => (
              <Tag key={index} color="blue">{tag}</Tag>
            ))}
          </ProductTags>
        )}
        
        <div style={{ marginTop: 16 }}>
          <ProductAction icon={<HeartOutlined />}>Add to Wishlist</ProductAction>
          <ProductAction icon={<QuestionCircleOutlined />}>Ask a Question</ProductAction>
        </div>
      </ProductInfoSection>
    </ProductDetailContainer>
  );
};

export default ProductDetail;
