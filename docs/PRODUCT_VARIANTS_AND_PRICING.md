# Product Variants and Bulk Pricing Guide

This document provides information on how to use the product variants and bulk pricing features in the Resort Fresh application.

## Table of Contents
1. [Product Variants](#product-variants)
   - [What are Product Variants?](#what-are-product-variants)
   - [Creating Product Variants](#creating-product-variants)
   - [Managing Variant Attributes](#managing-variant-attributes)
   - [Editing and Deleting Variants](#editing-and-deleting-variants)
   - [Customer-Facing Variant Selection](#customer-facing-variant-selection)
2. [Bulk Pricing](#bulk-pricing)
   - [What is Bulk Pricing?](#what-is-bulk-pricing)
   - [Setting Up Bulk Pricing Tiers](#setting-up-bulk-pricing-tiers)
   - [How Bulk Pricing Works](#how-bulk-pricing-works)
   - [Bulk Pricing Display for Customers](#bulk-pricing-display-for-customers)
3. [API Integration](#api-integration)
   - [Product Variants API](#product-variants-api)
   - [Bulk Pricing API](#bulk-pricing-api)
   - [Frontend Integration](#frontend-integration)

## Product Variants

### What are Product Variants?

Product variants allow you to sell multiple versions of the same product that differ in attributes like color, size, material, etc. Each variant can have its own:

- SKU (Stock Keeping Unit)
- Price
- Stock quantity
- Attributes (color, size, etc.)
- Image URL (optional)

This feature is perfect for products that come in different options, such as clothing in multiple sizes and colors or electronics with different storage capacities.

### Creating Product Variants

To create product variants:

1. Go to the **Admin Panel > Products**
2. Create a new product or edit an existing one
3. In the product form, scroll down to the **Product Variants** section
4. Click the **Add Variant** button
5. Fill in the required information:
   - SKU: A unique identifier for this specific variant
   - Price: The price for this variant
   - Stock: The available quantity
   - Image URL (optional): An image specific to this variant
   - Attributes: Values for attributes like color, size, etc.
6. Click **Add Variant** to save

### Managing Variant Attributes

By default, the system includes common attributes like "color" and "size". To add custom attributes:

1. In the Product Variants section, click the **Add Attribute Type** button
2. Enter the name of your new attribute (e.g., "material", "pattern", "capacity")
3. Click **OK**
4. The new attribute will now be available when creating or editing variants

### Editing and Deleting Variants

To edit a variant:
1. Click the **Edit** button next to the variant in the variants table
2. Update the information as needed
3. Click **Update Variant** to save your changes

To delete a variant:
1. Click the **Delete** button next to the variant
2. Confirm the deletion when prompted

### Customer-Facing Variant Selection

The product detail page allows customers to view and select product variants:

1. When a product has variants, customers will see dropdown menus for each attribute type (e.g., Size, Color)
2. As customers select attributes, the interface updates to show:
   - The variant's price
   - Available stock for the selected variant
   - A variant-specific product image (if available)
3. All attribute types must be selected before adding the product to the cart
4. The interface prevents ordering more than the available stock quantity

Key features of variant selection:
- Variant-specific pricing overrides the base product price
- Variant-specific images are displayed when a variant is selected
- Stock tracking is managed per variant
- SKU display updates based on the selected variant

## Bulk Pricing

### What is Bulk Pricing?

Bulk pricing allows you to offer discounted prices based on the quantity ordered. This incentivizes customers to purchase larger quantities by providing better per-unit pricing as the order size increases.

### Setting Up Bulk Pricing Tiers

To set up bulk pricing:

1. Go to the **Admin Panel > Products**
2. Create a new product or edit an existing one
3. In the product form, scroll down to the **Bulk Pricing** section
4. Click the **Add Tier** button
5. Configure the tier:
   - Minimum Quantity: The minimum quantity required to qualify for this price
   - Price: The per-unit price for this tier
6. Click **Add** to save the tier
7. Add additional tiers as needed, with increasing minimum quantities

Best practices for setting up tiers:
- Start with the lowest minimum quantity (e.g., 10 units)
- Each subsequent tier should have a higher minimum quantity and a lower price
- Ensure there are no gaps or overlaps between tiers

### How Bulk Pricing Works

When a customer places an order:

1. The system checks the ordered quantity
2. It applies the price from the highest tier for which the quantity qualifies
3. If the quantity doesn't qualify for any tier, the base product price is used

For example, with these tiers:
- 1-9 units: $10.00 each (base price)
- 10-24 units: $9.00 each
- 25+ units: $8.00 each

A customer ordering:
- 5 units will pay: $10.00 per unit
- 15 units will pay: $9.00 per unit
- 30 units will pay: $8.00 per unit

### Bulk Pricing Display for Customers

When bulk pricing is enabled for a product, customers will see:

1. A "Bulk Pricing" section on the product detail page showing all pricing tiers
2. A quantity selector that allows them to choose how many units to order
3. The unit price automatically updates based on the selected quantity
4. The calculated total price is shown before adding to cart

This implementation helps customers:
- Understand the volume discount structure at a glance
- See potential savings for buying in larger quantities
- Make informed purchasing decisions

## API Integration

### Product Variants API

The following API endpoints are available for managing product variants:

- `GET /api/products/:productId/variants`: Get all variants for a product
- `GET /api/products/:productId/variants/:variantId`: Get a specific variant
- `POST /api/products/:productId/variants`: Create a new variant
- `PUT /api/products/:productId/variants/:variantId`: Update a variant
- `DELETE /api/products/:productId/variants/:variantId`: Delete a variant

Example request to create a variant:

```json
POST /api/products/123/variants
{
  "sku": "TSHIRT-RED-M",
  "price": 19.99,
  "stock": 100,
  "attributes": {
    "color": "Red",
    "size": "Medium"
  },
  "imageUrl": "https://example.com/red-tshirt.jpg"
}
```

### Bulk Pricing API

The following API endpoints are available for managing bulk pricing:

- `GET /api/products/:productId/bulk-pricing`: Get all bulk pricing tiers for a product
- `PUT /api/products/:productId/bulk-pricing`: Update all bulk pricing tiers
- `POST /api/products/:productId/bulk-pricing`: Add a new bulk pricing tier
- `PUT /api/products/:productId/bulk-pricing/:tierId`: Update a specific tier
- `DELETE /api/products/:productId/bulk-pricing/:tierId`: Delete a specific tier
- `GET /api/products/:productId/price?quantity=X`: Get the price for a specific quantity

Example request to update bulk pricing tiers:

```json
PUT /api/products/123/bulk-pricing
{
  "tiers": [
    {
      "minQuantity": 10,
      "price": 9.99
    },
    {
      "minQuantity": 25,
      "price": 8.99
    },
    {
      "minQuantity": 50,
      "price": 7.99
    }
  ]
}
```

### Frontend Integration

The frontend application integrates with the product variant and bulk pricing APIs through:

1. **Product Store**
   - The `useProductStore` hook manages variant and pricing state
   - Methods include `fetchProductVariants`, `fetchBulkPricing`, and `fetchPriceForQuantity`
   - The store tracks selected variants, quantity, and calculated price

2. **ProductDetail Component**
   - Dynamically renders attribute selectors based on available variants
   - Updates pricing and product images when variants are selected
   - Shows bulk pricing tiers when available
   - Calculates price based on selected quantity and variant

3. **Error Handling**
   - Uses error boundaries to prevent UI crashes
   - Implements fallback UIs for when variant or pricing data fails to load
   - Provides informative messages to guide users when selections are incomplete

4. **Loading States**
   - Shows skeleton loaders while variant data is loading
   - Disables the Add to Cart button until all required selections are made
   - Clearly indicates when operations are in progress

Example of variant selection logic:
```tsx
// Find matching variant based on selected attributes
useEffect(() => {
  if (!productVariants.length || Object.keys(selectedAttributes).length === 0) {
    setSelectedVariant(null);
    return;
  }
  
  // Only find a matching variant if all attribute types have been selected
  const requiredAttributeCount = attributeTypes().length;
  const selectedAttributeCount = Object.keys(selectedAttributes).length;
  
  if (selectedAttributeCount !== requiredAttributeCount) {
    return;
  }
  
  const matchingVariant = productVariants.find(variant => {
    return Object.entries(selectedAttributes).every(([key, value]) => 
      variant.attributes[key] === value
    );
  });
  
  setSelectedVariant(matchingVariant || null);
}, [selectedAttributes, productVariants, attributeTypes, setSelectedVariant]);
