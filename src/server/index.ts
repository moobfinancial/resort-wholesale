import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';
import authRoutes from './routes/auth';
import customerAuthRoutes from './routes/customerAuth';
import inventoryRoutes from './routes/inventory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug('app:server');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5175', 'http://localhost:5176'], 
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const businessDocsDir = path.join(uploadsDir, 'business-documents');
const productsDir = path.join(uploadsDir, 'products');

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
} catch (error) {
  console.error('Error creating directories:', error);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/admin/inventory', inventoryRoutes);

// Serve static files from products directory
app.use('/products', express.static(path.join(__dirname, '../../uploads/products')));

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
  res.status(404).json({
    status: 'error',
    message: 'Not found'
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log('Upload directories:');
  log('- Base:', uploadsDir);
  log('- Business docs:', businessDocsDir);
  log('- Products:', productsDir);
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
