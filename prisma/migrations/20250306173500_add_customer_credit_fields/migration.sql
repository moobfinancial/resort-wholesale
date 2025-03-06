-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "creditLimit" DECIMAL(10,2),
                       ADD COLUMN "availableCredit" DECIMAL(10,2),
                       ADD COLUMN "creditStatus" TEXT,
                       ADD COLUMN "creditTerm" "CreditTerm",
                       ADD COLUMN "creditApprovedAt" TIMESTAMP(3),
                       ADD COLUMN "creditExpiresAt" TIMESTAMP(3);
