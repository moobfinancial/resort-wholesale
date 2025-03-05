-- Add supplierId column to Product table
ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;

-- Add foreign key constraint if Supplier table exists
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
