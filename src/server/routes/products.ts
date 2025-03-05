import express from 'express';
import { productService } from '../services/productService';
import debug from 'debug';

const log = debug('app:products');
const router = express.Router();

// Get categories (specific route before parameter routes)
router.get('/categories', async (req, res) => {
  log('GET /categories called');
  try {
    const categories = await productService.getCategories();
    log('Categories fetched:', categories);

    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category, index) => ({
        category: category, // remove spread and use index for category
        count: await productService.getCategoryCount(category), // pass category directly to getCategoryCount
      }))
    );
    log('Categories with count:', categoriesWithCount);

    res.json({
      status: 'success',
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get categories',
    });
  }
});

// Get featured products (specific route before parameter routes)
router.get('/featured', async (req, res) => {
  log('GET /featured called');
  try {
    const products = await productService.getFeaturedProducts();
    log('Featured products:', products);

    res.json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get featured products',
    });
  }
});

// Get new arrivals (specific route before parameter routes)
router.get('/new-arrivals', async (req, res) => {
  log('GET /new-arrivals called');
  try {
    const products = await productService.getNewArrivals();
    log('New arrivals:', products);

    res.json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get new arrivals',
    });
  }
});

// List products with filtering and pagination
router.get('/', async (req, res) => {
  log('GET / called');
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
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
    }

    const { products, hasMore, pagination: { total } } = await productService.listProducts({
      where,
      orderBy,
      page,
      limit,
    });

    res.json({
      status: 'success',
      data: { products, total, hasMore },
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to list products',
    });
  }
});

// Get related products (parameter route after specific routes)
router.get('/:id/related', async (req, res) => {
  log('GET /:id/related called');
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    log('Product fetched:', product);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const { products } = await productService.listProducts({
      where: {
        category: product.category,
        id: { not: id },
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      limit: 4
    });
    log('Related products:', products);

    res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get related products'
    });
  }
});

// Get product price based on quantity (for bulk pricing)
router.get('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = parseInt(req.query.quantity as string, 10) || 1;
    
    // First, check if the product exists
    const product = await productService.getProductById(id);
    
    if (!product) {
      return res.status(200).json({
        status: 'success',
        data: {
          price: 0
        }
      });
    }
    
    // Try to get bulk pricing if available
    try {
      const bulkPrice = await productService.getPriceForQuantity(id, quantity);
      // If bulk price is available, use it, otherwise use the product base price
      const finalPrice = bulkPrice !== null ? bulkPrice : product.price;
      
      res.json({
        status: 'success',
        data: {
          price: finalPrice
        }
      });
    } catch (error) {
      // If there's an error getting bulk pricing, fallback to regular price
      console.error('Error getting bulk price:', error);
      res.json({
        status: 'success',
        data: {
          price: product.price
        }
      });
    }
  } catch (error) {
    console.error('Error getting product price:', error);
    res.status(200).json({
      status: 'success',
      data: {
        price: 0
      }
    });
  }
});

// Get single product (parameter route after specific routes)
router.get('/:id', async (req, res) => {
  log('GET /:id called');
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    res.json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get product',
    });
  }
});

// Test DB connection
router.get('/test-db', async (req, res) => {
  try {
    const isConnected = await productService.testConnection();
    res.json({
      status: 'success',
      data: {
        isConnected
      }
    });
  } catch (error) {
    console.error('Test DB connection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to test DB connection'
    });
  }
});

export default router;
