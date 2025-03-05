-- Create Supplier table
CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" JSONB NOT NULL,
  "website" TEXT,
  "logo" TEXT,
  "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "paymentTerms" TEXT NOT NULL,
  "documents" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on Supplier email
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- Create SupplierOrder table
CREATE TABLE "SupplierOrder" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "status" "SupplierOrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDeliveryDate" TIMESTAMP(3),
  "deliveredDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on SupplierOrder orderNumber
CREATE UNIQUE INDEX "SupplierOrder_orderNumber_key" ON "SupplierOrder"("orderNumber");

-- Add foreign key constraint from SupplierOrder to Supplier
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create SupplierOrderItem table
CREATE TABLE "SupplierOrderItem" (
  "id" TEXT NOT NULL,
  "supplierOrderId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupplierOrderItem_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint from SupplierOrderItem to SupplierOrder
ALTER TABLE "SupplierOrderItem" ADD CONSTRAINT "SupplierOrderItem_supplierOrderId_fkey" FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add supplier relation to Product model
ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create ProductVariant table
CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "attributes" JSONB NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on ProductVariant sku
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- Add foreign key constraint from ProductVariant to Product
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create BulkPricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS "BulkPricing" (
  "id" TEXT NOT NULL,
  "minQuantity" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BulkPricing_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on BulkPricing productId and minQuantity
CREATE UNIQUE INDEX "BulkPricing_productId_minQuantity_key" ON "BulkPricing"("productId", "minQuantity");

-- Add foreign key constraint from BulkPricing to Product
ALTER TABLE "BulkPricing" ADD CONSTRAINT "BulkPricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create enum types if they don't exist
-- Note: PostgreSQL doesn't have a "CREATE TYPE IF NOT EXISTS" syntax, so we need to check if they exist first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplierstatus') THEN
        CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplierorderstatus') THEN
        CREATE TYPE "SupplierOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
    END IF;
END$$;
