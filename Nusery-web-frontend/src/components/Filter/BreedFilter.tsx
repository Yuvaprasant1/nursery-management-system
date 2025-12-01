'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Breed } from '@/screens/breeds/models/types'
import { Input } from '@/components/Input'
import { cn } from '@/utils/cn'
import { UIText } from '@/enums'

interface BreedFilterProps {
  breeds: Breed[]
  selectedBreed: Breed | null
  onSelect: (breed: Breed | null) => void
  className?: string
}

/**
 * Compact, modern Breed filter used on the Transactions screen.
 * Purely client-side: it filters the provided breeds list for the dropdown.
 */
export function BreedFilter({
  breeds,
  selectedBreed,
  onSelect,
  className,
}: BreedFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredBreeds = useMemo(() => {
    if (!searchTerm) return breeds
    const lower = searchTerm.toLowerCase()
    return breeds.filter(
      (b) =>
        b.name.toLowerCase().includes(lower)
    )
  }, [breeds, searchTerm])

  const handleSelect = (breed: Breed | null) => {
    onSelect(breed)
    setIsOpen(false)
    setSearchTerm('')
  }

  const displayText = selectedBreed ? selectedBreed.name : UIText.ALL_BREEDS

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs',
          'border border-gray-300 rounded-md',
          'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent',
          'transition-colors duration-200',
          'h-8',
          selectedBreed && 'border-primary bg-primary/5'
        )}
        aria-label="Filter by breed"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg
          className="w-3.5 h-3.5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h8M6 11h12M10 15h4"
          />
        </svg>
        <span className="truncate max-w-[140px] text-xs font-medium text-gray-700">
          {displayText}
        </span>
        <svg
          className={cn(
            'w-3 h-3 text-gray-500 transition-transform duration-200 flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-64 max-w-[90vw] bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden"
          role="listbox"
        >
          <div className="p-1.5 border-b border-gray-200">
            <Input
              type="text"
              placeholder={UIText.SEARCH_BREEDS}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-7 px-2 py-1"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full text-left px-2 py-1.5 text-xs',
                'hover:bg-gray-50 transition-colors',
                !selectedBreed && 'bg-blue-50 text-blue-700 font-medium'
              )}
              role="option"
              aria-selected={!selectedBreed}
            >
              {UIText.ALL_BREEDS}
            </button>
            {filteredBreeds.length === 0 ? (
              <div className="px-2 py-2 text-xs text-gray-500 text-center">
                {searchTerm ? UIText.NO_BREEDS_FOUND : UIText.NO_BREEDS_AVAILABLE}
              </div>
            ) : (
              filteredBreeds.map((breed) => (
                <button
                  key={breed.id}
                  type="button"
                  onClick={() => handleSelect(breed)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-xs',
                    'hover:bg-gray-50 transition-colors',
                    selectedBreed?.id === breed.id && 'bg-blue-50 text-blue-700 font-medium'
                  )}
                  role="option"
                  aria-selected={selectedBreed?.id === breed.id}
                >
                  <span className="truncate block">{breed.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}


