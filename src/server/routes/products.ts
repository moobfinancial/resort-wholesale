import express, { Request, Response } from "express";
import { productService } from "../services/productService";
import { productVariantService } from "../services/productVariantService";
import debug from "debug";
import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import { requireAdmin } from "../middleware/auth";
// import type { Product, ProductVariant } from '@prisma/client';
// import multer from 'multer';
// import path from 'path';

const log = debug("app:products");
const router = express.Router();

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../../uploads/products'));
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // Initialize multer upload middleware
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });

// Public routes

// Get categories (specific route before parameter routes)
router.get("/categories", async (_, res) => {
  log("GET /categories called");
  try {
    const categoriesResponse = await productService.getCategories();
    log("Categories fetched:", categoriesResponse);

    // Extract the categories array from the response
    const categories =
      categoriesResponse.status === "success"
        ? categoriesResponse.data.items
        : [];

    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: string) => ({
        category,
        count: await productService.getCategoryCount(category), // pass category directly to getCategoryCount
      }))
    );
    log("Categories with count:", categoriesWithCount);

    res.json({
      status: "success",
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get categories",
    });
  }
});

// Get featured products (specific route before parameter routes)
router.get("/featured", async (_req, res) => {
  try {
    const response = await productService.getFeaturedProducts();

    // Forward the response directly since productService now returns in our standard format
    if (response.status === "success") {
      res.json(response);
    } else {
      res.status(500).json(response);
    }
  } catch (error) {
    console.error("Error getting featured products:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch featured products",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get new arrivals (specific route before parameter routes)
router.get("/new-arrivals", async (_req, res) => {
  try {
    const response = await productService.getNewArrivals();

    // Forward the response directly since productService now returns in our standard format
    if (response.status === "success") {
      res.json(response);
    } else {
      res.status(500).json(response);
    }
  } catch (error) {
    console.error("Error getting new arrivals:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch new arrivals",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// List products with filtering and pagination
router.get("/", async (req, res) => {
  log("GET / called");
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const sort = req.query.sort as string;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
    }

    const result = await productService.listProducts({
      where,
      orderBy,
      page,
      limit,
    });

    if (result.status === "success") {
      // The response from productService.listProducts already has the pagination data
      // directly in the data property, not in a nested pagination property
      const {
        items,
        total,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
      } = result.data;

      res.json({
        status: "success",
        data: {
          items,
          total,
          page: currentPage,
          limit: itemsPerPage,
          totalPages,
        },
      });
    } else {
      throw new Error(result.message || "Failed to list products");
    }
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to list products",
    });
  }
});

// Get related products (parameter route after specific routes)
router.get("/:id/related", async (req, res) => {
  log("GET /:id/related called");
  try {
    const { id } = req.params;
    const productResponse = await productService.getProductById(id);
    log("Product fetched:", productResponse);

    if (productResponse.status !== "success" || !productResponse.data.item) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const product = productResponse.data.item;

    const result = await productService.listProducts({
      where: {
        category: product.category,
        id: { not: id },
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      limit: 4,
    });
    log(
      "Related products:",
      result.status === "success" ? result.data.items : []
    );

    res.json({
      status: "success",
      data: {
        items: result.status === "success" ? result.data.items : [],
      },
    });
  } catch (error) {
    console.error("Get related products error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get related products",
    });
  }
});

// Get product price based on quantity (for bulk pricing)
router.get("/:id/price", async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = parseInt(req.query.quantity as string, 10) || 1;

    // First, check if the product exists
    const productResponse = await productService.getProductById(id);

    if (productResponse.status !== "success" || !productResponse.data.item) {
      return res.status(200).json({
        status: "success",
        data: {
          price: 0,
        },
      });
    }

    const product = productResponse.data.item;

    // Try to get bulk pricing if available
    try {
      const bulkPriceResponse = await productService.getPriceForQuantity(
        id,
        quantity
      );
      // If bulk price is available, use it, otherwise use the product base price
      const finalPrice =
        bulkPriceResponse.status === "success" &&
        bulkPriceResponse.data.price !== null
          ? bulkPriceResponse.data.price
          : product.price;

      return res.json({
        status: "success",
        data: {
          price: finalPrice,
        },
      });
    } catch (err) {
      // If bulk pricing fails, return the product base price
      return res.json({
        status: "success",
        data: {
          price: product.price,
        },
      });
    }
  } catch (error) {
    console.error("Get product price error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get product price",
    });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  log("GET /:id called");
  try {
    const { id } = req.params;
    const productResponse = await productService.getProductById(id);
    log("Product fetched:", productResponse);

    if (productResponse.status !== "success" || !productResponse.data.item) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Also fetch product variants to include with the response
    const variants = await productVariantService.getByProductId(id);

    // Include product images
    const imagesResponse = await productService.getProductImages(id);
    const images =
      imagesResponse.status === "success" ? imagesResponse.data.items : [];

    // Construct the full response
    res.json({
      status: "success",
      data: {
        item: {
          ...productResponse.data.item,
          variants: variants || [],
          images: images,
        },
      },
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get product details",
    });
  }
});

// Get product images
router.get("/:id/images", async (req, res) => {
  log("GET /:id/images called");
  try {
    const { id } = req.params;

    // Check database connection first
    const dbConnected = await productService.testConnection();

    if (!dbConnected) {
      return res.status(500).json({
        status: "error",
        message: "Database unavailable",
        details: "Cannot connect to database",
      });
    }

    // Use the product service to fetch images
    const response = await productService.getProductImages(id);

    if (response.status === "success") {
      res.json(response);
    } else {
      res.status(500).json(response);
    }
  } catch (error) {
    console.error("Get product images error:", error);
    res.status(500).json({
      status: "error",
      message: "Error retrieving product images",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Note: Image handling routes have been moved to product-images.ts
// These routes are left here as redirects to maintain backward compatibility

// Forward image upload requests to the product-images route handler
router.post("/:id/images", requireAdmin, (req: Request, res: Response) => {
  console.log("POST /:id/images - Redirecting to product-images route");
  // Just respond with success and tell the client to use the product-images endpoint
  res.json({
    status: "error",
    message: "This endpoint has been moved",
    details:
      "Please use /api/products/:productId/images from product-images.ts",
  });
});

// Forward image update requests
router.put(
  "/:id/images/:imageId",
  requireAdmin,
  (req: Request, res: Response) => {
    console.log(
      "PUT /:id/images/:imageId - Redirecting to product-images route"
    );
    res.json({
      status: "error",
      message: "This endpoint has been moved",
      details:
        "Please use /api/products/:productId/images/:imageId from product-images.ts",
    });
  }
);

// Forward image delete requests
router.delete(
  "/:id/images/:imageId",
  requireAdmin,
  (req: Request, res: Response) => {
    console.log(
      "DELETE /:id/images/:imageId - Redirecting to product-images route"
    );
    res.json({
      status: "error",
      message: "This endpoint has been moved",
      details:
        "Please use /api/products/:productId/images/:imageId from product-images.ts",
    });
  }
);

// Test DB connection
router.get("/test-db", async (_, res) => {
  try {
    const isConnected = await productService.testConnection();
    res.json({
      status: "success",
      data: {
        isConnected,
      },
    });
  } catch (error) {
    console.error("Test DB connection error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to test DB connection",
    });
  }
});

// Endpoint for variant images
router.get(
  "/variants/:variantId/images",
  async (req: Request, res: Response) => {
    log("GET /variants/:variantId/images called");
    try {
      const variantId = req.params.variantId;
      console.log("Looking up variant with ID:", variantId);

      // Check if the variant exists
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      console.log("Found variant:", variant ? "yes" : "no");

      if (!variant) {
        return res.status(404).json({
          status: "error",
          message: "Variant not found",
        });
      }

      // If variant has a direct imageUrl, return it as a single image
      if (variant.imageUrl) {
        console.log("Variant has imageUrl:", variant.imageUrl);

        return res.json({
          status: "success",
          data: {
            items: [
              {
                id: `variant-image-${variantId}`,
                url: variant.imageUrl,
                sortOrder: 0,
                isDefault: true,
              },
            ],
          },
        });
      }

      console.log("Variant has no image, returning empty array");

      // If no direct image, return empty array (in real-world scenario, you might fetch related images from a VariantImage table)
      return res.json({
        status: "success",
        data: {
          items: [],
        },
      });
    } catch (error) {
      console.error("Error retrieving variant images:", error);
      res.status(500).json({
        status: "error",
        message: "Error retrieving variant images",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Test route for creating variants without auth (for development only)
router.post("/test-variant/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const variantData = req.body;

    console.log(`Creating test variant for product ${productId}:`, variantData);

    const variant = await productVariantService.create({
      productId,
      sku: variantData.sku || `TEST-SKU-${Date.now()}`,
      price: variantData.price || 1.99,
      stock: variantData.stock || 10,
      attributes: variantData.attributes || { color: "Test", size: "Test" },
      imageUrl: variantData.imageUrl,
    });

    // Return response in the standardized format
    return res.json({
      status: "success",
      data: { item: variant },
    });
  } catch (error) {
    console.error("Error creating test variant:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create test variant",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Direct database test route for variants
router.post(
  "/direct-test-variant/:productId",
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const variantData = req.body;

      console.log(
        `Creating direct test variant for product ${productId}:`,
        variantData
      );

      // Insert directly into database
      const variant = await prisma.productVariant.create({
        data: {
          id: crypto.randomUUID(),
          productId,
          sku: variantData.sku || `TEST-SKU-${Date.now()}`,
          price: Number(variantData.price) || 2.99,
          stock: Number(variantData.stock) || 25,
          attributes: variantData.attributes || { color: "Test", size: "Test" },
          imageUrl: variantData.imageUrl || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("Created test variant:", variant);

      // Return in standardized format
      return res.json({
        status: "success",
        data: { item: variant },
      });
    } catch (error) {
      console.error("Error creating direct test variant:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create direct test variant",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Admin routes
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  log("POST / called");
  try {
    const product = await productService.createProduct(req.body);
    log("Product created:", product);

    if (!product) {
      return res.status(400).json({
        status: "error",
        message: "Failed to create product",
        details: "Product creation returned null",
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        item: product,
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create product",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  log("PUT /:id called");
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    log("Product updated:", product);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      data: {
        item: product,
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update product",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  log("DELETE /:id called");
  try {
    const { id } = req.params;
    const product = await productService.deleteProduct(id);
    log("Product deleted:", product);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      data: {
        item: product,
      },
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete product",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Variant management routes (admin only)
router.post(
  "/:id/variants",
  requireAdmin,
  async (req: Request, res: Response) => {
    log("POST /:id/variants called");
    try {
      const { id } = req.params;
      const variant = await productVariantService.create({
        productId: id,
        ...req.body,
      });
      log("Variant created:", variant);

      res.status(201).json({
        status: "success",
        data: {
          item: variant,
        },
      });
    } catch (error) {
      console.error("Create variant error:", error);
      res.status(500).json({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to create variant",
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  }
);

router.put(
  "/:productId/variants/:variantId",
  requireAdmin,
  async (req: Request, res: Response) => {
    log("PUT /:productId/variants/:variantId called");
    try {
      const { variantId } = req.params;
      const variant = await productVariantService.update({
        id: variantId,
        ...req.body,
      });
      log("Variant updated:", variant);

      if (!variant) {
        return res.status(404).json({
          status: "error",
          message: "Variant not found",
          details: `No variant found with id ${variantId}`,
        });
      }

      res.json({
        status: "success",
        data: {
          item: variant,
        },
      });
    } catch (error) {
      console.error("Update variant error:", error);
      res.status(500).json({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to update variant",
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  }
);

router.delete(
  "/:productId/variants/:variantId",
  requireAdmin,
  async (req: Request, res: Response) => {
    log("DELETE /:productId/variants/:variantId called");
    try {
      const { variantId } = req.params;
      const success = await productVariantService.delete(variantId);

      if (!success) {
        return res.status(404).json({
          status: "error",
          message: "Failed to delete variant",
          details: `Could not delete variant with id ${variantId}`,
        });
      }

      res.json({
        status: "success",
        data: { message: "Variant deleted successfully" },
      });
    } catch (error) {
      console.error("Delete variant error:", error);
      res.status(500).json({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete variant",
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  }
);

export default router;
