import express from 'express';
import productsRouter from './products';
import collectionsRouter from './collections';

const router = express.Router();

// API routes
router.use('/products', productsRouter);
router.use('/collections', collectionsRouter);

export default router;
