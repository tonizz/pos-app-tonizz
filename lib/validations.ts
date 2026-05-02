import { z } from 'zod'

// Product Validation Schema
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters'),
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  barcode: z.string()
    .min(8, 'Barcode must be at least 8 characters')
    .max(50, 'Barcode must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  categoryId: z.string()
    .min(1, 'Category is required'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  buyPrice: z.number()
    .min(0, 'Buy price must be at least 0')
    .max(999999999, 'Buy price is too large'),
  sellPrice: z.number()
    .min(0, 'Sell price must be at least 0')
    .max(999999999, 'Sell price is too large'),
  unit: z.string()
    .min(1, 'Unit is required')
    .max(20, 'Unit must not exceed 20 characters'),
  minStock: z.number()
    .min(0, 'Minimum stock must be at least 0')
    .max(999999, 'Minimum stock is too large')
    .optional(),
  image: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal(''))
}).refine((data) => data.sellPrice >= data.buyPrice, {
  message: 'Sell price must be greater than or equal to buy price',
  path: ['sellPrice']
})

// Category Validation Schema
export const categorySchema = z.object({
  name: z.string()
    .min(3, 'Category name must be at least 3 characters')
    .max(50, 'Category name must not exceed 50 characters'),
  description: z.string()
    .max(200, 'Description must not exceed 200 characters')
    .optional()
    .or(z.literal(''))
})

// Customer Validation Schema
export const customerSchema = z.object({
  name: z.string()
    .min(3, 'Customer name must be at least 3 characters')
    .max(100, 'Customer name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number can only contain numbers, +, -, spaces, and parentheses'),
  address: z.string()
    .max(200, 'Address must not exceed 200 characters')
    .optional()
    .or(z.literal('')),
  creditLimit: z.number()
    .min(0, 'Credit limit must be at least 0')
    .max(999999999, 'Credit limit is too large')
    .optional()
})

// Supplier Validation Schema
export const supplierSchema = z.object({
  name: z.string()
    .min(3, 'Supplier name must be at least 3 characters')
    .max(100, 'Supplier name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number can only contain numbers, +, -, spaces, and parentheses'),
  address: z.string()
    .max(200, 'Address must not exceed 200 characters')
    .optional()
    .or(z.literal('')),
  contactPerson: z.string()
    .max(100, 'Contact person must not exceed 100 characters')
    .optional()
    .or(z.literal(''))
})

// Employee Validation Schema
export const employeeSchema = z.object({
  name: z.string()
    .min(3, 'Employee name must be at least 3 characters')
    .max(100, 'Employee name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number can only contain numbers, +, -, spaces, and parentheses'),
  position: z.string()
    .min(3, 'Position must be at least 3 characters')
    .max(50, 'Position must not exceed 50 characters'),
  salary: z.number()
    .min(0, 'Salary must be at least 0')
    .max(999999999, 'Salary is too large'),
  joinDate: z.string()
    .min(1, 'Join date is required')
})

// Warehouse Validation Schema
export const warehouseSchema = z.object({
  name: z.string()
    .min(3, 'Warehouse name must be at least 3 characters')
    .max(100, 'Warehouse name must not exceed 100 characters'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number can only contain numbers, +, -, spaces, and parentheses')
    .optional()
    .or(z.literal('')),
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
})

// Promotion Validation Schema
export const promotionSchema = z.object({
  name: z.string()
    .min(3, 'Promotion name must be at least 3 characters')
    .max(100, 'Promotion name must not exceed 100 characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  type: z.enum(['PERCENTAGE', 'FIXED'], {
    errorMap: () => ({ message: 'Type must be either PERCENTAGE or FIXED' })
  }),
  value: z.number()
    .min(0, 'Value must be at least 0'),
  startDate: z.string()
    .min(1, 'Start date is required'),
  endDate: z.string()
    .min(1, 'End date is required'),
  minPurchase: z.number()
    .min(0, 'Minimum purchase must be at least 0')
    .optional()
}).refine((data) => {
  if (data.type === 'PERCENTAGE' && data.value > 100) {
    return false
  }
  return true
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value']
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end >= start
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
})

// Login Validation Schema
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
})

// User Registration Schema
export const userSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CASHIER'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  warehouseId: z.string()
    .min(1, 'Warehouse is required')
    .optional()
})

// Stock Transfer Schema
export const stockTransferSchema = z.object({
  productId: z.string()
    .min(1, 'Product is required'),
  fromWarehouseId: z.string()
    .min(1, 'Source warehouse is required'),
  toWarehouseId: z.string()
    .min(1, 'Destination warehouse is required'),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .max(999999, 'Quantity is too large'),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .or(z.literal(''))
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouse must be different',
  path: ['toWarehouseId']
})

// Purchase Order Schema
export const purchaseOrderSchema = z.object({
  supplierId: z.string()
    .min(1, 'Supplier is required'),
  warehouseId: z.string()
    .min(1, 'Warehouse is required'),
  expectedDate: z.string()
    .min(1, 'Expected date is required'),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be at least 0')
  })).min(1, 'At least one item is required')
})

// Tax Settings Schema
export const taxSettingsSchema = z.object({
  name: z.string()
    .min(3, 'Tax name must be at least 3 characters')
    .max(50, 'Tax name must not exceed 50 characters'),
  rate: z.number()
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate cannot exceed 100%'),
  isActive: z.boolean()
})

// Helper function to format Zod errors
export const formatZodError = (error: z.ZodError) => {
  const errors: { [key: string]: string } = {}
  if (error && error.errors && Array.isArray(error.errors)) {
    error.errors.forEach((err) => {
      const path = err.path.join('.')
      errors[path] = err.message
    })
  }
  return errors
}

// Helper function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: formatZodError(error) }
    }
    return { success: false, data: null, errors: { _error: 'Validation failed' } }
  }
}
