-- Add loyalty program fields to Customer table
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;

-- Add unique constraint for referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_referralCode_key" ON "Customer"("referralCode");

-- Create PointTransaction table
CREATE TABLE IF NOT EXISTS "PointTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "PointTransaction_customerId_idx" ON "PointTransaction"("customerId");
CREATE INDEX IF NOT EXISTS "PointTransaction_createdAt_idx" ON "PointTransaction"("createdAt");
