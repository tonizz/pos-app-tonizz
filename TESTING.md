# POS Application Testing Guide

## Test Credentials

### Users
- **Admin**: admin@pos.com / admin123
- **Manager**: manager@pos.com / manager123 (for discount approval)
- **Cashier**: cashier@pos.com / cashier123

## Testing Flow

### 1. Login as Cashier
- Email: cashier@pos.com
- Password: cashier123

### 2. Open Shift
- When you access POS, you'll be prompted to open a shift
- Enter opening cash amount (e.g., 100000)
- Shift code will be auto-generated: SHIFT-YYYYMMDD-HHMMSS

### 3. Add Products to Cart
Products with auto-discount:
- **Coca Cola 330ml** (SKU: FOO-COC-001) - 5% auto discount
- **Indomie Goreng** (SKU: FOO-IND-002) - Rp 500 auto discount
- **Samsung Galaxy A54** (SKU: ELE-SAM-003) - 3% auto discount
- **Shampoo Clear 170ml** (SKU: HEA-SHA-005) - Rp 2,000 auto discount

Products without auto-discount:
- **T-Shirt Cotton** (SKU: FAS-TSH-004)

### 4. Apply Manual Discount

#### Discount ≤5% (No approval needed)
- Select discount type: % or Rp
- Enter value ≤5%
- Discount applies immediately

#### Discount >5% (Requires approval)
- Select discount type: %
- Enter value >5% (e.g., 10%)
- Approval modal will appear
- Enter manager credentials:
  - Email: manager@pos.com
  - Password: manager123
- Discount will be approved and applied

### 5. Complete Transaction
- Click "Proceed to Payment"
- Enter payment amount (must be ≥ total)
- System shows change amount
- Click "Complete"
- Transaction is recorded with shift ID and discount approver (if applicable)

### 6. Close Shift
- Click "Close Shift" button in header
- View shift summary:
  - Shift code
  - Opening amount
  - Total sales
  - Expected amount
- Enter actual cash amount (required)
- System calculates difference (over/short)
- Add optional notes
- Click "Close Shift"
- Redirected to dashboard

## Features to Test

### Auto Discount
- ✓ Percentage-based auto discount
- ✓ Nominal-based auto discount
- ✓ Toast notification shows discount applied

### Manual Discount
- ✓ Percentage discount ≤5% (no approval)
- ✓ Percentage discount >5% (requires approval)
- ✓ Nominal discount (no approval limit)
- ✓ Discount approval by Manager/Admin only
- ✓ Invalid credentials rejected

### Shift Management
- ✓ Must open shift before using POS
- ✓ One shift per cashier per day
- ✓ Shift code auto-generated
- ✓ Shift info displayed in header
- ✓ Close shift requires actual cash amount
- ✓ Difference calculation (over/short)

### Transaction
- ✓ Stock deduction
- ✓ Transaction linked to shift
- ✓ Discount approver recorded
- ✓ Invoice number generated
- ✓ Change calculation

## API Endpoints

- `POST /api/shift` - Open shift
- `GET /api/shift` - Get active shift
- `POST /api/shift/close` - Close shift
- `POST /api/discount/approve` - Approve manual discount
- `POST /api/transactions` - Create transaction
- `GET /api/products` - Get products with search
- `GET /api/warehouses` - Get warehouses

## Notes

- Shift must be opened before POS can be used
- Only one active shift per cashier per day
- Manual discount >5% requires SPV/Manager/Admin approval
- All transactions are linked to the active shift
- Close shift calculates expected vs actual cash difference
