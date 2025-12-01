'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { Input } from './Input'
import { cn } from '@/utils/cn'

interface IntegerInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  allowNegative?: boolean
  error?: string
}

/**
 * IntegerInput - A number input that only accepts whole numbers (no decimals)
 */
export const IntegerInput = forwardRef<HTMLInputElement, IntegerInputProps>(
  ({ allowNegative = false, error, className, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        step={1}
        onChange={onChange}
        error={error}
        className={cn('text-lg', className)}
        {...props}
      />
    )
  }
)

IntegerInput.displayName = 'IntegerInput'
