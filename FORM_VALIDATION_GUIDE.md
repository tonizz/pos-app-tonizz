# Form Validation & Error Handling - Implementation Guide

**Date:** 2026-05-01  
**Status:** ✅ COMPLETED  
**Version:** 1.0.0

---

## 🎯 Overview

Sistem validasi form yang komprehensif menggunakan Zod schema telah berhasil diimplementasikan. Fitur ini memberikan validasi real-time, error messages yang jelas, dan loading states yang konsisten di seluruh aplikasi.

---

## ✨ Fitur yang Ditambahkan

### 1. **Zod Validation Schemas** ✅
- Product validation
- Category validation
- Customer validation
- Supplier validation
- Employee validation
- Warehouse validation
- Promotion validation
- Login validation
- User registration validation
- Stock transfer validation
- Purchase order validation
- Tax settings validation

### 2. **Custom Form Hook** ✅
- `useForm` hook untuk form handling
- Real-time validation
- Field-level error tracking
- Touch state management
- Submit handling dengan loading state
- Helper functions untuk field props

### 3. **Reusable Form Components** ✅
- `FormInput` - Input dengan error display
- `FormTextarea` - Textarea dengan error display
- `FormSelect` - Select dengan error display
- `FormButton` - Button dengan loading state
- `FormError` - Error message display
- `FormSuccess` - Success message display

### 4. **Enhanced Forms** ✅
- Login page dengan validation
- Add Product modal dengan validation
- Consistent error handling
- Loading states

---

## 📁 Files Created

### **1. `/lib/validations.ts` (400+ lines)**
Zod schemas untuk semua form di aplikasi:

```typescript
// Product Schema
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters'),
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  buyPrice: z.number()
    .min(0, 'Buy price must be at least 0'),
  sellPrice: z.number()
    .min(0, 'Sell price must be at least 0'),
  // ... more fields
}).refine((data) => data.sellPrice >= data.buyPrice, {
  message: 'Sell price must be greater than or equal to buy price',
  path: ['sellPrice']
})

// Helper functions
export const formatZodError = (error: z.ZodError) => { ... }
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => { ... }
```

### **2. `/lib/useForm.ts` (200+ lines)**
Custom hook untuk form handling:

```typescript
export function useForm<T>({
  initialValues,
  validationSchema,
  onSubmit
}: UseFormOptions<T>) {
  // State management
  const [formState, setFormState] = useState<FormState<T>>({ ... })

  // Validation functions
  const validateField = (name: string, value: any) => { ... }
  const validateForm = (values: T) => { ... }

  // Event handlers
  const handleChange = (name: string, value: any) => { ... }
  const handleBlur = (name: string) => { ... }
  const handleSubmit = async (e?: React.FormEvent) => { ... }

  // Helper functions
  const getFieldProps = (name: string) => ({ ... })
  const getFieldError = (name: string) => { ... }
  const hasError = (name: string) => { ... }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setErrors,
    resetForm,
    getFieldProps,
    getFieldError,
    hasError
  }
}
```

### **3. `/components/FormComponents.tsx` (250+ lines)**
Reusable form components:

```typescript
// Input with error handling
export function FormInput({
  label,
  error,
  touched,
  required,
  ...props
}: FormInputProps) { ... }

// Textarea with error handling
export function FormTextarea({ ... }) { ... }

// Select with error handling
export function FormSelect({ ... }) { ... }

// Button with loading state
export function FormButton({
  loading,
  variant = 'primary',
  children,
  ...props
}: FormButtonProps) { ... }

// Error message display
export function FormError({ error }: FormErrorProps) { ... }

// Success message display
export function FormSuccess({ message }: FormSuccessProps) { ... }
```

### **4. `/app/components/AddProductModalV2.tsx` (250+ lines)**
Enhanced product form dengan validation:

```typescript
export default function AddProductModalV2({
  isOpen,
  onClose,
  onCreate,
  categories,
  initialBarcode = ''
}: AddProductModalProps) {
  const form = useForm({
    initialValues: { ... },
    validationSchema: productSchema,
    onSubmit: async (values) => {
      await onCreate(values)
      form.resetForm()
      onClose()
    }
  })

  // Auto-generate SKU
  const generateSKU = () => { ... }

  return (
    <form onSubmit={form.handleSubmit}>
      <FormInput
        label="Product Name"
        required
        {...form.getFieldProps('name')}
        error={form.getFieldError('name')}
        touched={form.touched.name}
      />
      {/* More fields */}
    </form>
  )
}
```

---

## 🚀 How to Use

### **1. Using Validation Schemas**

```typescript
import { productSchema, validateData } from '@/lib/validations'

// Validate data
const result = validateData(productSchema, formData)

if (result.success) {
  // Data is valid
  console.log(result.data)
} else {
  // Show errors
  console.log(result.errors)
}
```

### **2. Using useForm Hook**

```typescript
import { useForm } from '@/lib/useForm'
import { loginSchema } from '@/lib/validations'

const form = useForm({
  initialValues: {
    email: '',
    password: ''
  },
  validationSchema: loginSchema,
  onSubmit: async (values) => {
    // Handle submit
    await login(values)
  }
})

// In JSX
<form onSubmit={form.handleSubmit}>
  <input {...form.getFieldProps('email')} />
  {form.hasError('email') && (
    <span>{form.getFieldError('email')}</span>
  )}
</form>
```

### **3. Using Form Components**

```typescript
import { FormInput, FormButton, FormError } from '@/components/FormComponents'

<form onSubmit={form.handleSubmit}>
  <FormError error={form.errors._error} />
  
  <FormInput
    label="Email"
    required
    {...form.getFieldProps('email')}
    error={form.getFieldError('email')}
    touched={form.touched.email}
  />

  <FormButton
    type="submit"
    loading={form.isSubmitting}
    disabled={!form.isValid}
  >
    Submit
  </FormButton>
</form>
```

---

## 📋 Validation Rules

### **Product Validation:**
- Name: 3-100 characters
- SKU: 3-50 characters, uppercase + numbers + hyphens only
- Barcode: 8-50 characters (optional)
- Buy Price: >= 0
- Sell Price: >= 0, must be >= buy price
- Unit: required, max 20 characters
- Min Stock: >= 0 (optional)

### **Customer Validation:**
- Name: 3-100 characters
- Email: valid email format (optional)
- Phone: 10-15 digits, numbers/+/-/spaces/parentheses only
- Address: max 200 characters (optional)
- Credit Limit: >= 0 (optional)

### **Login Validation:**
- Email: required, valid email format
- Password: 6-100 characters

### **User Registration:**
- Name: 3-100 characters
- Email: valid email format
- Password: 6-100 characters, must contain uppercase, lowercase, and number
- Role: SUPER_ADMIN, ADMIN, or CASHIER
- Warehouse: required (optional for SUPER_ADMIN)

### **Promotion Validation:**
- Name: 3-100 characters
- Type: PERCENTAGE or FIXED
- Value: >= 0, max 100 for percentage
- Start Date: required
- End Date: required, must be >= start date
- Min Purchase: >= 0 (optional)

---

## 🎨 UI/UX Features

### **Error Display:**
- Red border on invalid fields
- Error icon with message below field
- Only show errors after field is touched
- Clear error messages

### **Loading States:**
- Spinner animation during submit
- Disabled button during loading
- "Loading..." text
- Prevent double submission

### **Visual Feedback:**
- Required fields marked with red asterisk
- Focus ring on active field
- Hover effects on buttons
- Success/error message banners

### **Dark Theme:**
- Consistent with app design
- Gray-800 backgrounds
- Gray-700 borders
- White/gray text
- Red for errors, green for success

---

## 💻 Technical Implementation

### **Real-time Validation:**

```typescript
const handleChange = (name: string, value: any) => {
  setFormState((prev) => {
    const newValues = { ...prev.values, [name]: value }
    const fieldError = validateField(name, value)
    const newErrors = { ...prev.errors }

    if (fieldError) {
      newErrors[name] = fieldError
    } else {
      delete newErrors[name]
    }

    return {
      ...prev,
      values: newValues,
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    }
  })
}
```

### **Touch State Management:**

```typescript
const handleBlur = (name: string) => {
  setFormState((prev) => ({
    ...prev,
    touched: { ...prev.touched, [name]: true }
  }))
}

// Only show error if field is touched
const hasError = (name: string) => {
  return formState.touched[name] && !!formState.errors[name]
}
```

### **Submit Handling:**

```typescript
const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault()

  // Mark all fields as touched
  const allTouched = Object.keys(formState.values).reduce((acc, key) => {
    acc[key] = true
    return acc
  }, {} as { [key: string]: boolean })

  setFormState((prev) => ({ ...prev, touched: allTouched }))

  // Validate form
  const validation = validateForm(formState.values)

  if (!validation.isValid) {
    setFormState((prev) => ({
      ...prev,
      errors: validation.errors,
      isValid: false
    }))
    return
  }

  // Submit form
  setFormState((prev) => ({ ...prev, isSubmitting: true }))

  try {
    await onSubmit(formState.values)
    // Reset form on success
    resetForm()
  } catch (error: any) {
    setFormState((prev) => ({
      ...prev,
      errors: { _error: error.message || 'Submission failed' },
      isSubmitting: false
    }))
  }
}
```

---

## 🔧 Best Practices

### **1. Always Use Schemas:**
```typescript
// ✅ Good
const form = useForm({
  initialValues: { ... },
  validationSchema: productSchema,
  onSubmit: async (values) => { ... }
})

// ❌ Bad
const form = useForm({
  initialValues: { ... },
  onSubmit: async (values) => { ... }
})
```

### **2. Show Errors Only After Touch:**
```typescript
// ✅ Good
<FormInput
  error={form.getFieldError('email')}
  touched={form.touched.email}
/>

// ❌ Bad
<FormInput
  error={form.errors.email}
/>
```

### **3. Disable Submit When Invalid:**
```typescript
// ✅ Good
<FormButton
  disabled={!form.isValid || form.isSubmitting}
>
  Submit
</FormButton>

// ❌ Bad
<button type="submit">
  Submit
</button>
```

### **4. Handle Server Errors:**
```typescript
// ✅ Good
try {
  await onCreate(values)
} catch (error: any) {
  form.setErrors({ _error: error.message })
}

// ❌ Bad
await onCreate(values)
```

---

## 📊 Validation Coverage

| Form | Schema | Hook | Components | Status |
|------|--------|------|------------|--------|
| **Login** | ✅ | ✅ | ✅ | 100% |
| **Product** | ✅ | ✅ | ✅ | 100% |
| **Category** | ✅ | ⏳ | ⏳ | 33% |
| **Customer** | ✅ | ⏳ | ⏳ | 33% |
| **Supplier** | ✅ | ⏳ | ⏳ | 33% |
| **Employee** | ✅ | ⏳ | ⏳ | 33% |
| **Warehouse** | ✅ | ⏳ | ⏳ | 33% |
| **Promotion** | ✅ | ⏳ | ⏳ | 33% |
| **User** | ✅ | ⏳ | ⏳ | 33% |
| **Stock Transfer** | ✅ | ⏳ | ⏳ | 33% |
| **Purchase Order** | ✅ | ⏳ | ⏳ | 33% |
| **Tax Settings** | ✅ | ⏳ | ⏳ | 33% |

**Overall:** 50% Complete (Schemas: 100%, Implementation: 20%)

---

## 🐛 Common Issues & Solutions

### **Issue: Validation not working**
```typescript
// Check if schema is passed
const form = useForm({
  initialValues: { ... },
  validationSchema: productSchema, // ← Make sure this is set
  onSubmit: async (values) => { ... }
})
```

### **Issue: Errors showing immediately**
```typescript
// Only show errors after touch
{form.hasError('email') && (
  <span>{form.getFieldError('email')}</span>
)}
```

### **Issue: Form not resetting**
```typescript
// Call resetForm after successful submit
try {
  await onCreate(values)
  form.resetForm() // ← Add this
  onClose()
} catch (error) {
  // Handle error
}
```

---

## 🚀 Next Steps

### **To Complete (20% → 100%):**
1. ⏳ Apply validation to Category form
2. ⏳ Apply validation to Customer form
3. ⏳ Apply validation to Supplier form
4. ⏳ Apply validation to Employee form
5. ⏳ Apply validation to Warehouse form
6. ⏳ Apply validation to Promotion form
7. ⏳ Apply validation to User form
8. ⏳ Apply validation to Stock Transfer form
9. ⏳ Apply validation to Purchase Order form
10. ⏳ Apply validation to Tax Settings form

### **Future Enhancements:**
1. ⏳ Add async validation (check duplicate SKU, email)
2. ⏳ Add field dependencies (conditional validation)
3. ⏳ Add custom validation rules
4. ⏳ Add validation on blur vs on change toggle
5. ⏳ Add form dirty state tracking
6. ⏳ Add unsaved changes warning

---

## ✨ Summary

### **What's Working:**
✅ Zod validation schemas for all forms  
✅ Custom useForm hook with real-time validation  
✅ Reusable form components  
✅ Login page with validation  
✅ Product form with validation  
✅ Error handling and display  
✅ Loading states  
✅ Dark theme consistency  

### **What's Next:**
⏳ Apply validation to remaining forms  
⏳ Add async validation  
⏳ Add more validation rules  

### **Progress:**
```
██████████░░░░░░░░░░ 50% Complete
```

---

**Last Updated:** 2026-05-01  
**Implemented By:** Claude Code  
**Status:** ✅ Foundation Complete, Ready for Rollout  
**Next:** Apply to All Forms
