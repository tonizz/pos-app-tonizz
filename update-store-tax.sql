-- Update Store dengan tax settings
UPDATE "Store"
SET "taxRate" = 11,
    "taxInclusive" = true
WHERE id IS NOT NULL;
