import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../public/uploads/collections");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "collection-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Get all collections
router.get("/", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { Products: true },
        },
      },
    });

    const formattedCollections = collections.map((collection) => ({
      ...collection,
      productCount: collection._count.Products,
      _count: undefined,
    }));

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      data: {
        items: formattedCollections,
      },
    });
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch collections",
      data: null,
    });
  }
});

// Get active collections (for frontend)
router.get("/active", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { Products: true },
        },
      },
    });

    const formattedCollections = collections.map((collection) => ({
      ...collection,
      productCount: collection._count.Products,
      _count: undefined,
    }));

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      data: {
        items: formattedCollections,
      },
    });
  } catch (error) {
    console.error("Failed to fetch active collections:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch active collections",
      data: null,
    });
  }
});

// Get a single collection by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Products: true },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Format collection with product count
    const formattedCollection = {
      ...collection,
      productCount: collection._count.Products,
      _count: undefined,
    };

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      data: {
        item: formattedCollection,
      },
    });
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch collection",
      data: null,
    });
  }
});

// Create a new collection
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    let imageUrl = null;

    if (req.file) {
      // Save to uploads directory
      imageUrl = `/uploads/collections/${req.file.filename}`;

      // // Also copy to public/images/collections for frontend access
      // const publicDir = path.join(__dirname, '../../public/images/collections');
      // if (!fs.existsSync(publicDir)) {
      //   fs.mkdirSync(publicDir, { recursive: true });
      // }

      // const sourcePath = path.join(__dirname, '../../public', imageUrl);
      // const destPath = path.join(publicDir, req.file.filename);

      // if (fs.existsSync(sourcePath)) {
      //   fs.copyFileSync(sourcePath, destPath);
      // }

      // // Update imageUrl to use the images path that frontend expects
      // imageUrl = `/images/collections/${req.file.filename}`;
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        imageUrl,
        isActive: isActive === "true",
      },
      include: {
        _count: {
          select: { Products: true },
        },
      },
    });

    // Format collection with product count
    const formattedCollection = {
      ...collection,
      productCount: collection._count.Products,
      _count: undefined,
    };

    // Return in standardized format expected by frontend
    res.status(201).json({
      status: "success",
      data: {
        item: formattedCollection,
      },
    });
  } catch (error) {
    console.error("Failed to create collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create collection",
      data: null,
    });
  }
});

// Update a collection
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      isActive: isActive === "true",
    };

    // If a new image was uploaded, update the imageUrl
    if (req.file) {
      // Save to uploads directory
      const uploadPath = `/uploads/collections/${req.file.filename}`;

      // Also copy to public/images/collections for frontend access
      const publicDir = path.join(__dirname, "../../public/images/collections");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const sourcePath = path.join(__dirname, "../../public", uploadPath);
      const destPath = path.join(publicDir, req.file.filename);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
      }

      // Update imageUrl to use the images path that frontend expects
      updateData.imageUrl = `/images/collections/${req.file.filename}`;

      // Delete old image if it exists
      if (existingCollection.imageUrl) {
        // Try to delete from both locations
        const oldUploadPath = existingCollection.imageUrl.replace(
          "/images/collections/",
          "/uploads/collections/"
        );
        const oldImagePath = path.join(
          __dirname,
          "../../public",
          oldUploadPath
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        const oldPublicPath = path.join(
          __dirname,
          "../../public",
          existingCollection.imageUrl
        );
        if (fs.existsSync(oldPublicPath)) {
          fs.unlinkSync(oldPublicPath);
        }
      }
    }

    // Update the collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { Products: true },
        },
      },
    });

    // Format collection with product count
    const formattedCollection = {
      ...updatedCollection,
      productCount: updatedCollection._count.Products,
      _count: undefined,
    };

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      data: {
        item: formattedCollection,
      },
    });
  } catch (error) {
    console.error("Failed to update collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update collection",
      data: null,
    });
  }
});

// Delete a collection
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Delete the collection's image if it exists
    if (existingCollection.imageUrl) {
      // Try to delete from both locations
      const publicPath = path.join(
        __dirname,
        "../../public",
        existingCollection.imageUrl
      );

      if (fs.existsSync(publicPath)) {
        fs.unlinkSync(publicPath);
      }

      // Also try to delete from uploads directory
      const uploadPath = existingCollection.imageUrl.replace(
        "/images/collections/",
        "/uploads/collections/"
      );
      const uploadFullPath = path.join(__dirname, "../../public", uploadPath);

      if (fs.existsSync(uploadFullPath)) {
        fs.unlinkSync(uploadFullPath);
      }
    }

    // Delete the collection
    await prisma.collection.delete({
      where: { id },
    });

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      message: "Collection deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete collection",
      data: null,
    });
  }
});

// Get products in a collection
router.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
      include: {
        Products: true,
      },
    });

    if (!existingCollection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      data: {
        items: existingCollection.Products,
      },
    });
  } catch (error) {
    console.error("Failed to fetch collection products:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch collection products",
      data: null,
    });
  }
});

// Add products to a collection
router.post("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Product IDs are required",
        data: null,
      });
    }

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Add products to collection
    await prisma.collection.update({
      where: { id },
      data: {
        Products: {
          connect: productIds.map((productId) => ({ id: productId })),
        },
      },
    });

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      message: "Products added to collection successfully",
      data: null,
    });
  } catch (error) {
    console.error("Failed to add products to collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add products to collection",
      data: null,
    });
  }
});

// Remove a product from a collection
router.delete("/:id/products/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({
        status: "error",
        message: "Collection not found",
        data: null,
      });
    }

    // Remove product from collection
    await prisma.collection.update({
      where: { id },
      data: {
        Products: {
          disconnect: { id: productId },
        },
      },
    });

    // Return in standardized format expected by frontend
    res.json({
      status: "success",
      message: "Product removed from collection successfully",
      data: null,
    });
  } catch (error) {
    console.error("Failed to remove product from collection:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to remove product from collection",
      data: null,
    });
  }
});

export default router;
