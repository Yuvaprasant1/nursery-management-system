'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saplingApi } from './api/saplingApi'
import { ResponsiveListCard } from '@/components/ResponsiveListCard'
import { IconButton } from '@/components/IconButton'
import { Sapling } from './models/types'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { useNursery } from '@/contexts/NurseryContext'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { DEBOUNCE_DELAY } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { ButtonAction, ConfirmationVariant } from '@/enums'
import { getErrorMessage } from '@/utils/errors'

export default function SaplingsScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  const router = useRouter()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for API data
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Fetch saplings function (for manual refetch)
  const fetchSaplings = useCallback(async () => {
    if (!nursery?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await saplingApi.getAllSaplings(nursery.id, debouncedSearchTerm, currentPage, pageSize)
      setSaplingsData(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load saplings')
      setError(error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [nursery?.id, debouncedSearchTerm, currentPage, pageSize]) // Removed toast - it's stable
  
  // Fetch data when dependencies change - use direct dependencies
  useEffect(() => {
    if (!nursery?.id) return
    
    setIsLoading(true)
    setError(null)
    
    saplingApi.getAllSaplings(nursery.id, debouncedSearchTerm, currentPage, pageSize)
      .then(data => setSaplingsData(data))
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to load saplings')
        setError(error)
        toast.error(getErrorMessage(error))
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, debouncedSearchTerm, currentPage, pageSize]) // Direct dependencies, toast is stable
  
  // Check if response is paginated
  const isPaginated = saplingsData && 'content' in saplingsData
  const saplings = isPaginated 
    ? (saplingsData as PaginatedResponse<Sapling>).content 
    : (saplingsData as Sapling[] || [])
  const paginationData = isPaginated 
    ? (saplingsData as PaginatedResponse<Sapling>) 
    : null
  
  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Sapling?',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        await saplingApi.deleteSapling(id)
        toast.success('Sapling deleted successfully')
        fetchSaplings() // Refresh the list
      } catch (error) {
        toast.error(getErrorMessage(error) || 'Failed to delete sapling')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(0)
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Saplings</h1>
        <IconButton
          action="add"
          onClick={() => router.push('/saplings/new')}
          label="Add Sapling"
          size="md"
        />
      </div>
      
      {/* Search Bar */}
      <div className="max-w-xs">
        <Input
          type="text"
          placeholder="Search saplings..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="h-8 text-sm"
        />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : saplings && saplings.length > 0 ? (
        <>
          <div className="space-y-3 sm:space-y-4">
            {saplings.map((sapling) => (
              <ResponsiveListCard
                key={sapling.id}
                title={sapling.name}
                description={sapling.description}
                actions={[
                  {
                    action: 'view',
                    label: 'View',
                    onClick: () => router.push(`/saplings/${sapling.id}`),
                    variant: 'outline',
                  },
                  {
                    action: 'edit',
                    label: 'Edit',
                    onClick: () => router.push(`/saplings/${sapling.id}/edit`),
                    variant: 'outline',
                  },
                  {
                    action: 'delete',
                    label: isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE,
                    onClick: () => handleDelete(sapling.id, sapling.name),
                    variant: 'danger',
                    disabled: isDeleting,
                  },
                ]}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {isPaginated && paginationData && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationData.totalPages}
              totalElements={paginationData.totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(0)
              }}
            />
          )}
        </>
      ) : (
        <Card>
          <p className="text-gray-600 text-center py-8">
            {searchTerm ? 'No saplings found matching your search' : 'No saplings found'}
          </p>
        </Card>
      )}
    </div>
  )
}
