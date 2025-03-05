import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        BulkPricing: true,
      },
    });

    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get featured products (for homepage)
router.get('/featured', async (req, res) => {
  try {
    const featuredProducts = await prisma.product.findMany({
      where: { 
        isFeatured: true,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 8, // Limit to 8 products for the homepage
      include: {
        BulkPricing: true,
      },
    });

    res.json(featuredProducts);
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get new arrivals (for homepage)
router.get('/new-arrivals', async (req, res) => {
  try {
    const newArrivals = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8, // Limit to 8 products for the homepage
      include: {
        BulkPricing: true,
      },
    });

    res.json(newArrivals);
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error);
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        BulkPricing: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data);
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        tags: productData.tags || [],
        price: productData.price,
        sku: productData.sku,
        stock: productData.stock || 0,
        minOrder: productData.minOrder || 1,
        imageUrl: imageUrl || '',
        isActive: productData.isActive || false,
        isFeatured: productData.isFeatured || false,
        supplierId: productData.supplierId,
        BulkPricing: {
          create: productData.bulkPricing?.map((pricing: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            minQuantity: pricing.minQuantity,
            price: pricing.price,
          })) || [],
        },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const productData = JSON.parse(req.body.data);
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        BulkPricing: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prepare update data
    const updateData: any = {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      tags: productData.tags || [],
      price: productData.price,
      sku: productData.sku,
      minOrder: productData.minOrder || 1,
      isActive: productData.isActive,
      isFeatured: productData.isFeatured,
      supplierId: productData.supplierId,
    };

    // If a new image was uploaded, update the imageUrl
    if (req.file) {
      updateData.imageUrl = `/uploads/products/${req.file.filename}`;
      
      // Delete old image if it exists
      if (existingProduct.imageUrl) {
        const oldImagePath = path.join(
          __dirname, 
          '../../public', 
          existingProduct.imageUrl
        );
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Handle bulk pricing updates separately
    if (productData.bulkPricing && Array.isArray(productData.bulkPricing)) {
      // Delete all existing bulk pricing
      await prisma.bulkPricing.deleteMany({
        where: { productId: id },
      });
      
      // Create new bulk pricing entries
      for (const pricing of productData.bulkPricing) {
        await prisma.bulkPricing.create({
          data: {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            minQuantity: pricing.minQuantity,
            price: pricing.price,
            productId: id,
          },
        });
      }
    }

    // Fetch the updated product with bulk pricing
    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        BulkPricing: true,
      },
    });

    res.json(finalProduct);
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product's image if it exists
    if (existingProduct.imageUrl) {
      const imagePath = path.join(
        __dirname, 
        '../../public', 
        existingProduct.imageUrl
      );
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
