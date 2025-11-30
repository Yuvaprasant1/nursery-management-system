'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface DropdownOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  icon?: ReactNode
}

interface DropdownProps<T = string> {
  options: DropdownOption<T>[]
  value?: T
  onChange?: (value: T) => void
  placeholder?: string
  label?: ReactNode
  error?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  searchable?: boolean
  onSearch?: (searchTerm: string) => void
  renderOption?: (option: DropdownOption<T>) => ReactNode
  renderValue?: (option: DropdownOption<T> | undefined) => ReactNode
}

export function Dropdown<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
  size = 'md',
  searchable = false,
  onSearch,
  renderOption,
  renderValue,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm h-8',
    md: 'px-3 py-2 text-sm h-10',
    lg: 'px-4 py-2.5 text-base h-12',
  }

  const filteredOptions = searchable && searchTerm
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when dropdown opens
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, searchable])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return
    onChange?.(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    onSearch?.(term)
  }

  const displayValue = renderValue 
    ? renderValue(selectedOption)
    : selectedOption?.label || placeholder

  return (
    <div className={cn('w-full', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between',
            'border rounded-md',
            'bg-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[size],
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 hover:border-gray-400',
            isOpen && 'ring-2 ring-blue-500 border-transparent'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={label || placeholder}
        >
          <span className={cn(
            'flex items-center gap-2 flex-1 text-left truncate',
            !selectedOption && 'text-gray-500'
          )}>
            {selectedOption?.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className="truncate">{displayValue}</span>
          </span>
          
          <svg
            className={cn(
              'w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden"
            role="listbox"
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={cn(
                    'w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded',
                    'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent',
                    'h-8'
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value
                  const optionContent = renderOption 
                    ? renderOption(option)
                    : (
                        <span className="flex items-center gap-2">
                          {option.icon && (
                            <span className="flex-shrink-0">{option.icon}</span>
                          )}
                          <span className="truncate">{option.label}</span>
                        </span>
                      )

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm',
                        'hover:bg-gray-50 transition-colors duration-150',
                        'focus:outline-none focus:bg-gray-50',
                        isSelected && 'bg-blue-50 text-blue-700 font-medium',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {optionContent}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

