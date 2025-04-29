import { create } from "zustand";
import { frontendProductApi } from "../lib/api";
import { Product, ProductVariant, BulkPricing } from "../types/product";

interface ProductQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

interface ProductState {
  products: Product[];
  categories: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
  }[];
  featuredProducts: Product[];
  newArrivals: Product[];
  collections: any[];
  currentCollection: any | null;
  collectionProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  productVariants: ProductVariant[];
  bulkPricing: BulkPricing[];
  selectedVariant: ProductVariant | null;
  quantity: number;
  calculatedPrice: number | null;
  loading: boolean;
  variantsLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;

  // Actions
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewArrivals: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  fetchCollectionProducts: (id: string) => Promise<void>;
  fetchProductVariants: (productId: string) => Promise<void>;
  fetchBulkPricing: (productId: string) => Promise<void>;
  fetchPriceForQuantity: (productId: string, quantity: number) => Promise<void>;
  setSelectedVariant: (variant: ProductVariant | null) => void;
  setQuantity: (quantity: number) => void;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
  fetchRelatedProducts: (productId: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  featuredProducts: [],
  newArrivals: [],
  collections: [],
  currentCollection: null,
  collectionProducts: [],
  currentProduct: null,
  relatedProducts: [],
  productVariants: [],
  bulkPricing: [],
  selectedVariant: null,
  quantity: 1,
  calculatedPrice: null,
  loading: false,
  variantsLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,

  fetchProducts: async (params?: ProductQueryParams) => {
    set({ loading: true, error: null });
    try {
      const queryParams = params || {};
      const response = await frontendProductApi.listProducts(queryParams);
      console.log("Products API response:", response);

      if (response.status === "success" && response.data) {
        // Handle various possible response structures based on API standards
        let productsArray = [];
        let totalCount = 0;

        // Case 1: data.products (current structure)
        if (response.data.products && Array.isArray(response.data.products)) {
          productsArray = response.data.products;
          totalCount = response.data.total || productsArray.length;
        }
        // Case 2: data.items (standardized structure)
        else if (response.data.items && Array.isArray(response.data.items)) {
          productsArray = response.data.items;
          totalCount = response.data.total || productsArray.length;
        }
        // Case 3: data is array directly
        else if (Array.isArray(response.data)) {
          productsArray = response.data;
          totalCount = productsArray.length;
        }
        // Case 4: Other unexpected structure
        else {
          console.error("Unexpected API response structure:", response);
          throw new Error("Invalid response format - no products array found");
        }

        console.log(
          `Processed ${productsArray.length} products from API response`
        );

        set({
          products: productsArray,
          totalPages: Math.ceil(totalCount / (queryParams.limit || 12)),
          currentPage: queryParams.page || 1,
          loading: false,
        });
      } else {
        console.error("API response missing success status or data:", response);
        throw new Error(
          "Invalid response format - missing success status or data"
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
        loading: false,
        products: [],
      });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await frontendProductApi.getCategories();
      if (response.status === "success" && response.data) {
        // Transform the data to match the expected format
        const transformedCategories = response.data.map((item) => {
          // If the data already has the correct structure, use it directly
          if (item.id) {
            return item;
          }
          // If the data has category and count property structure
          if (item.category) {
            return {
              ...item.category,
              count: item.count,
            };
          }
          // Fallback for any other structure
          return item;
        });

        set({ categories: transformedCategories });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch categories",
        categories: [],
      });
    }
  },

  fetchProduct: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.getProduct(productId);
      console.log("Product API response:", response);

      if (response.status === "success" && response.data) {
        // Extract product data from response, handling different potential formats
        let productData: Product | null = null;

        // Handle different response formats
        if (response.data.item && typeof response.data.item === "object") {
          // Standard format with item property
          productData = response.data.item as Product;
        } else if (
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        ) {
          // Direct object in data
          productData = response.data as Product;
        }

        if (!productData) {
          throw new Error("Invalid product data format");
        }

        console.log("Product data extracted:", productData);

        // Fetch related products for this product
        const relatedResponse = await frontendProductApi.getRelatedProducts(
          productId
        );
        let relatedProducts: Product[] = [];

        if (relatedResponse.status === "success") {
          // Process related products with type safety
          if (Array.isArray(relatedResponse.data)) {
            relatedProducts = relatedResponse.data as Product[];
          } else if (
            relatedResponse.data &&
            typeof relatedResponse.data === "object"
          ) {
            if (
              "items" in relatedResponse.data &&
              Array.isArray(relatedResponse.data.items)
            ) {
              relatedProducts = relatedResponse.data.items as Product[];
            }
          }

          // Ensure all related products have the required fields
          relatedProducts = relatedProducts.filter(
            (product) => typeof product === "object" && product !== null
          );
        }

        console.log(`Found ${relatedProducts.length} related products`);

        set({
          currentProduct: productData,
          relatedProducts,
          loading: false,
          error: null,
        });

        // Fetch variants and bulk pricing
        if (productData.id) {
          get().fetchProductVariants(productData.id);
          get().fetchBulkPricing(productData.id);
        }
      } else {
        if ("message" in response) {
          throw new Error(response.message as string);
        } else {
          throw new Error("Failed to fetch product");
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch product",
        loading: false,
        currentProduct: null,
        relatedProducts: [],
      });
    }
  },

  fetchProductVariants: async (productId: string) => {
    set({ variantsLoading: true, error: null });
    try {
      console.log(`Fetching variants for product ${productId}`);

      // Use the API client instead of direct fetch
      const response = await frontendProductApi.getProductVariants(productId);

      console.log("Variants API response:", response);

      let variantsArray: ProductVariant[] = [];

      // Follow the standardized API response format
      if (response.status === "success") {
        if (Array.isArray(response.data)) {
          // Direct array
          variantsArray = response.data;
          console.log(
            `Found ${variantsArray.length} variants in direct array format`
          );
        } else if (response.data && typeof response.data === "object") {
          const data = response.data as any;
          // Check for items array (standardized format)
          if (data.items && Array.isArray(data.items)) {
            variantsArray = data.items;
            console.log(
              `Found ${variantsArray.length} variants in data.items format`
            );
          } else if (data.variants && Array.isArray(data.variants)) {
            // Variants in dedicated field
            variantsArray = data.variants;
            console.log(
              `Found ${variantsArray.length} variants in data.variants format`
            );
          } else if (data.item) {
            // Single item response
            variantsArray = [data.item];
            console.log("Found single variant in data.item format");
          } else {
            console.log("Empty or unexpected response structure:", data);
            variantsArray = [];
          }
        }

        console.log(
          `Successfully processed ${variantsArray.length} variants for product ${productId}:`,
          variantsArray
        );

        // Ensure each variant has the required fields
        const validVariants = variantsArray.filter(
          (variant) => variant && typeof variant === "object" && "id" in variant
        );

        if (validVariants.length !== variantsArray.length) {
          console.warn(
            `Filtered out ${
              variantsArray.length - validVariants.length
            } invalid variants`
          );
        }

        set({
          productVariants: validVariants,
          variantsLoading: false,
          error: null,
        });
      } else {
        console.error("API returned error status for variants:", response);
        set({
          variantsLoading: false,
          productVariants: [],
          error: response.message || "Failed to fetch product variants",
        });
      }
    } catch (error) {
      console.error("Error fetching product variants:", error);
      set({
        variantsLoading: false,
        productVariants: [],
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  },

  fetchBulkPricing: async (productId: string) => {
    try {
      const response = await frontendProductApi.getProductBulkPricing(
        productId
      );
      if (response.status === "success") {
        set({ bulkPricing: response.data });

        // Update calculated price based on current quantity
        const currentQuantity = get().quantity;
        get().fetchPriceForQuantity(productId, currentQuantity);
      }
    } catch (error) {
      console.error("Error fetching bulk pricing:", error);
      set({ bulkPricing: [] });
    }
  },

  fetchPriceForQuantity: async (productId: string, quantity: number) => {
    try {
      const selectedVariant = get().selectedVariant;

      // If we have a selected variant, use its price
      if (selectedVariant) {
        set({ calculatedPrice: selectedVariant.price });
        return;
      }

      // Otherwise, calculate price based on quantity using bulk pricing
      const response = await frontendProductApi.getProductPriceForQuantity(
        productId,
        quantity
      );
      if (response.status === "success") {
        set({ calculatedPrice: response.data });
      }
    } catch (error) {
      console.error("Error fetching price for quantity:", error);
      // Fall back to base product price
      const product = get().currentProduct;
      set({ calculatedPrice: product?.price ?? null });
    }
  },

  setSelectedVariant: (variant: ProductVariant | null) => {
    set({
      selectedVariant: variant,
      calculatedPrice: variant?.price ?? get().currentProduct?.price ?? null,
    });
  },

  setQuantity: (quantity: number) => {
    const currentProduct = get().currentProduct;
    set({ quantity });

    if (currentProduct && !get().selectedVariant) {
      get().fetchPriceForQuantity(currentProduct.id, quantity);
    }
  },

  fetchFeaturedProducts: async () => {
    try {
      console.log("Fetching featured products...");
      const response = await frontendProductApi.getFeaturedProducts();
      console.log("Featured products response:", response);
      if (response.status === "success") {
        // Handle different possible data structures based on API standards
        let products: Product[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response
          products = response.data;
        } else if (response.data && response.data.items) {
          // Paginated collection with items
          products = response.data.items;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nested data array
          products = response.data.data;
        } else {
          // Assume it's the correct format
          products = response.data || [];
        }

        // Process image URLs to ensure they're properly formatted
        const processedProducts = products.map((product) => {
          // Handle product with appropriate type casting
          const processedProduct = {
            ...product,
            // imageUrl: typeof product.imageUrl === 'string'
            //   ? formatImageUrl(product.imageUrl) as string
            //   : '/images/products/placeholder.svg'
          };
          return processedProduct as Product;
        });

        console.log("Featured products after processing:", processedProducts);
        set({ featuredProducts: processedProducts });
      } else {
        throw new Error(response.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch featured products",
        featuredProducts: [],
      });
    }
  },

  fetchNewArrivals: async () => {
    try {
      console.log("Fetching new arrivals...");
      const response = await frontendProductApi.getNewArrivals();
      console.log("New arrivals response:", response);
      if (response.status === "success") {
        // Handle different possible data structures based on API standards
        let products: Product[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response
          products = response.data;
        } else if (response.data && response.data.items) {
          // Paginated collection with items
          products = response.data.items;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nested data array
          products = response.data.data;
        } else {
          // Assume it's the correct format
          products = response.data || [];
        }

        // Process image URLs to ensure they're properly formatted
        const processedProducts = products.map((product) => {
          // Handle product with appropriate type casting
          const processedProduct = {
            ...product,
            // imageUrl: typeof product.imageUrl === 'string'
            //   ? formatImageUrl(product.imageUrl) as string
            //   : '/images/products/placeholder.svg'
          };
          return processedProduct as Product;
        });

        console.log("New arrivals after processing:", processedProducts);
        set({ newArrivals: processedProducts });
      } else {
        throw new Error(response.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch new arrivals",
        newArrivals: [],
      });
    }
  },

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching collections...");
      const response = await frontendProductApi.getCollections();
      console.log("Collections API response:", response);

      if (response.status === "success") {
        let processedCollections;

        // Handle different response formats
        if (Array.isArray(response.data)) {
          processedCollections = response.data;
        } else if (response.data && response.data.items) {
          processedCollections = response.data.items;
        } else if (
          response.data &&
          response.data.collections &&
          Array.isArray(response.data.collections)
        ) {
          processedCollections = response.data.collections;
        } else if (response.data && Array.isArray(response.data.data)) {
          processedCollections = response.data.data;
        } else {
          console.error("Unexpected collections data structure:", response);
          processedCollections = [];
        }

        // Map to ensure all collections have proper structure and image URLs
        const formattedCollections = processedCollections.map(
          (collection: any) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description || "",
            imageUrl: collection?.imageUrl, //formatImageUrl(collection.imageUrl),
            productCount:
              collection.productCount || collection._count?.Product || 0,
            isActive: collection.isActive !== false, // default to true if not specified
          })
        );

        console.log("Processed collections:", formattedCollections);
        set({ collections: formattedCollections, loading: false });
      } else {
        console.error("API error or no data in response:", response);
        throw new Error(response.message || "Failed to fetch collections");
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      set({
        collections: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch collections",
        loading: false,
      });
    }
  },

  fetchCollection: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.getCollection(id);
      console.log("Collection response:", response);
      if (response.status === "success" && response.data) {
        // Handle both direct and nested response formats
        if (response.data.id) {
          set({ currentCollection: response.data, loading: false });
        } else if (response.data.collection && response.data.collection.id) {
          set({ currentCollection: response.data.collection, loading: false });
        } else {
          throw new Error("Invalid collection data format");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to fetch collection:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch collection",
        loading: false,
        currentCollection: null,
      });
    }
  },

  fetchCollectionProducts: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.getCollectionProducts(id);
      console.log("Collection products response:", response);
      if (response.status === "success" && response.data) {
        // Handle both direct array and nested response formats
        if (Array.isArray(response.data)) {
          set({ collectionProducts: response.data, loading: false });
        } else if (
          response.data.products &&
          Array.isArray(response.data.products)
        ) {
          set({ collectionProducts: response.data.products, loading: false });
        } else {
          throw new Error("Invalid collection products data format");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to fetch collection products:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch collection products",
        loading: false,
        collectionProducts: [],
      });
    }
  },

  fetchRelatedProducts: async (productId: string) => {
    try {
      // Fetch related products
      const response = await frontendProductApi.getRelatedProducts(productId);

      if (response.status === "success") {
        let relatedData: Product[] = [];

        // Handle different API response formats
        if (Array.isArray(response.data)) {
          relatedData = response.data as Product[];
        } else if (response.data && typeof response.data === "object") {
          if ("items" in response.data && Array.isArray(response.data.items)) {
            relatedData = response.data.items as Product[];
          }
        }

        // Map related products to ensure correct type
        const formattedRelated = relatedData
          .map((product) => {
            if (typeof product === "object" && product !== null) {
              return {
                id: product.id || "",
                name: product.name || "",
                price: typeof product.price === "number" ? product.price : 0,
                description: product.description || "",
                imageUrl: product.imageUrl || "",
                // Include other required properties with defaults
                ...product,
              };
            }
            return null;
          })
          .filter((product): product is Product => product !== null);

        set({ relatedProducts: formattedRelated });
      } else {
        set({ relatedProducts: [] });
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
      set({ relatedProducts: [] });
    }
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    const state = get();
    state.fetchProducts({ page, limit: 12 });
  },

  clearError: () => set({ error: null }),
}));

// Helper function to format image URLs consistently
// function formatImageUrl(url: string | undefined | null): string {
//   if (!url) {
//     return '/images/products/placeholder.svg';
//   }

//   // If URL already has a proper format, return it
//   if (url.startsWith('http') || url.startsWith('/images/')) {
//     return url;
//   }

//   // If URL is just a filename
//   if (!url.includes('/')) {
//     return `/images/products/${url}`;
//   }

//   // Handle URLs that might have the wrong format
//   if (url.startsWith('images/')) {
//     return `/${url}`;
//   }

//   // Extract filename as fallback
//   const filename = url.split('/').pop();
//   return `/images/products/${filename}`;
// }
