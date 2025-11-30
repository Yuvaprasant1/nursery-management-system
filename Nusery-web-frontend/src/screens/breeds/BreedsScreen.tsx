'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { breedApi } from './api/breedApi'
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
import { QUERY_KEYS, ROUTES, DEBOUNCE_DELAY } from '@/constants'
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
  const queryClient = useQueryClient()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  
  const { data: breedsData, isLoading, error, refetch, isError } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, nursery?.id, selectedSapling?.id, currentPage, pageSize],
    queryFn: () => breedApi.getBreeds(nursery?.id || '', selectedSapling?.id || null, currentPage, pageSize),
    retry: 1,
    enabled: !!nursery?.id,
    staleTime: 0,
    refetchOnMount: true,
  })
  
  // Check if response is paginated
  const isPaginated = breedsData && 'content' in breedsData
  const breeds = isPaginated ? (breedsData as PaginatedResponse<Breed>).content : (breedsData as Breed[] || [])
  const paginationData = isPaginated ? (breedsData as PaginatedResponse<Breed>) : null
  
  // Reset to first page when filters change
  const handleSaplingSelect = (sapling: Sapling | null) => {
    setSelectedSapling(sapling)
    setCurrentPage(0)
  }
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if breed has transactions before deleting
      const hasTransactions = await breedApi.checkHasTransactions(id)
      if (hasTransactions) {
        throw new Error('Cannot delete breed with existing transactions')
      }
      return breedApi.deleteBreed(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREEDS] })
      toast.success('Breed deleted successfully')
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('transactions')) {
        toast.error('Cannot delete breed with existing transactions')
      } else {
        toast.error(errorMessage || 'Failed to delete breed')
      }
    },
  })
  
  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Breed?',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }
  
  // Client-side filtering for search (since backend doesn't support search for breeds)
  const filteredBreeds = useMemo(() => {
    if (!breeds || breeds.length === 0) return []
    const term = debouncedSearchTerm.toLowerCase().trim()
    if (!term) return breeds
    return breeds.filter(breed =>
      breed.name.toLowerCase().includes(term) ||
      breed.description?.toLowerCase().includes(term)
    )
  }, [breeds, debouncedSearchTerm])
  
  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(0)
  }
  
  if (isError) {
    return (
      <ErrorState
        title="Failed to load breeds"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    )
  }
  

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Breeds</h1>
        <Button 
          onClick={() => router.push(`${ROUTES.BREEDS}/new`)}
          aria-label="Add new breed"
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          Add Breed
        </Button>
      </div>
      
      {/* Search Bar with Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search breeds by name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
            aria-label="Search breeds"
          />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <SaplingFilter
            selectedSapling={selectedSapling}
            onSelect={handleSaplingSelect}
            compact
          />
        </div>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredBreeds.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm ? 'No breeds found matching your search' : 'No breeds found'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBreeds.map((breed) => (
            <Card 
              key={breed.id} 
              className="flex flex-col p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-primary/30 group"
            >
              <div className="flex-1 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {breed.name}
                </h3>
                {breed.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {breed.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Updated: {new Date(breed.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}`)}
                  className="flex-1"
                  aria-label={`View details for ${breed.name}`}
                >
                  View Details
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(breed.id, breed.name)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Delete ${breed.name}`}
                >
                  {deleteMutation.isPending ? ButtonAction.DELETING : ButtonAction.DELETE}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
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
    </div>
  )
}
