package com.nursery.breed.service;

/**
 * Query service for breed-related read operations
 * Used to break circular dependencies between services
 */
public interface BreedQueryService {
    /**
     * Check if a sapling has active (non-deleted) breeds
     */
    boolean hasActiveBreeds(String saplingId);
}

