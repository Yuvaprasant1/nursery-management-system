import { breedApi } from '@/screens/breeds/api/breedApi'
import { Breed, BreedRequest } from '@/screens/breeds/models/types'

/**
 * Breed Service
 * Centralized service for breed operations
 */
export const breedService = {
  /**
   * Get all breeds, optionally filtered by sapling ID
   */
  getBreeds: async (saplingId?: string): Promise<Breed[]> => {
    return breedApi.getBreeds(saplingId)
  },

  /**
   * Get breed by ID
   */
  getBreed: async (id: string): Promise<Breed> => {
    return breedApi.getBreed(id)
  },

  /**
   * Create a new breed
   */
  createBreed: async (data: BreedRequest): Promise<Breed> => {
    return breedApi.createBreed(data)
  },

  /**
   * Update an existing breed
   */
  updateBreed: async (id: string, data: BreedRequest): Promise<Breed> => {
    return breedApi.updateBreed(id, data)
  },

  /**
   * Delete a breed
   */
  deleteBreed: async (id: string): Promise<void> => {
    return breedApi.deleteBreed(id)
  },
}

