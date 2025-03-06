import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

// Get cart for the current customer
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    // Find cart for the customer
    let cart = await prisma.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            Product: true,
            ProductVariant: true,
          },
        },
      },
    });

    // If no cart exists, create one
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          customerId,
        },
        include: {
          items: {
            include: {
              Product: true,
              ProductVariant: true,
            },
          },
        },
      });
    }

    res.json({
      status: 'success',
      data: cart,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch cart',
    });
  }
});

// Add item to cart
router.post(
  '/items',
  requireAuth,
  [
    body('productId').isString().notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('variantId').optional().isString().withMessage('Variant ID must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const customerId = req.user?.id;
      const { productId, quantity, variantId } = req.body;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Find or create cart for the customer
      let cart = await prisma.cart.findFirst({
        where: { customerId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            customerId,
          },
        });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      // Check if variant exists if variantId is provided
      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!variant) {
          return res.status(404).json({
            status: 'error',
            message: 'Product variant not found',
          });
        }

        // Check if variant has enough stock
        if (variant.stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'Not enough stock available',
          });
        }
      } else {
        // Check if product has enough stock
        if (product.stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'Not enough stock available',
          });
        }
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existingItem) {
        // Update existing item
        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity,
          },
          include: {
            Product: true,
            ProductVariant: true,
          },
        });

        return res.json({
          status: 'success',
          data: updatedItem,
        });
      }

      // Add new item to cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
        include: {
          Product: true,
          ProductVariant: true,
        },
      });

      res.json({
        status: 'success',
        data: cartItem,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to add item to cart',
      });
    }
  }
);

// Update cart item quantity
router.put(
  '/items/:id',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const customerId = req.user?.id;
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Find cart for the customer
      const cart = await prisma.cart.findFirst({
        where: { customerId },
      });

      if (!cart) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart not found',
        });
      }

      // Find cart item
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id,
          cartId: cart.id,
        },
        include: {
          Product: true,
          ProductVariant: true,
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found',
        });
      }

      // Check stock availability
      if (cartItem.variantId) {
        if (cartItem.ProductVariant && cartItem.ProductVariant.stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'Not enough stock available',
          });
        }
      } else {
        if (cartItem.Product.stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'Not enough stock available',
          });
        }
      }

      // Update cart item
      const updatedItem = await prisma.cartItem.update({
        where: { id },
        data: {
          quantity,
        },
        include: {
          Product: true,
          ProductVariant: true,
        },
      });

      res.json({
        status: 'success',
        data: updatedItem,
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update cart item',
      });
    }
  }
);

// Remove item from cart
router.delete(
  '/items/:id',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Item ID is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const customerId = req.user?.id;
      const { id } = req.params;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Find cart for the customer
      const cart = await prisma.cart.findFirst({
        where: { customerId },
      });

      if (!cart) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart not found',
        });
      }

      // Find cart item
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id,
          cartId: cart.id,
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found',
        });
      }

      // Delete cart item
      await prisma.cartItem.delete({
        where: { id },
      });

      res.json({
        status: 'success',
        message: 'Item removed from cart',
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove item from cart',
      });
    }
  }
);

// Clear cart
router.delete('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    // Find cart for the customer
      const cart = await prisma.cart.findFirst({
      where: { customerId },
    });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found',
      });
    }

    // Delete all cart items
      await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      status: 'success',
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to clear cart',
    });
  }
});

export default router;
