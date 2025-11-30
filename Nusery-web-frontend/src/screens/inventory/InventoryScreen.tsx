'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { inventoryApi } from './api/inventoryApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { SaplingFilter } from '@/components/Filter/SaplingFilter'
import { Sapling } from '@/screens/saplings/models/types'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { useNursery } from '@/contexts/NurseryContext'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ROUTES, DEBOUNCE_DELAY } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { Inventory } from './models/types'
import { cn } from '@/utils/cn'

export default function InventoryScreen() {
  const { nursery } = useNursery()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSapling, setSelectedSapling] = useState<Sapling | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY)
  
  // State for inventory API data
  const [inventoryData, setInventoryData] = useState<Inventory[] | PaginatedResponse<Inventory> | null>(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  
  // State for breeds API data
  const [breedsData, setBreedsData] = useState<any>(null)
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(false)
  
  // State for saplings API data
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)
  
  // Fetch inventory function (for manual refetch)
  const fetchInventory = useCallback(async () => {
    if (!nursery?.id) return
    
    setIsLoadingInventory(true)
    
    try {
      const data = await inventoryApi.getInventory(nursery.id, selectedSapling?.id || null, currentPage, pageSize, debouncedSearchTerm)
      setInventoryData(data)
    } catch (err) {
      console.error('Failed to load inventory:', err)
    } finally {
      setIsLoadingInventory(false)
    }
  }, [nursery?.id, selectedSapling?.id, currentPage, pageSize, debouncedSearchTerm])

  // Fetch breeds function (for manual refetch)
  const fetchBreeds = useCallback(async () => {
    if (!nursery?.id) return
    
    setIsLoadingBreeds(true)
    
    try {
      const data = await breedApi.getBreeds(nursery.id, selectedSapling?.id || null)
      setBreedsData(data)
    } catch (err) {
      console.error('Failed to load breeds:', err)
    } finally {
      setIsLoadingBreeds(false)
    }
  }, [nursery?.id, selectedSapling?.id])
  
  // Fetch saplings function (for manual refetch)
  const fetchSaplings = useCallback(async () => {
    if (!nursery?.id) return
    
    try {
      const data = await saplingApi.getAllSaplings(nursery.id)
      setSaplingsData(data)
    } catch (err) {
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
    
    setIsLoadingInventory(true)
    inventoryApi.getInventory(nursery.id, selectedSapling?.id || null, currentPage, pageSize, debouncedSearchTerm)
      .then(data => setInventoryData(data))
      .catch(err => console.error('Failed to load inventory:', err))
      .finally(() => setIsLoadingInventory(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, selectedSapling?.id, currentPage, pageSize, debouncedSearchTerm]) // Direct dependencies
  
  useEffect(() => {
    if (!nursery?.id) return
    
    setIsLoadingBreeds(true)
    breedApi.getBreeds(nursery.id, selectedSapling?.id || null)
      .then(data => setBreedsData(data))
      .catch(err => console.error('Failed to load breeds:', err))
      .finally(() => setIsLoadingBreeds(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, selectedSapling?.id]) // Direct dependencies
  
  useEffect(() => {
    if (!nursery?.id) return
    
    saplingApi.getAllSaplings(nursery.id)
      .then(data => setSaplingsData(data))
      .catch(err => console.error('Failed to load saplings:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id]) // Direct dependencies

  const isLoading = isLoadingInventory || isLoadingBreeds
  
  // Extract saplings array from response
  const saplings: Sapling[] = useMemo(() => {
    if (!saplingsData) return []
    if (Array.isArray(saplingsData)) return saplingsData
    if ('content' in saplingsData) return saplingsData.content
    return []
  }, [saplingsData])
  
  // Check if inventory response is paginated
  const isInventoryPaginated = inventoryData && 'content' in inventoryData
  const inventory = isInventoryPaginated 
    ? (inventoryData as PaginatedResponse<Inventory>).content 
    : (inventoryData as Inventory[] || [])
  const inventoryPaginationData = isInventoryPaginated
    ? (inventoryData as PaginatedResponse<Inventory>)
    : null

  // Create breed name map (still needed for displaying breed names)
  const breedNameMap = useMemo(() => {
    if (!breedsData) return new Map<string, string>()
    const breeds = Array.isArray(breedsData) ? breedsData : (breedsData as any).content || []
    return new Map(breeds.map((breed: any) => [breed.id, breed.name]))
  }, [breedsData])

  // Reset to first page when filters change
  const handleSaplingSelect = (sapling: Sapling | null) => {
    setSelectedSapling(sapling)
    setCurrentPage(0)
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search by breed name..."
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
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : inventory.length > 0 ? (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => {
                    const breedName = breedNameMap.get(item.breedId)
                    const displayName = (typeof breedName === 'string' ? breedName : 'Unknown') as string
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {displayName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={cn(
                            'font-semibold',
                            item.quantity < 0 ? 'text-red-600' : 'text-gray-900'
                          )}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${ROUTES.INVENTORY}/${item.breedId}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
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
        </>
      ) : (
        <Card>
          <p className="text-gray-600 text-center py-8">
            {searchTerm ? 'No inventory found matching your search' : 'No inventory found'}
          </p>
        </Card>
      )}
    </div>
  )
}
