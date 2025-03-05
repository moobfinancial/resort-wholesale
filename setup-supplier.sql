-- Create SupplierStatus enum type
DO $$ 
BEGIN
    CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN 
        NULL;
END $$;

-- Create Supplier table
CREATE TABLE IF NOT EXISTS "Supplier" (
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
  "documents" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on Supplier email
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_email_key" ON "Supplier"("email");

-- Add supplierId column to Product table if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;
EXCEPTION
    WHEN duplicate_column THEN 
        NULL;
END $$;

-- Create or replace foreign key constraint
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_supplierId_fkey";

-- Create the relationship once the Supplier table definitely exists
ALTER TABLE "Product" 
ADD CONSTRAINT "Product_supplierId_fkey" 
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
