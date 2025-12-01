'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { inventoryApi } from './api/inventoryApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { SaplingFilter } from '@/components/Filter/SaplingFilter'
import { ResponsiveTable, TableColumn } from '@/components/ResponsiveTable'
import { ResponsiveFilterBar } from '@/components/ResponsiveFilterBar'
import { Sapling } from '@/screens/saplings/models/types'
import { Input } from '@/components/Input'
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
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
      
      <ResponsiveFilterBar>
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm">
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
      </ResponsiveFilterBar>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : inventory.length > 0 ? (
        <>
          <ResponsiveTable
            columns={[
              {
                key: 'breedName',
                header: 'Breed',
                accessor: (item) => breedNameMap.get(item.breedId) || 'Unknown',
                className: 'font-medium',
              },
              {
                key: 'quantity',
                header: 'Quantity',
                render: (_, item) => (
                  <span className={cn(
                    'font-semibold',
                    item.quantity < 0 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {item.quantity}
                  </span>
                ),
              },
            ] as TableColumn<Inventory & { breedName?: string }>[]}
            data={inventory}
            actions={[
              {
                label: 'View Details',
                onClick: (item) => router.push(`${ROUTES.INVENTORY}/${item.breedId}`),
                variant: 'outline',
              },
            ]}
            emptyMessage={searchTerm ? 'No inventory found matching your search' : 'No inventory found'}
            loadingComponent={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}
            keyExtractor={(item) => item.id}
          />
          
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
        <div className="text-center py-8 bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            {searchTerm ? 'No inventory found matching your search' : 'No inventory found'}
          </p>
        </div>
      )}
    </div>
  )
}
