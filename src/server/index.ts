import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug('app:server');

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const businessDocsDir = path.join(uploadsDir, 'business-documents');

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
} catch (error) {
  console.error('Error creating directories:', error);
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Add business verification routes
try {
  const { default: businessVerificationRoutes } = await import('./routes/businessVerification.js');
  app.use('/api/business-verification', businessVerificationRoutes);
  log('Business verification routes loaded');
} catch (error) {
  console.error('Error loading business verification routes:', error);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Handle 404s
app.use((req: express.Request, res: express.Response) => {
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
