import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { Sapling, SaplingRequest } from '@/screens/saplings/models/types'

/**
 * Sapling Service
 * Centralized service for sapling operations
 */
export const saplingService = {
  /**
   * Get all saplings for a nursery
   */
  getAllSaplings: async (nurseryId: string): Promise<Sapling[]> => {
    return saplingApi.getAllSaplings(nurseryId)
  },

  /**
   * Get sapling by ID
   */
  getSapling: async (id: string): Promise<Sapling> => {
    return saplingApi.getSapling(id)
  },

  /**
   * Create a new sapling
   */
  createSapling: async (data: SaplingRequest): Promise<Sapling> => {
    return saplingApi.createSapling(data)
  },

  /**
   * Update an existing sapling
   */
  updateSapling: async (id: string, data: SaplingRequest): Promise<Sapling> => {
    return saplingApi.updateSapling(id, data)
  },

  /**
   * Delete a sapling
   */
  deleteSapling: async (id: string): Promise<void> => {
    return saplingApi.deleteSapling(id)
  },
}

