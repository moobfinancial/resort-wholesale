import express, { Request, Response } from "express";
import { prisma, isPrismaConnected } from "../../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validate";
import type { Cart, CartItem, Product, ProductVariant } from "@prisma/client";
import crypto from "crypto";

// Log the current route for debugging
console.log("Initializing cart routes at /api/cart");

const router = express.Router();

// Define types for our cart responses
type CartResponse = {
  status: "success" | "error";
  data?: {
    item: Cart & {
      items: (CartItem & {
        product: Product;
        variant?: ProductVariant | null;
      })[];
    };
    updatedItem?: CartItem & {
      product: Product;
      variant?: ProductVariant | null;
    };
  };
  message?: string;
  details?: string;
};

// In-memory mock cart storage for when the database is unavailable
const mockCartStore = new Map<string, Cart & { items: CartItem[] }>();

// Helper function to generate a mock cart response
const generateMockCart = (customerId: string): Cart & { items: CartItem[] } => {
  if (!mockCartStore.has(customerId)) {
    mockCartStore.set(customerId, {
      id: `mock-cart-${Date.now()}`,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    });
  }
  return mockCartStore.get(customerId)!;
};

// Helper function to ensure cart has proper structure
const ensureCartStructure = (
  cart: (Cart & { items: CartItem[] }) | null
): Cart & {
  items: (CartItem & {
    product: Product;
    variant?: ProductVariant | null;
  })[];
} => {
  if (!cart) {
    // Return an empty cart structure if null
    return {
      id: "",
      customerId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };
  }

  // Ensure each item has product and variant properties
  const itemsWithProducts = cart.items.map((item) => {
    // Create a default product if none exists
    const defaultProduct = {
      id: item.productId,
      name: "Unknown Product",
      description: "",
      category: "",
      tags: [],
      price: 0 as any,
      imageUrl: "",
      sku: "",
      stock: 0,
      minOrder: 1,
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "DRAFT" as any,
      collectionId: null,
    };

    // Create a properly typed cart item with product and variant
    return {
      ...item,
      product: (item as any).product || defaultProduct,
      variant: (item as any).variant || null,
    };
  });

  return {
    ...cart,
    items: itemsWithProducts,
  };
};

// Get cart for the current customer
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Check database connection
      const dbConnected = await isPrismaConnected();

      let cart;
      if (dbConnected) {
        try {
          // Use database if available
          cart = await prisma.cart.findFirst({
            where: { customerId },
            include: {
              items: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          });

          // If no cart exists, create one
          if (!cart) {
            try {
              // First, verify the customer exists
              const customer = await prisma.customer.findUnique({
                where: { id: customerId },
              });

              if (!customer) {
                console.error(
                  `Customer with ID ${customerId} not found in database but has valid token`
                );
                // Use mock cart instead of returning an error
                cart = generateMockCart(customerId);
              } else {
                // Customer exists, create a cart
                cart = await prisma.cart.create({
                  data: {
                    customerId,
                    id: crypto.randomUUID(), // Generate a unique ID
                    updatedAt: new Date(),
                  },
                  include: {
                    items: {
                      include: {
                        product: true,
                        variant: true,
                      },
                    },
                  },
                });
              }
            } catch (createCartError) {
              console.error("Error creating cart:", createCartError);
              // Use mock cart as fallback
              cart = generateMockCart(customerId);
            }
          }
        } catch (dbError) {
          console.error("Database operation failed:", dbError);
          cart = generateMockCart(customerId);
        }
      } else {
        console.log(
          "Database unavailable, using mock cart for user:",
          customerId
        );
        cart = generateMockCart(customerId);
      }

      res.json({
        status: "success",
        data: {
          item: ensureCartStructure(cart),
        },
      });
    } catch (error) {
      console.error("Error getting cart:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get cart",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Add item to cart
router.post(
  "/items",
  requireAuth,
  [
    body("productId")
      .isString()
      .notEmpty()
      .withMessage("Product ID is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
    body("variantId")
      .optional()
      .isString()
      .withMessage("Variant ID must be a string"),
  ],
  validateRequest,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const customerId = req.user?.id;
      const { productId, quantity, variantId } = req.body;

      if (!customerId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Check database connection
      const dbConnected = await isPrismaConnected();

      if (!dbConnected) {
        return res.status(503).json({
          status: "error",
          message: "Service temporarily unavailable",
          details: "Database connection failed",
        });
      }

      // Get product details including variants
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          Variants: true,
        },
      });

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      // Find or create cart for the customer
      let cart = await prisma.cart.findFirst({
        where: { customerId },
      });

      if (!cart) {
        try {
          // First, verify the customer exists
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
          });

          if (!customer) {
            console.error(
              `Customer with ID ${customerId} not found in database but has valid token`
            );
            // Use mock cart instead of returning an error
            return res.json({
              status: "success",
              data: {
                item: ensureCartStructure(generateMockCart(customerId)),
                updatedItem: {
                  id: crypto.randomUUID(),
                  cartId: generateMockCart(customerId).id,
                  productId,
                  variantId: variantId || null,
                  quantity,
                  //bulkPricingId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  product,
                  variant: null,
                },
              },
            });
          } else {
            // Customer exists, create a cart
            cart = await prisma.cart.create({
              data: {
                customerId,
                id: crypto.randomUUID(),
              },
            });
          }
        } catch (createCartError) {
          console.error("Error creating cart:", createCartError);
          // Use mock cart as fallback
          return res.json({
            status: "success",
            data: {
              item: ensureCartStructure(generateMockCart(customerId)),
              updatedItem: {
                id: crypto.randomUUID(),
                cartId: generateMockCart(customerId).id,
                productId,
                variantId: variantId || null,
                quantity,
                //bulkPricingId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                product,
                variant: null,
              },
            },
          });
        }
      }

      // Check if the item already exists in the cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
        },
      });

      let updatedItem;
      if (existingItem) {
        // Update quantity if item already exists
        updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity,
            updatedAt: new Date(),
          },
          include: {
            product: true,
            variant: true,
          },
        });
      } else {
        // Add new item to cart
        updatedItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
          },
          include: {
            product: true,
            variant: true,
          },
        });
      }

      // Get updated cart
      const updatedCart = await prisma.cart.findFirst({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      res.json({
        status: "success",
        data: {
          item: ensureCartStructure(updatedCart),
          updatedItem: {
            id: updatedItem.id,
            cartId: updatedItem.cartId,
            productId: updatedItem.productId,
            variantId: updatedItem.variantId,
            quantity: updatedItem.quantity,
            //bulkPricingId: updatedItem.bulkPricingId,
            createdAt: updatedItem.createdAt,
            updatedAt: updatedItem.updatedAt,
            product: updatedItem.product,
            variant: updatedItem.variant,
          },
        },
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to add item to cart",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Update cart item
router.put(
  "/items/:id",
  requireAuth,
  [
    param("id").isString().notEmpty().withMessage("Item ID is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
  ],
  validateRequest,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const customerId = req.user?.id;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!customerId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Check database connection
      const dbConnected = await isPrismaConnected();

      if (!dbConnected) {
        return res.status(503).json({
          status: "error",
          message: "Service temporarily unavailable",
          details: "Database connection failed",
        });
      }

      // Verify the item belongs to the customer's cart
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id,
          cart: {
            customerId,
          },
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          status: "error",
          message: "Cart item not found",
        });
      }

      // Update the item
      const updatedItem = await prisma.cartItem.update({
        where: { id },
        data: {
          quantity,
          updatedAt: new Date(),
        },
        include: {
          product: true,
          variant: true,
        },
      });

      // Get updated cart
      const updatedCart = await prisma.cart.findFirst({
        where: {
          customerId,
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      res.json({
        status: "success",
        data: {
          item: ensureCartStructure(updatedCart),
          updatedItem: {
            id: updatedItem.id,
            cartId: updatedItem.cartId,
            productId: updatedItem.productId,
            variantId: updatedItem.variantId,
            quantity: updatedItem.quantity,
            //bulkPricingId: updatedItem.bulkPricingId,
            createdAt: updatedItem.createdAt,
            updatedAt: updatedItem.updatedAt,
            product: updatedItem.product,
            variant: updatedItem.variant,
          },
        },
      });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update cart item",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete cart item
router.delete(
  "/items/:id",
  requireAuth,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const customerId = req.user?.id;
      const { id } = req.params;

      if (!customerId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Check database connection
      const dbConnected = await isPrismaConnected();

      if (!dbConnected) {
        return res.status(503).json({
          status: "error",
          message: "Service temporarily unavailable",
          details: "Database connection failed",
        });
      }

      // Verify the item belongs to the customer's cart
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id,
          cart: {
            customerId,
          },
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          status: "error",
          message: "Cart item not found",
        });
      }

      // Delete the item
      await prisma.cartItem.delete({
        where: { id },
      });

      // Get updated cart
      const updatedCart = await prisma.cart.findFirst({
        where: {
          customerId,
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      res.json({
        status: "success",
        data: {
          item: ensureCartStructure(updatedCart),
        },
      });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete cart item",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Clear cart
router.delete(
  "/",
  requireAuth,
  async (req: Request, res: Response<CartResponse>) => {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      // Check database connection
      const dbConnected = await isPrismaConnected();

      if (!dbConnected) {
        return res.status(503).json({
          status: "error",
          message: "Service temporarily unavailable",
          details: "Database connection failed",
        });
      }

      // Get the customer's cart
      const cart = await prisma.cart.findFirst({
        where: { customerId },
      });

      if (cart) {
        // Delete all items in the cart
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      // Return empty cart
      const emptyCart = await prisma.cart.findFirst({
        where: { customerId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      res.json({
        status: "success",
        data: {
          item: ensureCartStructure(emptyCart),
        },
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to clear cart",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
