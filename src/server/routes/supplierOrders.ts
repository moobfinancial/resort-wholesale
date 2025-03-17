import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all orders for a supplier
router.get('/:supplierId/orders', requireAdmin, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Verify supplier exists
    const supplierResult = await prisma.$queryRaw`
      SELECT * FROM "Supplier" WHERE id = ${supplierId}
    `;
    
    const supplier = Array.isArray(supplierResult) && supplierResult.length > 0 ? supplierResult[0] : null;
    
    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }
    
    // Get total count
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "SupplierOrder" WHERE "supplierId" = ${supplierId}
    `;
    
    const total = Array.isArray(totalResult) && totalResult.length > 0 ? Number(totalResult[0].count) : 0;
    
    // Get supplier orders with pagination
    const orders = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" 
      WHERE "supplierId" = ${supplierId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    
    // Get items for each order
    const ordersWithItems = await Promise.all(
      (Array.isArray(orders) ? orders : []).map(async (order: any) => {
        const items = await prisma.$queryRaw`
          SELECT * FROM "SupplierOrderItem" 
          WHERE "supplierOrderId" = ${order.id}
        `;
        
        return {
          ...order,
          items: Array.isArray(items) ? items : []
        };
      })
    );
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      status: 'success',
      data: {
        items: ordersWithItems,
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch supplier orders',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Get a specific order
router.get('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { supplierId, orderId } = req.params;
    
    const orderResult = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" 
      WHERE id = ${orderId} AND "supplierId" = ${supplierId}
    `;
    
    const order = Array.isArray(orderResult) && orderResult.length > 0 ? orderResult[0] : null;

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Get items for the order
    const items = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrderItem" 
      WHERE "supplierOrderId" = ${orderId}
    `;
    
    // Get supplier details
    const supplierResult = await prisma.$queryRaw`
      SELECT * FROM "Supplier" 
      WHERE id = ${supplierId}
    `;
    
    const supplier = Array.isArray(supplierResult) && supplierResult.length > 0 ? supplierResult[0] : null;
    
    const orderWithDetails = {
      ...order,
      items: Array.isArray(items) ? items : [],
      supplier
    };

    res.json({
      status: 'success',
      data: {
        item: orderWithDetails
      }
    });
  } catch (error) {
    console.error('Error fetching supplier order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch supplier order',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Create a new order
router.post('/:supplierId/orders', requireAdmin, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;
    
    // Verify supplier exists
    const supplierResult = await prisma.$queryRaw`
      SELECT * FROM "Supplier" WHERE id = ${supplierId}
    `;
    
    const supplier = Array.isArray(supplierResult) && supplierResult.length > 0 ? supplierResult[0] : null;
    
    if (!supplier) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }

    // Validate items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order must contain at least one item'
      });
    }

    // Generate order number
    const orderNumber = `SO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderId = uuidv4();
    const now = new Date();
    
    // Create the order
    await prisma.$executeRaw`
      INSERT INTO "SupplierOrder" (
        id, 
        "orderNumber", 
        "supplierId", 
        status, 
        total, 
        notes, 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        ${orderId},
        ${orderNumber},
        ${supplierId},
        ${data.status || 'PENDING'},
        ${data.totalAmount || 0},
        ${data.notes || null},
        ${now},
        ${now}
      )
    `;
    
    // Create order items
    for (const item of data.items) {
      const itemId = uuidv4();
      await prisma.$executeRaw`
        INSERT INTO "SupplierOrderItem" (
          id, 
          "supplierOrderId", 
          "productName", 
          sku, 
          quantity, 
          price, 
          total, 
          notes, 
          "createdAt", 
          "updatedAt"
        ) VALUES (
          ${itemId},
          ${orderId},
          ${item.productName},
          ${item.sku || null},
          ${item.quantity},
          ${item.unitPrice || 0},
          ${item.totalPrice || 0},
          ${item.notes || null},
          ${now},
          ${now}
        )
      `;
    }
    
    // Get the created order with items
    const orderResult = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" WHERE id = ${orderId}
    `;
    
    const order = Array.isArray(orderResult) && orderResult.length > 0 ? orderResult[0] : null;
    
    // Get items for the order
    const items = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrderItem" WHERE "supplierOrderId" = ${orderId}
    `;
    
    const orderWithItems = {
      ...order,
      items: Array.isArray(items) ? items : []
    };

    res.status(201).json({
      status: 'success',
      data: {
        item: orderWithItems
      }
    });
  } catch (error: any) {
    console.error('Error creating supplier order:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to create supplier order',
      details: error.message 
    });
  }
});

// Update an order
router.put('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { supplierId, orderId } = req.params;
    const data = req.body;
    
    // Check if order exists and belongs to this supplier
    const existingOrderResult = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" 
      WHERE id = ${orderId} AND "supplierId" = ${supplierId}
    `;
    
    const existingOrder = Array.isArray(existingOrderResult) && existingOrderResult.length > 0 ? existingOrderResult[0] : null;
    
    if (!existingOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or does not belong to this supplier'
      });
    }

    // First, delete existing items
    await prisma.$executeRaw`
      DELETE FROM "SupplierOrderItem" WHERE "supplierOrderId" = ${orderId}
    `;

    // Update the order
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "SupplierOrder" 
      SET 
        status = ${data.status || existingOrder.status},
        total = ${data.totalAmount || existingOrder.total},
        notes = ${data.notes || existingOrder.notes},
        "updatedAt" = ${now}
      WHERE id = ${orderId}
    `;
    
    // Create new items
    for (const item of data.items) {
      const itemId = uuidv4();
      await prisma.$executeRaw`
        INSERT INTO "SupplierOrderItem" (
          id, 
          "supplierOrderId", 
          "productName", 
          sku, 
          quantity, 
          price, 
          total, 
          notes, 
          "createdAt", 
          "updatedAt"
        ) VALUES (
          ${itemId},
          ${orderId},
          ${item.productName},
          ${item.sku || null},
          ${item.quantity},
          ${item.unitPrice || 0},
          ${item.totalPrice || 0},
          ${item.notes || null},
          ${now},
          ${now}
        )
      `;
    }
    
    // Get the updated order with items
    const orderResult = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" WHERE id = ${orderId}
    `;
    
    const order = Array.isArray(orderResult) && orderResult.length > 0 ? orderResult[0] : null;
    
    // Get items for the order
    const items = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrderItem" WHERE "supplierOrderId" = ${orderId}
    `;
    
    const orderWithItems = {
      ...order,
      items: Array.isArray(items) ? items : []
    };

    res.json({
      status: 'success',
      data: {
        item: orderWithItems
      }
    });
  } catch (error: any) {
    console.error('Error updating supplier order:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update supplier order',
      details: error.message 
    });
  }
});

// Delete an order
router.delete('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { supplierId, orderId } = req.params;
    
    // Check if order exists and belongs to this supplier
    const existingOrderResult = await prisma.$queryRaw`
      SELECT * FROM "SupplierOrder" 
      WHERE id = ${orderId} AND "supplierId" = ${supplierId}
    `;
    
    const existingOrder = Array.isArray(existingOrderResult) && existingOrderResult.length > 0 ? existingOrderResult[0] : null;
    
    if (!existingOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or does not belong to this supplier'
      });
    }
    
    // First delete all items
    await prisma.$executeRaw`
      DELETE FROM "SupplierOrderItem" WHERE "supplierOrderId" = ${orderId}
    `;
    
    // Then delete the order
    await prisma.$executeRaw`
      DELETE FROM "SupplierOrder" WHERE id = ${orderId}
    `;
    
    res.json({
      status: 'success',
      data: null,
      message: 'Supplier order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete supplier order',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

export default router;
