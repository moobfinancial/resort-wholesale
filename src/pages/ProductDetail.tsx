import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProductStore } from '../stores/frontendProductStore';
import { useCartStore } from '../stores/cartStore';
import ProductGrid from '../components/products/ProductGrid';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../utils/formatters';
import { Button, Select, InputNumber, Skeleton, Tabs, Tag, Divider } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TabPane } = Tabs;

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    currentProduct, 
    relatedProducts, 
    productVariants,
    bulkPricing,
    selectedVariant,
    quantity,
    calculatedPrice,
    loading, 
    variantsLoading,
    error,
    fetchProduct,
    setSelectedVariant,
    setQuantity
  } = useProductStore();

  // Track which attributes have been selected
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  
  // Use useCallback to memoize the error notification to prevent setState during render
  const showErrorToast = useCallback((errorMessage: string) => {
    toast.error(errorMessage);
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  // Show error via useEffect instead of during render
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  // Find available attribute types and values from variants
  const attributeTypes = useCallback(() => {
    if (!productVariants.length) return [];
    
    const types: string[] = [];
    productVariants.forEach(variant => {
      Object.keys(variant.attributes).forEach(key => {
        if (!types.includes(key)) {
          types.push(key);
        }
      });
    });
    
    return types;
  }, [productVariants]);

  // Get all possible values for a specific attribute type
  const getAttributeValues = useCallback((attributeType: string) => {
    if (!productVariants.length) return [];
    
    const values = new Set<string>();
    productVariants.forEach(variant => {
      if (variant.attributes[attributeType]) {
        values.add(variant.attributes[attributeType]);
      }
    });
    
    return Array.from(values);
  }, [productVariants]);

  // Find matching variant based on selected attributes
  useEffect(() => {
    if (!productVariants.length || Object.keys(selectedAttributes).length === 0) {
      setSelectedVariant(null);
      return;
    }
    
    // Only find a matching variant if all attribute types have been selected
    const requiredAttributeCount = attributeTypes().length;
    const selectedAttributeCount = Object.keys(selectedAttributes).length;
    
    if (selectedAttributeCount !== requiredAttributeCount) {
      return;
    }
    
    const matchingVariant = productVariants.find(variant => {
      return Object.entries(selectedAttributes).every(([key, value]) => 
        variant.attributes[key] === value
      );
    });
    
    setSelectedVariant(matchingVariant || null);
  }, [selectedAttributes, productVariants, attributeTypes, setSelectedVariant]);

  // Handle attribute selection
  const handleAttributeChange = (attributeType: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeType]: value
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (value: number | null) => {
    if (value !== null && value > 0) {
      setQuantity(value);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentProduct) return;
    
    try {
      if (selectedVariant) {
        await useCartStore().addItem(currentProduct.id, quantity, selectedVariant.id);
      } else {
        await useCartStore().addItem(currentProduct.id, quantity);
      }
      toast.success('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  // Render the bulk pricing tiers if available
  const renderBulkPricing = () => {
    if (!bulkPricing || bulkPricing.length === 0) return null;
    
    return (
      <div className="mt-6 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Bulk Pricing</h3>
        <div className="grid grid-cols-2 gap-2">
          {bulkPricing
            .sort((a, b) => a.minQuantity - b.minQuantity)
            .map((tier, index) => (
              <React.Fragment key={tier.id || index}>
                <div className="text-sm text-gray-500">{tier.minQuantity}+ units</div>
                <div className="text-sm font-semibold">${formatPrice(tier.price)} each</div>
              </React.Fragment>
            ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
          <div className="h-32 bg-gray-200 rounded mb-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product Image */}
        <div className="relative">
          {/* Debug log removed to fix TypeScript error */}
          <img
            src={(selectedVariant?.imageUrl || currentProduct.imageUrl || '/images/products/placeholder.svg')}
            alt={currentProduct.name}
            className="w-full h-auto rounded-lg shadow-lg"
            onError={(e) => {
              console.error('Failed to load product image:', selectedVariant?.imageUrl || currentProduct.imageUrl);
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
            }}
          />
          {currentProduct.isNew && (
            <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              New Arrival
            </span>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentProduct.name}
          </h1>
          
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-2xl font-bold text-gray-900">
              ${formatPrice(calculatedPrice || selectedVariant?.price || currentProduct.price)}
            </span>
            {/* Display original price if there's a sale price */}
            {currentProduct.price && calculatedPrice && calculatedPrice < currentProduct.price && (
              <span className="text-lg text-gray-500 line-through">
                ${formatPrice(currentProduct.price)}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-8">
            {currentProduct.description}
          </p>

          {/* Product Variants */}
          {variantsLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            productVariants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Options</h3>
                
                {attributeTypes().map(attributeType => (
                  <div key={attributeType} className="mb-4">
                    <label 
                      htmlFor={`attribute-${attributeType}`} 
                      className="block text-sm text-gray-700 mb-2"
                    >
                      {attributeType.charAt(0).toUpperCase() + attributeType.slice(1)}
                    </label>
                    
                    <Select
                      id={`attribute-${attributeType}`}
                      placeholder={`Select ${attributeType}`}
                      onChange={(value) => handleAttributeChange(attributeType, value)}
                      style={{ width: '100%' }}
                      value={selectedAttributes[attributeType]}
                    >
                      {getAttributeValues(attributeType).map(value => (
                        <Option key={value} value={value}>
                          {value}
                        </Option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Quantity and Add to Cart */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <label htmlFor="quantity" className="block text-sm text-gray-700">
                Quantity
              </label>
              <InputNumber
                id="quantity"
                min={currentProduct.minOrder || 1}
                value={quantity}
                onChange={handleQuantityChange}
                style={{ width: '120px' }}
              />
              
              {currentProduct.minOrder > 1 && (
                <span className="text-xs text-amber-600">
                  Min order: {currentProduct.minOrder}
                </span>
              )}
            </div>
            
            {selectedVariant && (
              <p className="text-sm text-gray-600 mb-4">
                {selectedVariant.stock > 0 
                  ? `${selectedVariant.stock} in stock` 
                  : 'Out of stock'}
              </p>
            )}
            
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              disabled={(selectedVariant && selectedVariant.stock < quantity) || 
                        (!selectedVariant && productVariants.length > 0) ||
                        quantity < (currentProduct.minOrder || 1)}
              className="bg-blue-600 w-full"
            >
              Add to Cart
            </Button>
            
            {productVariants.length > 0 && !selectedVariant && (
              <p className="text-sm text-amber-600 mt-2">
                <InfoCircleOutlined className="mr-1" />
                Please select all options
              </p>
            )}
          </div>

          {/* Bulk Pricing */}
          {renderBulkPricing()}

          {currentProduct.tags && currentProduct.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {currentProduct.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-8">
            <Tabs defaultActiveKey="details">
              <TabPane tab="Details" key="details">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentProduct.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedVariant?.sku || currentProduct.sku}</dd>
                  </div>
                  {currentProduct.minOrder && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Minimum Order</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentProduct.minOrder} units</dd>
                    </div>
                  )}
                  {!selectedVariant && currentProduct.stock !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Stock</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentProduct.stock} units</dd>
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane tab="Shipping" key="shipping">
                <p className="text-sm text-gray-600">
                  Standard shipping: 3-5 business days<br />
                  Express shipping: 1-2 business days<br /><br />
                  Free shipping on orders over $500.
                </p>
              </TabPane>
              <TabPane tab="Returns" key="returns">
                <p className="text-sm text-gray-600">
                  We accept returns within 30 days of delivery.<br />
                  Items must be unused and in original packaging.<br />
                  Contact customer service to initiate a return.
                </p>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
          <ProductGrid products={relatedProducts} loading={false} />
        </div>
      )}
    </div>
  );
}
