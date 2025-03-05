# Inventory Management and Reporting

This document provides information on how to use the inventory management and reporting features in the Resort Fresh application.

## Table of Contents
1. [Inventory Management](#inventory-management)
   - [Overview](#overview)
   - [Stock Tracking](#stock-tracking)
   - [Order Processing](#order-processing)
2. [Inventory Reporting](#inventory-reporting)
   - [Low Stock Report](#low-stock-report)
   - [Inventory Valuation Report](#inventory-valuation-report)
   - [Inventory Turnover Report](#inventory-turnover-report)
3. [API Integration](#api-integration)
   - [Inventory Report Endpoints](#inventory-report-endpoints)
   - [Order Service Integration](#order-service-integration)

## Inventory Management

### Overview

The Resort Fresh inventory management system seamlessly tracks stock levels for both regular products and product variants. It provides real-time stock updates during order processing and ensures accurate inventory data.

Key features:
- Stock tracking for both products and variants
- Stock validation before order processing
- Inventory updates during checkout
- Centralized order service for consistent inventory operations

### Stock Tracking

Stock is tracked at two levels:
1. **Product Level**: Each product has a base stock level
2. **Variant Level**: Each product variant has its own independent stock level

When a customer places an order, the system:
1. Validates that the requested quantity is available
2. Decrements the appropriate stock level (product or variant)
3. Prevents orders that would exceed available stock

### Order Processing

When orders are processed, inventory is handled as follows:

1. **Pre-validation**: Before an order is created, the system checks:
   - That all products/variants exist
   - That sufficient stock is available for each item

2. **Stock Updates**: When an order is confirmed:
   - Stock is decremented for each product or variant
   - Updates are logged for audit purposes

3. **Order Fulfillment**: During the fulfillment process:
   - Inventory levels are verified again before shipping
   - Any discrepancies are flagged for admin attention

## Inventory Reporting

### Low Stock Report

The Low Stock Report identifies products and variants that have fallen below a specified threshold. This helps prevent stockouts and manage reordering.

**Access the report:**
- Admin Panel > Inventory > Reports > Low Stock

**Features:**
- Configurable threshold (default: 10 units)
- Sorted by stock level (lowest first)
- Includes both products and variants
- Shows detailed variant attributes

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Cotton T-Shirt",
      "sku": "TSHIRT-001",
      "stock": 5,
      "category": "Apparel",
      "price": 19.99,
      "type": "product",
      "lowStockVariants": [
        {
          "id": "variant-456",
          "sku": "TSHIRT-001-RED-M",
          "stock": 2,
          "attributes": {
            "color": "Red",
            "size": "Medium"
          }
        }
      ]
    }
  ]
}
```

### Inventory Valuation Report

The Inventory Valuation Report provides a complete overview of the current inventory value. It calculates the total worth of all products and variants in stock.

**Access the report:**
- Admin Panel > Inventory > Reports > Valuation

**Features:**
- Total inventory value calculation
- Product and variant counts
- Breakdown by category
- Item count per category

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 45250.75,
    "productCount": 120,
    "variantCount": 350,
    "categoryBreakdown": [
      {
        "category": "Apparel",
        "value": 15200.50,
        "itemCount": 45
      },
      {
        "category": "Accessories",
        "value": 8750.25,
        "itemCount": 35
      }
    ]
  }
}
```

### Inventory Turnover Report

The Inventory Turnover Report analyzes how quickly products are selling. It helps identify fast-moving products and calculate inventory efficiency metrics.

**Access the report:**
- Admin Panel > Inventory > Reports > Turnover

**Features:**
- Customizable date range analysis
- Top selling products identification
- Inventory turnover rate calculation
- Period comparison functionality

**Example Response:**
```json
{
  "success": true,
  "data": {
    "topSellingProducts": [
      {
        "id": "product-789",
        "name": "Stainless Water Bottle",
        "sku": "BOTTLE-001",
        "soldQuantity": 250
      }
    ],
    "turnoverRate": 1.5,
    "period": {
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2025-03-01T00:00:00.000Z"
    }
  }
}
```

## API Integration

### Inventory Report Endpoints

The following API endpoints are available for inventory reporting:

#### Low Stock Report
- **Endpoint**: `GET /api/admin/inventory-reports/low-stock`
- **Query Parameters**: 
  - `threshold` (optional): Minimum stock level to include (default: 10)
- **Authentication**: Required
- **Response**: List of products and variants below threshold

#### Inventory Valuation
- **Endpoint**: `GET /api/admin/inventory-reports/valuation`
- **Authentication**: Required
- **Response**: Total value and category breakdown

#### Inventory Turnover
- **Endpoint**: `GET /api/admin/inventory-reports/turnover`
- **Query Parameters**:
  - `startDate` (optional): ISO 8601 date string
  - `endDate` (optional): ISO 8601 date string
- **Authentication**: Required
- **Response**: Turnover metrics and top selling products

### Order Service Integration

The Order Service provides centralized inventory management during order processing:

#### Validate Stock Availability
```typescript
// Check if stock is available before order creation
const insufficientItems = await orderService.validateStockAvailability(orderItems);
if (insufficientItems.length > 0) {
  // Handle insufficient stock
}
```

#### Update Inventory Levels
```typescript
// Update stock levels after order confirmation
await orderService.updateInventoryLevels(orderItems);
```

#### Get Pricing Information
```typescript
// Get price information including bulk pricing
const { price, total } = await orderService.getItemPrice(
  productId,
  variantId,
  quantity
);
```

This integration ensures consistent inventory management throughout the ordering process.
