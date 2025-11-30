package com.nursery.inventory.service;

import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.inventory.dto.response.InventoryResponseDTO;
import com.nursery.inventory.firestore.InventoryDocument;

import java.util.List;

import com.google.cloud.firestore.Transaction;

public interface InventoryService {
    List<InventoryResponseDTO> findAll(String nurseryId);
    PaginatedResponseDTO<InventoryResponseDTO> findAllPaginated(String nurseryId, PageRequest pageRequest);
    InventoryResponseDTO findByBreedId(String breedId);
    InventoryDocument getOrCreate(String breedId);
    InventoryDocument getOrCreate(String breedId, Transaction transaction);
    InventoryDocument findByBreedIdEntity(String breedId);
    InventoryDocument findByBreedIdEntity(String breedId, Transaction transaction);
    void save(InventoryDocument inventory);
    void save(InventoryDocument inventory, Transaction transaction);
}

