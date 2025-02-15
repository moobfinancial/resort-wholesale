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
      categories.map(async (category) => ({
        ...category,
        count: await productService.getCategoryCount(category.id)
      }))
    );
    log('Categories with count:', categoriesWithCount);

    res.json({
      status: 'success',
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get categories'
    });
  }
});

// Get featured products (specific route before parameter routes)
router.get('/featured', async (req, res) => {
  log('GET /featured called');
  try {
    const { products } = await productService.listProducts({
      where: {
        isFeatured: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      limit: 4
    });
    log('Featured products:', products);

    res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get featured products'
    });
  }
});

// Get new arrivals (specific route before parameter routes)
router.get('/new-arrivals', async (req, res) => {
  log('GET /new-arrivals called');
  try {
    const { products } = await productService.listProducts({
      where: {
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      limit: 4
    });
    log('New arrivals:', products);

    res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get new arrivals'
    });
  }
});

// List products with filtering and pagination
router.get('/', async (req, res) => {
  log('GET / called');
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 12,
      sort = 'newest'
    } = req.query;

    const where: any = { isActive: true };
    
    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
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

    const result = await productService.listProducts({
      where,
      orderBy,
      page: Number(page),
      limit: Number(limit)
    });
    log('Products listed:', result);

    res.json({
      status: 'success',
      data: {
        products: result.products,
        total: result.total,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to list products'
    });
  }
});

// Get related products (parameter route after specific routes)
router.get('/:id/related', async (req, res) => {
  log('GET /:id/related called');
  try {
    const { id } = req.params;
    const product = await productService.getProduct(id);
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

// Get single product (parameter route after specific routes)
router.get('/:id', async (req, res) => {
  log('GET /:id called');
  try {
    const { id } = req.params;
    const product = await productService.getProduct(id);
    log('Product fetched:', product);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get product'
    });
  }
});

export default router;
