import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';

import customerRoutes from './routes/customers.js';
import customerSimplifiedRoutes from './routes/customers-simplified.js';
import authRoutes from './routes/auth.js';
import customerAuthRoutes from './routes/customerAuth.js';
import inventoryRoutes from './routes/inventory.js';
import inventoryReportRoutes from './routes/inventoryReports.js';
import productRoutes from './routes/products.js';
import productVariantRoutes from './routes/productVariants.js';
import bulkPricingRoutes from './routes/bulkPricing.js';
import orderRoutes from './routes/orders.js';
import documentRoutes from './routes/documents.js';
import cartRoutes from './routes/cart.js';
import creditApplicationRoutes from './routes/creditApplications.js';
import adminRoutes from './routes/admin.js';
import businessCustomerRoutes from './routes/business-customers.js';
import suppliersRouter from './routes/suppliers.js';
import supplierOrdersRouter from './routes/supplierOrders.js';
import collectionsRouter from './routes/collections.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = debug('app:server');

// Initialize Express app
const app = express();

// Configure CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};

// Apply essential middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Simple diagnostics endpoint
app.get('/api/diagnostics', (req, res) => {
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

// Apply essential routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customers-simplified', customerSimplifiedRoutes);  // No auth version
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
app.use('/api/cart', cartRoutes);

// API Routes with more specific paths
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer/documents', documentRoutes);
app.use('/api/credit-applications', creditApplicationRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  console.log('404 handler called for:', req.url);
  res.status(404).json({
    status: 'error',
    message: 'Not found'
  });
});

// Start the server
const PORT = 5180;
app.listen(PORT, () => {
  console.log(`Fixed server running at http://localhost:${PORT}`);
  console.log(`
Key endpoints:
  - GET /api/diagnostics - Basic health check
  - GET /api/customers-simplified - No-auth customer listing
  - Full API endpoints with authentication
  `);
});
