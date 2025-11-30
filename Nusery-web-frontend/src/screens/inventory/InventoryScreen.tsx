'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from './api/inventoryApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { SaplingFilter } from '@/components/Filter/SaplingFilter'
import { Sapling } from '@/screens/saplings/models/types'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { useNursery } from '@/contexts/NurseryContext'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ROUTES, DEBOUNCE_DELAY, QUERY_KEYS } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { Inventory } from './models/types'

export default function InventoryScreen() {
  const { nursery } = useNursery()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSapling, setSelectedSapling] = useState<Sapling | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: [QUERY_KEYS.INVENTORY, nursery?.id, selectedSapling?.id, currentPage, pageSize],
    queryFn: () => inventoryApi.getInventory(nursery?.id || '', selectedSapling?.id || null, currentPage, pageSize),
    enabled: !!nursery?.id,
  })

  const { data: breedsData, isLoading: isLoadingBreeds } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, nursery?.id, selectedSapling?.id],
    queryFn: () => breedApi.getBreeds(nursery?.id || '', selectedSapling?.id || null),
    enabled: !!nursery?.id,
  })

  const isLoading = isLoadingInventory || isLoadingBreeds
  
  // Check if inventory response is paginated
  const isInventoryPaginated = inventoryData && 'content' in inventoryData
  const inventory = isInventoryPaginated 
    ? (inventoryData as PaginatedResponse<Inventory>).content 
    : (inventoryData as Inventory[] || [])
  const inventoryPaginationData = isInventoryPaginated 
    ? (inventoryData as PaginatedResponse<Inventory>) 
    : null
  
  // Check if breeds response is paginated
  const isBreedsPaginated = breedsData && 'content' in breedsData
  const breeds = isBreedsPaginated 
    ? (breedsData as PaginatedResponse<any>).content 
    : (breedsData || [])
  
  // Merge breeds with inventory to show all breeds (including those with 0 quantity)
  const mergedInventory = useMemo(() => {
    if (!breeds || breeds.length === 0) return []
    
    const inventoryMap = new Map(
      (inventory || []).map(item => [item.breedId, item])
    )
    
    return breeds.map((breed: any) => {
      const inv = inventoryMap.get(breed.id)
      return {
        id: inv?.id || breed.id,
        breedId: breed.id,
        breedName: breed.name,
        quantity: inv?.quantity ?? 0,
        nurseryId: breed.nurseryId,
      }
    })
  }, [breeds, inventory])
  
  const filteredInventory = useMemo(() => {
    if (!mergedInventory || mergedInventory.length === 0) return []
    const term = debouncedSearchTerm.toLowerCase().trim()
    if (!term) return mergedInventory
    return mergedInventory.filter((item) =>
      item.breedName.toLowerCase().includes(term)
    )
  }, [mergedInventory, debouncedSearchTerm])
  
  const handleSaplingSelect = (sapling: Sapling | null) => {
    setSelectedSapling(sapling)
    setCurrentPage(0)
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(0)
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
      </div>
      
      {/* Search Bar with Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search inventory by breed name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
            aria-label="Search inventory"
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
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm ? 'No inventory found matching your search' : 'No inventory found'}
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
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Breed Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.breedId}
                    onClick={() => router.push(`${ROUTES.INVENTORY}/${item.breedId}`)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.breedName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {item.quantity.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {/* Pagination */}
      {isInventoryPaginated && inventoryPaginationData && (
        <Pagination
          currentPage={currentPage}
          totalPages={inventoryPaginationData.totalPages}
          totalElements={inventoryPaginationData.totalElements}
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
