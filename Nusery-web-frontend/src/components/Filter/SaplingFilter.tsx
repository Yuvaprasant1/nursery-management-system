'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { Sapling } from '@/screens/saplings/models/types'
import { useNursery } from '@/contexts/NurseryContext'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { Input } from '@/components/Input'
import { cn } from '@/utils/cn'
import { QUERY_KEYS, DEBOUNCE_DELAY } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'

interface SaplingFilterProps {
  selectedSapling: Sapling | null
  onSelect: (sapling: Sapling | null) => void
  className?: string
  compact?: boolean
}

export function SaplingFilter({
  selectedSapling,
  onSelect,
  className,
  compact = false,
}: SaplingFilterProps) {
  const { nursery } = useNursery()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: saplings, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SAPLINGS, nursery?.id, debouncedSearchTerm],
    queryFn: () => saplingApi.getAllSaplings(nursery?.id || '', debouncedSearchTerm),
    enabled: !!nursery?.id,
    staleTime: 0, // Always fetch fresh data (no caching)
    refetchOnMount: true, // Always refetch when component mounts
  })

  // Use saplings directly from API (already filtered by backend)
  const filteredSaplings = saplings || []

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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (sapling: Sapling | null) => {
    onSelect(sapling)
    setIsOpen(false)
    setSearchTerm('')
  }

  const displayText = selectedSapling ? selectedSapling.name : 'All Breeds'

  if (compact) {
    return (
      <div className={cn('relative', className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full px-3 py-2 text-left text-sm',
            'border border-gray-300 rounded-md',
            'bg-white hover:bg-gray-50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'flex items-center justify-between gap-2',
            'transition-colors duration-200'
          )}
          aria-label="Filter by sapling"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">{displayText}</span>
          <svg
            className={cn(
              'w-4 h-4 text-gray-500 transition-transform duration-200',
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
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden"
            role="listbox"
          >
            <div className="p-2 border-b border-gray-200">
              <Input
                type="text"
                placeholder="Search saplings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm',
                      'hover:bg-gray-50 transition-colors',
                      selectedSapling === null && 'bg-blue-50 text-blue-700 font-medium'
                    )}
                    role="option"
                    aria-selected={selectedSapling === null}
                  >
                    All Breeds
                  </button>
                  {filteredSaplings.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {debouncedSearchTerm ? 'No saplings found' : 'No saplings available'}
                    </div>
                  ) : (
                    filteredSaplings.map((sapling) => (
                      <button
                        key={sapling.id}
                        type="button"
                        onClick={() => handleSelect(sapling)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm',
                          'hover:bg-gray-50 transition-colors',
                          selectedSapling?.id === sapling.id && 'bg-blue-50 text-blue-700 font-medium'
                        )}
                        role="option"
                        aria-selected={selectedSapling?.id === sapling.id}
                      >
                        {sapling.name}
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full version for header
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2',
          'border border-gray-300 rounded-lg',
          'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          'shadow-sm hover:shadow-md',
          selectedSapling && 'border-primary bg-primary/5'
        )}
        aria-label="Filter by sapling"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="font-medium text-gray-700">{displayText}</span>
        <svg
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200',
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
          className="absolute z-50 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden"
          role="listbox"
        >
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <Input
              type="text"
              placeholder="Search saplings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-80">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full text-left px-4 py-3',
                    'hover:bg-gray-50 transition-colors',
                    'border-b border-gray-100',
                    selectedSapling === null && 'bg-blue-50 text-blue-700 font-medium'
                  )}
                  role="option"
                  aria-selected={selectedSapling === null}
                >
                  <div className="font-medium">All Breeds</div>
                  <div className="text-xs text-gray-500 mt-0.5">Show breeds from all saplings</div>
                </button>
                {filteredSaplings.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-gray-500 text-center">
                    {debouncedSearchTerm ? 'No saplings found matching your search' : 'No saplings available'}
                  </div>
                ) : (
                  filteredSaplings.map((sapling) => (
                    <button
                      key={sapling.id}
                      type="button"
                      onClick={() => handleSelect(sapling)}
                      className={cn(
                        'w-full text-left px-4 py-3',
                        'hover:bg-gray-50 transition-colors',
                        'border-b border-gray-100 last:border-b-0',
                        selectedSapling?.id === sapling.id && 'bg-blue-50 text-blue-700 font-medium'
                      )}
                      role="option"
                      aria-selected={selectedSapling?.id === sapling.id}
                    >
                      <div className="font-medium">{sapling.name}</div>
                      {sapling.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {sapling.description}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

