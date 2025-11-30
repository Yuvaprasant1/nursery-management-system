package com.nursery.breed.service;

import com.nursery.breed.dto.request.BreedRequestDTO;
import com.nursery.breed.dto.response.BreedResponseDTO;
import com.nursery.breed.firestore.BreedDocument;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;

import java.util.List;

public interface BreedService {
    List<BreedResponseDTO> findAll(String nurseryId, String saplingId, String search);
    PaginatedResponseDTO<BreedResponseDTO> findAllPaginated(String nurseryId, String saplingId, String search, PageRequest pageRequest);
    BreedResponseDTO findById(String id);
    BreedResponseDTO create(BreedRequestDTO request);
    BreedResponseDTO update(String id, BreedRequestDTO request);
    void softDelete(String id);
    void validateExists(String id);
    BreedDocument findByIdEntity(String id);
    boolean hasActiveBreeds(String saplingId);
    boolean hasTransactions(String breedId);
}

