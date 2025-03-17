-- Create ProductVariant table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sku" TEXT UNIQUE NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "attributes" JSONB NOT NULL DEFAULT '{}',
  "imageUrl" TEXT,
  "productId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add variantId column to OrderItem if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'OrderItem' AND column_name = 'variantId'
  ) THEN
    ALTER TABLE "OrderItem" 
    ADD COLUMN "variantId" UUID,
    ADD CONSTRAINT "OrderItem_variantId_fkey" 
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "OrderItem_variantId_idx" ON "OrderItem"("variantId");
