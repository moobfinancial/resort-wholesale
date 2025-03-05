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
    const uploadDir = path.join(__dirname, '../../public/uploads/collections');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'collection-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const formattedCollections = collections.map(collection => ({
      ...collection,
      productCount: collection._count.products,
      _count: undefined,
    }));

    res.json(formattedCollections);
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get active collections (for frontend)
router.get('/active', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(collections);
  } catch (error) {
    console.error('Failed to fetch active collections:', error);
    res.status(500).json({ error: 'Failed to fetch active collections' });
  }
});

// Get a single collection by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create a new collection
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/collections/${req.file.filename}`;
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        imageUrl,
        isActive: isActive === 'true',
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error('Failed to create collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update a collection
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      isActive: isActive === 'true',
    };

    // If a new image was uploaded, update the imageUrl
    if (req.file) {
      updateData.imageUrl = `/uploads/collections/${req.file.filename}`;
      
      // Delete old image if it exists
      if (existingCollection.imageUrl) {
        const oldImagePath = path.join(
          __dirname, 
          '../../public', 
          existingCollection.imageUrl
        );
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Update the collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedCollection);
  } catch (error) {
    console.error('Failed to update collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete a collection
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Delete the collection's image if it exists
    if (existingCollection.imageUrl) {
      const imagePath = path.join(
        __dirname, 
        '../../public', 
        existingCollection.imageUrl
      );
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the collection
    await prisma.collection.delete({
      where: { id },
    });

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Failed to delete collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Get products in a collection
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!existingCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(existingCollection.products);
  } catch (error) {
    console.error('Failed to fetch collection products:', error);
    res.status(500).json({ error: 'Failed to fetch collection products' });
  }
});

// Add products to a collection
router.post('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs are required' });
    }

    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Add products to collection
    await prisma.collection.update({
      where: { id },
      data: {
        products: {
          connect: productIds.map(productId => ({ id: productId })),
        },
      },
    });

    res.json({ message: 'Products added to collection successfully' });
  } catch (error) {
    console.error('Failed to add products to collection:', error);
    res.status(500).json({ error: 'Failed to add products to collection' });
  }
});

// Remove a product from a collection
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    
    // Check if collection exists
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Remove product from collection
    await prisma.collection.update({
      where: { id },
      data: {
        products: {
          disconnect: { id: productId },
        },
      },
    });

    res.json({ message: 'Product removed from collection successfully' });
  } catch (error) {
    console.error('Failed to remove product from collection:', error);
    res.status(500).json({ error: 'Failed to remove product from collection' });
  }
});

export default router;
