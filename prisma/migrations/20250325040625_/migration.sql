-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
ADD COLUMN     "cost" DECIMAL(10,2),
ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "minStock" INTEGER DEFAULT 0,
ADD COLUMN     "shippingCategory" TEXT,
ADD COLUMN     "supplierCost" DECIMAL(10,2),
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "supplierLeadTime" INTEGER,
ADD COLUMN     "supplierMinOrder" INTEGER,
ADD COLUMN     "supplierNotes" TEXT,
ADD COLUMN     "supplierPackSize" INTEGER,
ADD COLUMN     "supplierPackUnit" TEXT,
ADD COLUMN     "supplierSKU" TEXT,
ADD COLUMN     "taxCategory" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;
