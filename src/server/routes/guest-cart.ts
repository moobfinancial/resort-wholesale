import express, { Request, Response } from 'express';
import { prisma, isPrismaConnected } from '../../lib/prisma';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import type { Product, ProductVariant } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();

// Define types for our cart responses
type GuestCartItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product: Product;
  variant?: ProductVariant | null;
};

type GuestCart = {
  id: string;
  items: GuestCartItem[];
  createdAt: Date;
  updatedAt: Date;
};

type CartResponse = {
  status: 'success' | 'error';
  data?: {
    item: GuestCart;
    updatedItem?: GuestCartItem;
  };
  message?: string;
  details?: string;
};

// In-memory mock cart storage
const guestCartStore = new Map<string, GuestCart>();

// Helper function to generate a cart ID
const generateCartId = (): string => {
  return `guest-cart-${crypto.randomUUID()}`;
};

// Helper function to get or create a guest cart
const getOrCreateGuestCart = (cartId?: string): GuestCart => {
  let cart: GuestCart | undefined;
  
  if (cartId && guestCartStore.has(cartId)) {
    cart = guestCartStore.get(cartId);
  }
  
  if (!cart) {
    const newCartId = generateCartId();
    cart = {
      id: newCartId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    guestCartStore.set(newCartId, cart);
  }
  
  return cart;
};

// Get cart
router.get('/:cartId?', async (req: Request, res: Response<CartResponse>) => {
  try {
    const { cartId } = req.params;
    const cart = getOrCreateGuestCart(cartId);
    
    // If there are product IDs in the cart, fetch the product details
    if (cart.items.length > 0) {
      const productIds = cart.items.map(item => item.productId);
      const variantIds = cart.items
        .filter(item => item.variantId)
        .map(item => item.variantId as string);
      
      // Check database connection
      const dbConnected = await isPrismaConnected();
      
      if (dbConnected) {
        try {
          // Fetch products
          const products = await prisma.product.findMany({
            where: {
              id: {
                in: productIds
              }
            }
          });
          
          // Fetch variants if any
          const variants = variantIds.length > 0 
            ? await prisma.productVariant.findMany({
                where: {
                  id: {
                    in: variantIds
                  }
                }
              })
            : [];
          
          // Update cart items with product and variant details
          cart.items = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const variant = item.variantId 
              ? variants.find(v => v.id === item.variantId)
              : null;
            
            return {
              ...item,
              product: product ? {
                ...product,
                images: product.imageUrl ? [product.imageUrl] : [],
              } : {
                id: item.productId,
                name: 'Unknown Product',
                description: '',
                category: '',
                tags: [],
                price: 0 as any,
                imageUrl: '',
                sku: '',
                stock: 0,
                minOrder: 1,
                isActive: true,
                isFeatured: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'DRAFT' as any,
                collectionId: null,
                images: []
              },
              variant: variant ? {
                ...variant,
                attributes: {} // Ensure attributes exists even if empty
              } : null
            };
          });
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
        }
      }
    }
    
    res.json({
      status: 'success',
      data: {
        item: cart
      }
    });
  } catch (error) {
    console.error('Error getting guest cart:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cart',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add item to cart
router.post(
  '/:cartId/items',
  [
    body('productId').isString().notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('variantId').optional().isString().withMessage('Variant ID must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const { cartId } = req.params;
      const { productId, quantity, variantId } = req.body;
      
      // Check database connection
      const dbConnected = await isPrismaConnected();
      
      if (dbConnected) {
        // Get product details
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });
        
        if (!product) {
          return res.status(404).json({
            status: 'error',
            message: 'Product not found'
          });
        }
        
        // Get variant details if provided
        let variant = null;
        if (variantId) {
          variant = await prisma.productVariant.findUnique({
            where: { id: variantId }
          });
          
          if (!variant) {
            return res.status(404).json({
              status: 'error',
              message: 'Variant not found'
            });
          }
        }
        
        // Get or create cart
        const cart = getOrCreateGuestCart(cartId);
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
          item => item.productId === productId && item.variantId === variantId
        );
        
        let updatedItem: GuestCartItem;
        
        if (existingItemIndex >= 0) {
          // Update existing item
          cart.items[existingItemIndex].quantity += quantity;
          updatedItem = cart.items[existingItemIndex];
        } else {
          // Add new item
          const newItem: GuestCartItem = {
            id: crypto.randomUUID(),
            productId,
            variantId: variantId || null,
            quantity,
            product,
            variant
          };
          
          cart.items.push(newItem);
          updatedItem = newItem;
        }
        
        // Update cart timestamp
        cart.updatedAt = new Date();
        
        // Save cart
        guestCartStore.set(cart.id, cart);
        
        res.json({
          status: 'success',
          data: {
            item: cart,
            updatedItem
          }
        });
      } else {
        return res.status(503).json({
          status: 'error',
          message: 'Service temporarily unavailable',
          details: 'Database connection failed'
        });
      }
    } catch (error) {
      console.error('Error adding item to guest cart:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add item to cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Update cart item
router.put(
  '/:cartId/items/:itemId',
  [
    param('itemId').isString().notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const { cartId, itemId } = req.params;
      const { quantity } = req.body;
      
      // Get cart
      if (!guestCartStore.has(cartId)) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart not found'
        });
      }
      
      const cart = guestCartStore.get(cartId)!;
      
      // Find item
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found'
        });
      }
      
      // Update item
      cart.items[itemIndex].quantity = quantity;
      
      // Update cart timestamp
      cart.updatedAt = new Date();
      
      // Save cart
      guestCartStore.set(cartId, cart);
      
      res.json({
        status: 'success',
        data: {
          item: cart,
          updatedItem: cart.items[itemIndex]
        }
      });
    } catch (error) {
      console.error('Error updating guest cart item:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update cart item',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Remove item from cart
router.delete(
  '/:cartId/items/:itemId',
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const { cartId, itemId } = req.params;
      
      // Get cart
      if (!guestCartStore.has(cartId)) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart not found'
        });
      }
      
      const cart = guestCartStore.get(cartId)!;
      
      // Find item
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found'
        });
      }
      
      // Remove item
      cart.items.splice(itemIndex, 1);
      
      // Update cart timestamp
      cart.updatedAt = new Date();
      
      // Save cart
      guestCartStore.set(cartId, cart);
      
      res.json({
        status: 'success',
        data: {
          item: cart
        }
      });
    } catch (error) {
      console.error('Error removing guest cart item:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove cart item',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Clear cart
router.delete(
  '/:cartId',
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const { cartId } = req.params;
      
      // Get cart
      if (!guestCartStore.has(cartId)) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart not found'
        });
      }
      
      const cart = guestCartStore.get(cartId)!;
      
      // Clear items
      cart.items = [];
      
      // Update cart timestamp
      cart.updatedAt = new Date();
      
      // Save cart
      guestCartStore.set(cartId, cart);
      
      res.json({
        status: 'success',
        data: {
          item: cart
        }
      });
    } catch (error) {
      console.error('Error clearing guest cart:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to clear cart',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
