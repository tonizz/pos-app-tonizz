-- Add Settings table for application configuration
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Create unique index for key
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_key_key" ON "Settings"("key");

-- Insert default settings
INSERT INTO "Settings" ("id", "key", "value", "category", "type", "createdAt", "updatedAt")
VALUES
    -- Store Settings
    (gen_random_uuid(), 'store_name', 'POS Store', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_address', '', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_phone', '', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_email', '', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_logo', '', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_npwp', '', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'store_currency', 'IDR', 'store', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Loyalty Settings
    (gen_random_uuid(), 'loyalty_points_per_amount', '1000', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_points_value', '1', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_redeem_points', '100', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_redeem_value', '10000', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_bronze_threshold', '0', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_silver_threshold', '5000000', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_gold_threshold', '20000000', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_platinum_threshold', '50000000', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_birthday_bonus', '200', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_referrer_bonus', '100', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'loyalty_referee_bonus', '50', 'loyalty', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Receipt Settings
    (gen_random_uuid(), 'receipt_template', '80mm', 'receipt', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'receipt_show_logo', 'true', 'receipt', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'receipt_footer', 'Thank you for your purchase!\nPlease come again', 'receipt', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'receipt_auto_print', 'false', 'receipt', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
