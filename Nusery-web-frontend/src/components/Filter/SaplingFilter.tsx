'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { Sapling } from '@/screens/saplings/models/types'
import { useNursery } from '@/contexts/NurseryContext'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { Input } from '@/components/Input'
import { cn } from '@/utils/cn'
import { DEBOUNCE_DELAY } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { PaginatedResponse } from '@/api/types'

interface SaplingFilterProps {
  selectedSapling: Sapling | null
  onSelect: (sapling: Sapling | null) => void
  className?: string
  compact?: boolean
  saplings?: Sapling[] // Optional: provide saplings to avoid duplicate API call
}

export function SaplingFilter({
  selectedSapling,
  onSelect,
  className,
  compact = false,
  saplings: providedSaplings,
}: SaplingFilterProps) {
  const { nursery } = useNursery()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // State for saplings API data (only used if not provided)
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch saplings function (for manual refetch, only if not provided)
  const fetchSaplings = useCallback(async () => {
    if (!nursery?.id || providedSaplings) return
    
    setIsLoading(true)
    try {
      const data = await saplingApi.getAllSaplings(nursery.id, debouncedSearchTerm)
      setSaplingsData(data)
    } catch (err) {
      console.error('Failed to load saplings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [nursery?.id, debouncedSearchTerm, providedSaplings])

  // Fetch data when dependencies change (only if saplings not provided) - use direct dependencies
  useEffect(() => {
    if (!nursery?.id || providedSaplings) return
    
    setIsLoading(true)
    saplingApi.getAllSaplings(nursery.id, debouncedSearchTerm)
      .then(data => setSaplingsData(data))
      .catch(err => console.error('Failed to load saplings:', err))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, debouncedSearchTerm, providedSaplings]) // Direct dependencies

  // Handle both array and paginated response, or use provided saplings
  const filteredSaplings: Sapling[] = useMemo(() => {
    // If saplings are provided, use them and filter by search term
    if (providedSaplings) {
      if (!debouncedSearchTerm) return providedSaplings
      const searchLower = debouncedSearchTerm.toLowerCase()
      return providedSaplings.filter((sapling) =>
        sapling.name.toLowerCase().includes(searchLower)
      )
    }
    
    // Otherwise use fetched data
    if (!saplingsData) return []
    if (Array.isArray(saplingsData)) return saplingsData
    if ('content' in saplingsData) return saplingsData.content
    return []
  }, [providedSaplings, saplingsData, debouncedSearchTerm])

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

  const displayText = selectedSapling ? selectedSapling.name : 'All Saplings'

  // Always use compact version
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
          selectedSapling && 'border-primary bg-primary/5'
        )}
        aria-label="Filter by sapling"
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="truncate max-w-[120px] text-xs font-medium text-gray-700">{displayText}</span>
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
          className="absolute z-50 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden"
          role="listbox"
        >
          <div className="p-1.5 border-b border-gray-200">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-7 px-2 py-1"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            {isLoading && !providedSaplings ? (
              <div className="flex items-center justify-center py-3">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-xs',
                    'hover:bg-gray-50 transition-colors',
                    selectedSapling === null && 'bg-blue-50 text-blue-700 font-medium'
                  )}
                  role="option"
                  aria-selected={selectedSapling === null}
                >
                  All Saplings
                </button>
                {filteredSaplings.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-gray-500 text-center">
                    {debouncedSearchTerm ? 'No saplings found' : 'No saplings available'}
                  </div>
                ) : (
                  filteredSaplings.map((sapling) => (
                    <button
                      key={sapling.id}
                      type="button"
                      onClick={() => handleSelect(sapling)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-xs',
                        'hover:bg-gray-50 transition-colors',
                        selectedSapling?.id === sapling.id && 'bg-blue-50 text-blue-700 font-medium'
                      )}
                      role="option"
                      aria-selected={selectedSapling?.id === sapling.id}
                    >
                      <span className="truncate block">{sapling.name}</span>
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

