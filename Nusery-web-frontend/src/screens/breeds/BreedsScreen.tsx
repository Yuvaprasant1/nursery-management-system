'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { SaplingFilter } from '@/components/Filter/SaplingFilter'
import { Sapling } from '@/screens/saplings/models/types'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { useNursery } from '@/contexts/NurseryContext'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { ErrorState } from '@/components/Error/ErrorState'
import { Skeleton } from '@/components/Loading/Skeleton'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { ROUTES, DEBOUNCE_DELAY } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { useDebounce } from '@/hooks/useDebounce'
import { ButtonAction, ConfirmationVariant } from '@/enums'
import { Breed } from './models/types'

export default function BreedsScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSapling, setSelectedSapling] = useState<Sapling | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  const router = useRouter()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for breeds API data
  const [breedsData, setBreedsData] = useState<Breed[] | PaginatedResponse<Breed> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for saplings API data
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)
  
  // Fetch breeds function (for manual refetch)
  const fetchBreeds = useCallback(async () => {
    if (!nursery?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await breedApi.getBreeds(nursery.id, selectedSapling?.id || null, currentPage, pageSize, debouncedSearchTerm)
      setBreedsData(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load breeds')
      setError(error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [nursery?.id, selectedSapling?.id, currentPage, pageSize, debouncedSearchTerm]) // Removed toast - it's stable
  
  // Fetch saplings function (for manual refetch)
  const fetchSaplings = useCallback(async () => {
    if (!nursery?.id) return
    
    try {
      const data = await saplingApi.getAllSaplings(nursery.id)
      setSaplingsData(data)
    } catch (err) {
      // Silently fail for saplings - not critical for main functionality
      console.error('Failed to load saplings:', err)
    }
  }, [nursery?.id])
  
  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm])
  
  // Fetch data when dependencies change - use direct dependencies
  useEffect(() => {
    if (!nursery?.id) return
    
    setIsLoading(true)
    setError(null)
    
    breedApi.getBreeds(nursery.id, selectedSapling?.id || null, currentPage, pageSize, debouncedSearchTerm)
      .then(data => setBreedsData(data))
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to load breeds')
        setError(error)
        toast.error(getErrorMessage(error))
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, selectedSapling?.id, currentPage, pageSize, debouncedSearchTerm]) // Direct dependencies, toast is stable
  
  useEffect(() => {
    if (!nursery?.id) return
    
    saplingApi.getAllSaplings(nursery.id)
      .then(data => setSaplingsData(data))
      .catch(err => console.error('Failed to load saplings:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id]) // Direct dependencies
  
  // Extract saplings array from response
  const saplings: Sapling[] = useMemo(() => {
    if (!saplingsData) return []
    if (Array.isArray(saplingsData)) return saplingsData
    if ('content' in saplingsData) return saplingsData.content
    return []
  }, [saplingsData])
  
  // Check if response is paginated
  const isPaginated = breedsData && 'content' in breedsData
  const breeds = isPaginated ? (breedsData as PaginatedResponse<Breed>).content : (breedsData as Breed[] || [])
  const paginationData = isPaginated ? (breedsData as PaginatedResponse<Breed>) : null
  
  // Reset to first page when filters change
  const handleSaplingSelect = (sapling: Sapling | null) => {
    setSelectedSapling(sapling)
    setCurrentPage(0)
  }
  
  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Breed?',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        // Check if breed has transactions before deleting
        const hasTransactions = await breedApi.checkHasTransactions(id)
        if (hasTransactions) {
          toast.error('Cannot delete breed with existing transactions')
          return
        }
        await breedApi.deleteBreed(id)
        toast.success('Breed deleted successfully')
        fetchBreeds() // Refresh the list
      } catch (error) {
        // Error is handled by Axios interceptor
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Breeds</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <ErrorState
        title="Failed to load breeds"
        message={getErrorMessage(error)}
        onRetry={fetchBreeds}
      />
    )
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Breeds</h1>
        <Button onClick={() => router.push(ROUTES.BREEDS + '/new')}>
          Add New Breed
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search breeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <SaplingFilter
          selectedSapling={selectedSapling}
          onSelect={handleSaplingSelect}
          saplings={saplings}
        />
      </div>
      
      {breeds.length > 0 ? (
        <>
          <div className="grid gap-4">
            {breeds.map((breed) => (
              <Card key={breed.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{breed.name}</h3>
                    {breed.description && (
                      <p className="text-sm text-gray-600 mt-1">{breed.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Mode: {breed.mode || 'INDIVIDUAL'}</span>
                      {breed.mode === 'SLOT' && breed.itemsPerSlot && (
                        <span>Items per slot: {breed.itemsPerSlot}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(breed.id, breed.name)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE}
                    </Button>
                  </div>
                </div>
              </Card>
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
            {searchTerm ? 'No breeds found matching your search' : 'No breeds found'}
          </p>
        </Card>
      )}
    </div>
  )
}
