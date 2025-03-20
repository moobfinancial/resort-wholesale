import type { Product } from "../types/product";

// Adding ProductVariant and BulkPricing interfaces
interface ProductVariant {
  attributes: object;
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  isDefault: boolean;
  inStock: boolean;
}

interface BulkPricing {
  minimumQuantity: number;
  price: number;
}

// API Response interfaces
interface ApiResponseSuccess<T> {
  status: "success";
  data: T;
}

interface ApiResponseError {
  status: "error";
  message: string;
  data: null;
  details?: string;
}

type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

// Product response specific interfaces
interface ProductData {
  item?: Product;
  [key: string]: unknown;
}

interface ProductsData {
  items?: Product[];
  [key: string]: unknown;
}

interface AnalysisResult {
  name: string;
  category: string;
  description: string;
  suggestedTags: string[];
}

interface ImageUploadResult {
  item: unknown;
  imageUrl: string;
}

interface Headers {
  [key: string]: string;
}

const defaultHeaders: Headers = {
  "Content-Type": "application/json",
};

// Utility function to make API requests
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5177";
  // Handle endpoints with or without leading slash
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.substring(1)
    : endpoint;
  // Ensure we don't have double slashes in the URL
  const url = `${apiBaseUrl}/api/${normalizedEndpoint}`.replace(
    /([^:]\/)\/+/g,
    "$1"
  );
  // Log the URL for debugging

  // Set default headers with proper typing
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Don't set Content-Type for FormData requests
  if (!options.body || !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add authorization token if available
  const token = localStorage.getItem("token");
  if (token) {
    // Ensure token doesn't already contain the Bearer prefix
    const tokenValue = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    headers["Authorization"] = tokenValue;
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increase timeout to 15 seconds

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
      // Add mode and credentials for CORS support
      mode: "cors",
      credentials: "include",
    };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      let errorDetails = "";

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details || "";
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      // Return standardized error response format
      return {
        status: "error",
        message: errorMessage,
        details: errorDetails,
        data: null,
      } as ApiResponse<T>;
    }

    const data = await response.json();

    // Standardize the response following our API standards
    if (data) {
      // If response already follows our standard format
      if (data.status === "success" && data.data !== undefined) {
        return data as ApiResponseSuccess<T>;
      }

      // Handle legacy API format where the entire response is the data
      if (Array.isArray(data)) {
        return {
          status: "success",
          data: data as unknown as T,
        } as ApiResponseSuccess<T>;
      }

      // Wrap regular response in our standard format
      return {
        status: "success",
        data: data,
      } as ApiResponseSuccess<T>;
    }

    return {
      status: "success",
      data: null as unknown as T,
    };
  } catch (error: unknown) {
    // Log specific error details to help debugging
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(
          `Request timeout for ${url} - API server may be down or unresponsive`
        );
      } else if (
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch")
      ) {
        console.error(
          `Network error for ${url} - Check if API server is running at ${apiBaseUrl}`
        );
      } else {
        console.error(`Error fetching ${url}:`, error);
      }
    } else {
      console.error(`Unknown error fetching ${url}`);
    }

    // Return standardized error response that follows our API standards
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch",
      details:
        typeof error === "object" ? JSON.stringify(error) : String(error),
      data: null,
    };
  }
}

export const api = {
  request: request,

  // HTTP method wrappers
  get: <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post: <T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    // Handle FormData differently than JSON data
    if (data instanceof FormData) {
      // For FormData, don't stringify and don't add JSON content-type
      const formDataOptions = {
        ...options,
        method: "POST",
        body: data,
        headers: { ...(options.headers || {}) },
      };

      // Remove Content-Type to let browser set it correctly with boundary
      if (formDataOptions.headers) {
        delete (formDataOptions.headers as Record<string, string>)[
          "Content-Type"
        ];
      }

      return request<T>(endpoint, formDataOptions);
    }

    // Regular JSON data
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      body: JSON.stringify(data),
    });
  },

  put: <T>(
    endpoint: string,
    data: Record<string, unknown>,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    // Handle FormData differently than JSON data
    if (data instanceof FormData) {
      // For FormData, don't stringify and don't add JSON content-type
      const formDataOptions = {
        ...options,
        method: "PUT",
        body: data,
        headers: { ...(options.headers || {}) },
      };

      // Remove Content-Type to let browser set it correctly with boundary
      if (formDataOptions.headers) {
        // delete formDataOptions.headers["Content-Type"];
        delete (formDataOptions.headers as Record<string, string>)[
          "Content-Type"
        ];
      }

      return request<T>(endpoint, formDataOptions);
    }

    // Regular JSON data
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      body: JSON.stringify(data),
    });
  },

  delete: <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },

  uploadFormData: (
    endpoint: string,
    options: { method?: string; body: FormData }
  ) => {
    return request(endpoint, {
      method: options.method || "POST",
      body: options.body,
      headers: {}, // Empty headers object - don't set Content-Type for FormData
    });
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      api.post("admin/auth/login", { email, password }),

    logout: () => api.post("admin/auth/logout", {}),
  },

  // Product endpoints
  products: {
    create: (formData: FormData): Promise<ApiResponse<Product>> => {
      return api.uploadFormData("admin/inventory/products", {
        body: formData,
      }) as Promise<ApiResponse<Product>>;
    },

    update: (id: string, formData: FormData): Promise<ApiResponse<Product>> => {
      return api.uploadFormData(`admin/inventory/products/${id}`, {
        method: "PUT",
        body: formData,
      }) as Promise<ApiResponse<Product>>;
    },

    delete: (id: string): Promise<ApiResponse<void>> =>
      api.delete(`admin/inventory/products/${id}`),

    list: (params?: {
      category?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{ products: Product[] }>> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append("category", params.category);
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      return api.get<{ products: Product[] }>(
        `admin/inventory/products?${searchParams.toString()}`
      );
    },

    get: (id: string): Promise<ApiResponse<Product>> =>
      api.get<Product>(`admin/inventory/products/${id}`),

    analyzeImage: (imageFile: File): Promise<ApiResponse<AnalysisResult>> => {
      const formData = new FormData();
      formData.append("image", imageFile);
      return api.uploadFormData("admin/inventory/products/analyze-image", {
        body: formData,
      }) as Promise<ApiResponse<AnalysisResult>>;
    },

    uploadImage: (
      productId: string,
      imageFile: File
    ): Promise<ApiResponse<ImageUploadResult>> => {
      const formData = new FormData();
      formData.append("image", imageFile);
      return api.uploadFormData(
        `admin/inventory/products/${productId}/images`,
        {
          body: formData,
        }
      ) as Promise<ApiResponse<ImageUploadResult>>;
    },
    uploadProVariantImage: (
      productId: string,
      imageFile: File
    ): Promise<ApiResponse<ImageUploadResult>> => {
      const formData = new FormData();
      formData.append("image", imageFile);
      return api.uploadFormData(`product-images/${productId}/images`, {
        body: formData,
      }) as Promise<ApiResponse<ImageUploadResult>>;
    },

    adjustStock: (
      productId: string,
      stock: number
    ): Promise<ApiResponse<Product>> =>
      api.put<Product>(`admin/inventory/products/${productId}/stock`, {
        stock,
      }),

    updateMinimumStock: (
      productId: string,
      minOrder: number
    ): Promise<ApiResponse<Product>> =>
      api.put<Product>(`admin/inventory/products/${productId}/min-stock`, {
        minOrder,
      }),
  },

  // Inventory endpoints
  inventory: {
    getLowStockReport: (
      threshold?: number
    ): Promise<ApiResponse<{ productId: string; stock: number }[]>> => {
      const queryParam = threshold ? `?threshold=${threshold}` : "";
      return api.get<{ productId: string; stock: number }[]>(
        `admin/inventory-reports/low-stock${queryParam}`
      );
    },

    getInventoryValuation: (): Promise<
      ApiResponse<{ totalValue: number; currency: string }>
    > => {
      return api.get<{ totalValue: number; currency: string }>(
        "admin/inventory-reports/valuation"
      );
    },

    getInventoryTurnover: (
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<any>> => {
      let queryParams = "";
      if (startDate) {
        queryParams = `?startDate=${startDate}`;
        if (endDate) {
          queryParams += `&endDate=${endDate}`;
        }
      } else if (endDate) {
        queryParams = `?endDate=${endDate}`;
      }

      return api.get<any>(`admin/inventory-reports/turnover${queryParams}`);
    },

    updateStock: (
      productId: string,
      quantity: number
    ): Promise<ApiResponse<any>> => {
      return api.put<any>(`admin/inventory/${productId}`, { stock: quantity });
    },

    updateVariantStock: (
      variantId: string,
      quantity: number
    ): Promise<ApiResponse<any>> => {
      return api.put<any>(`admin/inventory/variants/${variantId}`, {
        stock: quantity,
      });
    },
  },

  // Product variant endpoints
  variants: {
    getVariants: async (
      productId: string
    ): Promise<ApiResponse<ProductVariant[]>> => {
      try {
        const response = await request<any>(`variants/${productId}/variants`);

        // Handle response according to the consistent API response format from MEMORIES
        if (response && response.status === "success") {
          let variants = [];

          // Extract variants based on the response data structure
          if (Array.isArray(response.data)) {
            // Direct array in data field
            variants = response.data;
          } else if (response.data && typeof response.data === "object") {
            // Check for nested structures
            if (
              "items" in response.data &&
              Array.isArray(response.data.items)
            ) {
              // Standard format with items array
              variants = response.data.items;
            } else if (
              "variants" in response.data &&
              Array.isArray(response.data.variants)
            ) {
              // Variants in dedicated field
              variants = response.data.variants;
            } else if ("item" in response.data && response.data.item) {
              // Single item response
              variants = [response.data.item];
            }
          }

          return {
            status: "success",
            data: variants,
          };
        } else {
          console.error("API returned error status for variants:", response);
          return {
            status: "error",
            message: response?.message || "Failed to fetch product variants",
            data: [],
          };
        }
      } catch (error) {
        console.error(`Error in getVariants for ${productId}:`, error);
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch product variants",
          data: [],
        };
      }
    },

    getVariant: (variantId: string): Promise<ApiResponse<ProductVariant>> => {
      return api.get<ProductVariant>(`variants/${variantId}`);
    },

    createVariant: (
      productId: string,
      variantData: Omit<ProductVariant, "id">
    ): Promise<ApiResponse<ProductVariant>> => {
      return api.post<ProductVariant>(
        `variants/${productId}/variants`,
        variantData
      );
    },

    updateVariant: (
      variantId: string,
      productId: string,
      variantData: Partial<ProductVariant>
    ): Promise<ApiResponse<ProductVariant>> => {
      return api.put<ProductVariant>(
        `variants/${productId}/variants/${variantId}`,
        variantData
      );
    },

    deleteVariant: (
      variantId: string,
      productId: string
    ): Promise<ApiResponse<void>> => {
      return api.delete<void>(`variants/${productId}/variants/${variantId}`);
    },
  },

  // Bulk pricing endpoints
  bulkPricing: {
    getBulkPricing: (
      productId: string
    ): Promise<ApiResponse<BulkPricing[]>> => {
      return api.get<BulkPricing[]>(
        `products-bulk-pricing/${productId}/bulk-pricing`
      );
    },

    createTier: (
      productId: string,
      tierData: Omit<BulkPricing, "id">
    ): Promise<ApiResponse<BulkPricing>> => {
      return api.post<BulkPricing>(
        `products-bulk-pricing/${productId}/bulk-pricing/tier`,
        tierData
      );
    },

    updateTier: (
      tierId: string,
      tierData: Partial<BulkPricing>
    ): Promise<ApiResponse<BulkPricing>> => {
      return api.put<BulkPricing>(`bulk-pricing/tier/${tierId}`, tierData);
    },

    deleteTier: (tierId: string): Promise<ApiResponse<void>> => {
      return api.delete<void>(`bulk-pricing/tier/${tierId}`);
    },

    calculatePrice: (
      productId: string,
      quantity: number
    ): Promise<ApiResponse<{ price: number }>> => {
      return api.get<{ price: number }>(
        `products/${productId}/calculate-price?quantity=${quantity}`
      );
    },
  },
};

// Helper function to ensure image URLs are properly formatted
const formatImageUrl = (
  input: Record<string, any> | string | null | undefined
): Record<string, any> | string => {
  // If input is null or undefined, return placeholder image
  if (input === null || input === undefined) {
    console.log("formatImageUrl received null/undefined input");
    return "/images/products/placeholder.svg";
  }

  // Handle case where we receive just a string URL instead of a product object
  if (typeof input === "string") {
    let imageUrl = input;

    // Normalize null strings
    if (imageUrl === "null" || imageUrl === "undefined") {
      imageUrl = "";
    } else if (imageUrl.startsWith("http") || imageUrl.startsWith("https")) {
      // External URL - keep as is
    } else if (imageUrl.startsWith("/images/")) {
      // Already has relative path - keep as is
    } else if (!imageUrl.startsWith("/")) {
      // If it doesn't start with /, add the product images path
      imageUrl = `/images/products/${imageUrl}`;
    }

    // If imageUrl is null after processing, set a default product image
    if (!imageUrl) {
      imageUrl = "/images/products/placeholder.svg";
    }

    return imageUrl;
  }

  // Handle case where we receive a product object
  const formattedProduct = { ...input };

  // Log product details for debugging
  // console.log("Formatting image URL for product:", {
  //   id: formattedProduct.id,
  //   name: formattedProduct.name,
  //   originalImageUrl: formattedProduct.imageUrl,
  // });

  // Check if the imageUrl exists and is a valid string
  if (
    formattedProduct.imageUrl &&
    typeof formattedProduct.imageUrl === "string"
  ) {
    // Normalize null strings
    if (
      formattedProduct.imageUrl === "null" ||
      formattedProduct.imageUrl === "undefined"
    ) {
      // console.log('Normalizing "null" or "undefined" string to empty string');
      formattedProduct.imageUrl = "";
    } else if (
      formattedProduct.imageUrl.startsWith("http") ||
      formattedProduct.imageUrl.startsWith("https")
    ) {
      // External URL - keep as is
      // console.log(
      //   "External URL detected, keeping as is:",
      //   formattedProduct.imageUrl
      // );
    } else if (formattedProduct.imageUrl.startsWith("/images/")) {
      // Already has relative path - keep as is
      // console.log(
      //   "Relative path detected, keeping as is:",
      //   formattedProduct.imageUrl
      // );
    } else if (!formattedProduct.imageUrl.startsWith("/")) {
      // If it doesn't start with /, add the product images path
      // console.log(
      //   "Adding product path to filename:",
      //   formattedProduct.imageUrl
      // );
      formattedProduct.imageUrl = `/images/products/${formattedProduct.imageUrl}`;
    }
  } else {
    // Handle non-string or empty imageUrl
    // console.log(
    //   "Product imageUrl is not a valid string:",
    //   formattedProduct.imageUrl
    // );
    formattedProduct.imageUrl = null;
  }

  // If imageUrl is still empty, null, undefined after processing, set a default product image
  if (!formattedProduct.imageUrl) {
    // console.log(
    //   "Setting placeholder image for product:",
    //   formattedProduct.id || "unknown product"
    // );
    formattedProduct.imageUrl = "/images/products/placeholder.svg";
  }

  // console.log("Final formatted image URL:", formattedProduct.imageUrl);
  return formattedProduct;
};

// Helper function to format collection image URLs
const formatCollectionImageUrl = (collection: any): any => {
  if (!collection) return collection;

  // Create a copy of the collection to avoid mutating the original
  const formattedCollection = { ...collection };

  // Check if the imageUrl exists
  if (formattedCollection.imageUrl) {
    // If imageUrl already has a proper path format, leave it as is
    if (
      formattedCollection.imageUrl.startsWith("http") ||
      formattedCollection.imageUrl.startsWith("https://")
    ) {
      // URL is already properly formatted, do nothing
    }
    // Handle paths with /uploads/ prefix (from backend)
    else if (formattedCollection.imageUrl.includes("/uploads/collections/")) {
      // Make sure the URL is absolute
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5177";
      if (!formattedCollection.imageUrl.startsWith("http")) {
        formattedCollection.imageUrl = `${apiBaseUrl}${formattedCollection.imageUrl}`;
      }
    }
    // Handle relative image paths that don't have a leading slash
    else if (
      formattedCollection.imageUrl.startsWith("images/") ||
      formattedCollection.imageUrl.startsWith("uploads/")
    ) {
      formattedCollection.imageUrl = `/${formattedCollection.imageUrl}`;
    }
    // If it's just a filename, add the proper path
    else if (!formattedCollection.imageUrl.includes("/")) {
      formattedCollection.imageUrl = `/images/categories/${formattedCollection.imageUrl}`;
    }
  }

  // If imageUrl is empty, null, or undefined after processing, set a default image
  if (
    !formattedCollection.imageUrl ||
    formattedCollection.imageUrl === "null"
  ) {
    formattedCollection.imageUrl = "/images/categories/placeholder.jpg";
  }

  console.log("Formatted collection image URL:", formattedCollection.imageUrl);

  return formattedCollection;
};

// Product API for frontend
export const frontendProductApi = {
  listProducts: async (params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params.category) {
      queryParams.append("category", params.category);
    }

    if (params.search) {
      queryParams.append("search", params.search);
    }

    if (params.page) {
      queryParams.append("page", params.page.toString());
    }

    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params.sort) {
      queryParams.append("sort", params.sort);
    }

    const response = await request<any>(`products?${queryParams.toString()}`);
    console.log(
      "API response for http://localhost:5177/api/products?" +
        queryParams.toString() +
        ":",
      response
    );

    // Handle different response formats
    let formattedProducts = [];
    let responseData = response.data;

    // Case 1: response.data contains products array
    if (
      responseData &&
      responseData.products &&
      Array.isArray(responseData.products)
    ) {
      formattedProducts = responseData.products.map(formatImageUrl);
    }
    // Case 2: response.data contains items array (standardized format)
    else if (
      responseData &&
      responseData.items &&
      Array.isArray(responseData.items)
    ) {
      formattedProducts = responseData.items.map(formatImageUrl);
      // Adjust response data to use expected structure
      responseData = {
        ...responseData,
        products: formattedProducts,
      };
    }
    // Case 3: response.data is directly an array
    else if (responseData && Array.isArray(responseData)) {
      formattedProducts = responseData.map(formatImageUrl);
      // Create a compatible structure
      responseData = {
        products: formattedProducts,
        total: formattedProducts.length,
        hasMore: false,
      };
    }
    // If we can't identify a known structure, create a safe default
    else {
      console.warn(
        "Unexpected API response structure in listProducts:",
        response
      );
      responseData = {
        products: [],
        total: 0,
        hasMore: false,
      };
    }

    return {
      status: "success",
      data: responseData,
    };
  },

  getProduct: async (id: string) => {
    try {
      const response = await request<ProductData>(`products/${id}`);

      // Check if response is in the correct format
      if (response.status === "success" && response.data) {
        // Determine if we need to extract from item property or use data directly
        let productData: any;
        if (response.data?.item) {
          console.log("Found product data in response.data.item");
          productData = response.data.item;
        } else {
          console.log("Using product data directly from response.data");
          productData = response.data;
        }

        // Format the product data, including image URLs
        const formattedProduct = formatImageUrl(productData);
        console.log("Final formatted product data:", formattedProduct);

        // Return in standardized format
        return {
          status: "success",
          data: {
            item: formattedProduct,
          },
        };
      } else {
        // Handle error response - generate fallback product data
        console.error(`Error fetching product ${id}:`, response);
        console.log(
          "Creating fallback product data since API server is unavailable"
        );

        // Create fallback product with the ID from the URL
        const fallbackProduct = {
          id: id,
          name: "Sample Product (API Unavailable)",
          description:
            "This is a sample product shown because the API server is currently unavailable. Please start the API server to see actual product data.",
          price: 99.99,
          imageUrl: "/images/products/placeholder.svg",
          category: "Sample Category",
          sku: "SAMPLE-SKU",
          stock: 100,
        };

        return {
          status: "success",
          data: {
            item: fallbackProduct,
          },
        };
      }
    } catch (error) {
      console.error(`Exception fetching product ${id}:`, error);

      // Create fallback product with the ID from the URL
      const fallbackProduct = {
        id: id,
        name: "Sample Product (API Error)",
        description:
          "This is a sample product shown because there was an error connecting to the API server. Please make sure the API server is running at http://localhost:5177.",
        price: 99.99,
        imageUrl: "/images/products/placeholder.svg",
        category: "Sample Category",
        sku: "SAMPLE-SKU",
        stock: 100,
      };

      return {
        status: "success",
        data: {
          item: fallbackProduct,
        },
      };
    }
  },

  getRelatedProducts: async (id: string) => {
    try {
      const response = await request<ProductsData>(`products/${id}/related`);

      // Check if response is in the correct format
      if (response.status === "success" && response.data) {
        // Determine if we need to extract from items property or use data directly
        let productsData: any[] = [];
        if (response.data?.items) {
          console.log("Found related products in response.data.items");
          productsData = response.data.items;
        } else if (Array.isArray(response.data)) {
          console.log(
            "Using related products directly from response.data array"
          );
          productsData = response.data;
        } else {
          console.log("No related products found or invalid format");
        }

        // Format each product in the array
        const formattedProducts = productsData.map((product) =>
          formatImageUrl(product)
        );
        console.log(`Formatted ${formattedProducts.length} related products`);

        // Return in standardized format
        return {
          status: "success",
          data: {
            items: formattedProducts,
          },
        };
      } else {
        // Handle error response
        console.error(`Error fetching related products for ${id}:`, response);
        return {
          status: "error",
          message: response.message || "Failed to fetch related products",
          data: {
            items: [],
          },
        };
      }
    } catch (error) {
      console.error(`Exception fetching related products for ${id}:`, error);
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch related products",
        data: {
          items: [],
        },
      };
    }
  },

  getCategories: async () => {
    const response = await request<any[]>("products/categories");
    return {
      status: "success",
      data: response.data,
    };
  },

  getFeaturedProducts: async () => {
    try {
      const response = await request<any>("products/featured");
      console.log("Featured products raw response:", response);

      // Initialize with empty array
      let products = [];

      // Handle response according to standardized API format
      if (response.status === "success" && response.data) {
        // Handle different potential response structures
        if (Array.isArray(response.data)) {
          // Direct array
          products = response.data;
        } else if (response.data.items) {
          // Items array inside data
          products = response.data.items;
        } else if (response.data.item) {
          // Single item (though this shouldn't happen for featured products)
          products = [response.data.item];
        }
      }

      // Format the product images
      const formattedProducts = products.map((product) =>
        formatImageUrl(product)
      );

      console.log("Featured products processed:", formattedProducts);

      return {
        status: "success",
        data: formattedProducts,
      };
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return {
        status: "success", // Keep consistent UI experience by not showing error state
        data: [],
      };
    }
  },

  getNewArrivals: async () => {
    try {
      const response = await request<any>("products/new-arrivals");
      console.log("New arrivals raw response:", response);

      // Initialize with empty array
      let products = [];

      // Handle response according to standardized API format
      if (response.status === "success" && response.data) {
        // Handle different potential response structures
        if (Array.isArray(response.data)) {
          // Direct array
          products = response.data;
        } else if (response.data.items) {
          // Items array inside data
          products = response.data.items;
        } else if (response.data.item) {
          // Single item (though this shouldn't happen for new arrivals)
          products = [response.data.item];
        }
      }

      // Format the product images
      const formattedProducts = products.map((product) =>
        formatImageUrl(product)
      );

      console.log("New arrivals processed:", formattedProducts);

      return {
        status: "success",
        data: formattedProducts,
      };
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
      return {
        status: "success", // Keep consistent UI experience by not showing error state
        data: [],
      };
    }
  },

  getCollections: async () => {
    try {
      const response = await request<any>("collections/active");
      console.log("Raw collections response:", response);

      // Initialize with empty array
      let collections = [];

      // Handle response according to standardized API format
      if (response.status === "success" && response.data) {
        // Handle different potential response structures
        if (Array.isArray(response.data)) {
          // Direct array
          collections = response.data;
        } else if (response.data.items) {
          // Items array inside data
          collections = response.data.items;
        } else if (response.data.collections) {
          // Legacy format
          collections = response.data.collections;
        }
      }

      // Format the image URLs in the collections
      const formattedCollections = collections.map(formatCollectionImageUrl);

      console.log("Collections API response:", {
        status: "success",
        data: formattedCollections,
      });
      console.log("Processed collections:", formattedCollections);

      return {
        status: "success",
        data: formattedCollections,
      };
    } catch (error) {
      console.error("Error fetching collections:", error);
      return {
        status: "success", // Keep consistent UI experience by not showing error state
        data: [],
      };
    }
  },

  getCollection: async (id: string) => {
    try {
      const response = await request<any>(`collections/${id}`);

      if (response.status === "success" && response.data) {
        return {
          status: "success",
          data: formatCollectionImageUrl(response.data),
        };
      }

      return response;
    } catch (error) {
      console.error(`Error fetching collection ${id}:`, error);
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to fetch collection",
        data: null,
      };
    }
  },

  getCollectionProducts: async (collectionId: string) => {
    try {
      const response = await request<any>(
        `collections/${collectionId}/products`
      );
      console.log("Collection products response:", response);

      return response;
    } catch (error) {
      console.error(
        `Error fetching products for collection ${collectionId}:`,
        error
      );
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch collection products",
        data: [],
      };
    }
  },

  getProductVariants: async (productId: string) => {
    try {
      console.log(`Fetching variants for product ${productId}`);
      const response = await request<any>(`variants/${productId}/variants`);
      console.log(`Raw variants response for product ${productId}:`, response);

      // Handle response according to the consistent API response format from MEMORIES
      if (response && response.status === "success") {
        let variants = [];

        // Extract variants based on the response data structure
        if (Array.isArray(response.data)) {
          // Direct array in data field
          variants = response.data;
          console.log(
            `Found ${variants.length} variants in direct array format`
          );
        } else if (response.data && typeof response.data === "object") {
          // Check for nested structures
          if ("items" in response.data && Array.isArray(response.data.items)) {
            // Standard format with items array
            variants = response.data.items;
            console.log(
              `Found ${variants.length} variants in data.items format`
            );
          } else if (
            "variants" in response.data &&
            Array.isArray(response.data.variants)
          ) {
            // Variants in dedicated field
            variants = response.data.variants;
            console.log(
              `Found ${variants.length} variants in data.variants format`
            );
          } else if ("item" in response.data && response.data.item) {
            // Single item response
            variants = [response.data.item];
            console.log("Found single variant in data.item format");
          }
        }

        console.log(
          `Successfully processed ${variants.length} variants for product ${productId}`
        );

        return {
          status: "success",
          data: variants,
        };
      } else {
        console.error("API returned error status for variants:", response);
        return {
          status: "error",
          message: response?.message || "Failed to fetch product variants",
          data: [],
        };
      }
    } catch (error) {
      console.error(`Error in getProductVariants for ${productId}:`, error);
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch product variants",
        data: [],
      };
    }
  },

  getProductBulkPricing: async (productId: string) => {
    try {
      const response = await request<BulkPricing[]>(
        `products-bulk-pricing/${productId}/bulk-pricing`
      );
      return {
        status: "success",
        data: response.data,
      };
    } catch (error) {
      console.error(`Error fetching bulk pricing for ${productId}:`, error);
      return {
        status: "success", // Return success with empty array for better UX
        data: [],
      };
    }
  },

  getProductPriceForQuantity: async (productId: string, quantity: number) => {
    try {
      try {
        const response = await request<{ price: number }>(
          `products/${productId}/price?quantity=${quantity}`
        );
        return {
          status: "success",
          data: response.data.price || 0,
        };
      } catch (error) {
        console.error(
          `Error fetching price for product ${productId} and quantity ${quantity}:`,
          error
        );

        // Attempt to get the base product price as fallback
        try {
          const productResponse = await request<{ product: { price: number } }>(
            `products/${productId}`
          );
          return {
            status: "success",
            data: productResponse.data.product.price || 0,
          };
        } catch (innerError) {
          console.error(
            `Failed to get base price for product ${productId}:`,
            innerError
          );
          return {
            status: "success",
            data: 0,
          };
        }
      }
    } catch (error) {
      console.error(
        `Error in getProductPriceForQuantity for product ${productId}:`,
        error
      );
      return {
        status: "success",
        data: 0,
      };
    }
  },
};
