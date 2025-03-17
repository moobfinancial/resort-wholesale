import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Configure CORS options
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// TESTING PHASES - Uncomment the next phase after testing the current one

// PHASE 1: Basic Express routes without any complex middleware
app.get('/phase1/health', (req, res) => {
  console.log('Phase 1 health check called');
  res.json({
    status: 'success',
    data: {
      message: 'Phase 1 is healthy',
      phase: 1
    }
  });
});

// PHASE 2: Add a route with database access
app.get('/phase2/db-test', async (req, res) => {
  try {
    console.log('Phase 2 DB test called');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    res.json({
      status: 'success',
      data: {
        message: 'Database connection successful',
        result,
        phase: 2
      }
    });
  } catch (error) {
    console.error('Phase 2 DB error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PHASE 3: Add a route that uses the authentication middleware
import { requireAuth } from './middleware/auth.js';
app.get('/phase3/protected', requireAuth, (req, res) => {
  console.log('Phase 3 protected route called');
  res.json({
    status: 'success',
    data: {
      message: 'Protected route accessed',
      phase: 3
    }
  });
});

// PHASE 4: Import a single router but don't use it yet
import customerRoutes from './routes/customers.js';
import customerSimplifiedRoutes from './routes/customers-simplified.js';
app.get('/phase4/test-import', (req, res) => {
  console.log('Phase 4 import test called');
  res.json({
    status: 'success',
    data: {
      message: 'Router imported successfully',
      phase: 4
    }
  });
});

// PHASE 5: Mount a single router
app.use('/phase5/customers', customerRoutes);
app.use('/phase5/customers-simplified', customerSimplifiedRoutes);
app.get('/phase5/status', (req, res) => {
  console.log('Phase 5 status check called');
  res.json({
    status: 'success',
    data: {
      message: 'Phase 5 router mounted',
      phase: 5
    }
  });
});

// Add error handler - this is often a source of issues
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = 3345;
app.listen(PORT, () => {
  console.log(`Progressive test server running at http://localhost:${PORT}`);
  console.log(`
Available test phases:
  - Phase 1: /phase1/health - Basic Express route
  - Phase 2: /phase2/db-test - Database access
  - Phase 3: /phase3/protected - Auth middleware (will fail without token)
  - Phase 4: /phase4/test-import - Import router but don't use it
  - Phase 5: /phase5/status - Router mounting check
  `);
});
