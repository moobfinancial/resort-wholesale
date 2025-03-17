import express from 'express';
import { collectionService } from '../services/collectionService';
import debug from 'debug';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth';

const log = debug('app:collections');
const router = express.Router();

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads', 'collections');
const publicDir = path.join(process.cwd(), 'public', 'images', 'collections');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
    const result = await collectionService.getActiveCollections();
    if (result.status === 'error') {
      return res.status(500).json(result);
    }
    res.json({
      status: 'success',
      data: {
        items: result.data?.items || []
      }
    });
  } catch (error) {
    console.error('Get active collections error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get active collections'
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
      orderBy: { createdAt: 'desc' },
    });

    if (result.status === 'error') {
      return res.status(500).json(result);
    }
    
    res.json({
      status: 'success',
      data: {
        items: result.data?.items || [],
        total: result.data?.total || 0,
        page: result.data?.page || 1,
        limit: result.data?.limit || 10,
        totalPages: result.data?.totalPages || 0
      }
    });
  } catch (error) {
    console.error('List collections error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to list collections'
    });
  }
});

// Get a single collection by ID
router.get('/:id', async (req, res) => {
  log('GET /:id called');
  try {
    const { id } = req.params;
    const result = await collectionService.getCollection(id);

    if (result.status === 'error') {
      return res.status(404).json(result);
    }

    res.json({
      status: 'success',
      data: {
        item: result.data?.item || null
      }
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get collection'
    });
  }
});

// Get products in a collection
router.get('/:id/products', async (req, res) => {
  log('GET /:id/products called');
  try {
    const { id } = req.params;
    const result = await collectionService.getCollectionProducts(id);
    
    if (result.status === 'error') {
      return res.status(500).json(result);
    }

    res.json({
      status: 'success',
      data: {
        items: result.data?.items || []
      }
    });
  } catch (error) {
    console.error('Get collection products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get collection products'
    });
  }
});

// Create a new collection
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  log('POST / called');
  try {
    const { name, description, isActive } = req.body;
    let imageUrl = null;

    log('Request body:', req.body);
    log('File:', req.file);

    if (req.file) {
      // Copy to public directory for frontend access
      const publicPath = path.join(publicDir, req.file.filename);
      fs.copyFileSync(req.file.path, publicPath);
      
      // Set the imageUrl to the format expected by the frontend
      imageUrl = `/images/collections/${req.file.filename}`;
    }

    const result = await collectionService.createCollection({
      name,
      description,
      imageUrl,
      isActive: isActive === 'true',
    });

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    res.status(201).json({
      status: 'success',
      data: {
        item: result.data?.item || null
      }
    });
  } catch (error) {
    console.error('Create collection error:', error);
    log('Create collection error details:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create collection'
    });
  }
});

// Update a collection
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  log('PUT /:id called');
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    let imageUrl = undefined;

    if (req.file) {
      // Copy to public directory for frontend access
      const publicPath = path.join(publicDir, req.file.filename);
      fs.copyFileSync(req.file.path, publicPath);
      
      // Set the imageUrl to the format expected by the frontend
      imageUrl = `/images/collections/${req.file.filename}`;
    }

    const result = await collectionService.updateCollection(id, {
      name,
      description,
      imageUrl,
      isActive: isActive === 'true',
    });

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    res.json({
      status: 'success',
      data: {
        item: result.data?.item || null
      }
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update collection'
    });
  }
});

// Delete a collection
router.delete('/:id', requireAdmin, async (req, res) => {
  log('DELETE /:id called');
  try {
    const { id } = req.params;
    const result = await collectionService.deleteCollection(id);

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete collection'
    });
  }
});

// Add products to a collection
router.post('/:id/products', requireAdmin, async (req, res) => {
  log('POST /:id/products called');
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    const result = await collectionService.addProductsToCollection(id, productIds);

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Add products to collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to add products to collection'
    });
  }
});

// Remove product from a collection
router.delete('/:collectionId/products/:productId', requireAdmin, async (req, res) => {
  log('DELETE /:collectionId/products/:productId called');
  try {
    const { collectionId, productId } = req.params;
    const result = await collectionService.removeProductFromCollection(collectionId, productId);

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Remove product from collection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to remove product from collection'
    });
  }
});

export default router;
