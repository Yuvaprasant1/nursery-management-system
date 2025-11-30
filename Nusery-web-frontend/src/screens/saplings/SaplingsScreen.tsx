'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { saplingApi } from './api/saplingApi'
import { Sapling } from './models/types'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { useNursery } from '@/contexts/NurseryContext'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { DEBOUNCE_DELAY, QUERY_KEYS } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { ButtonAction, ConfirmationVariant } from '@/enums'

export default function SaplingsScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  
  const { data: saplingsData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SAPLINGS, nursery?.id, debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => saplingApi.getAllSaplings(nursery?.id || '', debouncedSearchTerm, currentPage, pageSize),
    enabled: !!nursery?.id,
  })
  
  // Check if response is paginated
  const isPaginated = saplingsData && 'content' in saplingsData
  const saplings = isPaginated 
    ? (saplingsData as PaginatedResponse<Sapling>).content 
    : (saplingsData as Sapling[] || [])
  const paginationData = isPaginated 
    ? (saplingsData as PaginatedResponse<Sapling>) 
    : null
  
  const deleteMutation = useMutation({
    mutationFn: saplingApi.deleteSapling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAPLINGS] })
      toast.success('Sapling deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete sapling')
    },
  })
  
  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Sapling?',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(0)
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Saplings</h1>
        <Button 
          onClick={() => router.push('/saplings/new')}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          Add Sapling
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search saplings by name or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full"
          aria-label="Search saplings"
        />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : !saplings || saplings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm ? 'No saplings found matching your search' : 'No saplings found'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setCurrentPage(0)
                }}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saplings.map((sapling: Sapling) => (
            <Card 
              key={sapling.id}
              className="p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-primary/30 group overflow-hidden"
            >
              {sapling.imageUrl && (
                <div className="mb-4 -mx-6 -mt-6">
                  <img 
                    src={sapling.imageUrl} 
                    alt={sapling.name} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {sapling.name}
              </h3>
              {sapling.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {sapling.description}
                </p>
              )}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/saplings/${sapling.id}`)}
                  className="flex-1"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/saplings/${sapling.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(sapling.id, sapling.name)}
                  disabled={deleteMutation.isPending}
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
