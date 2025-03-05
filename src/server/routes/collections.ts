import express from 'express';
import { collectionService } from '../services/collectionService';
import debug from 'debug';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const log = debug('app:collections');
const router = express.Router();

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/collections');
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

// Get active collections (for frontend)
router.get('/active', async (req, res) => {
  log('GET /active called');
  try {
    const collections = await collectionService.getActiveCollections();
    
    const formattedCollections = collections.map(collection => ({
      ...collection,
      productCount: collection._count.products,
      _count: undefined,
    }));

    res.json({
      status: 'success',
      data: formattedCollections,
    });
  } catch (error) {
    console.error('Get active collections error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get active collections',
    });
  }
});

// List collections with pagination
router.get('/', async (req, res) => {
  log('GET / called');
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await collectionService.listCollections({
      page,
      limit,
    });

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('List collections error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to list collections',
    });
  }
});

// Get a single collection by ID
router.get('/:id', async (req, res) => {
  log('GET /:id called');
  try {
    const { id } = req.params;
    const collection = await collectionService.getCollection(id);

    if (!collection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    res.json({
      status: 'success',
      data: collection,
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get collection',
    });
  }
});

// Get products in a collection
router.get('/:id/products', async (req, res) => {
  log('GET /:id/products called');
  try {
    const { id } = req.params;
    const products = await collectionService.getCollectionProducts(id);

    res.json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('Get collection products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get collection products',
    });
  }
});

// Create a new collection
router.post('/', upload.single('image'), async (req, res) => {
  log('POST / called');
  try {
    const { name, description, isActive } = req.body;
    let imageUrl = null;

    log('Request body:', req.body);
    log('File:', req.file);

    if (req.file) {
      // Save to uploads directory (already done by multer)
      const uploadPath = `/uploads/collections/${req.file.filename}`;
      
      // Copy to public directory for frontend access
      const publicDir = path.join(process.cwd(), 'public', 'images', 'collections');
      const publicPath = path.join(publicDir, req.file.filename);
      
      // Ensure the public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Copy the file from uploads to public
      fs.copyFileSync(
        path.join(process.cwd(), 'uploads', 'collections', req.file.filename),
        publicPath
      );
      
      // Set the imageUrl to the format expected by the frontend
      imageUrl = `/images/collections/${req.file.filename}`;
    }

    const collection = await collectionService.createCollection({
      name,
      description,
      imageUrl,
      isActive: isActive === 'true',
    });

    res.status(201).json({
      status: 'success',
      data: collection,
    });
  } catch (error) {
    console.error('Create collection error:', error);
    log('Create collection error details:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create collection',
    });
  }
});

// Update a collection
router.put('/:id', upload.single('image'), async (req, res) => {
  log('PUT /:id called');
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    // Check if collection exists
    const existingCollection = await collectionService.getCollection(id);

    if (!existingCollection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      isActive: isActive === 'true',
    };

    // If a new image was uploaded, update the imageUrl
    if (req.file) {
      // Save to uploads directory (already done by multer)
      const uploadPath = `/uploads/collections/${req.file.filename}`;
      
      // Copy to public directory for frontend access
      const publicDir = path.join(process.cwd(), 'public', 'images', 'collections');
      const publicPath = path.join(publicDir, req.file.filename);
      
      // Ensure the public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Copy the file from uploads to public
      fs.copyFileSync(
        path.join(process.cwd(), 'uploads', 'collections', req.file.filename),
        publicPath
      );
      
      // Set the imageUrl to the format expected by the frontend
      updateData.imageUrl = `/images/collections/${req.file.filename}`;
      
      // Delete old image if it exists
      if (existingCollection.imageUrl) {
        // Delete from uploads directory
        const oldUploadPath = path.join(
          process.cwd(), 
          'uploads', 
          existingCollection.imageUrl.replace(/^\/images/, 'collections')
        );
        
        if (fs.existsSync(oldUploadPath)) {
          fs.unlinkSync(oldUploadPath);
        }
        
        // Delete from public directory
        const oldPublicPath = path.join(
          process.cwd(),
          'public',
          existingCollection.imageUrl
        );
        
        if (fs.existsSync(oldPublicPath)) {
          fs.unlinkSync(oldPublicPath);
        }
      }
    }

    // Update the collection
    const updatedCollection = await collectionService.updateCollection(id, updateData);

    res.json({
      status: 'success',
      data: updatedCollection,
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update collection',
    });
  }
});

// Add products to a collection
router.post('/:id/products', async (req, res) => {
  log('POST /:id/products called');
  try {
    const { id } = req.params;
    const { productIds } = req.body;
    
    log('Request body:', req.body);
    log('Product IDs:', productIds);
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      log('Invalid product IDs:', productIds);
      return res.status(400).json({
        status: 'error',
        message: 'Product IDs are required',
      });
    }

    // Check if collection exists
    const existingCollection = await collectionService.getCollection(id);
    log('Existing collection:', existingCollection);

    if (!existingCollection) {
      log('Collection not found:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Add products to collection
    log('Adding products to collection:', productIds);
    const result = await collectionService.addProductsToCollection(id, productIds);
    log('Add products result:', result);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Add products to collection error:', error);
    log('Add products to collection error details:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to add products to collection',
    });
  }
});

// Remove a product from a collection
router.delete('/:id/products/:productId', async (req, res) => {
  log('DELETE /:id/products/:productId called');
  try {
    const { id, productId } = req.params;
    
    // Check if collection exists
    const existingCollection = await collectionService.getCollection(id);

    if (!existingCollection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Remove product from collection
    await collectionService.removeProductFromCollection(id, productId);

    res.json({
      status: 'success',
      message: 'Product removed from collection successfully',
    });
  } catch (error) {
    console.error('Remove product from collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to remove product from collection',
    });
  }
});

// Delete a collection
router.delete('/:id', async (req, res) => {
  log('DELETE /:id called');
  try {
    const { id } = req.params;
    
    // Check if collection exists
    const existingCollection = await collectionService.getCollection(id);

    if (!existingCollection) {
      return res.status(404).json({
        status: 'error',
        message: 'Collection not found',
      });
    }

    // Delete the collection's image if it exists
    if (existingCollection.imageUrl) {
      const imagePath = path.join(
        __dirname, 
        '../../../uploads', 
        existingCollection.imageUrl.replace(/^\/uploads/, '')
      );
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the collection
    await collectionService.deleteCollection(id);

    res.json({
      status: 'success',
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete collection',
    });
  }
});

export default router;
