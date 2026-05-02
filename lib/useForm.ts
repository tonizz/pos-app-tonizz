import { useState } from 'react'
import { z } from 'zod'
import { formatZodError } from './validations'

interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: z.ZodSchema<T>
  onSubmit: (values: T) => Promise<void> | void
}

interface FormState<T> {
  values: T
  errors: { [key: string]: string }
  touched: { [key: string]: boolean }
  isSubmitting: boolean
  isValid: boolean
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true
  })

  const validateField = (name: string, value: any) => {
    if (!validationSchema) return null

    try {
      // Validate single field
      const fieldSchema = validationSchema.shape?.[name]
      if (fieldSchema) {
        fieldSchema.parse(value)
      }
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors?.[0]
        return firstError?.message || 'Invalid value'
      }
      return 'Invalid value'
    }
  }

  const validateForm = (values: T) => {
    if (!validationSchema) return { isValid: true, errors: {} }

    try {
      validationSchema.parse(values)
      return { isValid: true, errors: {} }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatZodError(error)
        return { isValid: false, errors: formattedErrors }
      }
      return { isValid: false, errors: { _error: 'Validation failed' } }
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormState((prev) => {
      const newValues = { ...prev.values, [name]: value }

      // Only validate if field has been touched
      let newErrors = { ...prev.errors }

      if (prev.touched[name]) {
        const fieldError = validateField(name, value)
        if (fieldError) {
          newErrors[name] = fieldError
        } else {
          delete newErrors[name]
        }
      }

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      }
    })
  }

  const handleBlur = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true }
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

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
      setFormState({
        values: initialValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValid: true
      })
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        errors: { _error: error.message || 'Submission failed' },
        isSubmitting: false
      }))
    }
  }

  const setFieldValue = (name: string, value: any) => {
    handleChange(name, value)
  }

  const setFieldError = (name: string, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error }
    }))
  }

  const setErrors = (errors: { [key: string]: string }) => {
    setFormState((prev) => ({
      ...prev,
      errors,
      isValid: false
    }))
  }

  const resetForm = () => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true
    })
  }

  const getFieldProps = (name: string) => ({
    name,
    value: formState.values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
      handleChange(name, value)
    },
    onBlur: () => handleBlur(name)
  })

  const getFieldError = (name: string) => {
    return formState.touched[name] ? formState.errors[name] : undefined
  }

  const hasError = (name: string) => {
    return formState.touched[name] && !!formState.errors[name]
  }

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
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
