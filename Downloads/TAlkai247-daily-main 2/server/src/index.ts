import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

console.log('Starting server initialization...');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
console.log('Setting up middleware...');
app.use(cors());
app.use(express.json());

// Routes
console.log('Setting up routes...');
app.use('/api/auth', authRoutes);

// Error handling
console.log('Setting up error handling...');
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});