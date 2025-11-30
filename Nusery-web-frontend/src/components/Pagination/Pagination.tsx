'use client'

import { Button } from '@/components/Button'
import { Dropdown, DropdownOption } from '@/components/Dropdown'
import { cn } from '@/utils/cn'

interface PaginationProps {
  currentPage: number // 0-indexed from backend, but displayed as 1-indexed
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  // Convert 0-indexed to 1-indexed for display
  const displayPage = currentPage + 1
  
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(0)
      
      if (displayPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages - 1)
      } else if (displayPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis')
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push('ellipsis')
        for (let i = displayPage - 2; i <= displayPage + 1; i++) {
          pages.push(i - 1) // Convert to 0-indexed
        }
        pages.push('ellipsis')
        pages.push(totalPages - 1)
      }
    }
    
    return pages
  }
  
  const handlePageSizeChange = (size: number) => {
    onPageSizeChange(size)
    // Reset to first page when changing page size
    onPageChange(0)
  }

  const pageSizeOptions: DropdownOption<number>[] = PAGE_SIZE_OPTIONS.map(size => ({
    value: size,
    label: size.toString(),
  }))
  
  if (totalPages === 0) {
    return null
  }
  
  const pageNumbers = getPageNumbers()
  
  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4', className)}>
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 whitespace-nowrap">
          Items per page:
        </span>
        <Dropdown
          options={pageSizeOptions}
          value={pageSize}
          onChange={handlePageSizeChange}
          size="sm"
          className="w-20"
        />
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Previous page"
        >
          Previous
        </Button>
        
        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500"
                >
                  ...
                </span>
              )
            }
            
            const pageNum = page as number
            const isActive = pageNum === currentPage
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'min-w-[2.5rem] px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
                aria-label={`Go to page ${pageNum + 1}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum + 1}
              </button>
            )
          })}
        </div>
        
        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

