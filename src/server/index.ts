import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';
import { prisma } from '../lib/prisma'; // Import prisma client directly
import authRoutes from './routes/auth';
import customerAuthRoutes from './routes/customerAuth';
import customerRoutes from './routes/customers';
import inventoryRoutes from './routes/inventory';
import inventoryReportRoutes from './routes/inventoryReports';
import productRoutes from './routes/products';
import productVariantRoutes from './routes/productVariants';
import bulkPricingRoutes from './routes/bulkPricing';
import orderRoutes from './routes/orders';
import documentRoutes from './routes/documents';
import { productService } from './services/productService';
import adminRoutes from './routes/admin';
import businessCustomerRoutes from './routes/business-customers';
import suppliersRouter from './routes/suppliers';
import supplierOrdersRouter from './routes/supplierOrders';
import collectionsRouter from './routes/collections';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug('app:server');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cookieParser());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const businessDocsDir = path.join(uploadsDir, 'business-documents');
const productsDir = path.join(uploadsDir, 'products');
const suppliersDir = path.join(uploadsDir, 'suppliers');

try {
  // Create base uploads directory
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
  console.error('Error creating directories:', error);
}

// Apply routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/inventory-reports', inventoryReportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products', productVariantRoutes);
app.use('/api/products', bulkPricingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/business-customers', businessCustomerRoutes);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/suppliers', supplierOrdersRouter);
app.use('/api/collections', collectionsRouter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, '../../public/images')));
console.log('Serving static files from:', path.join(__dirname, '../../public/images'));

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

// API Routes
app.use('/api/customer/auth', customerAuthRoutes);
console.log('Registered customer auth routes');
app.use('/api', orderRoutes); // Mount at /api to support /api/customer/orders
app.use('/api', documentRoutes); // Mount at /api to support /api/customer/documents

// Test DB connection
app.get('/api/products/test-db', async (_req, res) => {
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

// Log all registered routes
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`Route: ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log(`Route: ${middleware.regexp} ${handler.route.path}`);
        console.log(`Methods: ${Object.keys(handler.route.methods)}`);
      }
    });
  }
});

// Serve static files from products directory
app.use('/products', express.static(path.join(__dirname, '../../uploads/products')));

// Serve static files from suppliers directory
app.use('/suppliers', express.static(path.join(__dirname, '../../uploads/suppliers')));

// Add business verification routes
try {
  const { default: businessVerificationRoutes } = await import('./routes/businessVerification.js');
  app.use('/api/business-verification', businessVerificationRoutes);
  log('Business verification routes loaded');
} catch (error) {
  console.error('Error loading business verification routes:', error);
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred'
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

const PORT = process.env.PORT || 5177;

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log('Upload directories:');
  log('- Base:', uploadsDir);
  log('- Business docs:', businessDocsDir);
  log('- Products:', productsDir);
  log('- Suppliers:', suppliersDir);
});

// Handle server errors
server.on('error', (error: Error) => {
  console.error('Server error:', error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});
