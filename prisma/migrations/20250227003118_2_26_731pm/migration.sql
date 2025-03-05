/*
  Warnings:

  - You are about to drop the column `name` on the `CustomerDocument` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `CustomerDocument` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CustomerDocument" DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "requiredDocumentId" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_requiredDocumentId_fkey" FOREIGN KEY ("requiredDocumentId") REFERENCES "RequiredDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredDocument" ADD CONSTRAINT "RequiredDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
