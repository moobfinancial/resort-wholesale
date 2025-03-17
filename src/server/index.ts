import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';

// Import routes with correct extensions
import authRoutes from './routes/auth.js';
import customerAuthRoutes from './routes/customerAuth.js';
import customerRoutes from './routes/customers.js';
import inventoryRoutes from './routes/inventory.js';
import inventoryReportRoutes from './routes/inventoryReports.js';
import productRoutes from './routes/products.js';
import productVariantRoutes from './routes/productVariants.js';
import bulkPricingRoutes from './routes/bulkPricing.js';
import orderRoutes from './routes/orders.js';
import documentRoutes from './routes/documents.js';
import cartRoutes from './routes/cart.js';
import guestCartRoutes from './routes/guest-cart.js';
import creditApplicationRoutes from './routes/creditApplications.js';
import adminRoutes from './routes/admin.js';
import adminOrdersRoutes from './routes/adminOrders.js';
import businessCustomerRoutes from './routes/business-customers.js';
import suppliersRouter from './routes/suppliers.js';
import supplierOrdersRouter from './routes/supplierOrders.js';
import collectionsRouter from './routes/collections.js';
import checkoutRoutes from './routes/checkout.js';
import customerSimplifiedRoutes from './routes/customers-simplified.js';
import productImageRoutes from './routes/product-images.js';
import debugRoutes from './routes/debug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = debug('app:server');

// Initialize Express app
const app = express();

// Configure CORS options
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // For development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5177',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5177'
      ];
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    
    // For production, restrict to frontend URL
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      const allowedOrigins = [process.env.FRONTEND_URL];
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'Cookie']
};

// Enable CORS with options
app.use(cors(corsOptions));

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Diagnostics endpoint that's guaranteed to work
app.get('/api/diagnostics', (_req, res) => {
  try {
    console.log('Diagnostics endpoint called');
    res.json({
      status: 'success',
      data: {
        message: 'API is functioning correctly',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const businessDocsDir = path.join(uploadsDir, 'business-documents');
const productsDir = path.join(uploadsDir, 'products');
const suppliersDir = path.join(uploadsDir, 'suppliers');

try {
  // Create uploads directory
  if (!fs.existsSync(uploadsDir)) {
    log('Creating uploads directory:', uploadsDir);
    fs.mkdirSync(uploadsDir);
  }
  
  // Create business-documents directory
  if (!fs.existsSync(businessDocsDir)) {
    log('Creating business-documents directory:', businessDocsDir);
    fs.mkdirSync(businessDocsDir);
  }
  
  // Create products directory
  if (!fs.existsSync(productsDir)) {
    log('Creating products directory:', productsDir);
    fs.mkdirSync(productsDir);
  }
  
  // Create suppliers directory
  if (!fs.existsSync(suppliersDir)) {
    log('Creating suppliers directory:', suppliersDir);
    fs.mkdirSync(suppliersDir);
  }
} catch (error) {
  console.error('Error creating upload directories:', error);
}

// Ensure placeholder images exist
const ensurePlaceholderExists = () => {
  const placeholderPath = path.join(__dirname, '../../public/images/products/placeholder.jpg');
  const svgPlaceholderPath = path.join(__dirname, '../../public/images/products/placeholder.svg');
  
  // Create directories if they don't exist
  const dirPath = path.join(__dirname, '../../public/images/products');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
  
  // Check if placeholder jpg exists, create if not
  if (!fs.existsSync(placeholderPath)) {
    try {
      // Simple placeholder data (a 1x1 pixel transparent PNG)
      const placeholderData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
      fs.writeFileSync(placeholderPath, placeholderData);
      console.log(`Created placeholder image: ${placeholderPath}`);
    } catch (err) {
      console.error('Failed to create placeholder image:', err);
    }
  }
  
  // Check if placeholder svg exists, create if not
  if (!fs.existsSync(svgPlaceholderPath)) {
    try {
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f8f9fa"/><text x="100" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#6c757d">Product Image</text></svg>';
      fs.writeFileSync(svgPlaceholderPath, svgContent);
      console.log(`Created SVG placeholder image: ${svgPlaceholderPath}`);
    } catch (err) {
      console.error('Failed to create SVG placeholder image:', err);
    }
  }
};

// Call function to ensure placeholders exist
ensurePlaceholderExists();

// Serve static files from uploads directory with explicit path
app.use('/uploads/suppliers', express.static(path.join(__dirname, '../../uploads/suppliers')));
app.use('/uploads/business-documents', express.static(path.join(__dirname, '../../uploads/business-documents')));

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../../public/images')));

// Global image handler middleware - catches ANY product image requests 
// and serves placeholder if the image doesn't exist
app.use(['/uploads/products/*', '/images/products/*'], (req, res, next) => {
  // Extract the requested path - this works for both /uploads/products/ and /images/products/
  const requestUrl = req.originalUrl;
  console.log(`Image request received for: ${requestUrl}`);
  
  // Skip for placeholder images to avoid loops
  if (requestUrl.includes('placeholder.jpg') || requestUrl.includes('placeholder.svg')) {
    return next();
  }
  
  // Check if the path is under /uploads/products/ and try to redirect to /images/products/
  if (requestUrl.startsWith('/uploads/products/')) {
    const fileName = path.basename(requestUrl);
    const newPath = `/images/products/${fileName}`;
    const fullPath = path.join(__dirname, '../../public', newPath);
    
    // Check if file exists at the new location
    if (fs.existsSync(fullPath)) {
      console.log(`Redirecting ${requestUrl} to ${newPath}`);
      return res.redirect(newPath);
    }
  }
  
  // For any image path, check if it physically exists
  const imagePath = requestUrl.startsWith('/uploads/products/')
    ? path.join(__dirname, '../../uploads', requestUrl.substring('/uploads'.length))
    : path.join(__dirname, '../../public', requestUrl);
  
  // Check if the file exists and serve it
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If the file doesn't exist, serve the placeholder image
      console.log(`Image not found: ${imagePath}, serving placeholder`);
      const placeholderPath = path.join(__dirname, '../../public/images/products/placeholder.jpg');
      return res.sendFile(placeholderPath);
    }
    // Let the static middleware handle it if the file exists
    next();
  });
});

// Create a route to serve our auth-test.html page
app.get('/auth-test', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../src/auth-test.html'));
});

// Create public/images directories if they don't exist
const publicDir = path.join(__dirname, '../../public');
const publicImagesDir = path.join(publicDir, 'images');
const publicProductsDir = path.join(publicImagesDir, 'products');

try {
  // Create public directory
  if (!fs.existsSync(publicDir)) {
    log('Creating public directory:', publicDir);
    fs.mkdirSync(publicDir);
  }
  
  // Create public/images directory
  if (!fs.existsSync(publicImagesDir)) {
    log('Creating public/images directory:', publicImagesDir);
    fs.mkdirSync(publicImagesDir);
  }

  // Create public/images/products directory
  if (!fs.existsSync(publicProductsDir)) {
    log('Creating public/images/products directory:', publicProductsDir);
    fs.mkdirSync(publicProductsDir);
  }
} catch (error) {
  console.error('Error creating public directories:', error);
}

// Test DB connection endpoint
app.get('/api/test-db', async (_req, res) => {
  try {
    const { productService } = await import('./services/productService.js');
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
      message: 'Failed to test DB connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple health check endpoint
app.get('/api/health', (_req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        message: 'API is healthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Plain text health check (no JSON serialization)
app.get('/api/plainhealth', (_req, res) => {
  try {
    console.log('Plain health check requested');
    res.setHeader('Content-Type', 'text/plain');
    res.send('API is healthy');
  } catch (error) {
    console.error('Plain health check error:', error);
    res.status(500).setHeader('Content-Type', 'text/plain');
    res.send('Health check failed');
  }
});

// Add business verification routes
try {
  const { default: businessVerificationRoutes } = await import('./routes/businessVerification.js');
  app.use('/api/business-verification', businessVerificationRoutes);
  log('Business verification routes loaded');
} catch (error) {
  console.error('Error loading business verification routes:', error);
}

// Apply routes with proper path mounting
app.use('/api/auth', authRoutes);  // General auth routes
app.use('/api/customers', customerRoutes);
app.use('/api/customers-simplified', customerSimplifiedRoutes); // No auth version
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/inventory-reports', inventoryReportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products', productVariantRoutes);
app.use('/api/variants', productVariantRoutes); // Add direct access to variant routes
app.use('/api/products', bulkPricingRoutes);
app.use('/api/products', productImageRoutes);
app.use('/api/admin', adminRoutes); // Mount admin routes at /api/admin
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/business-customers', businessCustomerRoutes);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/suppliers', supplierOrdersRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/guest-cart', guestCartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/debug', debugRoutes); // Add debug routes

// API Routes with more specific paths
app.use('/api/customer', customerAuthRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/customer/documents', documentRoutes);
app.use('/api/credit-applications', creditApplicationRoutes);

// Global error handler with better logging
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404s
app.use((_req: express.Request, res: express.Response) => {
  console.log('404 handler called for:', _req.url);
  res.status(404).json({
    status: 'error',
    message: 'Not found'
  });
});

const PORT = process.env.PORT || 5177;  // Changed back to 5177 as requested
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  - GET /api/diagnostics - Basic server status check (no auth)');
  console.log('  - GET /api/health - Health check endpoint (no auth)');
  console.log('  - GET /api/customers-simplified - Customer listing without auth');
  console.log('  - GET /api/customers - Regular customer endpoints (requires auth)');
  console.log('  ');
});
