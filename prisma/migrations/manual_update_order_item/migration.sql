-- Add variantId to OrderItem model
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

-- Add foreign key constraint from OrderItem to ProductVariant
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
