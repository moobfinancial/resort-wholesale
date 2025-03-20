/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { productVariantService } from "../services/productVariantService";
import { prisma } from "../../lib/prisma";
import multer from "multer";
import path from "path";
import { existsSync, mkdirSync } from "fs";
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads/products");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    console.log("File will be uploaded to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const newFilename =
      "variant-" + uniqueSuffix + path.extname(file.originalname);
    console.log("Generated filename:", newFilename);
    cb(null, newFilename);
  },
});
const router = Router();

// Schema for product variant validation
const ProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().nonnegative("Stock must be non-negative"),
  attributes: z.record(z.string()),
  imageUrl: z.string().optional(),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    console.log("Multer processing file:", file.originalname, file.mimetype);
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Get all variants for a product
router.get("/:productId/variants", async (req, res) => {
  try {
    const { productId } = req.params;

    // First check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    const variants = await productVariantService.getByProductId(productId);

    // Process variant images to ensure consistent paths
    const processedVariants = variants.map((variant) => {
      let imageUrl = variant.imageUrl;

      // Process image URL for consistency
      if (imageUrl) {
        // If imageUrl is just a filename or doesn't have the proper prefix
        if (
          !imageUrl.startsWith("/images/products/") &&
          !imageUrl.startsWith("http")
        ) {
          // If it's a relative path starting with images/ but missing the leading slash
          if (imageUrl.startsWith("images/products/")) {
            imageUrl = "/" + imageUrl;
          } else if (
            imageUrl.startsWith("/uploads/products/") ||
            imageUrl.startsWith("uploads/products/")
          ) {
            // Handle old path format
            const filename = imageUrl.split("/").pop();
            imageUrl = `/uploads/products/${filename || "placeholder.svg"}`;
          } else {
            // Extract just the filename if it's a path
            const filename = imageUrl.split("/").pop();
            imageUrl = `/images/products/${filename || "placeholder.svg"}`;
          }
        }
      } else {
        // Set default placeholder if no image
        imageUrl = "/images/products/placeholder.svg";
      }

      return {
        ...variant,
        imageUrl,
      };
    });

    // Return response following the standard format
    return res.status(200).json({
      status: "success",
      data: {
        items: processedVariants,
      },
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch product variants",
    });
  }
});

// Get a specific variant
router.get("/:productId/variants/:variantId", async (req, res) => {
  try {
    const { variantId } = req.params;
    const variant = await productVariantService.getById(variantId);

    if (!variant) {
      return res.status(404).json({
        status: "error",
        message: "Variant not found",
      });
    }

    // Process image URL for consistency
    const processedVariant = { ...variant };
    if (processedVariant.imageUrl) {
      // If imageUrl is just a filename or doesn't have the proper prefix
      if (
        !processedVariant.imageUrl.startsWith("/images/products/") &&
        !processedVariant.imageUrl.startsWith("http")
      ) {
        // If it's a relative path starting with images/ but missing the leading slash
        if (processedVariant.imageUrl.startsWith("images/products/")) {
          processedVariant.imageUrl = "/" + processedVariant.imageUrl;
        } else if (
          processedVariant.imageUrl.startsWith("/uploads/products/") ||
          processedVariant.imageUrl.startsWith("uploads/products/")
        ) {
          // Handle old path format
          const filename = processedVariant.imageUrl.split("/").pop();
          processedVariant.imageUrl = `/images/products/${
            filename || "placeholder.svg"
          }`;
        } else {
          // Extract just the filename if it's a path
          const filename = processedVariant.imageUrl.split("/").pop();
          processedVariant.imageUrl = `/images/products/${
            filename || "placeholder.svg"
          }`;
        }
      }
    } else {
      // Set default placeholder if no image
      processedVariant.imageUrl = "/images/products/placeholder.svg";
    }

    return res.status(200).json({
      status: "success",
      data: {
        item: processedVariant,
      },
    });
  } catch (error) {
    console.error("Error fetching product variant:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch product variant",
    });
  }
});

// Create a new variant
router.post(
  "/:productId/variants",
  upload.single("image"),
  requireAdmin,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const file = req.file;

      // Parse the JSON data from the form
      let variantData;
      try {
        variantData = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({
          status: "error",
          message: "Invalid JSON data",
        });
      }
      console.log("variantData", variantData);
      // Validate request body
      if (file) {
        const destinationPath = `/uploads/products/${file.filename}`;
        variantData.imageUrl = destinationPath;
      }
      console.log("variantData after url", variantData);
      const validatedData = ProductVariantSchema.parse(variantData);
      console.log("validatedData", validatedData);
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      console.log("file", file);
      // Upload to cloud storage if there's a file

      // Create the variant
      const newVariant = await productVariantService.create({
        ...validatedData,
        productId,
      });

      return res.status(201).json({
        status: "success",
        data: {
          item: newVariant,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          message: "Invalid variant data",
          details: error.errors,
        });
      }
      // variantData;
      console.error("Error creating product variant:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to create product variant",
      });
    }
  }
);

// Update a variant
router.put(
  "/:productId/variants/:variantId",
  upload.single("image"),
  requireAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;
      const file = req.file;
      console.log("file", file);
      // Parse the JSON data from the form
      let variantData;
      try {
        variantData = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({
          status: "error",
          message: "Invalid JSON data",
        });
      }

      // Validate request body
      const validatedData = ProductVariantSchema.parse(variantData);

      // Check if variant exists
      const existingVariant = await productVariantService.getById(variantId);

      if (!existingVariant) {
        return res.status(404).json({
          status: "error",
          message: "Variant not found",
        });
      }

      // Only update the image URL if a new file was uploaded
      if (file) {
        // const filename = `variant-${Date.now()}-${Math.floor(
        //   Math.random() * 100000000
        // )}.${file.originalname.split(".").pop()}`;
        const destinationPath = `/uploads/products/${file.filename}`;
        // const imageUrl = await uploadToCloud(file.path, destinationPath);
        validatedData.imageUrl = destinationPath;
      } else {
        // Keep the existing image URL if no new image was uploaded
        validatedData.imageUrl = existingVariant.imageUrl ?? undefined;
      }
      console.log("validatedData", validatedData);
      // Update the variant
      const updatedVariant = await productVariantService.update({
        id: variantId,
        ...validatedData,
      });
      console.log("updatedVariant", updatedVariant);
      if (!updatedVariant) {
        return res.status(500).json({
          status: "error",
          message: "Failed to update variant",
        });
      }

      // Process image URL for consistency
      const processedVariant = { ...updatedVariant };
      console.log("processedVariant", processedVariant);
      return res.status(200).json({
        status: "success",
        data: {
          item: processedVariant,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          message: "Invalid variant data",
          details: error.errors,
        });
      }

      console.error("Error updating product variant:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update product variant",
      });
    }
  }
);

router.delete(
  "/:productId/variants/:variantId",
  requireAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;

      // Check if variant exists
      const existingVariant = await productVariantService.getById(variantId);

      if (!existingVariant) {
        return res.status(404).json({
          status: "error",
          message: "Variant not found",
        });
      }

      // Delete the variant
      await productVariantService.delete(variantId);

      return res.status(200).json({
        status: "success",
        data: {
          message: "Variant deleted successfully",
        },
      });
    } catch (error) {
      console.error("Error deleting product variant:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to delete product variant",
      });
    }
  }
);

export default router;
