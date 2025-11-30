import { inventoryApi } from '@/screens/inventory/api/inventoryApi'
import { Inventory, TransactionRequest } from '@/screens/inventory/models/types'

/**
 * Inventory Service
 * Centralized service for inventory operations
 */
export const inventoryService = {
  /**
   * Get all inventory for a nursery
   */
  getInventory: async (nurseryId: string): Promise<Inventory[]> => {
    return inventoryApi.getInventory(nurseryId)
  },

  /**
   * Get inventory by breed ID
   */
  getInventoryByBreed: async (breedId: string): Promise<Inventory> => {
    return inventoryApi.getInventoryByBreed(breedId)
  },

  /**
   * Create a transaction for inventory
   */
  createTransaction: async (breedId: string, data: TransactionRequest): Promise<void> => {
    return inventoryApi.createTransaction(breedId, data)
  },
}

