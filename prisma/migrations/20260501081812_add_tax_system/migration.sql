-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxType" TEXT NOT NULL DEFAULT 'INCLUSIVE';

-- CreateTable
CREATE TABLE "TaxSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "type" "TaxType" NOT NULL DEFAULT 'INCLUSIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applyToAll" BOOLEAN NOT NULL DEFAULT true,
    "categories" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSetting_pkey" PRIMARY KEY ("id")
);
