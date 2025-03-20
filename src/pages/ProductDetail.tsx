import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/frontendProductStore";
import { useCartStore } from "../stores/cartStore";
import { useGuestCartStore } from "../stores/guestCartStore";
import { useCustomerAuthStore } from "../stores/customerAuth";
import ProductGrid from "../components/products/ProductGrid";
import { Tabs, Button, InputNumber, Select, message, Image } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { api, frontendProductApi } from "../lib/api";
import styled from "styled-components";
import { ProductImage } from "../types/product";

const { Option } = Select;
const { TabPane } = Tabs;

// Styled components for the inline ProductImageGallery
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

const ThumbnailButton = styled.button<{ isSelected: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  padding: 0;
  border: 2px solid ${(props) => (props.isSelected ? "#1890ff" : "transparent")};
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #40a9ff;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Add a helper function to safely format currency values
const formatPrice = (price: any): string => {
  if (price === null || price === undefined) return "$0.00";
  // Convert string prices to numbers before formatting
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  return `$${numericPrice.toFixed(2)}`;
};

// Inline ProductImageGallery component
const InlineProductImageGallery: React.FC<{
  productImages: ProductImage[];
  defaultImage?: string;
  variantImages?: ProductImage[];
}> = ({ productImages, defaultImage, variantImages = [] }) => {
  console.log("InlineProductImageGallery rendering with:", {
    productImagesCount: productImages.length,
    variantImagesCount: variantImages.length,
    defaultImage: defaultImage ? "provided" : "not provided",
  });

  // Prioritize variant images when available, otherwise use product images
  const allImages =
    variantImages.length > 0 ? [...variantImages] : [...productImages];

  // Default to the first image if no images are provided
  const defaultImageUrl =
    defaultImage ||
    (allImages.length > 0 ? allImages[0].url : "/placeholder-product.png");

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Reset selected image when images change
  useEffect(() => {
    if (allImages.length > 0) {
      // Try to find the default image from the variant or product
      const defaultImageIndex = allImages.findIndex((img) => img.isDefault);
      setSelectedImageIndex(defaultImageIndex >= 0 ? defaultImageIndex : 0);
    }
  }, [allImages]);

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <GalleryContainer>
      <MainImageContainer>
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            onVisibleChange: (vis) => setPreviewVisible(vis),
          }}
        >
          {allImages.length > 0 ? (
            <Image
              src={allImages[selectedImageIndex]?.url || defaultImageUrl}
              alt="Product image"
              fallback="/placeholder-product.png"
              preview={false}
              onClick={() => setPreviewVisible(true)}
            />
          ) : (
            <Image
              src={defaultImage}
              alt="Product image"
              fallback="/placeholder-product.png"
              preview={false}
              onClick={() => setPreviewVisible(true)}
            />
          )}
        </Image.PreviewGroup>
      </MainImageContainer>

      {allImages.length > 1 && (
        <ThumbnailsContainer>
          {allImages.map((image, index) => (
            <ThumbnailButton
              key={image.id || index}
              isSelected={selectedImageIndex === index}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
            >
              <img src={image.url} alt={`Product thumbnail ${index + 1}`} />
            </ThumbnailButton>
          ))}
        </ThumbnailsContainer>
      )}
    </GalleryContainer>
  );
};

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
    setQuantity,
  } = useProductStore();

  // Track which attributes have been selected
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // For storing product and variant images
  const [productImages, setProductImages] = useState<any[]>([]);
  const [variantImages, setVariantImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Use useCallback to memoize the error notification to prevent setState during render
  const showErrorToast = useCallback((errorMessage: string) => {
    message.error(errorMessage);
  }, []);

  useEffect(() => {
    // Fetch product if ID is available and we don't already have it
    const fetchProductIfNeeded = async () => {
      if (id && (!currentProduct || currentProduct.id !== id)) {
        console.log("Fetching product with ID:", id);
        await fetchProduct(id);
      }
    };
    fetchProductIfNeeded();
  }, [id, currentProduct, fetchProduct]);

  useEffect(() => {
    // Explicitly fetch variants when product is loaded
    const fetchVariantsExplicitly = async () => {
      if (!currentProduct?.id) return;

      try {
        console.log("Fetching variants for product:", currentProduct.id);
        // Use the API client instead of direct fetch
        const response = await frontendProductApi.getProductVariants(
          currentProduct.id
        );

        console.log("Variants API response:", response);

        // Always set a default empty array for variants to avoid undefined errors
        let processedVariants = [];

        // Only process variant data if the API call was successful
        if (response.status === "success" && response.data) {
          // Process according to standardized API response format
          if (Array.isArray(response.data)) {
            // Direct array
            processedVariants = response.data;
          } else if (response.data && typeof response.data === "object") {
            const data = response.data as any;
            if (data.items && Array.isArray(data.items)) {
              // Standard format with items array
              processedVariants = data.items;
            } else if (data.variants && Array.isArray(data.variants)) {
              // Variants in dedicated field
              processedVariants = data.variants;
            } else {
              console.log("No variants found or unexpected format:", data);
            }
          }

          console.log("Processed variants:", processedVariants);

          // Normalize the data to ensure price is always a number
          processedVariants = processedVariants.map((variant: any) => ({
            ...variant,
            price:
              typeof variant.price === "string"
                ? parseFloat(variant.price)
                : Number(variant.price || 0),
            stock:
              typeof variant.stock === "string"
                ? parseInt(variant.stock)
                : Number(variant.stock || 0),
          }));
        } else {
          console.error("API returned error status or no data:", response);
          // Continue with empty variants array
        }

        // Manually update the productVariants in the store
        if (processedVariants.length > 0) {
          useProductStore.setState({
            productVariants: processedVariants,
            variantsLoading: false,
          });

          // Extract unique attribute types for variant selection dropdowns
          const attributeTypes = new Set<string>();
          processedVariants.forEach((variant: any) => {
            if (variant.attributes && typeof variant.attributes === "object") {
              Object.keys(variant.attributes).forEach((key) =>
                attributeTypes.add(key)
              );
            }
          });

          // Initialize selected attributes with first value of each type
          const initialAttributes: Record<string, string> = {};
          attributeTypes.forEach((attrType) => {
            // Find first non-empty value for this attribute type
            for (const variant of processedVariants) {
              if (variant.attributes && variant.attributes[attrType]) {
                initialAttributes[attrType] = variant.attributes[attrType];
                break;
              }
            }
          });

          setSelectedAttributes(initialAttributes);

          // Find matching variant for initial attributes
          if (Object.keys(initialAttributes).length > 0) {
            const initialVariant = processedVariants.find((variant: any) =>
              Object.entries(initialAttributes).every(
                ([key, value]) =>
                  variant.attributes && variant.attributes[key] === value
              )
            );

            if (initialVariant) {
              setSelectedVariant(initialVariant);
            }
          }
        } else {
          useProductStore.setState({
            productVariants: [],
            variantsLoading: false,
          });
        }
      } catch (error) {
        console.error("Error fetching variants:", error);
        useProductStore.setState({
          productVariants: [],
          variantsLoading: false,
        });
      }
    };

    fetchVariantsExplicitly();
  }, [id, currentProduct?.id, setSelectedVariant]);

  useEffect(() => {
    // Fetch product images when product is loaded
    const fetchProductImages = async () => {
      if (!currentProduct?.id) return;

      try {
        setImagesLoading(true);
        const response = await api.get<any>(
          `product-images/${currentProduct.id}/images`
        );

        // Check response format and extract images safely
        if (response && response.status === "success" && response.data) {
          // Extract images data safely
          let images: any[] = [];

          if (Array.isArray(response.data)) {
            images = response.data;
          } else if (typeof response.data === "object") {
            if (
              "items" in response.data &&
              Array.isArray(response.data.items)
            ) {
              images = response.data.items;
            } else {
              // Try to handle other possible data structures
              images = Array.isArray(response.data) ? response.data : [];
            }
          }

          setProductImages(images);
        } else {
          console.warn("Failed to fetch product images:", response);
          setProductImages([]);
        }
      } catch (err) {
        console.error("Error fetching product images:", err);
        setProductImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchProductImages();
  }, [currentProduct]);

  useEffect(() => {
    // Fetch variant images when a variant is selected
    const fetchVariantImages = async () => {
      if (!selectedVariant?.id) {
        setVariantImages([]);
        return;
      }

      try {
        setImagesLoading(true);
        console.log(`Fetching images for variant ${selectedVariant.id}`);
        const response = await api.get<any>(
          `products/variants/${selectedVariant?.id}/images`
        );
        console.log(
          `Raw variant images response for variant ${selectedVariant.id}:`,
          response
        );

        // Process the response safely, handling any structure
        if (response && response.status === "success" && response.data) {
          let images: any[] = [];

          if (Array.isArray(response.data)) {
            // Direct array
            images = response.data;
          } else if (typeof response.data === "object") {
            // Check for nested data
            if (Array.isArray(response.data.items)) {
              images = response.data.items;
            } else if (Array.isArray(response.data.images)) {
              images = response.data.images;
            } else if (response.data.data) {
              // Further nested data
              const innerData = response.data.data;
              if (Array.isArray(innerData)) {
                images = innerData;
              } else if (typeof innerData === "object") {
                if (Array.isArray(innerData.items)) {
                  images = innerData.items;
                } else if (Array.isArray(innerData.images)) {
                  images = innerData.images;
                }
              }
            }
          }

          console.log(
            `Successfully processed ${images.length} images for variant ${selectedVariant.id}`
          );
          setVariantImages(images);
        } else {
          console.warn(
            `Invalid response format or error status for variant ${selectedVariant.id} images:`,
            response
          );
          message.error("Failed to load variant images");
          setVariantImages([]);
        }
      } catch (error) {
        console.error(
          `Error fetching images for variant ${selectedVariant.id}:`,
          error
        );
        message.error("Failed to load variant images");
        setVariantImages([]);
      } finally {
        setImagesLoading(false);
      }
    };
    console.log("porducts", productVariants);
    fetchVariantImages();
  }, [selectedVariant?.id, id]);
  console.log("selectedVariant", selectedVariant);
  useEffect(() => {
    // Show error via useEffect instead of during render
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  useEffect(() => {
    if (currentProduct) {
      console.log("FULL PRODUCT DETAILS:", currentProduct);
      console.log("Product image URL:", currentProduct.imageUrl);

      // Examine the type of imageUrl to ensure it's a string
      console.log("Image URL type:", typeof currentProduct.imageUrl);

      // Check if imageUrl is falsy value
      if (!currentProduct.imageUrl) {
        console.log("WARNING: Image URL is falsy:", currentProduct.imageUrl);
      }

      // Image rendering check when product or variant changes
      console.log("Image rendering check:", {
        selectedVariantImage: selectedVariant?.imageUrl,
        productImage: currentProduct.imageUrl,
        fallbackApplied: !selectedVariant?.imageUrl && !currentProduct.imageUrl,
      });
    }
  }, [currentProduct, selectedVariant]);

  // Function to get unique attribute types from variants
  const attributeTypes = useCallback(() => {
    if (!productVariants.length) return [];

    // Get all unique attribute types across all variants
    const types = new Set<string>();
    productVariants.forEach((variant) => {
      if (variant.attributes) {
        Object.keys(variant.attributes).forEach((key) => types.add(key));
      }
    });

    return Array.from(types);
  }, [productVariants]);

  // Find the right variant based on selected attributes
  useEffect(() => {
    if (
      !productVariants.length ||
      Object.keys(selectedAttributes).length === 0
    ) {
      return;
    }

    console.log(
      "Finding variant based on selected attributes:",
      selectedAttributes
    );

    // Check if we have selected values for all required attribute types
    const requiredAttributeTypes = attributeTypes();
    const hasAllRequiredAttributes = requiredAttributeTypes.every(
      (type) => selectedAttributes[type]
    );

    if (!hasAllRequiredAttributes) {
      console.log("Not all required attributes are selected");
      return;
    }

    // Find matching variant
    const matchingVariant = productVariants.find((variant) => {
      if (!variant.attributes) return false;

      // Check if all selected attributes match this variant
      return Object.entries(selectedAttributes).every(
        ([key, value]) => variant.attributes?.[key] === value
      );
    });

    console.log("Matching variant found:", matchingVariant);

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    } else {
      console.log("No matching variant found for selected attributes");
      // Clear selected variant if we can't find a match
      setSelectedVariant(null);
    }
  }, [selectedAttributes, productVariants, attributeTypes, setSelectedVariant]);

  // These functions were previously defined but not used anywhere in the component

  // Handle quantity change
  const handleQuantityChange = (value: number | null) => {
    if (value !== null && value > 0) {
      setQuantity(value);
    }
  };

  // Get authentication state
  const { isAuthenticated } = useCustomerAuthStore();

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentProduct) return;

    try {
      console.log("Adding to cart:", {
        isAuthenticated,
        productId: currentProduct.id,
        quantity,
        variantId: selectedVariant?.id,
      });

      // Use guest cart if not authenticated, otherwise use regular cart
      if (isAuthenticated) {
        const cartStore = useCartStore.getState();
        if (selectedVariant) {
          await cartStore.addItem(
            currentProduct.id,
            quantity,
            selectedVariant.id
          );
        } else {
          await cartStore.addItem(currentProduct.id, quantity);
        }
      } else {
        const guestCartStore = useGuestCartStore.getState();
        if (selectedVariant) {
          await guestCartStore.addItem(
            currentProduct.id,
            quantity,
            selectedVariant.id
          );
        } else {
          await guestCartStore.addItem(currentProduct.id, quantity);
        }
      }

      // Force a reload of the cart to update the cart icon
      if (isAuthenticated) {
        useCartStore.getState().loadCart();
      } else {
        useGuestCartStore.getState().loadCart();
      }

      message.success(`${currentProduct.name} added to cart successfully!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      message.error("Failed to add to cart. Please try again.");
    }
  };

  // Render the bulk pricing tiers if available
  const renderBulkPricing = () => {
    // Safely check if bulkPricing exists and is an array
    if (
      !bulkPricing ||
      !Array.isArray(bulkPricing) ||
      bulkPricing.length === 0
    ) {
      return null;
    }

    // Create a local copy to avoid modifying the original
    const pricingTiers = [...bulkPricing];

    return (
      <div className="mt-6 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Bulk Pricing</h3>
        <div className="grid grid-cols-2 gap-2">
          {pricingTiers
            .sort((a, b) => a.minQuantity - b.minQuantity)
            .map((tier, index) => (
              <React.Fragment key={tier.id || index}>
                <div className="text-sm text-gray-500">
                  {tier.minQuantity}+ units
                </div>
                <div className="text-sm font-semibold">
                  {formatPrice(tier.price)} each
                </div>
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
        {/* Product Image Gallery */}
        <div className="relative">
          {imagesLoading ? (
            <div className="animate-pulse h-96 bg-gray-200 rounded-lg mb-8" />
          ) : (
            <InlineProductImageGallery
              productImages={productImages}
              defaultImage={
                currentProduct?.imageUrl || "/images/products/placeholder.svg"
              }
              variantImages={selectedVariant ? variantImages : []}
            />
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentProduct.name}
          </h1>

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(
                calculatedPrice ||
                  selectedVariant?.price ||
                  currentProduct.price
              )}
            </span>
            {/* Display original price if there's a sale price */}
            {currentProduct.price &&
              calculatedPrice &&
              calculatedPrice < currentProduct.price && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(currentProduct.price)}
                </span>
              )}
          </div>

          <p className="text-gray-600 mb-8">{currentProduct.description}</p>

          {/* Product Variants */}
          {variantsLoading ? (
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          ) : (
            productVariants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Options
                </h3>

                {Object.entries(selectedAttributes).map(
                  ([attributeType, selectedValue]) => (
                    <div key={attributeType} className="mb-4">
                      <label
                        htmlFor={`attribute-${attributeType}`}
                        className="block text-sm text-gray-700 mb-2"
                      >
                        {attributeType.charAt(0).toUpperCase() +
                          attributeType.slice(1)}
                      </label>

                      <Select
                        id={`attribute-${attributeType}`}
                        placeholder={`Select ${attributeType}`}
                        onChange={(value) => {
                          const newAttributes = {
                            ...selectedAttributes,
                            [attributeType]: value,
                          };
                          setSelectedAttributes(newAttributes);

                          // Find matching variant
                          const matchingVariant = productVariants.find(
                            (variant) =>
                              Object.entries(newAttributes).every(
                                ([key, value]) =>
                                  variant.attributes &&
                                  variant.attributes[key] === value
                              )
                          );

                          if (matchingVariant) {
                            setSelectedVariant(matchingVariant);
                          }
                        }}
                        style={{ width: "100%" }}
                        value={selectedValue}
                      >
                        {Array.from(
                          new Set(
                            productVariants
                              .filter((variant) => variant.attributes)
                              .map(
                                (variant) => variant.attributes[attributeType]
                              )
                          )
                        ).map((value) => (
                          <Option key={value} value={value}>
                            {value}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  )
                )}
              </div>
            )
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm text-gray-700 mb-2"
              >
                Quantity
              </label>
              <InputNumber
                id="quantity"
                min={1}
                defaultValue={quantity}
                onChange={handleQuantityChange}
                style={{ width: "100px" }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              className="mt-6"
            >
              Add to Cart
            </Button>
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
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentProduct.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedVariant?.sku || currentProduct.sku}
                    </dd>
                  </div>
                  {currentProduct.minOrder && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Minimum Order
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentProduct.minOrder} units
                      </dd>
                    </div>
                  )}
                  {!selectedVariant && currentProduct.stock !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Stock
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentProduct.stock} units
                      </dd>
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane tab="Shipping" key="shipping">
                <p className="text-sm text-gray-600">
                  Standard shipping: 3-5 business days
                  <br />
                  Express shipping: 1-2 business days
                  <br />
                  <br />
                  Free shipping on orders over $500.
                </p>
              </TabPane>
              <TabPane tab="Returns" key="returns">
                <p className="text-sm text-gray-600">
                  We accept returns within 30 days of delivery.
                  <br />
                  Items must be unused and in original packaging.
                  <br />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Related Products
          </h2>
          <ProductGrid products={relatedProducts} loading={false} />
        </div>
      )}
    </div>
  );
}
